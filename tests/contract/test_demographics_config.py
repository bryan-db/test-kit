"""
Contract tests for DemographicsConfig validation.

Tests validate that demographics configuration validation matches the contract
specification in contracts/app_interface.yaml.

These tests MUST FAIL initially (TDD) until validation is implemented.
"""

import pytest


class TestDemographicsConfigValidation:
    """Test demographics configuration validation rules."""

    def test_age_range_minimum_validation(self):
        """Age minimum below 18 should be rejected."""
        from databricks_app.src.wizard.validation import validate_demographics_config

        config = {
            "age_range": {"min": 17, "max": 85},
            "gender_distribution": {"Male": 0.48, "Female": 0.48, "Non-Binary": 0.03, "Prefer not to say": 0.01},
        }

        result = validate_demographics_config(config)
        assert not result["valid"], "Should reject age_range.min < 18"
        assert any("age_range" in err["field"] for err in result["errors"])

    def test_age_range_maximum_validation(self):
        """Age maximum above 100 should be rejected."""
        from databricks_app.src.wizard.validation import validate_demographics_config

        config = {
            "age_range": {"min": 18, "max": 101},
            "gender_distribution": {"Male": 0.48, "Female": 0.48, "Non-Binary": 0.03, "Prefer not to say": 0.01},
        }

        result = validate_demographics_config(config)
        assert not result["valid"], "Should reject age_range.max > 100"

    def test_valid_age_range(self):
        """Age range between 18 and 100 should be accepted."""
        from databricks_app.src.wizard.validation import validate_demographics_config

        config = {
            "age_range": {"min": 18, "max": 85},
            "gender_distribution": {"Male": 0.48, "Female": 0.48, "Non-Binary": 0.03, "Prefer not to say": 0.01},
        }

        result = validate_demographics_config(config)
        assert result["valid"], "Should accept valid age range"

    def test_age_min_greater_than_max(self):
        """Age min greater than max should be rejected."""
        from databricks_app.src.wizard.validation import validate_demographics_config

        config = {
            "age_range": {"min": 60, "max": 30},
            "gender_distribution": {"Male": 0.48, "Female": 0.48, "Non-Binary": 0.03, "Prefer not to say": 0.01},
        }

        result = validate_demographics_config(config)
        assert not result["valid"], "Should reject age_range.min > age_range.max"

    def test_gender_distribution_weights_sum_to_one(self):
        """Gender distribution weights must sum to 1.0 (within tolerance)."""
        from databricks_app.src.wizard.validation import validate_demographics_config

        # Invalid: sum to 0.95
        config = {
            "age_range": {"min": 18, "max": 85},
            "gender_distribution": {"Male": 0.45, "Female": 0.45, "Non-Binary": 0.03, "Prefer not to say": 0.02},
        }

        result = validate_demographics_config(config)
        assert not result["valid"], "Should reject gender weights not summing to 1.0"
        assert any("gender_distribution" in err["field"] for err in result["errors"])

    def test_valid_gender_distribution(self):
        """Valid gender distribution summing to 1.0 should be accepted."""
        from databricks_app.src.wizard.validation import validate_demographics_config

        config = {
            "age_range": {"min": 18, "max": 85},
            "gender_distribution": {"Male": 0.48, "Female": 0.48, "Non-Binary": 0.03, "Prefer not to say": 0.01},
        }

        result = validate_demographics_config(config)
        assert result["valid"], "Should accept valid gender distribution"

    def test_identifiers_per_person_range(self):
        """identifiers_per_person.mean must be between 2 and 15."""
        from databricks_app.src.wizard.validation import validate_demographics_config

        # Too low
        config = {
            "age_range": {"min": 18, "max": 85},
            "gender_distribution": {"Male": 0.48, "Female": 0.48, "Non-Binary": 0.03, "Prefer not to say": 0.01},
            "identity_mappings": {"identifiers_per_person": {"mean": 1}},
        }

        result = validate_demographics_config(config)
        assert not result["valid"], "Should reject identifiers_per_person.mean < 2"

        # Too high
        config["identity_mappings"]["identifiers_per_person"]["mean"] = 16
        result = validate_demographics_config(config)
        assert not result["valid"], "Should reject identifiers_per_person.mean > 15"

        # Valid
        config["identity_mappings"]["identifiers_per_person"]["mean"] = 4
        result = validate_demographics_config(config)
        assert result["valid"], "Should accept identifiers_per_person.mean = 4"

    def test_identifier_type_distribution_probabilities(self):
        """Identifier type distribution probabilities must be between 0 and 1."""
        from databricks_app.src.wizard.validation import validate_demographics_config

        # Invalid: probability > 1.0
        config = {
            "age_range": {"min": 18, "max": 85},
            "gender_distribution": {"Male": 0.48, "Female": 0.48, "Non-Binary": 0.03, "Prefer not to say": 0.01},
            "identity_mappings": {
                "identifiers_per_person": {"mean": 4},
                "identifier_type_distribution": {
                    "email_hash": 1.2,  # Invalid
                    "cookie_id": 0.9,
                },
            },
        }

        result = validate_demographics_config(config)
        assert not result["valid"], "Should reject probability > 1.0"

    def test_education_distribution_valid_levels(self):
        """Education distribution must only contain valid education levels."""
        from databricks_app.src.wizard.validation import validate_demographics_config

        valid_levels = ["High School", "Some College", "Bachelor", "Master", "Doctorate"]

        config = {
            "age_range": {"min": 18, "max": 85},
            "gender_distribution": {"Male": 0.48, "Female": 0.48, "Non-Binary": 0.03, "Prefer not to say": 0.01},
            "education_distribution": {level: 0.2 for level in valid_levels},
        }

        result = validate_demographics_config(config)
        assert result["valid"], "Should accept valid education levels"

        # Invalid level
        config["education_distribution"]["InvalidLevel"] = 0.1
        result = validate_demographics_config(config)
        assert not result["valid"], "Should reject invalid education level"

    def test_validation_result_structure(self):
        """Validation result must have required structure."""
        from databricks_app.src.wizard.validation import validate_demographics_config

        config = {
            "age_range": {"min": 18, "max": 85},
            "gender_distribution": {"Male": 0.48, "Female": 0.48, "Non-Binary": 0.03, "Prefer not to say": 0.01},
        }

        result = validate_demographics_config(config)

        assert "valid" in result
        assert "errors" in result
        assert "warnings" in result
        assert isinstance(result["valid"], bool)
        assert isinstance(result["errors"], list)
        assert isinstance(result["warnings"], list)

    def test_missing_required_fields(self):
        """Missing required fields should be rejected with clear error."""
        from databricks_app.src.wizard.validation import validate_demographics_config

        # Missing age_range
        config = {
            "gender_distribution": {"Male": 0.48, "Female": 0.48, "Non-Binary": 0.03, "Prefer not to say": 0.01}
        }

        result = validate_demographics_config(config)
        assert not result["valid"]
        assert any("age_range" in err["field"] for err in result["errors"])

        # Missing gender_distribution
        config = {"age_range": {"min": 18, "max": 85}}

        result = validate_demographics_config(config)
        assert not result["valid"]
        assert any("gender_distribution" in err["field"] for err in result["errors"])


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
