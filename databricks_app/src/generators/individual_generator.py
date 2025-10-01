"""Individual and identity mapping generators using dbldatagen and Faker.

This module generates synthetic individual records linked to households and their
associated identity mappings (cross-device identifiers).
"""

from typing import Tuple
from pyspark.sql import SparkSession, DataFrame
from pyspark.sql.functions import (
    pandas_udf,
    col,
    current_timestamp,
    explode,
    sequence,
    lit,
    concat,
    md5,
    rand,
    when,
    sum as spark_sum,
)
import pandas as pd
from faker import Faker
import dbldatagen as dg

from src.models.schemas import DemographicsConfig


def generate_individuals(
    spark: SparkSession,
    households_df: DataFrame,
    config: DemographicsConfig,
    seed: int = 42,
) -> DataFrame:
    """Generate synthetic individual records linked to households.

    Uses dbldatagen for demographic distributions and Faker for semantic data.
    Maintains referential integrity with households via household_id foreign key.

    Args:
        spark: Active SparkSession
        households_df: DataFrame with household_id column
        config: Demographics generation configuration
        seed: Random seed for reproducibility

    Returns:
        PySpark DataFrame matching IndividualSchema with columns:
        - individual_id (long): Unique individual identifier
        - household_id (long): Foreign key to households
        - age (int): Age in years (18-100)
        - gender (string): Gender category
        - education (string): Education level
        - employment_status (string): Employment status
        - created_at (timestamp): Record creation timestamp

    Example:
        >>> households = generate_households(spark, household_config, seed=42)
        >>> config = DemographicsConfig(
        ...     age_range={"min": 18, "max": 85},
        ...     gender_distribution={"Male": 0.48, "Female": 0.48, "Non-Binary": 0.04}
        ... )
        >>> individuals = generate_individuals(spark, households, config, seed=42)
    """
    # Extract configuration
    age_min = config.age_range.get("min", 18)
    age_max = config.age_range.get("max", 100)
    age_mean = (age_min + age_max) / 2
    age_std = (age_max - age_min) / 6  # ~99% within range

    gender_dist = config.gender_distribution or {
        "Male": 0.48,
        "Female": 0.48,
        "Non-Binary": 0.03,
        "Prefer not to say": 0.01,
    }

    education_dist = config.education_distribution or {
        "Less than High School": 0.12,
        "High School": 0.28,
        "Some College": 0.21,
        "Associate": 0.06,
        "Bachelor": 0.20,
        "Master": 0.10,
        "Doctorate": 0.03,
    }

    employment_dist = config.employment_distribution or {
        "Employed Full-Time": 0.55,
        "Employed Part-Time": 0.12,
        "Self-Employed": 0.08,
        "Unemployed": 0.05,
        "Retired": 0.15,
        "Student": 0.05,
    }

    # Explode households by household_size to create individual records
    # Each household generates household_size individuals
    individuals_base = households_df.select(
        "household_id",
        "household_size",
        "income_bracket",
    ).withColumn(
        "individual_index",
        explode(sequence(lit(0), col("household_size") - 1)),
    )

    # Count total individuals for ID generation
    num_individuals = individuals_base.count()
    num_partitions = max(1, min(200, num_individuals // 10000))

    # Generate unique individual IDs and demographics using dbldatagen
    individual_spec = (
        dg.DataGenerator(spark, rows=num_individuals, partitions=num_partitions)
        .withColumn(
            "individual_id",
            "long",
            uniqueValues=num_individuals,
            random=True,
        )
        .withColumn(
            "age",
            "integer",
            minValue=age_min,
            maxValue=age_max,
            distribution=dg.distributions.Normal(age_mean, age_std),
            random=True,
        )
        .withColumn(
            "gender",
            "string",
            values=list(gender_dist.keys()),
            weights=list(gender_dist.values()),
            random=True,
        )
        .withColumn(
            "education",
            "string",
            values=list(education_dist.keys()),
            weights=list(education_dist.values()),
            random=True,
        )
        .withColumn(
            "employment_status",
            "string",
            values=list(employment_dist.keys()),
            weights=list(employment_dist.values()),
            random=True,
        )
    )

    demographics_df = individual_spec.build()

    # Assign demographics to individuals using row_number matching
    from pyspark.sql.window import Window
    from pyspark.sql.functions import row_number

    individuals_base = individuals_base.withColumn(
        "row_num", row_number().over(Window.orderBy("household_id", "individual_index"))
    )

    demographics_df = demographics_df.withColumn(
        "row_num", row_number().over(Window.orderBy("individual_id"))
    )

    # Join demographics to household assignments
    result_df = (
        individuals_base.join(demographics_df, on="row_num", how="inner")
        .withColumn("created_at", current_timestamp())
        .select(
            "individual_id",
            "household_id",
            "age",
            "gender",
            "education",
            "employment_status",
            "created_at",
        )
    )

    # Ensure age is within valid range
    result_df = result_df.filter((col("age") >= age_min) & (col("age") <= age_max))

    return result_df


def generate_identity_mappings(
    spark: SparkSession,
    individuals_df: DataFrame,
    config: DemographicsConfig,
    seed: int = 42,
) -> DataFrame:
    """Generate cross-device identity mappings for individuals.

    Each individual gets 2-15 identity mappings representing different devices,
    browsers, and platforms where they can be identified.

    Args:
        spark: Active SparkSession
        individuals_df: DataFrame with individual_id column
        config: Demographics configuration with identity_mappings settings
        seed: Random seed for reproducibility

    Returns:
        PySpark DataFrame matching IdentityMappingSchema with columns:
        - mapping_id (long): Unique mapping identifier
        - individual_id (long): Foreign key to individuals
        - identifier_type (string): Type of identifier (email_hash, cookie_id, etc.)
        - identifier_value (string): Hashed identifier value
        - first_seen (timestamp): First time identifier was observed
        - last_seen (timestamp): Last time identifier was observed

    Example:
        >>> mappings = generate_identity_mappings(spark, individuals, config, seed=42)
        >>> mappings.groupBy("individual_id").count().show()
    """
    # Extract configuration
    identity_config = config.identity_mappings or {}
    identifiers_mean = identity_config.get("identifiers_per_person", {}).get("mean", 4)
    identifiers_std = identity_config.get("identifiers_per_person", {}).get("std_dev", 2)

    identifier_type_dist = identity_config.get("identifier_types") or identity_config.get(
        "identifier_type_distribution",
        {
            "email_hash": 0.60,
            "cookie_id": 0.90,
            "mobile_ad_id": 0.80,
            "device_id": 0.70,
            "ctv_id": 0.40,
            "hashed_phone": 0.30,
        },
    )

    # Generate number of identifiers per individual using normal distribution
    individuals_with_counts = individuals_df.select("individual_id").withColumn(
        "num_identifiers",
        (rand(seed) * identifiers_std * 2 + (identifiers_mean - identifiers_std)).cast("int"),
    )

    # Ensure num_identifiers is within valid range [2, 15]
    individuals_with_counts = individuals_with_counts.withColumn(
        "num_identifiers",
        when(col("num_identifiers") < 2, lit(2))
        .when(col("num_identifiers") > 15, lit(15))
        .otherwise(col("num_identifiers")),
    )

    # Explode to create one row per identifier
    mappings_base = individuals_with_counts.withColumn(
        "identifier_index",
        explode(sequence(lit(0), col("num_identifiers") - 1)),
    )

    # Count total mappings for ID generation
    num_mappings = mappings_base.count()
    num_partitions = max(1, min(200, num_mappings // 10000))

    # Generate unique mapping IDs and identifier types using dbldatagen
    mapping_spec = (
        dg.DataGenerator(spark, rows=num_mappings, partitions=num_partitions)
        .withColumn(
            "mapping_id",
            "long",
            uniqueValues=num_mappings,
            random=True,
        )
        .withColumn(
            "identifier_type",
            "string",
            values=list(identifier_type_dist.keys()),
            weights=list(identifier_type_dist.values()),
            random=True,
        )
    )

    mappings_df = mapping_spec.build()

    # Assign to individuals using row_number matching
    from pyspark.sql.window import Window
    from pyspark.sql.functions import row_number

    mappings_base = mappings_base.withColumn(
        "row_num", row_number().over(Window.orderBy("individual_id", "identifier_index"))
    )

    mappings_df = mappings_df.withColumn(
        "row_num", row_number().over(Window.orderBy("mapping_id"))
    )

    # Join to assign types to mappings
    result_df = mappings_base.join(mappings_df, on="row_num", how="inner")

    # Generate identifier values using hashing (deterministic based on mapping_id + seed)
    result_df = result_df.withColumn(
        "identifier_value",
        md5(concat(col("mapping_id").cast("string"), lit(str(seed)), col("identifier_type"))),
    )

    # Generate timestamps (first_seen slightly before last_seen)
    result_df = result_df.withColumn("first_seen", current_timestamp()).withColumn(
        "last_seen", current_timestamp()
    )

    # Select final columns
    result_df = result_df.select(
        "mapping_id",
        "individual_id",
        "identifier_type",
        "identifier_value",
        "first_seen",
        "last_seen",
    )

    return result_df


def generate_individuals_and_identities(
    spark: SparkSession,
    households_df: DataFrame,
    config: DemographicsConfig,
    seed: int = 42,
) -> Tuple[DataFrame, DataFrame]:
    """Generate both individuals and their identity mappings in one call.

    This is a convenience function that generates individuals and their associated
    identity mappings maintaining referential integrity.

    Args:
        spark: Active SparkSession
        households_df: DataFrame with household_id column
        config: Demographics generation configuration
        seed: Random seed for reproducibility

    Returns:
        Tuple of (individuals_df, identity_mappings_df)

    Example:
        >>> households = generate_households(spark, household_config, seed=42)
        >>> individuals, mappings = generate_individuals_and_identities(
        ...     spark, households, demographics_config, seed=42
        ... )
        >>> individuals.count()
        25000
        >>> mappings.count()
        100000
    """
    individuals_df = generate_individuals(spark, households_df, config, seed)
    identity_mappings_df = generate_identity_mappings(spark, individuals_df, config, seed)

    return individuals_df, identity_mappings_df
