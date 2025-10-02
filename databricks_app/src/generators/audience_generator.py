"""
Audience attribute derivation generator.

Aggregates content_engagements to compute viewership_patterns and derives
audience_attributes for segmentation and targeting.
"""

from typing import Dict, Any, Tuple
from pyspark.sql import SparkSession, DataFrame
from pyspark.sql.functions import (
    col, count, avg, max as spark_max, min as spark_min,
    collect_list, size, expr, row_number, when, lit, array_distinct,
    unix_timestamp, current_timestamp, map_from_arrays, element_at,
    sort_array, slice as spark_slice, hour, approx_percentile, rand
)
from pyspark.sql.window import Window
from src.models.schemas import AudienceConfig


def derive_viewership_patterns_and_audience_attributes(
    spark: SparkSession,
    individuals_df: DataFrame,
    content_engagements_df: DataFrame,
    config: AudienceConfig,
    seed: int = 42,
) -> Tuple[DataFrame, DataFrame]:
    """
    Derive viewership patterns and audience attributes from engagement data.

    Args:
        spark: Active SparkSession
        individuals_df: DataFrame with individual_id column
        content_engagements_df: DataFrame with engagement events
        config: Audience configuration
        seed: Random seed for deterministic generation

    Returns:
        Tuple of (viewership_patterns_df, audience_attributes_df)
    """
    # Phase 1: Aggregate engagement metrics by individual
    engagement_agg = (
        content_engagements_df
        .groupBy("individual_id")
        .agg(
            count("*").alias("total_engagements"),
            spark_max("timestamp").alias("recency_last_engagement"),
            spark_min("timestamp").alias("first_engagement"),
            collect_list("content_category").alias("all_categories"),
            collect_list("timestamp").alias("all_timestamps")
        )
    )

    # Phase 2: Compute frequency metrics
    # Calculate days between first and last engagement
    engagement_agg = engagement_agg.withColumn(
        "days_active",
        (unix_timestamp("recency_last_engagement") - unix_timestamp("first_engagement")) / 86400
    ).withColumn(
        "days_active_adjusted",
        when(col("days_active") < 1, lit(1)).otherwise(col("days_active"))
    ).withColumn(
        "frequency_daily_avg",
        col("total_engagements") / col("days_active_adjusted")
    )

    # Phase 3: Extract preferred categories (top 3)
    # Count category occurrences
    category_counts = (
        content_engagements_df
        .groupBy("individual_id", "content_category")
        .agg(count("*").alias("category_count"))
    )

    # Rank categories by count within each individual
    window_category = Window.partitionBy("individual_id").orderBy(col("category_count").desc())
    top_categories = (
        category_counts
        .withColumn("rank", row_number().over(window_category))
        .filter(col("rank") <= 3)
        .groupBy("individual_id")
        .agg(collect_list("content_category").alias("preferred_categories"))
    )

    # Phase 4: Compute peak hour (hour of day with most activity)
    hour_counts = (
        content_engagements_df
        .withColumn("hour_of_day", hour("timestamp"))
        .groupBy("individual_id", "hour_of_day")
        .agg(count("*").alias("hour_count"))
    )

    window_hour = Window.partitionBy("individual_id").orderBy(col("hour_count").desc())
    peak_hours = (
        hour_counts
        .withColumn("rank", row_number().over(window_hour))
        .filter(col("rank") == 1)
        .select("individual_id", col("hour_of_day").alias("peak_hour"))
    )

    # Phase 5: Join all viewership pattern components
    viewership_patterns = (
        individuals_df
        .select("individual_id")
        .join(engagement_agg, "individual_id", "left")
        .join(top_categories, "individual_id", "left")
        .join(peak_hours, "individual_id", "left")
    )

    # Fill nulls for individuals with no engagements
    viewership_patterns = viewership_patterns.fillna({
        "total_engagements": 0,
        "frequency_daily_avg": 0.0,
        "peak_hour": 20  # default to 8pm
    })

    # Add pattern_id and computed_at timestamp
    window_pattern = Window.orderBy("individual_id")
    viewership_patterns = (
        viewership_patterns
        .withColumn("pattern_id", row_number().over(window_pattern))
        .withColumn("computed_at", current_timestamp())
        .withColumn(
            "preferred_categories",
            when(col("preferred_categories").isNull(), array_distinct(lit(["General"])))
            .otherwise(col("preferred_categories"))
        )
        .withColumn(
            "recency_last_engagement",
            when(col("recency_last_engagement").isNull(), current_timestamp())
            .otherwise(col("recency_last_engagement"))
        )
    )

    # Select final columns for viewership_patterns
    viewership_patterns = viewership_patterns.select(
        "pattern_id",
        "individual_id",
        "total_engagements",
        "frequency_daily_avg",
        "recency_last_engagement",
        "preferred_categories",
        "peak_hour",
        "computed_at"
    )

    # Phase 7: Derive audience attributes from viewership patterns

    # Behavioral classification based on frequency thresholds
    behavioral_thresholds = getattr(config, 'behavioral_thresholds', {
        "heavy_user_min_daily": 10.0,
        "moderate_user_min_daily": 2.0,
        "light_user_min_daily": 0.5
    })
    audience_attributes = viewership_patterns.withColumn(
        "behavioral_classification",
        when(col("frequency_daily_avg") >= behavioral_thresholds["heavy_user_min_daily"], lit("Heavy User"))
        .when(col("frequency_daily_avg") >= behavioral_thresholds["moderate_user_min_daily"], lit("Moderate User"))
        .when(col("frequency_daily_avg") >= behavioral_thresholds["light_user_min_daily"], lit("Light User"))
        .otherwise(lit("Churned"))
    )

    # Primary segment based on top category
    segments = getattr(config, 'segments', [
        "Tech Enthusiast", "Sports Fan", "News Junkie",
        "Entertainment Seeker", "Casual User"
    ])
    audience_attributes = audience_attributes.withColumn(
        "segment_primary",
        when(size(col("preferred_categories")) > 0, element_at(col("preferred_categories"), 1))
        .otherwise(lit("Casual User"))
    )

    # Map category to segment (simplified mapping)
    category_to_segment = {
        "Technology": "Tech Enthusiast",
        "Sports": "Sports Fan",
        "News": "News Junkie",
        "Entertainment": "Entertainment Seeker",
        "Education": "Learner",
        "Lifestyle": "Lifestyle Enthusiast"
    }

    # Apply segment mapping
    segment_mapping_expr = col("segment_primary")
    for category, segment in category_to_segment.items():
        segment_mapping_expr = when(
            col("segment_primary") == category, lit(segment)
        ).otherwise(segment_mapping_expr)

    audience_attributes = audience_attributes.withColumn(
        "segment_primary",
        segment_mapping_expr
    )

    # Secondary segments (remaining top categories)
    audience_attributes = audience_attributes.withColumn(
        "segment_secondary",
        when(size(col("preferred_categories")) > 1,
             spark_slice(col("preferred_categories"), 2, 3))
        .otherwise(lit(None).cast("array<string>"))
    )

    # Compute affinity scores (normalized category counts)
    # For each individual, create a map of category -> affinity score
    category_affinities = (
        content_engagements_df
        .groupBy("individual_id", "content_category")
        .agg(count("*").alias("category_count"))
        .groupBy("individual_id")
        .agg(
            collect_list("content_category").alias("affinity_categories"),
            collect_list("category_count").alias("affinity_counts")
        )
    )

    # Create map and normalize
    category_affinities = category_affinities.withColumn(
        "total_count",
        expr("aggregate(affinity_counts, CAST(0 AS BIGINT), (acc, x) -> acc + x)")
    ).withColumn(
        "affinity_scores_normalized",
        expr("transform(affinity_counts, x -> CAST(x AS DOUBLE) / total_count)")
    ).withColumn(
        "affinity_scores",
        map_from_arrays("affinity_categories", "affinity_scores_normalized")
    ).select("individual_id", "affinity_scores")

    # Join affinity scores
    audience_attributes = audience_attributes.join(
        category_affinities, "individual_id", "left"
    )

    # Default affinity scores for individuals with no engagements
    audience_attributes = audience_attributes.withColumn(
        "affinity_scores",
        when(col("affinity_scores").isNull(),
             expr("map('General', 1.0)"))
        .otherwise(col("affinity_scores"))
    )

    # Propensity to convert (correlated with frequency and behavioral classification)
    # Heavy users have higher propensity
    audience_attributes = audience_attributes.withColumn(
        "propensity_to_convert",
        when(col("behavioral_classification") == "Heavy User",
             (rand(seed) * 0.3 + 0.6))  # 0.6-0.9 range
        .when(col("behavioral_classification") == "Moderate User",
              (rand(seed + 1) * 0.3 + 0.3))  # 0.3-0.6 range
        .when(col("behavioral_classification") == "Light User",
              (rand(seed + 2) * 0.2 + 0.1))  # 0.1-0.3 range
        .otherwise(rand(seed + 3) * 0.1)  # 0.0-0.1 range for churned
    )

    # Lifetime value estimate (based on engagement and propensity)
    audience_attributes = audience_attributes.withColumn(
        "lifetime_value_estimate",
        (col("total_engagements") * col("propensity_to_convert") * 2.5)
        .cast("decimal(10,2)")
    )

    # Add attribute_id and computed_at
    window_attr = Window.orderBy("individual_id")
    audience_attributes = (
        audience_attributes
        .withColumn("attribute_id", row_number().over(window_attr))
        .withColumn("computed_at", current_timestamp())
    )

    # Select final columns for audience_attributes
    audience_attributes = audience_attributes.select(
        "attribute_id",
        "individual_id",
        "segment_primary",
        "segment_secondary",
        "affinity_scores",
        "behavioral_classification",
        "propensity_to_convert",
        "lifetime_value_estimate",
        "computed_at"
    )

    return viewership_patterns, audience_attributes
