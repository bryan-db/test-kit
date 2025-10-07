"""
Contract Test: Campaign Performance Summary Gold Table Schema
Feature: 004-data-exploration-frontend
Task: T010

This test MUST FAIL initially (table doesn't exist yet).
It will pass after T023 (implement silver_to_gold campaign performance pipeline).
"""

import pytest
from pyspark.sql import SparkSession
from pyspark.sql.types import (
    StructType,
    StructField,
    StringType,
    DateType,
    LongType,
    DecimalType,
    TimestampType,
    ArrayType,
)


@pytest.fixture(scope="module")
def spark():
    """Shared Spark session for tests"""
    return SparkSession.builder.getOrCreate()


def test_campaign_performance_summary_table_exists(spark):
    """Test that campaign_performance_summary table exists in Unity Catalog"""
    tables = spark.sql("SHOW TABLES IN bryan_li.analytics").collect()
    table_names = [row.tableName for row in tables]
    assert "campaign_performance_summary" in table_names, \
        "Table bryan_li.analytics.campaign_performance_summary does not exist"


def test_campaign_performance_summary_schema(spark):
    """Test that campaign_performance_summary has correct schema with 13 columns"""
    expected_schema = StructType([
        StructField("campaign_id", StringType(), nullable=False),
        StructField("campaign_name", StringType(), nullable=False),
        StructField("start_date", DateType(), nullable=False),
        StructField("end_date", DateType(), nullable=False),
        StructField("target_segments", ArrayType(StringType()), nullable=True),
        StructField("channels", ArrayType(StringType()), nullable=True),
        StructField("total_impressions", LongType(), nullable=True),
        StructField("unique_reach", LongType(), nullable=True),
        StructField("total_spend", DecimalType(18, 2), nullable=True),
        StructField("conversion_count", LongType(), nullable=True),
        StructField("roi", DecimalType(10, 4), nullable=True),
        StructField("cpm", DecimalType(10, 4), nullable=True),
        StructField("updated_at", TimestampType(), nullable=True),
    ])

    actual_schema = spark.table("bryan_li.analytics.campaign_performance_summary").schema

    # Compare field names
    expected_fields = {f.name: f for f in expected_schema.fields}
    actual_fields = {f.name: f for f in actual_schema.fields}

    assert set(expected_fields.keys()) == set(actual_fields.keys()), \
        f"Schema mismatch. Expected columns: {sorted(expected_fields.keys())}, " \
        f"Actual columns: {sorted(actual_fields.keys())}"

    # Compare field types
    for field_name in expected_fields:
        expected_type = expected_fields[field_name].dataType
        actual_type = actual_fields[field_name].dataType
        assert expected_type == actual_type, \
            f"Field '{field_name}' type mismatch. Expected: {expected_type}, Actual: {actual_type}"


def test_campaign_performance_summary_not_empty(spark):
    """Test that campaign_performance_summary table has data (at least 1 row)"""
    count = spark.table("bryan_li.analytics.campaign_performance_summary").count()
    assert count > 0, "Table campaign_performance_summary is empty (expected at least 1 campaign)"


def test_campaign_performance_summary_primary_key(spark):
    """Test that campaign_id is unique (acts as primary key)"""
    df = spark.table("bryan_li.analytics.campaign_performance_summary")
    total_rows = df.count()
    unique_campaigns = df.select("campaign_id").distinct().count()

    assert total_rows == unique_campaigns, \
        f"campaign_id is not unique. Total rows: {total_rows}, Unique campaign_ids: {unique_campaigns}"


def test_campaign_performance_summary_data_quality(spark):
    """Test data quality constraints"""
    df = spark.table("bryan_li.analytics.campaign_performance_summary")

    # Check no null campaign_ids
    null_ids = df.filter(df.campaign_id.isNull()).count()
    assert null_ids == 0, f"Found {null_ids} rows with null campaign_id"

    # Check unique_reach <= total_impressions
    invalid_reach = df.filter(df.unique_reach > df.total_impressions).count()
    assert invalid_reach == 0, f"Found {invalid_reach} campaigns where unique_reach > total_impressions"

    # Check start_date <= end_date
    invalid_dates = df.filter(df.start_date > df.end_date).count()
    assert invalid_dates == 0, f"Found {invalid_dates} campaigns where start_date > end_date"
