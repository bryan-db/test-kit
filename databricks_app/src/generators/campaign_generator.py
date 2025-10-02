"""
Campaign and campaign exposure generators.

Generates marketing campaigns and individual-level exposure events.
"""

from typing import Optional
from datetime import datetime, timedelta
import dbldatagen as dg
from pyspark.sql import SparkSession, DataFrame
from pyspark.sql.functions import (
    col, lit, rand, when, expr, row_number, explode, sequence,
    date_add, to_date, current_timestamp, array, broadcast, monotonically_increasing_id
)
from pyspark.sql.window import Window
from src.models.schemas import CampaignConfig
import pandas as pd
from pyspark.sql.functions import pandas_udf


def generate_campaigns(
    spark: SparkSession,
    config: CampaignConfig,
    seed: int = 42,
    start_date: Optional[datetime] = None,
) -> DataFrame:
    """
    Generate synthetic marketing campaigns.

    Args:
        spark: Active SparkSession
        config: Campaign configuration
        seed: Random seed for deterministic generation
        start_date: Campaign start date (defaults to today)

    Returns:
        DataFrame matching CampaignSchema
    """
    num_campaigns = config.num_campaigns
    duration_min = config.campaign_duration_days["min"]
    duration_max = config.campaign_duration_days["max"]
    available_channels = config.channels

    if start_date is None:
        start_date = datetime.now()

    # Auto-calculate partitions
    num_partitions = max(1, min(10, num_campaigns // 10))

    # Build campaign spec using dbldatagen
    campaign_spec = (
        dg.DataGenerator(spark, name="campaigns", rows=num_campaigns, partitions=num_partitions)
        .withIdOutput()
        .withColumn("campaign_id", "long", uniqueValues=num_campaigns, random=True)
        .withColumn(
            "campaign_duration_days",
            "integer",
            minValue=duration_min,
            maxValue=duration_max,
            random=True
        )
        .withColumn(
            "budget_thousands",
            "integer",
            minValue=10,
            maxValue=500,
            distribution=dg.distributions.Normal(100, 50),
            random=True
        )
        .withColumn(
            "goal_index",
            "integer",
            values=[0, 1, 2],
            weights=[0.3, 0.4, 0.3],  # awareness, consideration, conversion
            random=True
        )
    )

    df = campaign_spec.build()

    # Map goal_index to goal names
    df = df.withColumn(
        "goal",
        when(col("goal_index") == 0, lit("awareness"))
        .when(col("goal_index") == 1, lit("consideration"))
        .otherwise(lit("conversion"))
    )

    # Convert budget to decimal
    df = df.withColumn("budget", (col("budget_thousands") * 1000).cast("decimal(12,2)"))

    # Generate campaign names using Pandas UDF
    @pandas_udf("string")
    def generate_campaign_name(campaign_ids: pd.Series) -> pd.Series:
        from faker import Faker
        fake = Faker()
        Faker.seed(seed)
        campaign_types = ["Spring", "Summer", "Fall", "Winter", "Holiday", "Back to School",
                         "Product Launch", "Brand Awareness", "Customer Retention"]
        return pd.Series([
            f"{fake.random_element(campaign_types)} Campaign {idx}"
            for idx in range(len(campaign_ids))
        ])

    df = df.withColumn("campaign_name", generate_campaign_name(col("campaign_id")))

    # Calculate start_date and end_date
    base_start_date = lit(start_date.strftime("%Y-%m-%d"))
    df = df.withColumn(
        "offset_days",
        (rand(seed + 1) * 365).cast("integer")  # Campaigns spread over 1 year
    )
    df = df.withColumn(
        "start_date",
        to_date(date_add(base_start_date, col("offset_days")))
    )
    df = df.withColumn(
        "end_date",
        to_date(date_add(col("start_date"), col("campaign_duration_days")))
    )

    # Assign channels (array of strings)
    # Each campaign gets 1-3 channels from available channels
    num_channels = len(available_channels)
    df = df.withColumn(
        "num_channels_to_assign",
        when(rand(seed + 2) < 0.3, lit(1))
        .when(rand(seed + 3) < 0.7, lit(2))
        .otherwise(lit(3))
    )

    # Generate channel assignments
    @pandas_udf("array<string>")
    def assign_channels(num_channels_series: pd.Series) -> pd.Series:
        from faker import Faker
        fake = Faker()
        Faker.seed(seed + 4)
        return pd.Series([
            fake.random_sample(available_channels, length=min(int(n), len(available_channels)))
            for n in num_channels_series
        ])

    df = df.withColumn("channels", assign_channels(col("num_channels_to_assign")))

    # Generate target segments (array of strings)
    # Each campaign targets 1-2 segments
    @pandas_udf("array<string>")
    def assign_segments(campaign_ids: pd.Series) -> pd.Series:
        from faker import Faker
        fake = Faker()
        Faker.seed(seed + 5)
        segments = ["Tech Enthusiast", "Sports Fan", "News Junkie", "Entertainment Seeker", "Casual User"]
        return pd.Series([
            fake.random_sample(segments, length=fake.random_int(min=1, max=2))
            for _ in range(len(campaign_ids))
        ])

    df = df.withColumn("target_segment", assign_segments(col("campaign_id")))

    # Add created_at timestamp
    df = df.withColumn("created_at", current_timestamp())

    # Select final columns
    result_df = df.select(
        "campaign_id",
        "campaign_name",
        "start_date",
        "end_date",
        "target_segment",
        "channels",
        "budget",
        "goal",
        "created_at"
    )

    return result_df


def generate_campaign_exposures(
    spark: SparkSession,
    individuals_df: DataFrame,
    campaigns_df: DataFrame,
    audience_attributes_df: DataFrame,
    config: CampaignConfig,
    seed: int = 42,
) -> DataFrame:
    """
    Generate campaign exposure events linking individuals to campaigns.

    Args:
        spark: Active SparkSession
        individuals_df: DataFrame with individual_id
        campaigns_df: DataFrame with campaign details
        audience_attributes_df: DataFrame with segment_primary for targeting
        config: Campaign configuration
        seed: Random seed for deterministic generation

    Returns:
        DataFrame matching CampaignExposureSchema
    """
    reach_percentage = getattr(config, 'reach_percentage', 0.3)  # default 30% reach

    # Join individuals with their primary segment
    individuals_with_segment = individuals_df.join(
        audience_attributes_df.select("individual_id", "segment_primary"),
        "individual_id",
        "left"
    )

    # Cross join campaigns with individuals (filtered by segment match)
    # To avoid exploding combinatorial size, sample individuals per campaign
    campaigns_with_segments = campaigns_df.select(
        "campaign_id",
        "campaign_name",
        "start_date",
        "end_date",
        "target_segment",
        "channels",
        "budget"
    ).withColumn("target_segment_exploded", explode(col("target_segment")))

    # Join campaigns to individuals where segment matches
    exposures_base = campaigns_with_segments.join(
        individuals_with_segment,
        individuals_with_segment["segment_primary"] == campaigns_with_segments["target_segment_exploded"],
        "inner"
    )

    # Sample reach_percentage of matched individuals per campaign
    exposures_sampled = exposures_base.withColumn(
        "sample_rand",
        rand(seed + 10)
    ).filter(col("sample_rand") < reach_percentage)

    # For each individual-campaign pair, generate 1-10 exposure events
    # Frequency distribution: most get 1-3, some get up to 10
    exposures_sampled = exposures_sampled.withColumn(
        "frequency",
        when(rand(seed + 11) < 0.5, lit(1))
        .when(rand(seed + 12) < 0.8, lit(2))
        .when(rand(seed + 13) < 0.95, lit(3))
        .otherwise((rand(seed + 14) * 7 + 4).cast("integer"))  # 4-10 range
    )

    # Generate timestamp for each exposure (within campaign date range)
    # Calculate days in campaign
    exposures_sampled = exposures_sampled.withColumn(
        "campaign_days",
        expr("datediff(end_date, start_date)")
    )

    # Generate random offset within campaign period
    exposures_sampled = exposures_sampled.withColumn(
        "exposure_offset_days",
        (rand(seed + 15) * col("campaign_days")).cast("integer")
    ).withColumn(
        "exposure_offset_hours",
        (rand(seed + 16) * 24).cast("integer")
    )

    exposures_sampled = exposures_sampled.withColumn(
        "exposure_timestamp",
        expr("timestamp(date_add(start_date, exposure_offset_days) + make_interval(0, 0, 0, 0, exposure_offset_hours, 0, 0))")
    )

    # Select one channel from campaign channels for this exposure
    @pandas_udf("string")
    def select_channel(channels_col: pd.Series) -> pd.Series:
        from faker import Faker
        fake = Faker()
        Faker.seed(seed + 17)
        return pd.Series([
            fake.random_element(ch) if ch is not None and len(ch) > 0 else "email"
            for ch in channels_col
        ])

    exposures_sampled = exposures_sampled.withColumn(
        "channel",
        select_channel(col("channels"))
    )

    # Calculate cost based on CPM model
    # CPM varies by channel: email=$5, social=$10, display=$15, video=$20, ctv=$25
    cpm_map = {"email": 5.0, "social": 10.0, "display": 15.0, "video": 20.0, "ctv": 25.0}
    cost_expr = col("channel")
    for channel, cpm in cpm_map.items():
        cost_expr = when(col("channel") == channel, lit(cpm / 1000.0)).otherwise(cost_expr)

    exposures_sampled = exposures_sampled.withColumn(
        "cost",
        cost_expr.cast("decimal(8,4)")
    )

    # Add placement (optional field)
    @pandas_udf("string")
    def generate_placement(channels: pd.Series) -> pd.Series:
        from faker import Faker
        fake = Faker()
        Faker.seed(seed + 18)
        placements = {
            "email": ["Newsletter", "Promotional", "Transactional"],
            "social": ["Feed", "Story", "Sidebar"],
            "display": ["Banner", "Skyscraper", "Rectangle"],
            "video": ["Pre-roll", "Mid-roll", "Post-roll"],
            "ctv": ["Commercial Break", "Pause Ad", "Overlay"]
        }
        return pd.Series([
            fake.random_element(placements.get(ch, ["Standard"]))
            for ch in channels
        ])

    exposures_sampled = exposures_sampled.withColumn(
        "placement",
        generate_placement(col("channel"))
    )

    # Add exposure_id
    window_exposure = Window.orderBy("campaign_id", "individual_id", "exposure_timestamp")
    exposures_sampled = exposures_sampled.withColumn(
        "exposure_id",
        row_number().over(window_exposure)
    )

    # Select final columns
    result_df = exposures_sampled.select(
        "exposure_id",
        "individual_id",
        "campaign_id",
        "exposure_timestamp",
        "channel",
        "frequency",
        "placement",
        "cost"
    )

    return result_df
