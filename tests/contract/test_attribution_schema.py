"""
Contract Test: Attribution Comparison Gold Table Schema
Feature: 004-data-exploration-frontend
Task: T013

This test MUST FAIL initially (table doesn't exist yet).
It will pass after T026 (implement silver_to_gold attribution comparison pipeline).
"""

import pytest
from pyspark.sql import SparkSession
from pyspark.sql.types import (
    StructType,
    StructField,
    StringType,
    LongType,
    DecimalType,
    TimestampType,
)


@pytest.fixture(scope="module")
def spark():
    """Shared Spark session for tests"""
    return SparkSession.builder.getOrCreate()


def test_attribution_comparison_table_exists(spark):
    """Test that attribution_comparison table exists in Unity Catalog"""
    tables = spark.sql("SHOW TABLES IN bryan_li.analytics").collect()
    table_names = [row.tableName for row in tables]
    assert "attribution_comparison" in table_names, \
        "Table bryan_li.analytics.attribution_comparison does not exist"


def test_attribution_comparison_schema(spark):
    """Test that attribution_comparison has correct schema with 7 columns"""
    expected_schema = StructType([
        StructField("campaign_id", StringType(), nullable=False),
        StructField("first_touch_conversions", LongType(), nullable=True),
        StructField("last_touch_conversions", LongType(), nullable=True),
        StructField("linear_conversions", DecimalType(18, 2), nullable=True),
        StructField("time_decay_conversions", DecimalType(18, 2), nullable=True),
        StructField("total_conversions", LongType(), nullable=True),
        StructField("updated_at", TimestampType(), nullable=True),
    ])

    actual_schema = spark.table("bryan_li.analytics.attribution_comparison").schema

    # Compare field names
    expected_fields = {f.name: f for f in expected_schema.fields}
    actual_fields = {f.name: f for f in actual_schema.fields}

    assert set(expected_fields.keys()) == set(actual_fields.keys()), \
        f"Schema mismatch. Expected columns: {sorted(expected_fields.keys())}, " \
        f"Actual columns: {sorted(actual_fields.keys())}"

    # Compare field types (allowing for decimal precision differences)
    for field_name in expected_fields:
        expected_type = expected_fields[field_name].dataType
        actual_type = actual_fields[field_name].dataType

        # For decimal types, check that it's a decimal (precision may vary)
        if isinstance(expected_type, DecimalType):
            assert isinstance(actual_type, DecimalType), \
                f"Field '{field_name}' type mismatch. Expected DecimalType, Actual: {actual_type}"
        else:
            assert expected_type == actual_type, \
                f"Field '{field_name}' type mismatch. Expected: {expected_type}, Actual: {actual_type}"


def test_attribution_comparison_not_empty(spark):
    """Test that attribution_comparison table has data"""
    count = spark.table("bryan_li.analytics.attribution_comparison").count()
    assert count > 0, "Table attribution_comparison is empty"


def test_attribution_comparison_primary_key(spark):
    """Test that campaign_id is unique (acts as primary key)"""
    df = spark.table("bryan_li.analytics.attribution_comparison")
    total_rows = df.count()
    unique_campaigns = df.select("campaign_id").distinct().count()

    assert total_rows == unique_campaigns, \
        f"campaign_id is not unique. Total rows: {total_rows}, Unique campaign_ids: {unique_campaigns}"


def test_attribution_comparison_data_quality(spark):
    """Test data quality constraints"""
    df = spark.table("bryan_li.analytics.attribution_comparison")

    # Check no null campaign_ids
    null_ids = df.filter(df.campaign_id.isNull()).count()
    assert null_ids == 0, f"Found {null_ids} rows with null campaign_id"

    # Check all attribution values >= 0
    invalid_values = df.filter(
        (df.first_touch_conversions < 0) |
        (df.last_touch_conversions < 0) |
        (df.linear_conversions < 0) |
        (df.time_decay_conversions < 0) |
        (df.total_conversions < 0)
    ).count()
    assert invalid_values == 0, f"Found {invalid_values} rows with negative attribution values"


def test_attribution_comparison_model_consistency(spark):
    """Test that attribution models are consistent with total_conversions"""
    df = spark.table("bryan_li.analytics.attribution_comparison")

    # Linear and time_decay should be within 20% of each other for most campaigns
    # (This is a business rule from data-model.md)
    from pyspark.sql.functions import abs as sql_abs

    df_with_diff = df.withColumn(
        "linear_decay_diff_pct",
        sql_abs(df.linear_conversions - df.time_decay_conversions) / df.total_conversions * 100
    )

    # At least 80% of campaigns should have linear vs time_decay within 20%
    total_campaigns = df.count()
    within_threshold = df_with_diff.filter(df_with_diff.linear_decay_diff_pct <= 20).count()

    within_threshold_pct = (within_threshold / total_campaigns) * 100 if total_campaigns > 0 else 0

    assert within_threshold_pct >= 80, \
        f"Only {within_threshold_pct:.1f}% of campaigns have linear vs time_decay within 20% " \
        f"(expected at least 80%)"
