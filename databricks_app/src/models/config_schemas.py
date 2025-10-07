"""
Configuration Table Schema Definitions for Marketing Analytics Explorer

This module defines PySpark schemas for configuration tables used to manage
user access, permissions, and dashboard personalization.
"""

from pyspark.sql.types import (
    StructType,
    StructField,
    StringType,
    TimestampType,
    ArrayType,
)


# T008: User Assignments Configuration Schema
USER_ASSIGNMENTS_SCHEMA = StructType([
    StructField("user_id", StringType(), nullable=False),
    StructField("user_email", StringType(), nullable=False),
    StructField("user_role", StringType(), nullable=False),  # CMO, Director, Analyst
    StructField("assigned_campaign_ids", ArrayType(StringType()), nullable=True),
    StructField("assigned_segment_ids", ArrayType(StringType()), nullable=True),
    StructField("created_at", TimestampType(), nullable=True),
    StructField("updated_at", TimestampType(), nullable=True),
])


# Schema registry for configuration tables
CONFIG_TABLE_SCHEMAS = {
    "user_assignments": USER_ASSIGNMENTS_SCHEMA,
}


def get_config_table_schema(table_name: str) -> StructType:
    """
    Retrieve the schema for a specific configuration table.

    Args:
        table_name: Name of the configuration table (without catalog/schema prefix)

    Returns:
        PySpark StructType schema for the table

    Raises:
        KeyError: If table_name is not found in CONFIG_TABLE_SCHEMAS
    """
    if table_name not in CONFIG_TABLE_SCHEMAS:
        raise KeyError(
            f"Unknown config table: {table_name}. "
            f"Available tables: {', '.join(CONFIG_TABLE_SCHEMAS.keys())}"
        )
    return CONFIG_TABLE_SCHEMAS[table_name]
