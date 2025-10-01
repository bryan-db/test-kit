"""Household data generator using dbldatagen and Faker.

This module generates synthetic household records with realistic distributions
for income brackets, household size, and geographic locations.
"""

from typing import Optional
from pyspark.sql import SparkSession, DataFrame
from pyspark.sql.functions import pandas_udf, col, current_timestamp
import pandas as pd
from faker import Faker
import dbldatagen as dg

from src.models.schemas import HouseholdConfig


def generate_households(
    spark: SparkSession,
    config: HouseholdConfig,
    seed: int = 42,
) -> DataFrame:
    """Generate synthetic household data.

    Uses dbldatagen for structural generation (IDs, sizes, income brackets) and
    Faker Pandas UDFs for semantic geographic data (city, state, zip).

    Args:
        spark: Active SparkSession
        config: Household generation configuration
        seed: Random seed for reproducibility

    Returns:
        PySpark DataFrame matching HouseholdSchema with columns:
        - household_id (long): Unique household identifier
        - location_city (string): City name
        - location_state (string): State abbreviation
        - location_zip (string): ZIP code
        - income_bracket (string): Income range category
        - household_size (int): Number of individuals in household
        - created_at (timestamp): Record creation timestamp

    Example:
        >>> config = HouseholdConfig(
        ...     num_households=10000,
        ...     income_brackets={"<30K": 0.2, "30-60K": 0.3, "60-100K": 0.5},
        ...     size_distribution={"mean": 2.5, "std_dev": 1.2}
        ... )
        >>> df = generate_households(spark, config, seed=42)
        >>> df.count()
        10000
    """
    # Extract configuration
    num_households = config.num_households
    income_brackets = config.income_brackets or {
        "<30K": 0.20,
        "30-60K": 0.30,
        "60-100K": 0.25,
        "100-150K": 0.15,
        "150K+": 0.10,
    }
    size_mean = config.size_distribution.get("mean", 2.5)
    size_std = config.size_distribution.get("std_dev", 1.2)

    # Calculate partitions for optimal parallelism (aim for ~10K rows per partition)
    num_partitions = max(1, min(200, num_households // 10000))

    # Build dbldatagen specification
    household_spec = (
        dg.DataGenerator(spark, name="households", rows=num_households, partitions=num_partitions)
        .withIdOutput()  # Creates unique sequential IDs
        .withColumn(
            "household_id",
            "long",
            uniqueValues=num_households,
            random=True,
        )
        .withColumn(
            "income_bracket",
            "string",
            values=list(income_brackets.keys()),
            weights=list(income_brackets.values()),
            random=True,
        )
        .withColumn(
            "household_size",
            "integer",
            minValue=1,
            maxValue=10,
            distribution=dg.distributions.Normal(size_mean, size_std),
            random=True,
        )
    )

    # Generate base dataframe with deterministic seed
    df = household_spec.build().withColumn("_seed", col("household_id") + seed)

    # Define Pandas UDFs for semantic location data
    @pandas_udf("string")
    def generate_city(seed_col: pd.Series) -> pd.Series:
        """Generate realistic city names using Faker."""
        fake = Faker()
        Faker.seed(seed)  # Set global seed
        return pd.Series([fake.city() for _ in range(len(seed_col))])

    @pandas_udf("string")
    def generate_state(seed_col: pd.Series) -> pd.Series:
        """Generate realistic state abbreviations using Faker."""
        fake = Faker()
        Faker.seed(seed)
        return pd.Series([fake.state_abbr() for _ in range(len(seed_col))])

    @pandas_udf("string")
    def generate_zip(seed_col: pd.Series) -> pd.Series:
        """Generate realistic ZIP codes using Faker."""
        fake = Faker()
        Faker.seed(seed)
        return pd.Series([fake.zipcode() for _ in range(len(seed_col))])

    # Add location columns using Pandas UDFs
    df = (
        df.withColumn("location_city", generate_city(col("_seed")))
        .withColumn("location_state", generate_state(col("_seed")))
        .withColumn("location_zip", generate_zip(col("_seed")))
        .withColumn("created_at", current_timestamp())
    )

    # Select final columns matching schema
    result_df = df.select(
        "household_id",
        "location_city",
        "location_state",
        "location_zip",
        "income_bracket",
        "household_size",
        "created_at",
    )

    # Ensure household_size is within valid range [1, 10]
    result_df = result_df.filter((col("household_size") >= 1) & (col("household_size") <= 10))

    return result_df


def generate_households_with_locations(
    spark: SparkSession,
    config: HouseholdConfig,
    location_distribution: Optional[dict] = None,
    seed: int = 42,
) -> DataFrame:
    """Generate households with specific geographic distribution.

    This variant allows explicit control over location distribution weights,
    useful for targeting specific geographic markets.

    Args:
        spark: Active SparkSession
        config: Household generation configuration
        location_distribution: Optional dict mapping city names to weights
        seed: Random seed for reproducibility

    Returns:
        PySpark DataFrame matching HouseholdSchema

    Example:
        >>> location_dist = {
        ...     "San Francisco": 0.3,
        ...     "New York": 0.3,
        ...     "Chicago": 0.2,
        ...     "Austin": 0.2
        ... }
        >>> df = generate_households_with_locations(
        ...     spark, config, location_dist, seed=42
        ... )
    """
    # Generate base households
    df = generate_households(spark, config, seed)

    if location_distribution:
        # Override random locations with specified distribution
        cities = list(location_distribution.keys())
        weights = list(location_distribution.values())

        # Create distribution spec
        location_spec = (
            dg.DataGenerator(spark, rows=config.num_households, partitions=10)
            .withColumn("household_id_temp", "long", uniqueValues=config.num_households)
            .withColumn(
                "location_city_override",
                "string",
                values=cities,
                weights=weights,
                random=True,
            )
        )

        location_df = location_spec.build()

        # Join to apply location override
        df = df.drop("location_city").join(
            location_df.select(
                col("household_id_temp").alias("household_id"),
                "location_city_override",
            ),
            on="household_id",
            how="left",
        )

        df = df.withColumnRenamed("location_city_override", "location_city")

    return df.select(
        "household_id",
        "location_city",
        "location_state",
        "location_zip",
        "income_bracket",
        "household_size",
        "created_at",
    )
