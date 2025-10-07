"""
Gold Table Schema Definitions for Marketing Analytics Explorer

This module defines PySpark StructType schemas for all gold layer tables
used in the marketing analytics dashboard.
"""

from pyspark.sql.types import (
    StructType,
    StructField,
    StringType,
    DateType,
    LongType,
    DecimalType,
    DoubleType,
    TimestampType,
    ArrayType,
)


# T003: Campaign Performance Summary Schema
CAMPAIGN_PERFORMANCE_SUMMARY_SCHEMA = StructType([
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


# T004: Audience Segment Summary Schema
AUDIENCE_SEGMENT_SUMMARY_SCHEMA = StructType([
    StructField("segment_id", StringType(), nullable=False),
    StructField("segment_name", StringType(), nullable=False),
    StructField("segment_size", LongType(), nullable=True),
    StructField("behavioral_classification", StringType(), nullable=True),
    StructField("avg_propensity_to_convert", DecimalType(5, 4), nullable=True),
    StructField("total_conversions", LongType(), nullable=True),
    StructField("demographic_distribution_json", StringType(), nullable=True),  # JSON string
    StructField("engagement_stats_json", StringType(), nullable=True),  # JSON string
    StructField("updated_at", TimestampType(), nullable=True),
])


# T005: Content Engagement Daily Schema
CONTENT_ENGAGEMENT_DAILY_SCHEMA = StructType([
    StructField("engagement_date", DateType(), nullable=False),
    StructField("content_category", StringType(), nullable=False),
    StructField("event_type", StringType(), nullable=False),
    StructField("total_engagements", LongType(), nullable=True),
    StructField("unique_users", LongType(), nullable=True),
    StructField("engagement_rate", DecimalType(10, 6), nullable=True),
    StructField("updated_at", TimestampType(), nullable=True),
])


# T006: Attribution Comparison Schema
ATTRIBUTION_COMPARISON_SCHEMA = StructType([
    StructField("campaign_id", StringType(), nullable=False),
    StructField("first_touch_conversions", LongType(), nullable=True),
    StructField("last_touch_conversions", LongType(), nullable=True),
    StructField("linear_conversions", DecimalType(18, 2), nullable=True),  # Fractional attribution
    StructField("time_decay_conversions", DecimalType(18, 2), nullable=True),  # Fractional attribution
    StructField("total_conversions", LongType(), nullable=True),
    StructField("updated_at", TimestampType(), nullable=True),
])


# T007: Conversion Funnel Metrics Schema
CONVERSION_FUNNEL_METRICS_SCHEMA = StructType([
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


# Schema registry for easy lookup
GOLD_TABLE_SCHEMAS = {
    "campaign_performance_summary": CAMPAIGN_PERFORMANCE_SUMMARY_SCHEMA,
    "audience_segment_summary": AUDIENCE_SEGMENT_SUMMARY_SCHEMA,
    "content_engagement_daily": CONTENT_ENGAGEMENT_DAILY_SCHEMA,
    "attribution_comparison": ATTRIBUTION_COMPARISON_SCHEMA,
    "conversion_funnel_metrics": CONVERSION_FUNNEL_METRICS_SCHEMA,
}


def get_gold_table_schema(table_name: str) -> StructType:
    """
    Retrieve the schema for a specific gold table.

    Args:
        table_name: Name of the gold table (without catalog/schema prefix)

    Returns:
        PySpark StructType schema for the table

    Raises:
        KeyError: If table_name is not found in GOLD_TABLE_SCHEMAS
    """
    if table_name not in GOLD_TABLE_SCHEMAS:
        raise KeyError(
            f"Unknown gold table: {table_name}. "
            f"Available tables: {', '.join(GOLD_TABLE_SCHEMAS.keys())}"
        )
    return GOLD_TABLE_SCHEMAS[table_name]
