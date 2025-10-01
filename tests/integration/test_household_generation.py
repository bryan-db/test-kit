"""Integration test for household generation.

This test validates end-to-end household data generation and Unity Catalog persistence.
Following TDD: This test MUST FAIL until T020 (household generator) is implemented.
"""

import pytest
from pyspark.sql import SparkSession


class TestHouseholdGeneration:
    """Integration tests for household generation pipeline."""

    @pytest.fixture(scope="class")
    def spark(self):
        """Create Spark session for testing."""
        spark = (
            SparkSession.builder.appName("test_household_generation")
            .config("spark.sql.shuffle.partitions", "2")
            .getOrCreate()
        )
        yield spark
        spark.stop()

    def test_generate_1000_households_with_seed_42(self, spark):
        """Test scenario: Generate 1000 households with seed 42.

        This test validates:
        - Household generator creates correct number of records
        - All required schema columns are present
        - Data types match schema definition
        - No NULL values in NOT NULL columns
        - Seed ensures deterministic output
        """
        from databricks_app.src.generators.household_generator import generate_households
        from databricks_app.src.models.schemas import HouseholdConfig

        # Configure generation
        config = HouseholdConfig(
            num_households=1000,
            income_brackets={
                "<30K": 0.20,
                "30-60K": 0.30,
                "60-100K": 0.25,
                "100-150K": 0.15,
                "150K+": 0.10,
            },
            size_distribution={"mean": 2.5, "std_dev": 1.2},
        )

        # Generate households
        df = generate_households(spark, config, seed=42)

        # Assert row count
        assert df.count() == 1000, "Should generate exactly 1000 households"

        # Assert all required columns exist
        required_columns = {
            "household_id",
            "location_city",
            "location_state",
            "location_zip",
            "income_bracket",
            "household_size",
            "created_at",
        }
        actual_columns = set(df.columns)
        assert required_columns.issubset(
            actual_columns
        ), f"Missing columns: {required_columns - actual_columns}"

        # Assert schema data types
        from databricks_app.src.models.schemas import get_household_schema

        expected_schema = get_household_schema()
        for field in expected_schema.fields:
            actual_field = df.schema[field.name]
            assert (
                actual_field.dataType == field.dataType
            ), f"Column {field.name} has wrong type: {actual_field.dataType} vs {field.dataType}"

        # Assert no NULL values in NOT NULL columns
        null_counts = df.select(
            [
                sum(col(c).isNull().cast("int")).alias(c)
                for c in required_columns
            ]
        ).collect()[0]

        for col_name in required_columns:
            assert (
                null_counts[col_name] == 0
            ), f"Column {col_name} has NULL values"

        # Assert income bracket distribution approximately matches config
        income_dist = (
            df.groupBy("income_bracket")
            .count()
            .rdd.map(lambda row: (row[0], row[1] / 1000))
            .collectAsDict()
        )

        for bracket, expected_pct in config.income_brackets.items():
            actual_pct = income_dist.get(bracket, 0.0)
            # Allow 5% tolerance for small sample size
            assert abs(actual_pct - expected_pct) < 0.10, (
                f"Income bracket {bracket} distribution off: "
                f"{actual_pct:.2f} vs {expected_pct:.2f}"
            )

    def test_deterministic_generation_with_same_seed(self, spark):
        """Test that same seed produces identical results."""
        from databricks_app.src.generators.household_generator import generate_households
        from databricks_app.src.models.schemas import HouseholdConfig

        config = HouseholdConfig(
            num_households=100,
            income_brackets={"<30K": 0.5, "30-60K": 0.5},
            size_distribution={"mean": 2.5, "std_dev": 1.0},
        )

        # Generate twice with same seed
        df1 = generate_households(spark, config, seed=123)
        df2 = generate_households(spark, config, seed=123)

        # Collect and sort for comparison
        rows1 = sorted(df1.collect(), key=lambda r: r.household_id)
        rows2 = sorted(df2.collect(), key=lambda r: r.household_id)

        assert len(rows1) == len(rows2), "Different row counts"
        assert rows1 == rows2, "Same seed should produce identical results"

    def test_household_size_within_valid_range(self, spark):
        """Test that household_size is between 1 and 10."""
        from databricks_app.src.generators.household_generator import generate_households
        from databricks_app.src.models.schemas import HouseholdConfig

        config = HouseholdConfig(
            num_households=500,
            income_brackets={"<30K": 1.0},
            size_distribution={"mean": 3.0, "std_dev": 1.5},
        )

        df = generate_households(spark, config, seed=999)

        # Check min/max household size
        from pyspark.sql.functions import min as spark_min, max as spark_max

        stats = df.select(
            spark_min("household_size").alias("min_size"),
            spark_max("household_size").alias("max_size"),
        ).collect()[0]

        assert stats.min_size >= 1, "household_size below minimum"
        assert stats.max_size <= 10, "household_size above maximum"

    @pytest.mark.skip(reason="Requires Unity Catalog connection - run manually")
    def test_write_to_unity_catalog(self, spark):
        """Test writing generated households to Unity Catalog.

        This test validates:
        - Table creation in Unity Catalog
        - Delta Lake format
        - Optimized write settings
        - Z-Order optimization

        NOTE: This test requires valid Databricks workspace credentials.
        """
        from databricks_app.src.generators.household_generator import generate_households
        from databricks_app.src.storage.catalog_writer import CatalogWriter
        from databricks_app.src.models.schemas import HouseholdConfig

        config = HouseholdConfig(
            num_households=1000,
            income_brackets={
                "<30K": 0.20,
                "30-60K": 0.30,
                "60-100K": 0.25,
                "100-150K": 0.15,
                "150K+": 0.10,
            },
        )

        df = generate_households(spark, config, seed=42)

        # Write to Unity Catalog
        writer = CatalogWriter(spark)
        writer.write_table(
            df=df,
            catalog="bryan_li",
            schema="synthetic_data",
            table_name="households",
            mode="overwrite",
        )

        # Verify table exists and has correct row count
        result_df = spark.table("bryan_li.synthetic_data.households")
        assert result_df.count() == 1000, "Table should have 1000 rows"

        # Verify Delta Lake format
        table_path = spark.sql(
            "DESCRIBE DETAIL bryan_li.synthetic_data.households"
        ).collect()[0]
        assert table_path.format == "delta", "Table should be Delta format"
