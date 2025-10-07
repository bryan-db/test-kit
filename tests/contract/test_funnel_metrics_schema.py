"""
Contract Test: Conversion Funnel Metrics Gold Table Schema
Feature: 004-data-exploration-frontend
Task: T014

This test MUST FAIL initially (table doesn't exist yet).
It will pass after T027 (implement silver_to_gold conversion funnel pipeline).
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


def test_conversion_funnel_metrics_table_exists(spark):
    """Test that conversion_funnel_metrics table exists in Unity Catalog"""
    tables = spark.sql("SHOW TABLES IN bryan_li.analytics").collect()
    table_names = [row.tableName for row in tables]
    assert "conversion_funnel_metrics" in table_names, \
        "Table bryan_li.analytics.conversion_funnel_metrics does not exist"


def test_conversion_funnel_metrics_schema(spark):
    """Test that conversion_funnel_metrics has correct schema with 10 columns"""
    expected_schema = StructType([
        StructField("campaign_id", StringType(), nullable=False),
        StructField("total_exposures", LongType(), nullable=True),
        StructField("unique_exposed", LongType(), nullable=True),
        StructField("total_responses", LongType(), nullable=True),
        StructField("unique_responders", LongType(), nullable=True),
        StructField("total_conversions", LongType(), nullable=True),
        StructField("exposure_to_response_rate", DecimalType(10, 6), nullable=True),
        StructField("response_to_conversion_rate", DecimalType(10, 6), nullable=True),
        StructField("overall_conversion_rate", DecimalType(10, 6), nullable=True),
        StructField("updated_at", TimestampType(), nullable=True),
    ])

    actual_schema = spark.table("bryan_li.analytics.conversion_funnel_metrics").schema

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

        # For decimal types, check that it's a decimal (precision may vary)
        if isinstance(expected_type, DecimalType):
            assert isinstance(actual_type, DecimalType), \
                f"Field '{field_name}' type mismatch. Expected DecimalType, Actual: {actual_type}"
        else:
            assert expected_type == actual_type, \
                f"Field '{field_name}' type mismatch. Expected: {expected_type}, Actual: {actual_type}"


def test_conversion_funnel_metrics_not_empty(spark):
    """Test that conversion_funnel_metrics table has data"""
    count = spark.table("bryan_li.analytics.conversion_funnel_metrics").count()
    assert count > 0, "Table conversion_funnel_metrics is empty"


def test_conversion_funnel_metrics_primary_key(spark):
    """Test that campaign_id is unique (acts as primary key)"""
    df = spark.table("bryan_li.analytics.conversion_funnel_metrics")
    total_rows = df.count()
    unique_campaigns = df.select("campaign_id").distinct().count()

    assert total_rows == unique_campaigns, \
        f"campaign_id is not unique. Total rows: {total_rows}, Unique campaign_ids: {unique_campaigns}"


def test_conversion_funnel_metrics_data_quality(spark):
    """Test data quality constraints from data-model.md"""
    df = spark.table("bryan_li.analytics.conversion_funnel_metrics")

    # Check no null campaign_ids
    null_ids = df.filter(df.campaign_id.isNull()).count()
    assert null_ids == 0, f"Found {null_ids} rows with null campaign_id"

    # Check unique_responders <= unique_exposed
    invalid_responders = df.filter(df.unique_responders > df.unique_exposed).count()
    assert invalid_responders == 0, \
        f"Found {invalid_responders} campaigns where unique_responders > unique_exposed"

    # Check total_conversions <= total_responses
    invalid_conversions = df.filter(df.total_conversions > df.total_responses).count()
    assert invalid_conversions == 0, \
        f"Found {invalid_conversions} campaigns where total_conversions > total_responses"

    # Check all rate fields are between 0 and 1
    invalid_rates = df.filter(
        (df.exposure_to_response_rate < 0) | (df.exposure_to_response_rate > 1) |
        (df.response_to_conversion_rate < 0) | (df.response_to_conversion_rate > 1) |
        (df.overall_conversion_rate < 0) | (df.overall_conversion_rate > 1)
    ).count()
    assert invalid_rates == 0, \
        f"Found {invalid_rates} rows with rate values outside [0, 1]"


def test_conversion_funnel_metrics_rate_calculations(spark):
    """Test that funnel rate formulas are correct"""
    from pyspark.sql.functions import abs as sql_abs, col

    df = spark.table("bryan_li.analytics.conversion_funnel_metrics")

    # Calculate expected rates
    df_with_calcs = df.withColumn(
        "expected_exposure_to_response",
        col("unique_responders") / col("unique_exposed")
    ).withColumn(
        "expected_response_to_conversion",
        col("total_conversions") / col("total_responses")
    ).withColumn(
        "expected_overall_conversion",
        col("total_conversions") / col("total_exposures")
    )

    # Check exposure_to_response_rate = unique_responders / unique_exposed
    exposure_diff = df_with_calcs.filter(
        sql_abs(col("exposure_to_response_rate") - col("expected_exposure_to_response")) > 0.0001
    ).count()
    assert exposure_diff == 0, \
        f"Found {exposure_diff} campaigns with incorrect exposure_to_response_rate calculation"

    # Check response_to_conversion_rate = total_conversions / total_responses
    response_diff = df_with_calcs.filter(
        sql_abs(col("response_to_conversion_rate") - col("expected_response_to_conversion")) > 0.0001
    ).count()
    assert response_diff == 0, \
        f"Found {response_diff} campaigns with incorrect response_to_conversion_rate calculation"

    # Check overall_conversion_rate = total_conversions / total_exposures
    overall_diff = df_with_calcs.filter(
        sql_abs(col("overall_conversion_rate") - col("expected_overall_conversion")) > 0.0001
    ).count()
    assert overall_diff == 0, \
        f"Found {overall_diff} campaigns with incorrect overall_conversion_rate calculation"
