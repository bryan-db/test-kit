# Databricks notebook source
# MAGIC %md
# MAGIC # Silver to Gold Pipeline - Metric Aggregation for Analytics Dashboards
# MAGIC **Feature**: 004-data-exploration-frontend
# MAGIC **Tasks**: T023-T027
# MAGIC
# MAGIC This pipeline aggregates silver layer tables into pre-computed gold tables
# MAGIC optimized for dashboard queries with sub-second performance.
# MAGIC
# MAGIC ## Gold Tables Created:
# MAGIC - campaign_performance_summary (T023)
# MAGIC - audience_segment_summary (T024)
# MAGIC - content_engagement_daily (T025)
# MAGIC - attribution_comparison (T026)
# MAGIC - conversion_funnel_metrics (T027)

# COMMAND ----------

from pyspark.sql import SparkSession, DataFrame
from pyspark.sql.functions import (
    col, count, sum as spark_sum, avg, min as spark_min, max as spark_max,
    countDistinct, when, lit, current_timestamp, to_json, struct, collect_list,
    expr, first, row_number, broadcast, datediff, unix_timestamp, pow as spark_pow,
    coalesce
)
from pyspark.sql.window import Window
from databricks.sdk.runtime import *
import logging

logger = logging.getLogger(__name__)

# COMMAND ----------


class SilverToGoldPipeline:
    """Aggregate silver tables into gold analytics tables"""

    def __init__(self, spark: SparkSession, catalog: str = "bryan_li"):
        self.spark = spark
        self.catalog = catalog
        self.silver_schema = "silver"
        self.gold_schema = "analytics"

    def run_all(self):
        """Execute all gold table aggregations"""
        logger.info("Starting silver_to_gold pipeline")

        # Create gold schema if not exists
        self.spark.sql(f"CREATE SCHEMA IF NOT EXISTS {self.catalog}.{self.gold_schema}")

        # Execute in dependency order
        self.create_campaign_performance_summary()  # T023
        self.create_audience_segment_summary()      # T024
        self.create_content_engagement_daily()      # T025
        self.create_attribution_comparison()        # T026
        self.create_conversion_funnel_metrics()     # T027

        # Enable auto-optimization on all gold tables
        self._enable_auto_optimization()

        logger.info("Silver to gold pipeline complete")

    def create_campaign_performance_summary(self):
        """
        T023: Aggregate campaign performance metrics

        Joins: campaigns, campaign_exposures, response_events, outcome_metrics
        Metrics: impressions, reach, spend, conversions, ROI, CPM
        """
        logger.info("Creating campaign_performance_summary (T023)")

        campaigns = self.spark.table(f"{self.catalog}.{self.silver_schema}.campaigns")
        exposures = self.spark.table(f"{self.catalog}.{self.silver_schema}.campaign_exposures")
        responses = self.spark.table(f"{self.catalog}.{self.silver_schema}.response_events")
        outcomes = self.spark.table(f"{self.catalog}.{self.silver_schema}.outcome_metrics")

        # Aggregate exposures by campaign
        exposure_agg = exposures.groupBy("campaign_id").agg(
            count("*").alias("total_impressions"),
            countDistinct("individual_id").alias("unique_reach"),
            spark_sum("cost").alias("total_spend")
        )

        # Aggregate conversions
        conversion_agg = outcomes.groupBy("campaign_id").agg(
            count("*").alias("conversion_count")
        )

        # Join campaign metadata with aggregates (use broadcast for small campaigns table)
        result = campaigns.alias("c") \
            .join(broadcast(exposure_agg.alias("e")), col("c.campaign_id") == col("e.campaign_id"), "left") \
            .join(broadcast(conversion_agg.alias("conv")), col("c.campaign_id") == col("conv.campaign_id"), "left") \
            .select(
                col("c.campaign_id"),
                col("c.campaign_name"),
                col("c.start_date"),
                col("c.end_date"),
                col("c.target_segment"),
                col("c.channels"),
                coalesce(col("e.total_impressions"), lit(0)).alias("total_impressions"),
                coalesce(col("e.unique_reach"), lit(0)).alias("unique_reach"),
                coalesce(col("e.total_spend"), lit(0.0)).cast("decimal(18,2)").alias("total_spend"),
                coalesce(col("conv.conversion_count"), lit(0)).alias("conversion_count"),
                # Calculate ROI: (conversions * $50 avg value - spend) / spend
                when(col("e.total_spend") > 0,
                     ((coalesce(col("conv.conversion_count"), lit(0)) * lit(50.0)) - col("e.total_spend")) / col("e.total_spend")
                ).otherwise(lit(0.0)).cast("decimal(10,4)").alias("roi"),
                # Calculate CPM: (spend / impressions) * 1000
                when(col("e.total_impressions") > 0,
                     (col("e.total_spend") / col("e.total_impressions")) * lit(1000.0)
                ).otherwise(lit(0.0)).cast("decimal(10,4)").alias("cpm"),
                current_timestamp().alias("updated_at")
            )

        # Write to gold table with Liquid Clustering
        target_table = f"{self.catalog}.{self.gold_schema}.campaign_performance_summary"
        result.write \
            .format("delta") \
            .mode("overwrite") \
            .option("overwriteSchema", "true") \
            .option("delta.enableChangeDataFeed", "true") \
            .partitionBy("start_date") \
            .saveAsTable(target_table)

        logger.info(f"Gold table {target_table} created successfully")

    def create_audience_segment_summary(self):
        """
        T024: Aggregate audience segment demographics and engagement

        Joins: audience_segments, individuals, viewership_patterns, outcome_metrics
        Metrics: segment size, demographics distribution, propensity, engagement stats
        """
        logger.info("Creating audience_segment_summary (T024)")

        segments = self.spark.table(f"{self.catalog}.{self.silver_schema}.audience_attributes")
        individuals = self.spark.table(f"{self.catalog}.{self.silver_schema}.individuals")
        viewership = self.spark.table(f"{self.catalog}.{self.silver_schema}.viewership_patterns")
        outcomes = self.spark.table(f"{self.catalog}.{self.silver_schema}.outcome_metrics")
        engagements = self.spark.table(f"{self.catalog}.{self.silver_schema}.content_engagements")

        # Join individuals with segments via viewership patterns
        segment_individuals = viewership.alias("v") \
            .join(individuals.alias("i"), col("v.individual_id") == col("i.individual_id")) \
            .select("v.segment_id", "i.*")

        # Aggregate demographics by segment
        demographic_agg = segment_individuals.groupBy("segment_id").agg(
            count("*").alias("segment_size"),
            to_json(struct(
                collect_list(struct(
                    col("age"),
                    col("gender"),
                    col("education_level")
                )).alias("demographics")
            )).alias("demographic_distribution_json")
        )

        # Calculate engagement stats per segment
        engagement_agg = viewership.alias("v") \
            .join(engagements.alias("e"), col("v.individual_id") == col("e.individual_id")) \
            .groupBy("v.segment_id").agg(
                count("e.event_id").alias("total_events"),
                countDistinct("e.content_category").alias("unique_categories"),
                to_json(struct(
                    (count("e.event_id") / countDistinct("v.individual_id")).alias("avg_events_per_user"),
                    collect_list("e.content_category").alias("top_categories")
                )).alias("engagement_stats_json")
            )

        # Calculate conversions by segment (via outcomes)
        # Join outcomes to exposures to campaigns to segments
        exposures = self.spark.table(f"{self.catalog}.{self.silver_schema}.campaign_exposures")
        campaigns = self.spark.table(f"{self.catalog}.{self.silver_schema}.campaigns")

        # Simplified: Count outcomes per individual, then aggregate by segment
        individual_conversions = outcomes.groupBy("individual_id").agg(
            count("*").alias("conversion_count")
        )

        segment_conversions = viewership.alias("v") \
            .join(individual_conversions.alias("ic"), col("v.individual_id") == col("ic.individual_id"), "left") \
            .groupBy("v.segment_id").agg(
                spark_sum(coalesce(col("ic.conversion_count"), lit(0))).alias("total_conversions")
            )

        # Join all segment aggregates
        result = segments.alias("s") \
            .join(demographic_agg.alias("d"), col("s.segment_id") == col("d.segment_id"), "left") \
            .join(engagement_agg.alias("ea"), col("s.segment_id") == col("ea.segment_id"), "left") \
            .join(segment_conversions.alias("sc"), col("s.segment_id") == col("sc.segment_id"), "left") \
            .select(
                col("s.segment_id"),
                col("s.segment_name"),
                coalesce(col("d.segment_size"), lit(0)).alias("segment_size"),
                col("s.behavioral_classification"),
                col("s.avg_propensity_to_convert").cast("decimal(5,4)"),
                coalesce(col("sc.total_conversions"), lit(0)).alias("total_conversions"),
                col("d.demographic_distribution_json"),
                col("ea.engagement_stats_json"),
                current_timestamp().alias("updated_at")
            )

        target_table = f"{self.catalog}.{self.gold_schema}.audience_segment_summary"
        result.write \
            .format("delta") \
            .mode("overwrite") \
            .option("overwriteSchema", "true") \
            .option("delta.enableChangeDataFeed", "true") \
            .saveAsTable(target_table)

        logger.info(f"Gold table {target_table} created successfully")

    def create_content_engagement_daily(self):
        """
        T025: Aggregate daily content engagement metrics

        Rollup: content_engagements by date, category, event_type
        Metrics: total engagements, unique users, engagement rate
        """
        logger.info("Creating content_engagement_daily (T025)")

        engagements = self.spark.table(f"{self.catalog}.{self.silver_schema}.content_engagements")

        # Daily aggregation by category and event type
        result = engagements.groupBy(
            col("engagement_date"),
            col("content_category"),
            col("event_type")
        ).agg(
            count("*").alias("total_engagements"),
            countDistinct("individual_id").alias("unique_users")
        )

        # Calculate engagement rate (unique users / total distinct users that day)
        # Subquery to get daily user counts
        daily_users = engagements.groupBy("engagement_date").agg(
            countDistinct("individual_id").alias("daily_active_users")
        )

        result = result.alias("r") \
            .join(daily_users.alias("du"), col("r.engagement_date") == col("du.engagement_date")) \
            .select(
                col("r.engagement_date"),
                col("r.content_category"),
                col("r.event_type"),
                col("r.total_engagements"),
                col("r.unique_users"),
                (col("r.unique_users") / col("du.daily_active_users")).cast("decimal(10,6)").alias("engagement_rate"),
                current_timestamp().alias("updated_at")
            )

        target_table = f"{self.catalog}.{self.gold_schema}.content_engagement_daily"
        result.write \
            .format("delta") \
            .mode("overwrite") \
            .option("overwriteSchema", "true") \
            .option("delta.enableChangeDataFeed", "true") \
            .partitionBy("engagement_date") \
            .saveAsTable(target_table)

        logger.info(f"Gold table {target_table} created successfully")

    def create_attribution_comparison(self):
        """
        T026: Calculate multi-touch attribution models

        Models: First-touch, Last-touch, Linear, Time-decay
        Uses: PySpark window functions (NOT pandas UDFs per research.md)
        """
        logger.info("Creating attribution_comparison (T026)")

        exposures = self.spark.table(f"{self.catalog}.{self.silver_schema}.campaign_exposures")
        responses = self.spark.table(f"{self.catalog}.{self.silver_schema}.response_events")
        outcomes = self.spark.table(f"{self.catalog}.{self.silver_schema}.outcome_metrics")

        # Join exposures to outcomes to get conversion touchpoints
        # Simplified: attribute each outcome to exposures that occurred before response
        touchpoints = exposures.alias("exp") \
            .join(responses.alias("resp"),
                  (col("exp.individual_id") == col("resp.individual_id")) &
                  (col("exp.exposure_timestamp") <= col("resp.response_timestamp"))) \
            .join(outcomes.alias("out"), col("resp.response_id") == col("out.response_id")) \
            .select(
                col("exp.campaign_id"),
                col("exp.individual_id"),
                col("out.outcome_id").alias("conversion_id"),
                col("exp.exposure_timestamp").alias("touchpoint_ts"),
                col("out.outcome_timestamp").alias("conversion_ts")
            )

        # First-touch attribution
        window_first = Window.partitionBy("individual_id", "conversion_id") \
            .orderBy(col("touchpoint_ts").asc())

        first_touch = touchpoints.withColumn("rank", row_number().over(window_first)) \
            .filter(col("rank") == 1) \
            .groupBy("campaign_id").agg(
                count("*").alias("first_touch_conversions")
            )

        # Last-touch attribution
        window_last = Window.partitionBy("individual_id", "conversion_id") \
            .orderBy(col("touchpoint_ts").desc())

        last_touch = touchpoints.withColumn("rank", row_number().over(window_last)) \
            .filter(col("rank") == 1) \
            .groupBy("campaign_id").agg(
                count("*").alias("last_touch_conversions")
            )

        # Linear attribution (equal weight to all touchpoints)
        window_count = Window.partitionBy("individual_id", "conversion_id")

        linear = touchpoints.withColumn(
            "touchpoint_count",
            count("*").over(window_count)
        ).withColumn(
            "attribution_weight",
            lit(1.0) / col("touchpoint_count")
        ).groupBy("campaign_id").agg(
            spark_sum("attribution_weight").cast("decimal(18,2)").alias("linear_conversions")
        )

        # Time-decay attribution (7-day half-life)
        time_decay = touchpoints.withColumn(
            "days_to_conversion",
            (unix_timestamp("conversion_ts") - unix_timestamp("touchpoint_ts")) / 86400.0
        ).withColumn(
            "decay_weight",
            spark_pow(lit(2.0), -col("days_to_conversion") / lit(7.0))
        )

        # Normalize decay weights per conversion
        window_sum = Window.partitionBy("individual_id", "conversion_id")
        time_decay = time_decay.withColumn(
            "total_weight",
            spark_sum("decay_weight").over(window_sum)
        ).withColumn(
            "attribution_weight",
            col("decay_weight") / col("total_weight")
        ).groupBy("campaign_id").agg(
            spark_sum("attribution_weight").cast("decimal(18,2)").alias("time_decay_conversions")
        )

        # Total conversions per campaign
        total_conversions = outcomes.alias("out") \
            .join(responses.alias("resp"), col("out.response_id") == col("resp.response_id")) \
            .join(exposures.alias("exp"),
                  (col("resp.individual_id") == col("exp.individual_id")) &
                  (col("exp.exposure_timestamp") <= col("resp.response_timestamp"))) \
            .groupBy("exp.campaign_id").agg(
                countDistinct("out.outcome_id").alias("total_conversions")
            )

        # Join all attribution models
        campaigns = self.spark.table(f"{self.catalog}.{self.silver_schema}.campaigns")

        result = campaigns.select("campaign_id").alias("c") \
            .join(first_touch.alias("ft"), col("c.campaign_id") == col("ft.campaign_id"), "left") \
            .join(last_touch.alias("lt"), col("c.campaign_id") == col("lt.campaign_id"), "left") \
            .join(linear.alias("lin"), col("c.campaign_id") == col("lin.campaign_id"), "left") \
            .join(time_decay.alias("td"), col("c.campaign_id") == col("td.campaign_id"), "left") \
            .join(total_conversions.alias("tc"), col("c.campaign_id") == col("tc.campaign_id"), "left") \
            .select(
                col("c.campaign_id"),
                coalesce(col("ft.first_touch_conversions"), lit(0)).alias("first_touch_conversions"),
                coalesce(col("lt.last_touch_conversions"), lit(0)).alias("last_touch_conversions"),
                coalesce(col("lin.linear_conversions"), lit(0.0)).cast("decimal(18,2)").alias("linear_conversions"),
                coalesce(col("td.time_decay_conversions"), lit(0.0)).cast("decimal(18,2)").alias("time_decay_conversions"),
                coalesce(col("tc.total_conversions"), lit(0)).alias("total_conversions"),
                current_timestamp().alias("updated_at")
            )

        target_table = f"{self.catalog}.{self.gold_schema}.attribution_comparison"
        result.write \
            .format("delta") \
            .mode("overwrite") \
            .option("overwriteSchema", "true") \
            .option("delta.enableChangeDataFeed", "true") \
            .saveAsTable(target_table)

        logger.info(f"Gold table {target_table} created successfully")

    def create_conversion_funnel_metrics(self):
        """
        T027: Calculate funnel metrics with drop-off rates

        Funnel stages: Exposures → Responses → Conversions
        Uses: LEFT JOINs to track cohort through stages
        """
        logger.info("Creating conversion_funnel_metrics (T027)")

        exposures = self.spark.table(f"{self.catalog}.{self.silver_schema}.campaign_exposures")
        responses = self.spark.table(f"{self.catalog}.{self.silver_schema}.response_events")
        outcomes = self.spark.table(f"{self.catalog}.{self.silver_schema}.outcome_metrics")

        # Stage 1: Exposures
        exposure_funnel = exposures.groupBy("campaign_id").agg(
            count("*").alias("total_exposures"),
            countDistinct("individual_id").alias("unique_exposed")
        )

        # Stage 2: Responses (only those who were exposed)
        response_funnel = exposures.alias("exp") \
            .join(responses.alias("resp"),
                  (col("exp.individual_id") == col("resp.individual_id")) &
                  (col("resp.response_timestamp") >= col("exp.exposure_timestamp")),
                  "left") \
            .groupBy("exp.campaign_id").agg(
                count(col("resp.response_id")).alias("total_responses"),
                countDistinct(col("resp.individual_id")).alias("unique_responders")
            )

        # Stage 3: Conversions (only those who responded)
        conversion_funnel = responses.alias("resp") \
            .join(outcomes.alias("out"), col("resp.response_id") == col("out.response_id"), "left") \
            .join(exposures.alias("exp"), col("resp.individual_id") == col("exp.individual_id")) \
            .groupBy("exp.campaign_id").agg(
                count(col("out.outcome_id")).alias("total_conversions")
            )

        # Join all funnel stages
        result = exposure_funnel.alias("ef") \
            .join(response_funnel.alias("rf"), col("ef.campaign_id") == col("rf.campaign_id")) \
            .join(conversion_funnel.alias("cf"), col("ef.campaign_id") == col("cf.campaign_id"), "left") \
            .select(
                col("ef.campaign_id"),
                col("ef.total_exposures"),
                col("ef.unique_exposed"),
                coalesce(col("rf.total_responses"), lit(0)).alias("total_responses"),
                coalesce(col("rf.unique_responders"), lit(0)).alias("unique_responders"),
                coalesce(col("cf.total_conversions"), lit(0)).alias("total_conversions"),
                # Calculate conversion rates
                when(col("ef.unique_exposed") > 0,
                     coalesce(col("rf.unique_responders"), lit(0)) / col("ef.unique_exposed")
                ).otherwise(lit(0.0)).cast("decimal(10,6)").alias("exposure_to_response_rate"),
                when(col("rf.total_responses") > 0,
                     coalesce(col("cf.total_conversions"), lit(0)) / col("rf.total_responses")
                ).otherwise(lit(0.0)).cast("decimal(10,6)").alias("response_to_conversion_rate"),
                when(col("ef.total_exposures") > 0,
                     coalesce(col("cf.total_conversions"), lit(0)) / col("ef.total_exposures")
                ).otherwise(lit(0.0)).cast("decimal(10,6)").alias("overall_conversion_rate"),
                current_timestamp().alias("updated_at")
            )

        target_table = f"{self.catalog}.{self.gold_schema}.conversion_funnel_metrics"
        result.write \
            .format("delta") \
            .mode("overwrite") \
            .option("overwriteSchema", "true") \
            .option("delta.enableChangeDataFeed", "true") \
            .saveAsTable(target_table)

        logger.info(f"Gold table {target_table} created successfully")

    def _enable_auto_optimization(self):
        """Enable auto-optimization on all gold tables"""
        gold_tables = [
            "campaign_performance_summary",
            "audience_segment_summary",
            "content_engagement_daily",
            "attribution_comparison",
            "conversion_funnel_metrics"
        ]

        for table in gold_tables:
            full_table_name = f"{self.catalog}.{self.gold_schema}.{table}"
            self.spark.sql(f"""
                ALTER TABLE {full_table_name} SET TBLPROPERTIES (
                    'delta.autoOptimize.optimizeWrite' = 'true',
                    'delta.autoOptimize.autoCompact' = 'true'
                )
            """)
            logger.info(f"Auto-optimization enabled for {full_table_name}")


# COMMAND ----------

# MAGIC %md
# MAGIC ## Execute Pipeline

# COMMAND ----------

# Get catalog parameter
catalog = dbutils.widgets.get("catalog") if dbutils.widgets else "bryan_li"

# Initialize Spark session
spark = SparkSession.builder.getOrCreate()

# Run pipeline
pipeline = SilverToGoldPipeline(spark, catalog=catalog)
pipeline.run_all()
