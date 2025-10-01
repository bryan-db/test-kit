"""Authentication and authorization utilities for Unity Catalog.

This module provides functions for verifying catalog permissions before
data generation to prevent wasted compute on permission failures.
"""

from typing import Tuple, List
from databricks.sdk import WorkspaceClient


def verify_catalog_permissions(
    catalog_name: str,
    schema_name: str,
    user_principal: str = None,
    create_if_missing: bool = False,
) -> Tuple[bool, List[str]]:
    """Verify user has required Unity Catalog permissions.

    Checks for:
    - USE CATALOG on the specified catalog
    - USE SCHEMA on the specified schema
    - CREATE TABLE on the specified schema

    Args:
        catalog_name: Name of the Unity Catalog catalog (e.g., "bryan_li")
        schema_name: Name of the schema (e.g., "synthetic_data")
        user_principal: User email/principal to check (None = current user)
        create_if_missing: Whether to check for CREATE SCHEMA if schema doesn't exist

    Returns:
        Tuple of (has_permission: bool, missing_privileges: List[str])

    Example:
        >>> has_perms, missing = verify_catalog_permissions(
        ...     "bryan_li", "synthetic_data", "user@example.com"
        ... )
        >>> if not has_perms:
        ...     print(f"Missing: {missing}")
    """
    missing_privileges = []

    try:
        # Initialize Databricks SDK client
        w = WorkspaceClient()

        # Get current user if not specified
        if user_principal is None:
            try:
                current_user = w.current_user.me()
                # Handle both string and object emails
                if current_user.user_name:
                    user_principal = current_user.user_name
                elif current_user.emails and len(current_user.emails) > 0:
                    email = current_user.emails[0]
                    user_principal = email.value if hasattr(email, 'value') else str(email)
                else:
                    user_principal = "unknown"
                print(f"DEBUG: Detected user principal: {user_principal}")
            except Exception as e:
                print(f"Warning: Could not detect current user: {e}")
                user_principal = "unknown"

        # Check catalog permissions
        print(f"DEBUG: Checking catalog permissions for '{catalog_name}' (user: {user_principal})")
        try:
            catalog_grants = w.grants.get(
                securable_type="catalog",
                full_name=catalog_name,
            )

            has_use_catalog = False
            if catalog_grants and catalog_grants.privilege_assignments:
                print(f"DEBUG: Found {len(catalog_grants.privilege_assignments)} privilege assignments for catalog")
                for assignment in catalog_grants.privilege_assignments:
                    print(f"DEBUG: Assignment for principal '{assignment.principal}'")
                    if assignment.principal == user_principal:
                        # Convert privileges to strings (they might be enum objects)
                        privileges = [str(p).replace('Privilege.', '') if hasattr(p, 'value') else str(p) for p in (assignment.privileges or [])]
                        print(f"DEBUG: User privileges on catalog: {privileges}")
                        if "USE_CATALOG" in privileges:
                            has_use_catalog = True
            else:
                print(f"DEBUG: No privilege assignments found for catalog '{catalog_name}'")

            if not has_use_catalog:
                missing_privileges.append("USE_CATALOG")

        except Exception as e:
            print(f"Warning: Could not check catalog permissions: {e}")
            import traceback
            traceback.print_exc()
            missing_privileges.append("USE_CATALOG")

        # Check schema existence and permissions
        print(f"DEBUG: Checking schema permissions for '{catalog_name}.{schema_name}'")
        try:
            schema_info = w.schemas.get(full_name=f"{catalog_name}.{schema_name}")
            schema_exists = True
            print(f"DEBUG: Schema '{catalog_name}.{schema_name}' exists")
        except Exception as e:
            schema_exists = False
            print(f"DEBUG: Schema '{catalog_name}.{schema_name}' does not exist: {e}")

        if not schema_exists and create_if_missing:
            # Need CREATE SCHEMA permission
            print(f"DEBUG: Schema does not exist, need CREATE_SCHEMA permission")
            missing_privileges.append("CREATE_SCHEMA")
        elif schema_exists:
            # Check schema permissions
            try:
                schema_grants = w.grants.get(
                    securable_type="schema",
                    full_name=f"{catalog_name}.{schema_name}",
                )

                has_use_schema = False
                has_create_table = False

                if schema_grants and schema_grants.privilege_assignments:
                    print(f"DEBUG: Found {len(schema_grants.privilege_assignments)} privilege assignments for schema")
                    for assignment in schema_grants.privilege_assignments:
                        print(f"DEBUG: Assignment for principal '{assignment.principal}'")
                        if assignment.principal == user_principal:
                            # Convert privileges to strings (they might be enum objects)
                            privileges = [str(p).replace('Privilege.', '') if hasattr(p, 'value') else str(p) for p in (assignment.privileges or [])]
                            print(f"DEBUG: User privileges on schema: {privileges}")
                            if "USE_SCHEMA" in privileges or "USE SCHEMA" in privileges:
                                has_use_schema = True
                            if "CREATE_TABLE" in privileges or "CREATE TABLE" in privileges:
                                has_create_table = True
                else:
                    print(f"DEBUG: No privilege assignments found for schema '{catalog_name}.{schema_name}'")

                if not has_use_schema:
                    missing_privileges.append("USE_SCHEMA")
                if not has_create_table:
                    missing_privileges.append("CREATE_TABLE")

            except Exception as e:
                print(f"Warning: Could not check schema permissions: {e}")
                import traceback
                traceback.print_exc()
                missing_privileges.extend(["USE_SCHEMA", "CREATE_TABLE"])

    except Exception as e:
        # Broad error handling - assume no permissions
        error_msg = f"Permission check failed: {str(e)}"
        missing_privileges.append(error_msg)

    has_permission = len(missing_privileges) == 0
    return has_permission, missing_privileges


def format_permission_error(
    catalog_name: str,
    schema_name: str,
    user_principal: str,
    missing_privileges: List[str],
) -> str:
    """Format a helpful error message with GRANT statements.

    Args:
        catalog_name: Catalog name
        schema_name: Schema name
        user_principal: User principal that lacks permissions
        missing_privileges: List of missing privilege names

    Returns:
        Formatted error message with GRANT SQL statements

    Example:
        >>> error = format_permission_error(
        ...     "bryan_li", "synthetic_data", "user@example.com",
        ...     ["USE_CATALOG", "CREATE_TABLE"]
        ... )
        >>> print(error)
    """
    error_lines = [
        f"❌ Missing Unity Catalog permissions for {user_principal}:",
        "",
        "Missing privileges:",
    ]

    for privilege in missing_privileges:
        error_lines.append(f"  - {privilege}")

    error_lines.extend(
        [
            "",
            "To grant required permissions, run the following SQL as a workspace admin:",
            "",
        ]
    )

    # Generate GRANT statements based on missing privileges
    if "USE_CATALOG" in missing_privileges:
        error_lines.append(
            f"  GRANT USE CATALOG ON CATALOG {catalog_name} TO `{user_principal}`;"
        )

    if "CREATE_SCHEMA" in missing_privileges:
        error_lines.append(
            f"  GRANT CREATE SCHEMA ON CATALOG {catalog_name} TO `{user_principal}`;"
        )

    if "USE_SCHEMA" in missing_privileges or "USE SCHEMA" in missing_privileges:
        error_lines.append(
            f"  GRANT USE SCHEMA ON SCHEMA {catalog_name}.{schema_name} TO `{user_principal}`;"
        )

    if "CREATE_TABLE" in missing_privileges or "CREATE TABLE" in missing_privileges:
        error_lines.append(
            f"  GRANT CREATE TABLE ON SCHEMA {catalog_name}.{schema_name} TO `{user_principal}`;"
        )

    error_lines.extend(
        [
            "",
            "After granting permissions, try generating the dataset again.",
        ]
    )

    return "\n".join(error_lines)


def check_permissions_and_fail_fast(
    catalog_name: str,
    schema_name: str,
    user_principal: str = None,
) -> None:
    """Check permissions and raise exception with helpful message if missing.

    Args:
        catalog_name: Catalog name
        schema_name: Schema name
        user_principal: User principal (None = current user)

    Raises:
        PermissionError: If required permissions are missing

    Example:
        >>> try:
        ...     check_permissions_and_fail_fast("bryan_li", "synthetic_data")
        ... except PermissionError as e:
        ...     print(e)
    """
    has_permission, missing = verify_catalog_permissions(
        catalog_name, schema_name, user_principal
    )

    if not has_permission:
        error_msg = format_permission_error(
            catalog_name, schema_name, user_principal or "current_user", missing
        )
        raise PermissionError(error_msg)
