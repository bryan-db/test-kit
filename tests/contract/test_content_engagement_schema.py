"""
Contract Test: Content Engagement Daily Gold Table Schema
Feature: 004-data-exploration-frontend
Task: T012

This test MUST FAIL initially (table doesn't exist yet).
It will pass after T025 (implement silver_to_gold content engagement pipeline).
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
)


@pytest.fixture(scope="module")
def spark():
    """Shared Spark session for tests"""
    return SparkSession.builder.getOrCreate()


def test_content_engagement_daily_table_exists(spark):
    """Test that content_engagement_daily table exists in Unity Catalog"""
    tables = spark.sql("SHOW TABLES IN bryan_li.analytics").collect()
    table_names = [row.tableName for row in tables]
    assert "content_engagement_daily" in table_names, \
        "Table bryan_li.analytics.content_engagement_daily does not exist"


def test_content_engagement_daily_schema(spark):
    """Test that content_engagement_daily has correct schema with 7 columns"""
    expected_schema = StructType([
        StructField("engagement_date", DateType(), nullable=False),
        StructField("content_category", StringType(), nullable=False),
        StructField("event_type", StringType(), nullable=False),
        StructField("total_engagements", LongType(), nullable=True),
        StructField("unique_users", LongType(), nullable=True),
        StructField("engagement_rate", DecimalType(10, 6), nullable=True),
        StructField("updated_at", TimestampType(), nullable=True),
    ])

    actual_schema = spark.table("bryan_li.analytics.content_engagement_daily").schema

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


def test_content_engagement_daily_not_empty(spark):
    """Test that content_engagement_daily table has data"""
    count = spark.table("bryan_li.analytics.content_engagement_daily").count()
    assert count > 0, "Table content_engagement_daily is empty"


def test_content_engagement_daily_composite_pk(spark):
    """Test that (engagement_date, content_category, event_type) is unique"""
    df = spark.table("bryan_li.analytics.content_engagement_daily")
    total_rows = df.count()
    unique_keys = df.select("engagement_date", "content_category", "event_type").distinct().count()

    assert total_rows == unique_keys, \
        f"Composite PK is not unique. Total rows: {total_rows}, Unique combinations: {unique_keys}"


def test_content_engagement_daily_data_quality(spark):
    """Test data quality constraints"""
    df = spark.table("bryan_li.analytics.content_engagement_daily")

    # Check no null values in PK columns
    null_dates = df.filter(df.engagement_date.isNull()).count()
    assert null_dates == 0, f"Found {null_dates} rows with null engagement_date"

    null_categories = df.filter(df.content_category.isNull()).count()
    assert null_categories == 0, f"Found {null_categories} rows with null content_category"

    null_event_types = df.filter(df.event_type.isNull()).count()
    assert null_event_types == 0, f"Found {null_event_types} rows with null event_type"

    # Check unique_users <= total_engagements
    invalid_users = df.filter(df.unique_users > df.total_engagements).count()
    assert invalid_users == 0, \
        f"Found {invalid_users} rows where unique_users > total_engagements"

    # Check engagement_rate is between 0 and 1
    invalid_rate = df.filter(
        (df.engagement_rate < 0) | (df.engagement_rate > 1)
    ).count()
    assert invalid_rate == 0, \
        f"Found {invalid_rate} rows with engagement_rate outside [0, 1]"


def test_content_engagement_daily_event_types(spark):
    """Test that event_type contains expected values"""
    df = spark.table("bryan_li.analytics.content_engagement_daily")
    expected_event_types = {'page_view', 'video_view', 'click', 'share'}

    actual_event_types = set(
        row.event_type for row in df.select("event_type").distinct().collect()
    )

    assert actual_event_types.issubset(expected_event_types), \
        f"Unexpected event types found: {actual_event_types - expected_event_types}"
