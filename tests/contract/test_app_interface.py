"""
Contract tests for Databricks App interface specification.

Tests validate that the application implements the contract defined in
specs/001-create-a-databricks/contracts/app_interface.yaml

These tests MUST FAIL initially (TDD approach) and pass once implementation is complete.
"""

import pytest
from enum import Enum
from typing import Dict, Any, Optional
from datetime import datetime
from uuid import UUID


class TestWizardStepContract:
    """Test WizardStep enum matches contract specification."""

    def test_wizard_step_enum_exists(self):
        """WizardStep enum should be defined in the application."""
        # This will fail until we implement the enum
        from databricks_app.src.models.schemas import WizardStep

        assert WizardStep is not None
        assert issubclass(WizardStep, Enum)

    def test_wizard_step_values_match_contract(self):
        """WizardStep enum values must match contract exactly."""
        from databricks_app.src.models.schemas import WizardStep

        expected_steps = {
            "household_config",
            "demographics_config",
            "engagement_config",
            "audience_config",
            "campaign_config",
            "review_submit",
        }

        actual_steps = {step.value for step in WizardStep}
        assert actual_steps == expected_steps, (
            f"WizardStep enum values mismatch. "
            f"Expected: {expected_steps}, Got: {actual_steps}"
        )


class TestSessionStateContract:
    """Test SessionState schema matches contract specification."""

    def test_session_state_class_exists(self):
        """SessionState class should be defined."""
        from databricks_app.src.models.schemas import SessionState

        assert SessionState is not None

    def test_session_state_required_fields(self):
        """SessionState must have all required fields from contract."""
        from databricks_app.src.models.schemas import SessionState

        # Required fields: session_id, current_step, config, created_at
        required_fields = {"session_id", "current_step", "config", "created_at"}

        # Check that SessionState has these fields (will fail until implemented)
        state = SessionState(
            session_id="550e8400-e29b-41d4-a716-446655440000",
            current_step="household_config",
            config={},
            created_at=datetime.now(),
        )

        for field in required_fields:
            assert hasattr(state, field), f"SessionState missing required field: {field}"

    def test_session_state_optional_fields(self):
        """SessionState must support optional fields from contract."""
        from databricks_app.src.models.schemas import SessionState

        # Optional fields: job_id, job_status, updated_at
        state = SessionState(
            session_id="550e8400-e29b-41d4-a716-446655440000",
            current_step="household_config",
            config={},
            created_at=datetime.now(),
            job_id="job_123",
            job_status="running",
            updated_at=datetime.now(),
        )

        assert hasattr(state, "job_id")
        assert hasattr(state, "job_status")
        assert hasattr(state, "updated_at")

    def test_session_id_is_uuid_format(self):
        """Session ID must be valid UUID format."""
        from databricks_app.src.models.schemas import SessionState

        valid_uuid = "550e8400-e29b-41d4-a716-446655440000"
        state = SessionState(
            session_id=valid_uuid,
            current_step="household_config",
            config={},
            created_at=datetime.now(),
        )

        # Verify it can be parsed as UUID
        UUID(state.session_id)

    def test_job_status_enum_values(self):
        """Job status must be one of: pending, running, succeeded, failed, cancelled."""
        from databricks_app.src.models.schemas import SessionState

        valid_statuses = ["pending", "running", "succeeded", "failed", "cancelled"]

        for status in valid_statuses:
            state = SessionState(
                session_id="550e8400-e29b-41d4-a716-446655440000",
                current_step="household_config",
                config={},
                created_at=datetime.now(),
                job_status=status,
            )
            assert state.job_status == status


class TestGenerationConfigContract:
    """Test GenerationConfig schema matches contract specification."""

    def test_generation_config_class_exists(self):
        """GenerationConfig class should be defined."""
        from databricks_app.src.models.schemas import GenerationConfig

        assert GenerationConfig is not None

    def test_generation_config_required_fields(self):
        """GenerationConfig must have all required fields."""
        from databricks_app.src.models.schemas import GenerationConfig

        # Required: seed, catalog_name, schema_name, household_config,
        #           demographics_config, engagement_config, campaign_config
        config = GenerationConfig(
            seed=42,
            catalog_name="bryan_li",
            schema_name="synthetic_data",
            household_config={},
            demographics_config={},
            engagement_config={},
            campaign_config={},
        )

        assert config.seed == 42
        assert config.catalog_name == "bryan_li"
        assert config.schema_name == "synthetic_data"
        assert hasattr(config, "household_config")
        assert hasattr(config, "demographics_config")
        assert hasattr(config, "engagement_config")
        assert hasattr(config, "campaign_config")

    def test_seed_range_validation(self):
        """Seed must be between 0 and 2147483647 (32-bit signed int max)."""
        from databricks_app.src.models.schemas import GenerationConfig

        # Valid seed
        config = GenerationConfig(
            seed=42,
            catalog_name="bryan_li",
            schema_name="synthetic_data",
            household_config={},
            demographics_config={},
            engagement_config={},
            campaign_config={},
        )
        assert 0 <= config.seed <= 2147483647

        # Seed at boundaries
        config_min = GenerationConfig(
            seed=0,
            catalog_name="bryan_li",
            schema_name="synthetic_data",
            household_config={},
            demographics_config={},
            engagement_config={},
            campaign_config={},
        )
        assert config_min.seed == 0

        config_max = GenerationConfig(
            seed=2147483647,
            catalog_name="bryan_li",
            schema_name="synthetic_data",
            household_config={},
            demographics_config={},
            engagement_config={},
            campaign_config={},
        )
        assert config_max.seed == 2147483647

    def test_catalog_defaults(self):
        """Catalog and schema should have default values."""
        from databricks_app.src.models.schemas import GenerationConfig

        # If defaults are implemented, this should use them
        config = GenerationConfig(
            seed=42,
            household_config={},
            demographics_config={},
            engagement_config={},
            campaign_config={},
        )

        # Contract specifies bryan_li as default catalog
        assert config.catalog_name == "bryan_li"


class TestHouseholdConfigContract:
    """Test HouseholdConfig schema matches contract."""

    def test_household_config_class_exists(self):
        """HouseholdConfig class should be defined."""
        from databricks_app.src.models.schemas import HouseholdConfig

        assert HouseholdConfig is not None

    def test_num_households_range(self):
        """num_households must be between 1000 and 10000000."""
        from databricks_app.src.models.schemas import HouseholdConfig

        # Valid range
        config = HouseholdConfig(num_households=10000, size_distribution={"mean": 2.5})
        assert 1000 <= config.num_households <= 10000000

        # Minimum boundary
        config_min = HouseholdConfig(num_households=1000, size_distribution={"mean": 2.5})
        assert config_min.num_households == 1000

        # Maximum boundary
        config_max = HouseholdConfig(
            num_households=10000000, size_distribution={"mean": 2.5}
        )
        assert config_max.num_households == 10000000


class TestDemographicsConfigContract:
    """Test DemographicsConfig schema matches contract."""

    def test_demographics_config_class_exists(self):
        """DemographicsConfig class should be defined."""
        from databricks_app.src.models.schemas import DemographicsConfig

        assert DemographicsConfig is not None

    def test_age_range_validation(self):
        """Age range must be between 18 and 100."""
        from databricks_app.src.models.schemas import DemographicsConfig

        config = DemographicsConfig(
            age_range={"min": 18, "max": 85}, gender_distribution={"Male": 0.48}
        )

        assert 18 <= config.age_range["min"] <= 100
        assert 18 <= config.age_range["max"] <= 100

    def test_gender_distribution_weights(self):
        """Gender distribution weights should sum to approximately 1.0."""
        from databricks_app.src.models.schemas import DemographicsConfig

        config = DemographicsConfig(
            age_range={"min": 18, "max": 85},
            gender_distribution={"Male": 0.48, "Female": 0.48, "Non-Binary": 0.03, "Prefer not to say": 0.01},
        )

        total_weight = sum(config.gender_distribution.values())
        assert abs(total_weight - 1.0) < 0.01, f"Gender weights sum to {total_weight}, expected 1.0"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
