"""Integration test for Unity Catalog permission checks.

This test validates that the application properly verifies catalog permissions
before attempting data generation.

Following TDD: This test MUST FAIL until T029 (permission checks) is implemented.
"""

import pytest
from unittest.mock import Mock, patch


class TestCatalogPermissions:
    """Integration tests for Unity Catalog permission validation."""

    def test_verify_catalog_permissions_success(self):
        """Test successful permission verification.

        This test validates:
        - USE_CATALOG permission is checked
        - USE_SCHEMA permission is checked
        - CREATE_TABLE permission is checked
        - Function returns True when all permissions granted
        """
        from databricks_app.src.utils.auth import verify_catalog_permissions

        # Mock Databricks SDK client
        with patch("databricks_app.src.utils.auth.WorkspaceClient") as mock_client:
            # Mock successful permission checks
            mock_grants = Mock()
            mock_grants.get.return_value = Mock(
                privilege_assignments=[
                    Mock(privileges=["USE_CATALOG"]),
                    Mock(privileges=["USE_SCHEMA", "CREATE_TABLE"]),
                ]
            )
            mock_client.return_value.grants = mock_grants

            # Verify permissions
            has_permission, missing = verify_catalog_permissions(
                catalog_name="bryan_li",
                schema_name="synthetic_data",
                user_principal="user@example.com",
            )

            assert has_permission is True, "Should have all permissions"
            assert missing == [], f"Should have no missing privileges: {missing}"

    def test_verify_catalog_permissions_missing_use_catalog(self):
        """Test detection of missing USE_CATALOG permission."""
        from databricks_app.src.utils.auth import verify_catalog_permissions

        with patch("databricks_app.src.utils.auth.WorkspaceClient") as mock_client:
            # Mock missing USE_CATALOG
            mock_grants = Mock()
            mock_grants.get.return_value = Mock(
                privilege_assignments=[
                    Mock(privileges=["USE_SCHEMA", "CREATE_TABLE"]),
                ]
            )
            mock_client.return_value.grants = mock_grants

            has_permission, missing = verify_catalog_permissions(
                catalog_name="bryan_li",
                schema_name="synthetic_data",
                user_principal="user@example.com",
            )

            assert has_permission is False, "Should not have all permissions"
            assert "USE_CATALOG" in missing, "Should detect missing USE_CATALOG"

    def test_verify_catalog_permissions_missing_create_table(self):
        """Test detection of missing CREATE_TABLE permission."""
        from databricks_app.src.utils.auth import verify_catalog_permissions

        with patch("databricks_app.src.utils.auth.WorkspaceClient") as mock_client:
            # Mock missing CREATE_TABLE
            mock_grants = Mock()
            mock_grants.get.return_value = Mock(
                privilege_assignments=[
                    Mock(privileges=["USE_CATALOG", "USE_SCHEMA"]),
                ]
            )
            mock_client.return_value.grants = mock_grants

            has_permission, missing = verify_catalog_permissions(
                catalog_name="bryan_li",
                schema_name="synthetic_data",
                user_principal="user@example.com",
            )

            assert has_permission is False
            assert "CREATE_TABLE" in missing, "Should detect missing CREATE_TABLE"

    def test_verify_catalog_permissions_api_error(self):
        """Test handling of Databricks API errors."""
        from databricks_app.src.utils.auth import verify_catalog_permissions

        with patch("databricks_app.src.utils.auth.WorkspaceClient") as mock_client:
            # Mock API error
            mock_grants = Mock()
            mock_grants.get.side_effect = Exception("Databricks API error")
            mock_client.return_value.grants = mock_grants

            # Should handle error gracefully
            has_permission, missing = verify_catalog_permissions(
                catalog_name="bryan_li",
                schema_name="synthetic_data",
                user_principal="user@example.com",
            )

            assert has_permission is False, "Should return False on API error"
            assert len(missing) > 0, "Should report error in missing privileges"

    def test_pipeline_blocks_on_missing_permissions(self):
        """Test that pipeline execution blocks when permissions are missing.

        This test validates:
        - Permission check runs before any generation
        - Missing permissions prevent job submission
        - Clear error message includes missing privileges
        """
        from databricks_app.src.generators.pipeline import execute_full_pipeline
        from databricks_app.src.models.schemas import GenerationConfig, HouseholdConfig

        config = GenerationConfig(
            seed=42,
            catalog_name="bryan_li",
            schema_name="synthetic_data",
            household_config=HouseholdConfig(
                num_households=100, income_brackets={"<30K": 1.0}
            ),
        )

        # Mock missing permissions
        with patch(
            "databricks_app.src.utils.auth.verify_catalog_permissions"
        ) as mock_verify:
            mock_verify.return_value = (
                False,
                ["USE_CATALOG", "CREATE_TABLE"],
            )

            # Attempt pipeline execution
            result = execute_full_pipeline(None, config)

            assert result["status"] == "failed", "Pipeline should fail"
            assert "permission" in result["error"].lower(), (
                "Error message should mention permissions"
            )
            assert "USE_CATALOG" in result["error"], (
                "Error should include missing privilege"
            )
            assert "CREATE_TABLE" in result["error"], (
                "Error should include missing privilege"
            )

    def test_permission_check_with_valid_databricks_token(self):
        """Test permission check with actual Databricks SDK (requires credentials).

        This test validates:
        - Real Databricks SDK connection
        - Actual permission query to Unity Catalog
        - Current user principal detection

        NOTE: This test requires DATABRICKS_HOST and DATABRICKS_TOKEN environment variables.
        """
        pytest.skip("Requires valid Databricks credentials - run manually")

        import os
        from databricks_app.src.utils.auth import verify_catalog_permissions

        # Verify environment variables
        assert (
            "DATABRICKS_HOST" in os.environ
        ), "DATABRICKS_HOST environment variable required"
        assert (
            "DATABRICKS_TOKEN" in os.environ
        ), "DATABRICKS_TOKEN environment variable required"

        # Get current user from SDK
        from databricks.sdk import WorkspaceClient

        w = WorkspaceClient()
        current_user = w.current_user.me().user_name

        # Check actual permissions
        has_permission, missing = verify_catalog_permissions(
            catalog_name="bryan_li",
            schema_name="synthetic_data",
            user_principal=current_user,
        )

        # Report results (may fail if permissions not granted)
        if not has_permission:
            pytest.fail(
                f"Current user {current_user} missing permissions: {missing}\n"
                f"Grant with:\n"
                f"  GRANT USE CATALOG ON CATALOG bryan_li TO `{current_user}`;\n"
                f"  GRANT USE SCHEMA ON SCHEMA bryan_li.synthetic_data TO `{current_user}`;\n"
                f"  GRANT CREATE TABLE ON SCHEMA bryan_li.synthetic_data TO `{current_user}`;"
            )

        assert has_permission is True, "Should have all required permissions"

    def test_permission_error_message_includes_grant_statements(self):
        """Test that permission errors include helpful GRANT statements."""
        from databricks_app.src.utils.auth import format_permission_error

        user_email = "test.user@databricks.com"
        missing_privileges = ["USE_CATALOG", "CREATE_TABLE"]

        error_msg = format_permission_error(
            catalog_name="bryan_li",
            schema_name="synthetic_data",
            user_principal=user_email,
            missing_privileges=missing_privileges,
        )

        # Check error message includes helpful info
        assert "USE_CATALOG" in error_msg
        assert "CREATE_TABLE" in error_msg
        assert user_email in error_msg
        assert "GRANT" in error_msg.upper()
        assert "bryan_li" in error_msg

        # Should include actual GRANT SQL statements
        assert (
            "GRANT USE CATALOG ON CATALOG bryan_li" in error_msg
        ), "Should include USE CATALOG grant"
        assert (
            "GRANT CREATE TABLE ON SCHEMA bryan_li.synthetic_data" in error_msg
        ), "Should include CREATE TABLE grant"

    def test_schema_creation_permission_check(self):
        """Test that CREATE SCHEMA permission is checked if schema doesn't exist."""
        from databricks_app.src.utils.auth import verify_catalog_permissions

        with patch("databricks_app.src.utils.auth.WorkspaceClient") as mock_client:
            # Mock schema doesn't exist
            mock_schemas = Mock()
            mock_schemas.get.side_effect = Exception("Schema not found")
            mock_client.return_value.schemas = mock_schemas

            # Mock permissions without CREATE SCHEMA
            mock_grants = Mock()
            mock_grants.get.return_value = Mock(
                privilege_assignments=[
                    Mock(privileges=["USE_CATALOG", "USE_SCHEMA", "CREATE_TABLE"]),
                ]
            )
            mock_client.return_value.grants = mock_grants

            has_permission, missing = verify_catalog_permissions(
                catalog_name="bryan_li",
                schema_name="new_schema",
                user_principal="user@example.com",
                create_if_missing=True,
            )

            # Should detect missing CREATE SCHEMA
            assert has_permission is False
            assert (
                "CREATE_SCHEMA" in missing or "CREATE SCHEMA" in missing
            ), "Should detect missing CREATE SCHEMA permission"
