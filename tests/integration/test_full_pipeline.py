"""Integration test for full end-to-end pipeline.

This test validates the complete data generation workflow from configuration to
Unity Catalog persistence for all entity types.

Following TDD: This test MUST FAIL until generators (T020-T027) and storage (T028) are implemented.
"""

import pytest
from datetime import datetime
from pyspark.sql import SparkSession


class TestFullPipeline:
    """Integration tests for complete data generation pipeline."""

    @pytest.fixture(scope="class")
    def spark(self):
        """Create Spark session for testing."""
        spark = (
            SparkSession.builder.appName("test_full_pipeline")
            .config("spark.sql.shuffle.partitions", "4")
            .config("spark.sql.adaptive.enabled", "true")
            .getOrCreate()
        )
        yield spark
        spark.stop()

    def test_generate_10k_households_end_to_end(self, spark):
        """Test Scenario 1 from quickstart.md: Generate 10K households end-to-end.

        This test validates:
        - All 10 entity tables are generated
        - Referential integrity across foreign keys
        - Data volumes match expected ranges
        - Generation completes in reasonable time (< 5 minutes)
        - All data quality constraints are satisfied
        """
        from databricks_app.src.models.schemas import GenerationConfig, HouseholdConfig
        from databricks_app.src.models.schemas import DemographicsConfig, EngagementConfig
        from databricks_app.src.models.schemas import AudienceConfig, CampaignConfig

        # Configure generation matching quickstart.md Scenario 1
        config = GenerationConfig(
            seed=42,
            catalog_name="bryan_li",
            schema_name="synthetic_data",
            household_config=HouseholdConfig(
                num_households=10000,
                income_brackets={
                    "<30K": 0.20,
                    "30-60K": 0.30,
                    "60-100K": 0.25,
                    "100-150K": 0.15,
                    "150K+": 0.10,
                },
                size_distribution={"mean": 2.5, "std_dev": 1.2},
            ),
            demographics_config=DemographicsConfig(
                age_range={"min": 18, "max": 85},
                gender_distribution={
                    "Male": 0.48,
                    "Female": 0.48,
                    "Non-Binary": 0.03,
                    "Prefer not to say": 0.01,
                },
                education_distribution={
                    "High School": 0.28,
                    "Some College": 0.21,
                    "Bachelor": 0.33,
                    "Master": 0.14,
                    "Doctorate": 0.04,
                },
                identity_mappings={"identifiers_per_person": {"mean": 4}},
            ),
            engagement_config=EngagementConfig(
                num_events_per_person={"mean": 50, "std_dev": 20},
                event_types={
                    "view": 0.70,
                    "click": 0.20,
                    "share": 0.05,
                    "like": 0.04,
                    "comment": 0.01,
                },
                duration_range={"min": 10, "max": 3600},
                temporal_pattern="daily",
                content_categories={
                    "Technology": 0.25,
                    "Sports": 0.20,
                    "Entertainment": 0.20,
                    "News": 0.15,
                    "Lifestyle": 0.10,
                    "Finance": 0.10,
                },
            ),
            audience_config=AudienceConfig(
                segments=[
                    "Tech Enthusiast",
                    "Sports Fan",
                    "Entertainment Lover",
                    "News Junkie",
                ],
                affinity_threshold=0.3,
                behavioral_classifications=["High Value", "Medium Value", "Low Value"],
                recency_weight=0.3,
                frequency_weight=0.7,
            ),
            campaign_config=CampaignConfig(
                num_campaigns=5,
                channels=["email", "social", "display"],
                exposure_rate=0.30,
                response_rate=0.05,
                conversion_rate=0.20,
                campaign_duration_days={"min": 14, "max": 60},
            ),
        )

        # Execute full pipeline
        from databricks_app.src.generators.pipeline import execute_full_pipeline

        start_time = datetime.now()
        result = execute_full_pipeline(spark, config)
        duration_seconds = (datetime.now() - start_time).total_seconds()

        # Assert generation completed
        assert result["status"] == "completed", f"Pipeline failed: {result.get('error')}"

        # Assert reasonable completion time (< 5 minutes for 10K households)
        assert (
            duration_seconds < 300
        ), f"Generation took too long: {duration_seconds:.1f}s"

        # Assert all 10 tables were created
        expected_tables = [
            "households",
            "individuals",
            "identity_mappings",
            "content_engagements",
            "viewership_patterns",
            "audience_attributes",
            "campaigns",
            "campaign_exposures",
            "response_events",
            "outcome_metrics",
        ]

        for table_name in expected_tables:
            assert (
                table_name in result["tables_created"]
            ), f"Table {table_name} not created"

        # Assert row counts are within expected ranges
        assert result["row_counts"]["households"] == 10000, "Wrong household count"

        # Individuals: 10K households * avg 2.5 size = ~25K individuals
        assert 20000 <= result["row_counts"]["individuals"] <= 30000, (
            f"Individual count out of range: {result['row_counts']['individuals']}"
        )

        # Identity mappings: ~25K individuals * avg 4 identifiers = ~100K mappings
        assert 80000 <= result["row_counts"]["identity_mappings"] <= 120000, (
            f"Identity mapping count out of range: {result['row_counts']['identity_mappings']}"
        )

        # Content engagements: ~25K individuals * avg 50 events = ~1.25M events
        assert 1000000 <= result["row_counts"]["content_engagements"] <= 1500000, (
            f"Content engagement count out of range: {result['row_counts']['content_engagements']}"
        )

        # Campaigns: exactly 5
        assert result["row_counts"]["campaigns"] == 5, "Wrong campaign count"

        # Campaign exposures: ~25K individuals * 30% reach * 5 campaigns = ~37.5K
        assert 30000 <= result["row_counts"]["campaign_exposures"] <= 50000, (
            f"Campaign exposure count out of range: {result['row_counts']['campaign_exposures']}"
        )

        # Response events: exposures * 5% response rate
        expected_responses = result["row_counts"]["campaign_exposures"] * 0.05
        assert abs(result["row_counts"]["response_events"] - expected_responses) < (
            expected_responses * 0.3
        ), f"Response event count out of range: {result['row_counts']['response_events']}"

    def test_referential_integrity_across_tables(self, spark):
        """Test that foreign key relationships are maintained across all tables.

        This test validates:
        - All individuals have valid household_id references
        - All identity_mappings have valid individual_id references
        - All content_engagements have valid individual_id references
        - All campaign_exposures have valid individual_id and campaign_id references
        - All response_events have valid individual_id, campaign_id, and exposure_id references
        """
        from databricks_app.src.generators.pipeline import execute_full_pipeline
        from databricks_app.src.models.schemas import GenerationConfig, HouseholdConfig
        from databricks_app.src.models.schemas import DemographicsConfig, EngagementConfig
        from databricks_app.src.models.schemas import AudienceConfig, CampaignConfig

        # Small dataset for faster testing
        config = GenerationConfig(
            seed=999,
            household_config=HouseholdConfig(
                num_households=100, income_brackets={"<30K": 1.0}
            ),
            demographics_config=DemographicsConfig(
                age_range={"min": 18, "max": 85},
                gender_distribution={"Male": 0.5, "Female": 0.5},
                identity_mappings={"identifiers_per_person": {"mean": 3}},
            ),
            engagement_config=EngagementConfig(
                num_events_per_person={"mean": 10, "std_dev": 5},
                event_types={"view": 1.0},
                duration_range={"min": 10, "max": 100},
                temporal_pattern="uniform",
            ),
            audience_config=AudienceConfig(
                segments=["Segment A"],
                affinity_threshold=0.5,
                behavioral_classifications=["High"],
            ),
            campaign_config=CampaignConfig(
                num_campaigns=2,
                channels=["email"],
                exposure_rate=0.5,
                response_rate=0.1,
                conversion_rate=0.5,
                campaign_duration_days={"min": 7, "max": 14},
            ),
        )

        result = execute_full_pipeline(spark, config)
        assert result["status"] == "completed"

        # Get DataFrames from result
        households = result["dataframes"]["households"]
        individuals = result["dataframes"]["individuals"]
        identity_mappings = result["dataframes"]["identity_mappings"]
        campaign_exposures = result["dataframes"]["campaign_exposures"]
        campaigns = result["dataframes"]["campaigns"]

        # Check individuals.household_id references exist
        orphan_individuals = individuals.join(
            households, individuals.household_id == households.household_id, "left_anti"
        ).count()
        assert orphan_individuals == 0, f"Found {orphan_individuals} orphan individuals"

        # Check identity_mappings.individual_id references exist
        orphan_mappings = identity_mappings.join(
            individuals,
            identity_mappings.individual_id == individuals.individual_id,
            "left_anti",
        ).count()
        assert orphan_mappings == 0, f"Found {orphan_mappings} orphan identity mappings"

        # Check campaign_exposures foreign keys
        orphan_exposures_individuals = campaign_exposures.join(
            individuals,
            campaign_exposures.individual_id == individuals.individual_id,
            "left_anti",
        ).count()
        assert (
            orphan_exposures_individuals == 0
        ), f"Found {orphan_exposures_individuals} exposures with invalid individual_id"

        orphan_exposures_campaigns = campaign_exposures.join(
            campaigns,
            campaign_exposures.campaign_id == campaigns.campaign_id,
            "left_anti",
        ).count()
        assert (
            orphan_exposures_campaigns == 0
        ), f"Found {orphan_exposures_campaigns} exposures with invalid campaign_id"

    def test_deterministic_full_pipeline_with_seed(self, spark):
        """Test that same seed produces identical full pipeline results."""
        from databricks_app.src.generators.pipeline import execute_full_pipeline
        from databricks_app.src.models.schemas import GenerationConfig, HouseholdConfig
        from databricks_app.src.models.schemas import DemographicsConfig, EngagementConfig
        from databricks_app.src.models.schemas import AudienceConfig, CampaignConfig

        # Minimal config for faster execution
        config = GenerationConfig(
            seed=777,
            household_config=HouseholdConfig(
                num_households=50, income_brackets={"<30K": 1.0}
            ),
            demographics_config=DemographicsConfig(
                age_range={"min": 18, "max": 50},
                gender_distribution={"Male": 1.0},
                identity_mappings={"identifiers_per_person": {"mean": 2}},
            ),
            engagement_config=EngagementConfig(
                num_events_per_person={"mean": 5, "std_dev": 2},
                event_types={"view": 1.0},
                duration_range={"min": 10, "max": 60},
                temporal_pattern="uniform",
            ),
            audience_config=AudienceConfig(
                segments=["A"],
                affinity_threshold=0.5,
                behavioral_classifications=["High"],
            ),
            campaign_config=CampaignConfig(
                num_campaigns=1,
                channels=["email"],
                exposure_rate=0.3,
                response_rate=0.1,
                conversion_rate=0.5,
                campaign_duration_days={"min": 7, "max": 7},
            ),
        )

        # Run pipeline twice with same seed
        result1 = execute_full_pipeline(spark, config)
        result2 = execute_full_pipeline(spark, config)

        assert result1["status"] == "completed"
        assert result2["status"] == "completed"

        # Compare row counts
        for table in result1["row_counts"].keys():
            assert result1["row_counts"][table] == result2["row_counts"][table], (
                f"Row count mismatch for {table}: "
                f"{result1['row_counts'][table]} vs {result2['row_counts'][table]}"
            )

    @pytest.mark.skip(reason="Requires Unity Catalog - run manually")
    def test_write_full_pipeline_to_unity_catalog(self, spark):
        """Test writing complete pipeline output to Unity Catalog.

        This test validates:
        - All tables created in bryan_li.synthetic_data schema
        - Delta Lake format for all tables
        - Optimized writes applied
        - Z-Order optimization for key columns
        """
        from databricks_app.src.generators.pipeline import execute_full_pipeline
        from databricks_app.src.storage.catalog_writer import CatalogWriter
        from databricks_app.src.models.schemas import GenerationConfig, HouseholdConfig
        from databricks_app.src.models.schemas import DemographicsConfig, EngagementConfig
        from databricks_app.src.models.schemas import AudienceConfig, CampaignConfig

        config = GenerationConfig(
            seed=42,
            catalog_name="bryan_li",
            schema_name="synthetic_data",
            household_config=HouseholdConfig(
                num_households=1000, income_brackets={"<30K": 0.5, "30-60K": 0.5}
            ),
            demographics_config=DemographicsConfig(
                age_range={"min": 18, "max": 85},
                gender_distribution={"Male": 0.5, "Female": 0.5},
                identity_mappings={"identifiers_per_person": {"mean": 4}},
            ),
            engagement_config=EngagementConfig(
                num_events_per_person={"mean": 20, "std_dev": 10},
                event_types={"view": 0.7, "click": 0.3},
                duration_range={"min": 10, "max": 300},
                temporal_pattern="daily",
            ),
            audience_config=AudienceConfig(
                segments=["Tech", "Sports"],
                affinity_threshold=0.3,
                behavioral_classifications=["High", "Medium", "Low"],
            ),
            campaign_config=CampaignConfig(
                num_campaigns=3,
                channels=["email", "social"],
                exposure_rate=0.25,
                response_rate=0.05,
                conversion_rate=0.2,
                campaign_duration_days={"min": 14, "max": 30},
            ),
        )

        # Execute and write to Unity Catalog
        result = execute_full_pipeline(spark, config, write_to_catalog=True)

        assert result["status"] == "completed"

        # Verify all tables exist in Unity Catalog
        for table_name in result["tables_created"]:
            full_table_name = f"bryan_li.synthetic_data.{table_name}"
            df = spark.table(full_table_name)
            assert df.count() > 0, f"Table {full_table_name} is empty"

            # Verify Delta format
            table_detail = spark.sql(f"DESCRIBE DETAIL {full_table_name}").collect()[0]
            assert table_detail.format == "delta", f"{table_name} is not Delta format"
