"""
Contract tests for HouseholdConfig validation.

Tests validate that household configuration validation matches the contract
specification in contracts/app_interface.yaml.

These tests MUST FAIL initially (TDD) until validation is implemented.
"""

import pytest


class TestHouseholdConfigValidation:
    """Test household configuration validation rules."""

    def test_num_households_minimum_validation(self):
        """num_households below 1000 should be rejected."""
        from databricks_app.src.wizard.validation import validate_household_config

        config = {"num_households": 999, "size_distribution": {"mean": 2.5, "std_dev": 1.2}}

        result = validate_household_config(config)
        assert not result["valid"], "Should reject num_households < 1000"
        assert any("num_households" in err["field"] for err in result["errors"])

    def test_num_households_maximum_validation(self):
        """num_households above 10000000 should be rejected."""
        from databricks_app.src.wizard.validation import validate_household_config

        config = {"num_households": 10000001, "size_distribution": {"mean": 2.5, "std_dev": 1.2}}

        result = validate_household_config(config)
        assert not result["valid"], "Should reject num_households > 10000000"
        assert any("num_households" in err["field"] for err in result["errors"])

    def test_valid_num_households_range(self):
        """num_households between 1000 and 10000000 should be accepted."""
        from databricks_app.src.wizard.validation import validate_household_config

        # Test boundaries
        for num in [1000, 10000, 1000000, 10000000]:
            config = {"num_households": num, "size_distribution": {"mean": 2.5, "std_dev": 1.2}}
            result = validate_household_config(config)
            assert result["valid"], f"Should accept num_households={num}"

    def test_income_bracket_weights_sum_validation(self):
        """Income bracket weights must sum to approximately 1.0."""
        from databricks_app.src.wizard.validation import validate_household_config

        # Invalid: weights sum to 0.9
        config = {
            "num_households": 10000,
            "size_distribution": {"mean": 2.5, "std_dev": 1.2},
            "income_brackets": {"<30K": 0.2, "30-60K": 0.3, "60-100K": 0.2, "100-150K": 0.1, "150K+": 0.1},
        }

        result = validate_household_config(config)
        assert not result["valid"], "Should reject income brackets summing to 0.9"
        assert any("income_brackets" in err["field"] for err in result["errors"])

    def test_valid_income_bracket_weights(self):
        """Income bracket weights summing to 1.0 should be accepted."""
        from databricks_app.src.wizard.validation import validate_household_config

        config = {
            "num_households": 10000,
            "size_distribution": {"mean": 2.5, "std_dev": 1.2},
            "income_brackets": {"<30K": 0.2, "30-60K": 0.3, "60-100K": 0.3, "100-150K": 0.15, "150K+": 0.05},
        }

        result = validate_household_config(config)
        assert result["valid"], "Should accept valid income bracket weights"
        assert len(result["errors"]) == 0

    def test_size_distribution_required_fields(self):
        """size_distribution must have mean and std_dev fields."""
        from databricks_app.src.wizard.validation import validate_household_config

        # Missing std_dev
        config = {"num_households": 10000, "size_distribution": {"mean": 2.5}}

        result = validate_household_config(config)
        assert not result["valid"], "Should reject size_distribution missing std_dev"

    def test_size_distribution_value_ranges(self):
        """size_distribution mean and std_dev must be within valid ranges."""
        from databricks_app.src.wizard.validation import validate_household_config

        # Mean too low
        config = {
            "num_households": 10000,
            "size_distribution": {"mean": 0.5, "std_dev": 1.2},
        }
        result = validate_household_config(config)
        assert not result["valid"], "Should reject mean < 1.0"

        # Mean too high
        config = {
            "num_households": 10000,
            "size_distribution": {"mean": 7.0, "std_dev": 1.2},
        }
        result = validate_household_config(config)
        assert not result["valid"], "Should reject mean > 6.0"

        # Std dev too low
        config = {
            "num_households": 10000,
            "size_distribution": {"mean": 2.5, "std_dev": 0.2},
        }
        result = validate_household_config(config)
        assert not result["valid"], "Should reject std_dev < 0.5"

    def test_validation_result_structure(self):
        """Validation result must have valid, errors, and warnings fields."""
        from databricks_app.src.wizard.validation import validate_household_config

        config = {"num_households": 10000, "size_distribution": {"mean": 2.5, "std_dev": 1.2}}

        result = validate_household_config(config)

        assert "valid" in result
        assert "errors" in result
        assert "warnings" in result
        assert isinstance(result["valid"], bool)
        assert isinstance(result["errors"], list)
        assert isinstance(result["warnings"], list)

    def test_error_message_clarity(self):
        """Error messages must be clear and actionable."""
        from databricks_app.src.wizard.validation import validate_household_config

        config = {"num_households": 500, "size_distribution": {"mean": 2.5, "std_dev": 1.2}}

        result = validate_household_config(config)

        assert not result["valid"]
        assert len(result["errors"]) > 0

        error = result["errors"][0]
        assert "field" in error
        assert "message" in error
        assert len(error["message"]) > 10, "Error message should be descriptive"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
