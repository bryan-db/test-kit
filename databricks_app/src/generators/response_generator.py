"""
Response event and outcome metric generators.

Generates individual responses to campaign exposures and derived outcome metrics.
"""

from typing import Tuple
from pyspark.sql import SparkSession, DataFrame
from pyspark.sql.functions import (
    col, lit, rand, when, expr, row_number, current_timestamp,
    unix_timestamp, broadcast
)
from pyspark.sql.window import Window
from src.models.schemas import CampaignConfig
import pandas as pd
from pyspark.sql.functions import pandas_udf


def generate_response_events_and_outcomes(
    spark: SparkSession,
    campaign_exposures_df: DataFrame,
    audience_attributes_df: DataFrame,
    config: CampaignConfig,
    seed: int = 42,
) -> Tuple[DataFrame, DataFrame]:
    """
    Generate response events and outcome metrics from campaign exposures.

    Args:
        spark: Active SparkSession
        campaign_exposures_df: DataFrame with exposure events
        audience_attributes_df: DataFrame with propensity_to_convert
        config: Campaign configuration
        seed: Random seed for deterministic generation

    Returns:
        Tuple of (response_events_df, outcome_metrics_df)
    """
    response_rate_range = getattr(config, 'response_rate_range', {"min": 0.01, "max": 0.05})
    response_rate_min = response_rate_range["min"]
    response_rate_max = response_rate_range["max"]

    # Join exposures with audience attributes to get propensity_to_convert
    exposures_with_propensity = campaign_exposures_df.join(
        broadcast(audience_attributes_df.select("individual_id", "propensity_to_convert")),
        "individual_id",
        "left"
    )

    # Default propensity for individuals without attributes
    exposures_with_propensity = exposures_with_propensity.fillna({
        "propensity_to_convert": 0.05
    })

    # Calculate response probability (base rate * propensity multiplier)
    # Use configured response_rate range as base
    exposures_with_propensity = exposures_with_propensity.withColumn(
        "base_response_rate",
        lit(response_rate_min) + rand(seed + 20) * (response_rate_max - response_rate_min)
    ).withColumn(
        "adjusted_response_probability",
        col("base_response_rate") * (1 + col("propensity_to_convert"))
    )

    # Sample exposures that generated responses
    responses_base = exposures_with_propensity.withColumn(
        "response_rand",
        rand(seed + 21)
    ).filter(col("response_rand") < col("adjusted_response_probability"))

    # Generate response_type (click, conversion, engagement, visit)
    # Distribution: 60% click, 25% engagement, 10% conversion, 5% visit
    responses_base = responses_base.withColumn(
        "response_type",
        when(rand(seed + 22) < 0.60, lit("click"))
        .when(rand(seed + 23) < 0.85, lit("engagement"))  # 0.60 + 0.25
        .when(rand(seed + 24) < 0.95, lit("conversion"))  # 0.85 + 0.10
        .otherwise(lit("visit"))
    )

    # Generate response_timestamp (after exposure_timestamp)
    # Time to conversion: 0-48 hours for most, up to 7 days for some
    responses_base = responses_base.withColumn(
        "time_to_conversion_hours",
        when(rand(seed + 25) < 0.7, rand(seed + 26) * 48)  # 0-48 hours (70%)
        .when(rand(seed + 27) < 0.9, rand(seed + 28) * 120 + 48)  # 48-168 hours (20%)
        .otherwise(rand(seed + 29) * 120 + 168)  # 168-288 hours (10%)
    ).withColumn(
        "response_timestamp",
        expr("timestamp(exposure_timestamp + make_interval(0, 0, 0, 0, cast(time_to_conversion_hours as int), 0, 0))")
    )

    # Generate monetary value for conversion responses
    # Conversions have value between $10 and $500
    responses_base = responses_base.withColumn(
        "value",
        when(
            col("response_type") == "conversion",
            (rand(seed + 30) * 490 + 10).cast("decimal(10,2)")
        ).otherwise(lit(None).cast("decimal(10,2)"))
    )

    # Add response_id
    window_response = Window.orderBy("campaign_id", "individual_id", "response_timestamp")
    responses_base = responses_base.withColumn(
        "response_id",
        row_number().over(window_response)
    )

    # Select final columns for response_events
    response_events = responses_base.select(
        "response_id",
        "individual_id",
        "campaign_id",
        "exposure_id",
        "response_type",
        "response_timestamp",
        "exposure_timestamp",
        "time_to_conversion_hours",
        "value"
    )

    # Phase 2: Generate outcome_metrics from response_events

    # Conversion status based on response_type
    outcome_metrics = responses_base.withColumn(
        "conversion_status",
        when(col("response_type") == "conversion", lit("converted"))
        .when(col("response_type").isin("engagement", "click"), lit("engaged"))
        .otherwise(lit("no_action"))
    )

    # Revenue (same as value for conversions, null otherwise)
    outcome_metrics = outcome_metrics.withColumn(
        "revenue",
        when(col("conversion_status") == "converted", col("value"))
        .otherwise(lit(None).cast("decimal(10,2)"))
    )

    # Engagement score (normalized metric based on response type and recency)
    # Higher scores for conversions, lower for clicks
    # Recency bonus: responses within 24 hours get higher scores
    outcome_metrics = outcome_metrics.withColumn(
        "base_engagement_score",
        when(col("response_type") == "conversion", lit(1.0))
        .when(col("response_type") == "engagement", lit(0.7))
        .when(col("response_type") == "click", lit(0.4))
        .otherwise(lit(0.2))
    ).withColumn(
        "recency_multiplier",
        when(col("time_to_conversion_hours") <= 24, lit(1.0))
        .when(col("time_to_conversion_hours") <= 48, lit(0.9))
        .when(col("time_to_conversion_hours") <= 120, lit(0.7))
        .otherwise(lit(0.5))
    ).withColumn(
        "engagement_score",
        (col("base_engagement_score") * col("recency_multiplier"))
        .cast("double")
    )

    # Attribution model (randomly assign for demonstration)
    # In real systems, this would be calculated based on multi-touch attribution logic
    @pandas_udf("string")
    def assign_attribution_model(response_ids: pd.Series) -> pd.Series:
        from faker import Faker
        from collections import OrderedDict
        fake = Faker()
        Faker.seed(seed + 31)
        models = ["first_touch", "last_touch", "linear", "time_decay"]
        weights = [0.3, 0.4, 0.2, 0.1]
        return pd.Series([
            fake.random_element(elements=OrderedDict(zip(models, weights)))
            for _ in range(len(response_ids))
        ])

    outcome_metrics = outcome_metrics.withColumn(
        "attribution_model",
        assign_attribution_model(col("response_id"))
    )

    # Attribution weight
    # For simplicity, single-touch models get 1.0, multi-touch get fractional weights
    outcome_metrics = outcome_metrics.withColumn(
        "attribution_weight",
        when(col("attribution_model").isin("first_touch", "last_touch"), lit(1.0))
        .when(col("attribution_model") == "linear", rand(seed + 32) * 0.4 + 0.3)  # 0.3-0.7
        .otherwise(rand(seed + 33) * 0.5 + 0.2)  # 0.2-0.7 for time_decay
    )

    # Add outcome_id and computed_at
    window_outcome = Window.orderBy("response_id")
    outcome_metrics = outcome_metrics.withColumn(
        "outcome_id",
        row_number().over(window_outcome)
    ).withColumn(
        "computed_at",
        current_timestamp()
    )

    # Select final columns for outcome_metrics
    outcome_metrics = outcome_metrics.select(
        "outcome_id",
        "response_id",
        "campaign_id",
        "conversion_status",
        "revenue",
        "engagement_score",
        "attribution_model",
        "attribution_weight",
        "computed_at"
    )

    return response_events, outcome_metrics
