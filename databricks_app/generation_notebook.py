# Databricks notebook source
# MAGIC %md
# MAGIC # Synthetic Identity Graph Data Generation
# MAGIC
# MAGIC This notebook is submitted as a Databricks Job by the wizard UI and executes
# MAGIC the full data generation pipeline with the provided configuration.
# MAGIC
# MAGIC **Usage:** Submit as job with parameter `config` (JSON-encoded GenerationConfig)

# COMMAND ----------

import json
import sys
from typing import Dict, Any
from datetime import datetime
from pyspark.sql import SparkSession

# Databricks notebook utilities
try:
    dbutils  # type: ignore
except NameError:
    # For local testing
    class MockDbutils:
        class widgets:
            @staticmethod
            def get(name: str, default: str = "") -> str:
                return default
    dbutils = MockDbutils()

# COMMAND ----------

import re

def camel_to_snake(name: str) -> str:
    """Convert camelCase to snake_case.

    Args:
        name: String in camelCase format

    Returns:
        String in snake_case format
    """
    # Insert underscore before uppercase letters and convert to lowercase
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()


def convert_dict_keys_to_snake_case(data: Any) -> Any:
    """Recursively convert all dictionary keys from camelCase to snake_case.

    Args:
        data: Dictionary, list, or primitive value

    Returns:
        Data with all dict keys converted to snake_case
    """
    if isinstance(data, dict):
        return {camel_to_snake(k): convert_dict_keys_to_snake_case(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [convert_dict_keys_to_snake_case(item) for item in data]
    else:
        return data


def parse_config() -> Dict[str, Any]:
    """Parse configuration from job parameters.

    Returns:
        Configuration dictionary with snake_case keys
    """
    # Get config from notebook_params (passed by Jobs API run-now)
    try:
        config_json = dbutils.widgets.get("config")  # type: ignore
    except Exception:
        raise ValueError(
            "config parameter is required. "
            "Pass GenerationConfig as JSON string via notebook_params."
        )

    if not config_json or config_json == "{}":
        raise ValueError(
            "config parameter is empty. "
            "Pass GenerationConfig as JSON string via notebook_params."
        )

    try:
        config = json.loads(config_json)
        # Convert all camelCase keys to snake_case to match Python dataclass expectations
        config = convert_dict_keys_to_snake_case(config)
        return config
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON in config parameter: {e}")

# COMMAND ----------

def initialize_spark() -> SparkSession:
    """Get the active Spark session.

    In Databricks notebooks, Spark is pre-initialized with optimal
    configurations for the compute type (classic or serverless).

    Returns:
        Active SparkSession
    """
    spark = SparkSession.builder.getOrCreate()
    return spark


def log_progress(phase: str, message: str) -> None:
    """Log progress message with timestamp.

    Args:
        phase: Current phase name
        message: Progress message
    """
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] [{phase}] {message}")

# COMMAND ----------

def execute_generation_pipeline(
    spark: SparkSession,
    config: Dict[str, Any]
) -> Dict[str, Any]:
    """Execute full data generation pipeline.

    Args:
        spark: Active SparkSession
        config: Generation configuration dictionary

    Returns:
        Result dictionary with status, table names, and row counts
    """
    from databricks_app.src.models.schemas import (
        GenerationConfig,
        HouseholdConfig,
        DemographicsConfig,
        EngagementConfig,
        AudienceConfig,
        CampaignConfig
    )
    from databricks_app.src.generators.pipeline import execute_full_pipeline

    log_progress("INITIALIZATION", "Parsing configuration...")

    # Transform household config from flat to nested structure
    household_cfg = config.get("household_config", {})
    household_config = HouseholdConfig(
        num_households=household_cfg.get("num_households", 1000),
        income_brackets=household_cfg.get("income_brackets", {}),
        size_distribution={
            "mean": household_cfg.get("household_size_mean", 2.5),
            "std_dev": household_cfg.get("household_size_std_dev", 1.2)
        },
        location_distribution=household_cfg.get("location_distribution", {})
    )

    # Transform demographics config
    demographics_cfg = config.get("demographics_config", {})
    demographics_config = DemographicsConfig(
        age_range=demographics_cfg.get("age_range", {"min": 18, "max": 80}),
        gender_distribution=demographics_cfg.get("gender_distribution", {}),
        education_distribution=demographics_cfg.get("education_distribution", {}),
        employment_distribution=demographics_cfg.get("employment_distribution", {}),
        identity_mappings=demographics_cfg.get("identity_mappings", {})
    )

    # Transform engagement config
    engagement_cfg = config.get("engagement_config", {})
    engagement_config = EngagementConfig(
        num_events_per_person=engagement_cfg.get("num_events_per_person", {"min": 1, "max": 100}),
        event_types=engagement_cfg.get("event_types", {}),
        duration_range=engagement_cfg.get("duration_range", {"min": 10, "max": 3600}),
        temporal_pattern=engagement_cfg.get("temporal_pattern", "uniform"),
        content_categories=engagement_cfg.get("content_categories", {})
    )

    # Campaign config
    campaign_cfg = config.get("campaign_config", {})
    campaign_config = CampaignConfig(
        num_campaigns=campaign_cfg.get("num_campaigns", 10),
        channels=campaign_cfg.get("channels", ["email", "social", "display"]),
        exposure_rate=campaign_cfg.get("exposure_rate", 0.3),
        response_rate=campaign_cfg.get("response_rate", 0.05),
        conversion_rate=campaign_cfg.get("conversion_rate", 0.02),
        campaign_duration_days=campaign_cfg.get("campaign_duration_days", {"min": 7, "max": 30})
    )

    # Transform audience config
    audience_cfg = config.get("audience_config", {})
    audience_config = AudienceConfig(
        segments=audience_cfg.get("segments", [
            "Tech Enthusiast", "Sports Fan", "News Junkie",
            "Entertainment Seeker", "Casual User"
        ]),
        affinity_threshold=audience_cfg.get("affinity_threshold", 0.5),
        behavioral_classifications=audience_cfg.get("behavioral_classifications", [
            "Heavy User", "Moderate User", "Light User"
        ]),
        recency_weight=audience_cfg.get("recency_weight", 0.3),
        frequency_weight=audience_cfg.get("frequency_weight", 0.7)
    )

    # Convert dict to typed config objects
    generation_config = GenerationConfig(
        seed=config.get("seed", 42),
        catalog_name=config.get("catalog_name", "bryan_li"),
        schema_name=config.get("schema_name", "synthetic_data"),
        household_config=household_config,
        demographics_config=demographics_config,
        engagement_config=engagement_config,
        audience_config=audience_config,
        campaign_config=campaign_config
    )

    log_progress("VALIDATION", "Checking Unity Catalog permissions...")

    # Create schema if it doesn't exist
    catalog_name = generation_config.catalog_name
    schema_name = generation_config.schema_name

    log_progress("SETUP", f"Creating schema if not exists: {catalog_name}.{schema_name}")
    try:
        spark.sql(f"CREATE SCHEMA IF NOT EXISTS {catalog_name}.{schema_name}")
        log_progress("SETUP", f"Schema {catalog_name}.{schema_name} is ready")
    except Exception as e:
        log_progress("WARNING", f"Could not create schema: {e}")

    # Permission check will be done in pipeline
    log_progress("GENERATION", "Starting data generation pipeline...")

    # Execute pipeline with catalog writes enabled
    result = execute_full_pipeline(
        spark=spark,
        config=generation_config,
        write_to_catalog=True
    )

    if result["status"] == "completed":
        log_progress("SUCCESS", "Data generation completed successfully!")
        log_progress("SUMMARY", f"Tables created: {len(result['tables_created'])}")

        for table_name in result["tables_created"]:
            row_count = result["row_counts"].get(table_name, 0)
            log_progress("SUMMARY", f"  - {table_name}: {row_count:,} rows")
    else:
        log_progress("ERROR", f"Data generation failed: {result.get('error', 'Unknown error')}")

    return result

# COMMAND ----------

def write_result_to_volumes(result: Dict[str, Any], config: Dict[str, Any]) -> None:
    """Write generation result to Unity Catalog Volumes for wizard retrieval.

    Args:
        result: Generation result dictionary
        config: Original configuration
    """
    try:
        volume_path = "/Volumes/bryan_li/synthetic_data/generation_results"

        # Create result file with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        result_file = f"{volume_path}/result_{timestamp}.json"

        result_data = {
            "timestamp": timestamp,
            "config": config,
            "result": {
                "status": result["status"],
                "tables_created": result["tables_created"],
                "row_counts": result["row_counts"],
                "error": result.get("error")
            }
        }

        # Write to volumes
        dbutils.fs.put(result_file, json.dumps(result_data, indent=2))  # type: ignore

        log_progress("RESULT", f"Result written to: {result_file}")
    except Exception as e:
        log_progress("WARNING", f"Failed to write result to volumes: {e}")

# COMMAND ----------

# MAGIC %md
# MAGIC ## Main Execution

# COMMAND ----------

def main() -> None:
    """Main execution entry point."""
    try:
        # Parse configuration
        config = parse_config()

        log_progress("START", "=" * 80)
        log_progress("START", "Synthetic Identity Graph Data Generation")
        log_progress("START", "=" * 80)
        log_progress("CONFIG", f"Seed: {config.get('seed', 42)}")
        log_progress("CONFIG", f"Target: {config.get('catalog_name', 'bryan_li')}.{config.get('schema_name', 'synthetic_data')}")

        # Format household count with proper type checking
        household_config = config.get('household_config', {})
        num_households = household_config.get('num_households', 'N/A')
        if isinstance(num_households, (int, float)):
            log_progress("CONFIG", f"Households: {int(num_households):,}")
        else:
            log_progress("CONFIG", f"Households: {num_households}")

        # Initialize Spark
        spark = initialize_spark()
        log_progress("SPARK", f"Spark version: {spark.version}")

        # Execute pipeline
        start_time = datetime.now()
        result = execute_generation_pipeline(spark, config)
        end_time = datetime.now()

        duration = (end_time - start_time).total_seconds()
        log_progress("TIMING", f"Total execution time: {duration:.2f} seconds ({duration/60:.2f} minutes)")

        # Write result for wizard retrieval
        write_result_to_volumes(result, config)

        log_progress("END", "=" * 80)

        # Exit with appropriate code
        if result["status"] == "completed":
            log_progress("END", "✅ SUCCESS")
            sys.exit(0)
        else:
            log_progress("END", f"❌ FAILED: {result.get('error', 'Unknown error')}")
            sys.exit(1)

    except Exception as e:
        log_progress("ERROR", f"Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


# Databricks notebook execution
if __name__ == "__main__":
    main()
