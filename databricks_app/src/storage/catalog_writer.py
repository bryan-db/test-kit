"""Unity Catalog writer for Delta Lake tables.

This module handles writing PySpark DataFrames to Unity Catalog as Delta Lake tables
with optimization and error handling.
"""

import time
from typing import Literal
from pyspark.sql import SparkSession, DataFrame


class CatalogWriter:
    """Unity Catalog writer with Delta Lake optimizations.

    Handles writing DataFrames to Unity Catalog with:
    - Optimized writes for better performance
    - Auto-compaction for small files
    - Z-Order optimization for query performance
    - Retry logic for transient failures
    """

    def __init__(self, spark: SparkSession):
        """Initialize catalog writer.

        Args:
            spark: Active SparkSession with Unity Catalog access
        """
        self.spark = spark

        # Enable Delta Lake optimizations (skip if not available in serverless)
        try:
            self.spark.conf.set("spark.databricks.delta.optimizeWrite.enabled", "true")
            self.spark.conf.set("spark.databricks.delta.autoCompact.enabled", "true")
            self.spark.conf.set("spark.databricks.delta.properties.defaults.autoOptimize.optimizeWrite", "true")
            self.spark.conf.set("spark.databricks.delta.properties.defaults.autoOptimize.autoCompact", "true")
        except Exception:
            # These configs may not be available in serverless/connect environments
            pass

    def write_table(
        self,
        df: DataFrame,
        catalog: str,
        schema: str,
        table_name: str,
        mode: Literal["overwrite", "append", "error", "ignore"] = "overwrite",
        partition_by: list[str] = None,
        z_order_by: list[str] = None,
        max_retries: int = 3,
    ) -> bool:
        """Write DataFrame to Unity Catalog as Delta Lake table.

        Args:
            df: DataFrame to write
            catalog: Catalog name (e.g., "bryan_li")
            schema: Schema name (e.g., "synthetic_data")
            table_name: Table name (e.g., "households")
            mode: Write mode - overwrite, append, error, or ignore
            partition_by: Optional list of columns to partition by
            z_order_by: Optional list of columns to Z-Order by for query optimization
            max_retries: Maximum number of retry attempts on failure

        Returns:
            True if successful, False otherwise

        Raises:
            Exception: If all retry attempts fail

        Example:
            >>> writer = CatalogWriter(spark)
            >>> writer.write_table(
            ...     df=households_df,
            ...     catalog="bryan_li",
            ...     schema="synthetic_data",
            ...     table_name="households",
            ...     mode="overwrite",
            ...     z_order_by=["household_id", "location_state"]
            ... )
            True
        """
        full_table_name = f"{catalog}.{schema}.{table_name}"

        for attempt in range(max_retries):
            try:
                # Prepare write builder
                writer = df.write.format("delta").mode(mode)

                # Add partitioning if specified
                if partition_by:
                    writer = writer.partitionBy(*partition_by)

                # Write to Unity Catalog
                writer.saveAsTable(full_table_name)

                # Apply Z-Order optimization if specified
                if z_order_by and mode == "overwrite":
                    self._optimize_with_zorder(full_table_name, z_order_by)

                print(f"Successfully wrote {df.count()} rows to {full_table_name}")
                return True

            except Exception as e:
                if attempt < max_retries - 1:
                    wait_time = 2**attempt  # Exponential backoff: 1s, 2s, 4s
                    print(
                        f"Write failed (attempt {attempt + 1}/{max_retries}): {e}. "
                        f"Retrying in {wait_time}s..."
                    )
                    time.sleep(wait_time)
                else:
                    print(f"Write failed after {max_retries} attempts: {e}")
                    raise

        return False

    def _optimize_with_zorder(self, full_table_name: str, z_order_columns: list[str]) -> None:
        """Run OPTIMIZE with Z-Order on specified columns.

        Args:
            full_table_name: Fully qualified table name (catalog.schema.table)
            z_order_columns: List of columns to Z-Order by

        Example:
            >>> writer._optimize_with_zorder(
            ...     "bryan_li.synthetic_data.households",
            ...     ["household_id", "location_state"]
            ... )
        """
        try:
            z_order_cols = ", ".join(z_order_columns)
            optimize_sql = f"OPTIMIZE {full_table_name} ZORDER BY ({z_order_cols})"

            print(f"Running optimization: {optimize_sql}")
            self.spark.sql(optimize_sql)
            print(f"Successfully optimized {full_table_name}")

        except Exception as e:
            # Z-Order is optional optimization, don't fail write if it errors
            print(f"Warning: Z-Order optimization failed: {e}")

    def create_schema_if_not_exists(self, catalog: str, schema: str) -> bool:
        """Create schema in catalog if it doesn't exist.

        Args:
            catalog: Catalog name
            schema: Schema name

        Returns:
            True if created or already exists, False on error

        Example:
            >>> writer.create_schema_if_not_exists("bryan_li", "synthetic_data")
            True
        """
        try:
            create_sql = f"CREATE SCHEMA IF NOT EXISTS {catalog}.{schema}"
            self.spark.sql(create_sql)
            print(f"Schema {catalog}.{schema} ready")
            return True

        except Exception as e:
            print(f"Failed to create schema: {e}")
            return False

    def table_exists(self, catalog: str, schema: str, table_name: str) -> bool:
        """Check if table exists in Unity Catalog.

        Args:
            catalog: Catalog name
            schema: Schema name
            table_name: Table name

        Returns:
            True if table exists, False otherwise

        Example:
            >>> if writer.table_exists("bryan_li", "synthetic_data", "households"):
            ...     print("Table exists")
        """
        try:
            full_table_name = f"{catalog}.{schema}.{table_name}"
            self.spark.table(full_table_name)
            return True
        except Exception:
            return False

    def get_table_stats(self, catalog: str, schema: str, table_name: str) -> dict:
        """Get statistics for a Delta Lake table.

        Args:
            catalog: Catalog name
            schema: Schema name
            table_name: Table name

        Returns:
            Dictionary with table statistics (row count, size, etc.)

        Example:
            >>> stats = writer.get_table_stats("bryan_li", "synthetic_data", "households")
            >>> print(f"Row count: {stats['num_rows']}")
        """
        try:
            full_table_name = f"{catalog}.{schema}.{table_name}"

            # Get table details
            details = self.spark.sql(f"DESCRIBE DETAIL {full_table_name}").collect()[0]

            # Get row count
            row_count = self.spark.table(full_table_name).count()

            return {
                "num_rows": row_count,
                "size_bytes": details.sizeInBytes if hasattr(details, "sizeInBytes") else None,
                "num_files": details.numFiles if hasattr(details, "numFiles") else None,
                "format": details.format if hasattr(details, "format") else None,
                "location": details.location if hasattr(details, "location") else None,
            }

        except Exception as e:
            print(f"Failed to get table stats: {e}")
            return {}

    def vacuum_table(self, catalog: str, schema: str, table_name: str, retention_hours: int = 168) -> bool:
        """Run VACUUM on Delta Lake table to remove old files.

        Args:
            catalog: Catalog name
            schema: Schema name
            table_name: Table name
            retention_hours: Hours to retain old files (default 168 = 7 days)

        Returns:
            True if successful, False otherwise

        Example:
            >>> writer.vacuum_table("bryan_li", "synthetic_data", "households")
            True
        """
        try:
            full_table_name = f"{catalog}.{schema}.{table_name}"
            vacuum_sql = f"VACUUM {full_table_name} RETAIN {retention_hours} HOURS"

            print(f"Running vacuum: {vacuum_sql}")
            self.spark.sql(vacuum_sql)
            print(f"Successfully vacuumed {full_table_name}")
            return True

        except Exception as e:
            print(f"Vacuum failed: {e}")
            return False
