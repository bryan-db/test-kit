"""Full pipeline orchestrator for synthetic data generation.

This module coordinates the execution of all generators in the correct order
to maintain referential integrity and temporal consistency.
"""

from datetime import datetime
from typing import Dict, Any, Optional
from pyspark.sql import SparkSession, DataFrame

from src.models.schemas import GenerationConfig
from src.generators.household_generator import generate_households
from src.generators.individual_generator import (
    generate_individuals_and_identities,
)
from src.generators.engagement_generator import generate_content_engagements
from src.generators.audience_generator import (
    derive_viewership_patterns_and_audience_attributes,
)
from src.generators.campaign_generator import (
    generate_campaigns,
    generate_campaign_exposures,
)
from src.generators.response_generator import (
    generate_response_events_and_outcomes,
)


def execute_full_pipeline(
    spark: Optional[SparkSession],
    config: GenerationConfig,
    write_to_catalog: bool = False,
) -> Dict[str, Any]:
    """Execute complete synthetic data generation pipeline.

    Generates all 10 entity types in dependency order:
    1. Households
    2. Individuals (FK: household_id)
    3. Identity Mappings (FK: individual_id)
    4. Content Engagements (FK: individual_id)
    5. Viewership Patterns (aggregated from engagements)
    6. Audience Attributes (derived from viewership)
    7. Campaigns
    8. Campaign Exposures (FK: individual_id, campaign_id)
    9. Response Events (FK: individual_id, campaign_id, exposure_id)
    10. Outcome Metrics (FK: response_id)

    Args:
        spark: Active SparkSession (None if no Spark available for testing)
        config: Complete generation configuration
        write_to_catalog: Whether to write tables to Unity Catalog

    Returns:
        Dictionary with:
        - status: "completed" or "failed"
        - tables_created: List of table names
        - row_counts: Dict mapping table names to row counts
        - dataframes: Dict mapping table names to DataFrames
        - error: Error message if failed

    Example:
        >>> config = GenerationConfig(
        ...     seed=42,
        ...     household_config=HouseholdConfig(...),
        ...     demographics_config=DemographicsConfig(...),
        ...     ...
        ... )
        >>> result = execute_full_pipeline(spark, config)
        >>> print(result["status"])
        completed
    """
    result = {
        "status": "pending",
        "tables_created": [],
        "row_counts": {},
        "dataframes": {},
        "error": None,
    }

    try:
        # Check if Spark is available
        if spark is None:
            return {
                "status": "failed",
                "error": "SparkSession is required for pipeline execution",
                "tables_created": [],
                "row_counts": {},
                "dataframes": {},
            }

        # Phase 1: Check permissions (if write_to_catalog)
        if write_to_catalog:
            from src.utils.auth import verify_catalog_permissions

            print(f"[PIPELINE] Checking permissions for catalog='{config.catalog_name}', schema='{config.schema_name}'")
            has_perms, missing = verify_catalog_permissions(
                catalog_name=config.catalog_name,
                schema_name=config.schema_name,
                user_principal="current_user",  # Will be detected from SDK
            )

            if not has_perms:
                error_msg = f"Missing permissions: {', '.join(missing)}. Required: USE_CATALOG, USE_SCHEMA, CREATE_TABLE"
                print(f"[PIPELINE] Permission check FAILED: {error_msg}")
                return {
                    "status": "failed",
                    "error": error_msg,
                    "tables_created": [],
                    "row_counts": {},
                    "dataframes": {},
                }
            print(f"[PIPELINE] Permission check PASSED for {config.catalog_name}.{config.schema_name}")

        # Phase 2: Generate households
        print(f"[PIPELINE] Phase 2: Generating {config.household_config.num_households} households...")
        households_df = generate_households(
            spark, config.household_config, seed=config.seed
        )
        result["dataframes"]["households"] = households_df
        household_count = households_df.count()
        result["row_counts"]["households"] = household_count
        result["tables_created"].append("households")
        print(f"[PIPELINE] Phase 2 COMPLETE: Generated {household_count} households")

        # Phase 3: Generate individuals and identity mappings
        individuals_df, identity_mappings_df = generate_individuals_and_identities(
            spark, households_df, config.demographics_config, seed=config.seed
        )
        result["dataframes"]["individuals"] = individuals_df
        result["dataframes"]["identity_mappings"] = identity_mappings_df
        result["row_counts"]["individuals"] = individuals_df.count()
        result["row_counts"]["identity_mappings"] = identity_mappings_df.count()
        result["tables_created"].extend(["individuals", "identity_mappings"])

        # Phase 4: Generate content engagements
        content_engagements_df = generate_content_engagements(
            spark, individuals_df, config.engagement_config, seed=config.seed
        )
        result["dataframes"]["content_engagements"] = content_engagements_df
        result["row_counts"]["content_engagements"] = content_engagements_df.count()
        result["tables_created"].append("content_engagements")

        # Phase 5: Derive viewership patterns and audience attributes
        viewership_patterns_df, audience_attributes_df = (
            derive_viewership_patterns_and_audience_attributes(
                spark, individuals_df, content_engagements_df,
                config.audience_config, seed=config.seed
            )
        )
        result["dataframes"]["viewership_patterns"] = viewership_patterns_df
        result["dataframes"]["audience_attributes"] = audience_attributes_df
        result["row_counts"]["viewership_patterns"] = viewership_patterns_df.count()
        result["row_counts"]["audience_attributes"] = audience_attributes_df.count()
        result["tables_created"].extend(["viewership_patterns", "audience_attributes"])

        # Phase 6: Generate campaigns
        campaigns_df = generate_campaigns(
            spark, config.campaign_config, seed=config.seed
        )
        result["dataframes"]["campaigns"] = campaigns_df
        result["row_counts"]["campaigns"] = campaigns_df.count()
        result["tables_created"].append("campaigns")

        # Phase 7: Generate campaign exposures
        campaign_exposures_df = generate_campaign_exposures(
            spark, individuals_df, campaigns_df, audience_attributes_df,
            config.campaign_config, seed=config.seed
        )
        result["dataframes"]["campaign_exposures"] = campaign_exposures_df
        result["row_counts"]["campaign_exposures"] = campaign_exposures_df.count()
        result["tables_created"].append("campaign_exposures")

        # Phase 8: Generate response events and outcome metrics
        response_events_df, outcome_metrics_df = generate_response_events_and_outcomes(
            spark, campaign_exposures_df, audience_attributes_df,
            config.campaign_config, seed=config.seed
        )
        result["dataframes"]["response_events"] = response_events_df
        result["dataframes"]["outcome_metrics"] = outcome_metrics_df
        result["row_counts"]["response_events"] = response_events_df.count()
        result["row_counts"]["outcome_metrics"] = outcome_metrics_df.count()
        result["tables_created"].extend(["response_events", "outcome_metrics"])

        # Write to Unity Catalog if requested
        if write_to_catalog:
            from src.storage.catalog_writer import CatalogWriter

            writer = CatalogWriter(spark)

            for table_name, df in result["dataframes"].items():
                if df.count() > 0:  # Only write non-empty tables
                    writer.write_table(
                        df=df,
                        catalog=config.catalog_name,
                        schema=config.schema_name,
                        table_name=table_name,
                        mode="overwrite",
                    )

        result["status"] = "completed"

    except Exception as e:
        result["status"] = "failed"
        result["error"] = str(e)

    return result
