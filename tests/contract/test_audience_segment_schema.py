"""
Contract Test: Audience Segment Summary Gold Table Schema
Feature: 004-data-exploration-frontend
Task: T011

This test MUST FAIL initially (table doesn't exist yet).
It will pass after T024 (implement silver_to_gold audience segment pipeline).
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


def test_audience_segment_summary_table_exists(spark):
    """Test that audience_segment_summary table exists in Unity Catalog"""
    tables = spark.sql("SHOW TABLES IN bryan_li.analytics").collect()
    table_names = [row.tableName for row in tables]
    assert "audience_segment_summary" in table_names, \
        "Table bryan_li.analytics.audience_segment_summary does not exist"


def test_audience_segment_summary_schema(spark):
    """Test that audience_segment_summary has correct schema with 9 columns"""
    expected_schema = StructType([
        StructField("segment_id", StringType(), nullable=False),
        StructField("segment_name", StringType(), nullable=False),
        StructField("segment_size", LongType(), nullable=True),
        StructField("behavioral_classification", StringType(), nullable=True),
        StructField("avg_propensity_to_convert", DecimalType(5, 4), nullable=True),
        StructField("total_conversions", LongType(), nullable=True),
        StructField("demographic_distribution_json", StringType(), nullable=True),
        StructField("engagement_stats_json", StringType(), nullable=True),
        StructField("updated_at", TimestampType(), nullable=True),
    ])

    actual_schema = spark.table("bryan_li.analytics.audience_segment_summary").schema

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


def test_audience_segment_summary_not_empty(spark):
    """Test that audience_segment_summary table has data"""
    count = spark.table("bryan_li.analytics.audience_segment_summary").count()
    assert count > 0, "Table audience_segment_summary is empty"


def test_audience_segment_summary_primary_key(spark):
    """Test that segment_id is unique (acts as primary key)"""
    df = spark.table("bryan_li.analytics.audience_segment_summary")
    total_rows = df.count()
    unique_segments = df.select("segment_id").distinct().count()

    assert total_rows == unique_segments, \
        f"segment_id is not unique. Total rows: {total_rows}, Unique segment_ids: {unique_segments}"


def test_audience_segment_summary_data_quality(spark):
    """Test data quality constraints"""
    df = spark.table("bryan_li.analytics.audience_segment_summary")

    # Check no null segment_ids
    null_ids = df.filter(df.segment_id.isNull()).count()
    assert null_ids == 0, f"Found {null_ids} rows with null segment_id"

    # Check avg_propensity_to_convert between 0 and 1
    invalid_propensity = df.filter(
        (df.avg_propensity_to_convert < 0) | (df.avg_propensity_to_convert > 1)
    ).count()
    assert invalid_propensity == 0, \
        f"Found {invalid_propensity} segments with avg_propensity_to_convert outside [0, 1]"


def test_audience_segment_summary_json_validity(spark):
    """Test that JSON columns contain valid JSON"""
    from pyspark.sql.functions import get_json_object

    df = spark.table("bryan_li.analytics.audience_segment_summary")

    # Test demographic_distribution_json is parseable (try to extract a field)
    # If JSON is invalid, get_json_object will return null
    df_with_parsed = df.withColumn(
        "test_json_parse",
        get_json_object(df.demographic_distribution_json, "$.age_groups")
    )

    # Count rows where JSON column is not null but parsing failed
    invalid_json = df_with_parsed.filter(
        df_with_parsed.demographic_distribution_json.isNotNull() &
        df_with_parsed.test_json_parse.isNull()
    ).count()

    assert invalid_json == 0, \
        f"Found {invalid_json} rows with invalid demographic_distribution_json"
