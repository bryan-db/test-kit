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

def parse_config() -> Dict[str, Any]:
    """Parse configuration from job parameters.

    Returns:
        Configuration dictionary
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

    # Convert dict to typed config objects
    generation_config = GenerationConfig(
        seed=config.get("seed", 42),
        catalog_name=config.get("catalog_name", "bryan_li"),
        schema_name=config.get("schema_name", "synthetic_data"),
        household_config=HouseholdConfig(**config["household_config"]),
        demographics_config=DemographicsConfig(**config["demographics_config"]),
        engagement_config=EngagementConfig(**config["engagement_config"]),
        audience_config=AudienceConfig(**config.get("audience_config", {
            "segments": ["Tech Enthusiast", "Sports Fan", "News Junkie",
                        "Entertainment Seeker", "Casual User"],
            "behavioral_thresholds": {
                "heavy_user_min_daily": 10.0,
                "moderate_user_min_daily": 2.0,
                "light_user_min_daily": 0.5
            }
        })),
        campaign_config=CampaignConfig(**config["campaign_config"])
    )

    log_progress("VALIDATION", "Checking Unity Catalog permissions...")

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
