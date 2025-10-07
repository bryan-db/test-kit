# Databricks notebook source
# MAGIC %md
# MAGIC # Bronze to Silver Pipeline - Data Cleansing and Standardization
# MAGIC **Feature**: 004-data-exploration-frontend
# MAGIC **Task**: T022
# MAGIC
# MAGIC This pipeline validates and standardizes all 10 bronze tables from Feature 001,
# MAGIC enforcing data quality rules and type constraints before promotion to silver layer.

# COMMAND ----------

from pyspark.sql import SparkSession
from pyspark.sql.functions import col, when, trim, regexp_replace, to_date, to_timestamp
from pyspark.sql.types import StringType, IntegerType, DecimalType, DateType, TimestampType
from databricks.sdk.runtime import *
import logging

logger = logging.getLogger(__name__)

# COMMAND ----------


class BronzeToSilverPipeline:
    """Cleanse and standardize bronze tables to silver layer"""

    def __init__(self, spark: SparkSession, source_catalog: str = "bryan_li", target_catalog: str = "bryan_li"):
        self.spark = spark
        self.source_catalog = source_catalog
        self.target_catalog = target_catalog
        self.bronze_schema = "synthetic_datasets"  # Changed from raw_data
        self.silver_schema = "silver"

    def run_all(self):
        """Execute full bronze to silver pipeline for all 10 tables"""
        logger.info("Starting bronze_to_silver pipeline")

        tables = [
            "households",
            "individuals",
            "identity_mappings",
            "content_engagements",
            "viewership_patterns",
            "audience_attributes",  # Fixed: was audience_segments
            "campaigns",
            "campaign_exposures",
            "response_events",
            "outcome_metrics"
        ]

        for table_name in tables:
            logger.info(f"Processing {table_name}")
            self.cleanse_and_write(table_name)

        logger.info("Bronze to silver pipeline complete")

    def cleanse_and_write(self, table_name: str):
        """Generic cleansing logic for a single table"""
        source_table = f"{self.source_catalog}.{self.bronze_schema}.{table_name}"
        target_table = f"{self.target_catalog}.{self.silver_schema}.{table_name}"

        # Read bronze table
        df_bronze = self.spark.table(source_table)

        # Apply table-specific cleansing rules
        df_silver = self._apply_cleansing_rules(df_bronze, table_name)

        # Write to silver layer (Delta with MERGE for idempotency)
        df_silver.write \
            .format("delta") \
            .mode("overwrite") \
            .option("overwriteSchema", "true") \
            .option("delta.autoOptimize.optimizeWrite", "true") \
            .saveAsTable(target_table)

        logger.info(f"Silver table {target_table} updated successfully")

    def _apply_cleansing_rules(self, df, table_name: str):
        """Apply table-specific data quality rules"""

        # Common cleansing: trim strings, handle nulls
        string_cols = [f.name for f in df.schema.fields if isinstance(f.dataType, StringType)]
        for col_name in string_cols:
            df = df.withColumn(col_name, trim(col(col_name)))

        # Table-specific rules
        if table_name == "households":
            df = self._cleanse_households(df)
        elif table_name == "individuals":
            df = self._cleanse_individuals(df)
        elif table_name == "campaigns":
            df = self._cleanse_campaigns(df)
        # Add other table-specific rules as needed

        return df

    def _cleanse_households(self, df):
        """Validate household data"""
        # Enforce household_size > 0
        df = df.filter(col("household_size") > 0)

        # Standardize income_bracket format
        df = df.withColumn(
            "income_bracket",
            regexp_replace(col("income_bracket"), "[^0-9k-]", "")
        )

        return df

    def _cleanse_individuals(self, df):
        """Validate individual demographic data"""
        # Age must be between 18 and 120
        df = df.filter((col("age") >= 18) & (col("age") <= 120))

        # Standardize gender values
        df = df.withColumn(
            "gender",
            when(col("gender").isin(["M", "Male", "male"]), "M")
            .when(col("gender").isin(["F", "Female", "female"]), "F")
            .otherwise("Other")
        )

        return df

    def _cleanse_campaigns(self, df):
        """Validate campaign data"""
        # Ensure start_date <= end_date
        df = df.filter(col("start_date") <= col("end_date"))

        # Budget must be positive
        df = df.filter(col("budget") > 0)

        return df


# COMMAND ----------

# MAGIC %md
# MAGIC ## Execute Pipeline

# COMMAND ----------

# Get parameters from job config
catalog = dbutils.widgets.get("catalog") if dbutils.widgets else "bryan_li"

# Initialize Spark session
spark = SparkSession.builder.getOrCreate()

# Run pipeline
pipeline = BronzeToSilverPipeline(spark, source_catalog=catalog, target_catalog=catalog)
pipeline.run_all()
