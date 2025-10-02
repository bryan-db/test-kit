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


def normalize_value(value: str) -> str:
    """Normalize string values by converting to lowercase snake_case.

    Args:
        value: String value to normalize

    Returns:
        Normalized value in lowercase snake_case
    """
    # Replace spaces with underscores and convert to lowercase
    normalized = value.replace(" ", "_").replace("'", "").lower()
    # Remove any consecutive underscores
    normalized = re.sub(r'_+', '_', normalized)
    # Remove leading/trailing underscores
    normalized = normalized.strip('_')
    return normalized


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


def normalize_distribution_values(config: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize distribution dictionary values to snake_case.

    This fixes issues with dbldatagen SQL generation when values contain spaces.

    Args:
        config: Configuration dictionary

    Returns:
        Config with normalized distribution values
    """
    # Normalize demographics_config distributions
    if "demographics_config" in config:
        demo = config["demographics_config"]

        # Normalize gender_distribution values
        if "gender_distribution" in demo and isinstance(demo["gender_distribution"], dict):
            demo["gender_distribution"] = {
                normalize_value(k): v for k, v in demo["gender_distribution"].items()
            }

        # Normalize education_distribution values
        if "education_distribution" in demo and isinstance(demo["education_distribution"], dict):
            demo["education_distribution"] = {
                normalize_value(k): v for k, v in demo["education_distribution"].items()
            }

        # Normalize employment_distribution values
        if "employment_distribution" in demo and isinstance(demo["employment_distribution"], dict):
            demo["employment_distribution"] = {
                normalize_value(k): v for k, v in demo["employment_distribution"].items()
            }

    return config


def restructure_react_config(config: Dict[str, Any]) -> Dict[str, Any]:
    """Restructure React app config to match Python dataclass structure.

    The React app sends a flat structure with camelCase, but Python expects
    nested structure. This function handles the conversion.

    Args:
        config: Configuration from React app

    Returns:
        Restructured config matching Python dataclass expectations
    """
    # Handle household_config restructuring
    if "household_config" in config:
        hh = config["household_config"]

        # Restructure householdSizeMean/StdDev into size_distribution
        if "household_size_mean" in hh and "household_size_std_dev" in hh:
            hh["size_distribution"] = {
                "mean": hh.pop("household_size_mean"),
                "std_dev": hh.pop("household_size_std_dev")
            }

    # Handle demographics_config restructuring
    if "demographics_config" in config:
        demo = config["demographics_config"]

        # Restructure ageRange into age_range if it's not already structured correctly
        if "age_range" in demo and isinstance(demo["age_range"], dict):
            # Already in correct format
            pass

    # Handle engagement_config restructuring
    if "engagement_config" in config:
        eng = config["engagement_config"]

        # Rename time_period_days if needed
        if "time_period_days" in eng:
            # Already in correct format
            pass

        # Rename events_per_person if needed
        if "events_per_person" in eng:
            # Already in correct format
            pass

    # Handle campaign_config restructuring
    if "campaign_config" in config:
        camp = config["campaign_config"]

        # Restructure durationRange into duration_range if needed
        if "duration_range" in camp and isinstance(camp["duration_range"], dict):
            # Already in correct format
            pass

        # Restructure responseRateRange into response_rate_range if needed
        if "response_rate_range" in camp and isinstance(camp["response_rate_range"], dict):
            # Already in correct format
            pass

    return config


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
        # Restructure React app config to match Python dataclass structure
        config = restructure_react_config(config)
        # Normalize distribution values to snake_case (fixes dbldatagen SQL generation)
        config = normalize_distribution_values(config)
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

def write_result_to_volumes(result: Dict[str, Any], config: Dict[str, Any], spark: SparkSession) -> None:
    """Write generation result to Unity Catalog Volumes for wizard retrieval.

    Args:
        result: Generation result dictionary
        config: Original configuration
        spark: Active SparkSession
    """
    try:
        catalog_name = config.get("catalog_name", "bryan_li")
        schema_name = config.get("schema_name", "synthetic_data")
        volume_name = "generation_results"
        volume_path = f"/Volumes/{catalog_name}/{schema_name}/{volume_name}"

        # Create volume if it doesn't exist
        try:
            spark.sql(f"CREATE VOLUME IF NOT EXISTS {catalog_name}.{schema_name}.{volume_name}")
            log_progress("SETUP", f"Volume {catalog_name}.{schema_name}.{volume_name} is ready")
        except Exception as vol_err:
            log_progress("WARNING", f"Could not create volume: {vol_err}")

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
        write_result_to_volumes(result, config, spark)

        log_progress("END", "=" * 80)

        # Log completion status (don't call sys.exit - let notebook complete naturally)
        if result["status"] == "completed":
            log_progress("END", "✅ SUCCESS")
        else:
            log_progress("END", f"❌ FAILED: {result.get('error', 'Unknown error')}")
            raise RuntimeError(f"Pipeline failed: {result.get('error', 'Unknown error')}")

    except Exception as e:
        log_progress("ERROR", f"Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise


# Databricks notebook execution
if __name__ == "__main__":
    main()
