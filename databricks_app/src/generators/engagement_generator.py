"""Content engagement generator using dbldatagen.

This module generates synthetic content engagement events representing user
interactions with content across different channels and categories.
"""

from pyspark.sql import SparkSession, DataFrame
from pyspark.sql.functions import (
    col,
    current_timestamp,
    expr,
    when,
    rand,
    unix_timestamp,
    from_unixtime,
    lit,
)
import dbldatagen as dg

from databricks_app.src.models.schemas import EngagementConfig


def generate_content_engagements(
    spark: SparkSession,
    individuals_df: DataFrame,
    config: EngagementConfig,
    seed: int = 42,
    time_period_days: int = 30,
) -> DataFrame:
    """Generate synthetic content engagement events for individuals.

    Creates realistic engagement patterns with temporal distributions and
    category preferences. Events are spread across the specified time period
    with realistic diurnal and weekly patterns.

    Args:
        spark: Active SparkSession
        individuals_df: DataFrame with individual_id column
        config: Engagement generation configuration
        seed: Random seed for reproducibility
        time_period_days: Number of days to spread events across (default 30)

    Returns:
        PySpark DataFrame matching ContentEngagementSchema with columns:
        - event_id (long): Unique event identifier
        - individual_id (long): Foreign key to individuals
        - content_id (string): Unique content identifier
        - timestamp (timestamp): When engagement occurred
        - engagement_type (string): Type of engagement (view, click, share, etc.)
        - duration_seconds (int): Duration for view events, null otherwise
        - content_category (string): Content category

    Example:
        >>> config = EngagementConfig(
        ...     num_events_per_person={"mean": 50, "std_dev": 20},
        ...     event_types={"view": 0.70, "click": 0.20, "share": 0.10},
        ...     duration_range={"min": 10, "max": 3600},
        ...     temporal_pattern="daily"
        ... )
        >>> events = generate_content_engagements(
        ...     spark, individuals, config, seed=42
        ... )
    """
    # Extract configuration
    events_mean = config.num_events_per_person.get("mean", 50)
    events_std = config.num_events_per_person.get("std_dev", 20)

    event_types = config.event_types or {
        "view": 0.70,
        "click": 0.20,
        "share": 0.05,
        "like": 0.04,
        "comment": 0.01,
    }

    content_categories = config.content_categories or {
        "Technology": 0.25,
        "Sports": 0.20,
        "Entertainment": 0.20,
        "News": 0.15,
        "Lifestyle": 0.10,
        "Finance": 0.10,
    }

    duration_min = config.duration_range.get("min", 10)
    duration_max = config.duration_range.get("max", 3600)

    # Calculate events per person using power law distribution (more realistic)
    num_individuals = individuals_df.count()

    # Create base for event explosion
    individuals_with_event_counts = individuals_df.select("individual_id").withColumn(
        "num_events",
        (rand(seed) * events_std * 2 + (events_mean - events_std)).cast("int"),
    )

    # Ensure num_events is positive
    individuals_with_event_counts = individuals_with_event_counts.withColumn(
        "num_events", when(col("num_events") < 1, lit(1)).otherwise(col("num_events"))
    )

    # Explode to create one row per event
    from pyspark.sql.functions import explode, sequence

    events_base = individuals_with_event_counts.withColumn(
        "event_index",
        explode(sequence(lit(0), col("num_events") - 1)),
    )

    # Count total events for ID generation
    num_events = events_base.count()
    num_partitions = max(1, min(200, num_events // 10000))

    # Generate event details using dbldatagen
    event_spec = (
        dg.DataGenerator(spark, rows=num_events, partitions=num_partitions)
        .withColumn(
            "event_id",
            "long",
            uniqueValues=num_events,
            random=True,
        )
        .withColumn(
            "engagement_type",
            "string",
            values=list(event_types.keys()),
            weights=list(event_types.values()),
            random=True,
        )
        .withColumn(
            "content_category",
            "string",
            values=list(content_categories.keys()),
            weights=list(content_categories.values()),
            random=True,
        )
        .withColumn(
            "content_id",
            "string",
            template="content_{0:010d}",
            uniqueValues=min(100000, num_events // 10),  # Many events per content
            random=True,
        )
        .withColumn(
            "duration_seconds_raw",
            "integer",
            minValue=duration_min,
            maxValue=duration_max,
            distribution=dg.distributions.Gamma(2.0, 2.0),  # Skewed towards shorter
            random=True,
        )
    )

    events_df = event_spec.build()

    # Assign to individuals using row_number matching
    from pyspark.sql.window import Window
    from pyspark.sql.functions import row_number

    events_base = events_base.withColumn(
        "row_num", row_number().over(Window.orderBy("individual_id", "event_index"))
    )

    events_df = events_df.withColumn("row_num", row_number().over(Window.orderBy("event_id")))

    # Join events to individuals
    result_df = events_base.join(events_df, on="row_num", how="inner")

    # Generate timestamps based on temporal pattern
    if config.temporal_pattern == "uniform":
        # Uniform distribution across time period
        result_df = result_df.withColumn(
            "timestamp",
            from_unixtime(
                unix_timestamp(current_timestamp())
                - (rand(seed + 1) * time_period_days * 24 * 3600).cast("long")
            ),
        )
    elif config.temporal_pattern == "daily":
        # Daily pattern with peak during evening hours (18:00-22:00)
        result_df = result_df.withColumn(
            "day_offset", (rand(seed + 1) * time_period_days).cast("int")
        ).withColumn(
            "hour_of_day",
            (
                when(rand(seed + 2) < 0.5, (rand(seed + 3) * 6 + 18).cast("int"))  # 50% evening
                .otherwise((rand(seed + 4) * 24).cast("int"))  # 50% other times
            ),
        )

        result_df = result_df.withColumn(
            "timestamp",
            from_unixtime(
                unix_timestamp(current_timestamp())
                - col("day_offset") * 24 * 3600
                + col("hour_of_day") * 3600
            ),
        )
    elif config.temporal_pattern == "weekly":
        # Weekly pattern with more activity on weekends
        result_df = result_df.withColumn(
            "week_offset", (rand(seed + 1) * (time_period_days / 7)).cast("int")
        ).withColumn(
            "day_of_week",
            (
                when(rand(seed + 2) < 0.4, (rand(seed + 3) * 2 + 5).cast("int"))  # 40% weekend
                .otherwise((rand(seed + 4) * 5).cast("int"))  # 60% weekday
            ),
        )

        result_df = result_df.withColumn(
            "timestamp",
            from_unixtime(
                unix_timestamp(current_timestamp())
                - col("week_offset") * 7 * 24 * 3600
                - col("day_of_week") * 24 * 3600
            ),
        )
    else:  # default to uniform
        result_df = result_df.withColumn(
            "timestamp",
            from_unixtime(
                unix_timestamp(current_timestamp())
                - (rand(seed + 1) * time_period_days * 24 * 3600).cast("long")
            ),
        )

    # Set duration_seconds only for 'view' engagement type
    result_df = result_df.withColumn(
        "duration_seconds",
        when(col("engagement_type") == "view", col("duration_seconds_raw")).otherwise(lit(None)),
    )

    # Select final columns
    result_df = result_df.select(
        "event_id",
        "individual_id",
        "content_id",
        "timestamp",
        "engagement_type",
        "duration_seconds",
        "content_category",
    )

    return result_df


def generate_engagements_with_preferences(
    spark: SparkSession,
    individuals_df: DataFrame,
    config: EngagementConfig,
    individual_preferences: DataFrame = None,
    seed: int = 42,
) -> DataFrame:
    """Generate engagements with individual-specific category preferences.

    This variant allows assigning category preferences to individuals, creating
    more realistic personalized engagement patterns.

    Args:
        spark: Active SparkSession
        individuals_df: DataFrame with individual_id column
        config: Engagement generation configuration
        individual_preferences: Optional DataFrame with (individual_id, preferred_category)
        seed: Random seed for reproducibility

    Returns:
        PySpark DataFrame matching ContentEngagementSchema

    Example:
        >>> # Generate base engagements
        >>> engagements = generate_engagements_with_preferences(
        ...     spark, individuals, config, seed=42
        ... )
        >>> # 70% of each person's engagements will be in their preferred category
    """
    # Generate base engagements
    engagements_df = generate_content_engagements(spark, individuals_df, config, seed)

    if individual_preferences is not None:
        # Override some content categories based on preferences
        engagements_with_prefs = engagements_df.join(
            individual_preferences, on="individual_id", how="left"
        )

        # 70% of events use preferred category if available
        engagements_with_prefs = engagements_with_prefs.withColumn(
            "content_category",
            when(
                (col("preferred_category").isNotNull()) & (rand(seed + 100) < 0.7),
                col("preferred_category"),
            ).otherwise(col("content_category")),
        )

        return engagements_with_prefs.select(engagements_df.columns)

    return engagements_df
