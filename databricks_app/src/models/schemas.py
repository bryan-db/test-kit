"""Schema definitions for the Synthetic Identity Graph Dataset Generator.

This module contains:
- Wizard configuration enums and dataclasses
- Session state management
- Delta Lake table schemas for Unity Catalog
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional
from uuid import UUID

from pyspark.sql.types import (
    ArrayType,
    DoubleType,
    IntegerType,
    LongType,
    StringType,
    StructField,
    StructType,
    TimestampType,
)


# ============================================================================
# Wizard Configuration Enums and Dataclasses
# ============================================================================


class WizardStep(Enum):
    """Enumeration of wizard steps in the data generation flow."""

    HOUSEHOLD_CONFIG = "household_config"
    DEMOGRAPHICS_CONFIG = "demographics_config"
    ENGAGEMENT_CONFIG = "engagement_config"
    AUDIENCE_CONFIG = "audience_config"
    CAMPAIGN_CONFIG = "campaign_config"
    REVIEW_SUBMIT = "review_submit"


@dataclass
class HouseholdConfig:
    """Configuration for household generation.

    Attributes:
        num_households: Number of households to generate (1000-10000000)
        income_brackets: Distribution weights for income brackets (must sum to 1.0)
        size_distribution: Mean and std_dev for household size
        location_distribution: Geographic distribution weights
    """

    num_households: int
    income_brackets: Dict[str, float] = field(default_factory=dict)
    size_distribution: Dict[str, float] = field(
        default_factory=lambda: {"mean": 2.5, "std_dev": 1.2}
    )
    location_distribution: Dict[str, float] = field(default_factory=dict)


@dataclass
class DemographicsConfig:
    """Configuration for individual demographics generation.

    Attributes:
        age_range: Min and max age (18-100)
        gender_distribution: Distribution weights for gender categories
        education_distribution: Distribution weights for education levels
        employment_distribution: Distribution weights for employment status
        identity_mappings: Configuration for cross-device identity mappings
    """

    age_range: Dict[str, int]
    gender_distribution: Dict[str, float]
    education_distribution: Dict[str, float] = field(default_factory=dict)
    employment_distribution: Dict[str, float] = field(default_factory=dict)
    identity_mappings: Dict[str, any] = field(default_factory=dict)


@dataclass
class EngagementConfig:
    """Configuration for content engagement generation.

    Attributes:
        num_events_per_person: Range for number of engagement events
        event_types: Distribution weights for engagement types
        duration_range: Min and max duration in seconds
        temporal_pattern: Time-based distribution pattern
        content_categories: Distribution weights for content categories
    """

    num_events_per_person: Dict[str, int]
    event_types: Dict[str, float]
    duration_range: Dict[str, int]
    temporal_pattern: str
    content_categories: Dict[str, float] = field(default_factory=dict)


@dataclass
class AudienceConfig:
    """Configuration for audience attribute derivation.

    Attributes:
        segments: List of audience segments to derive
        affinity_threshold: Minimum affinity score for segment assignment
        behavioral_classifications: List of behavioral classifiers
        recency_weight: Weight for recency in scoring (0.0-1.0)
        frequency_weight: Weight for frequency in scoring (0.0-1.0)
    """

    segments: List[str]
    affinity_threshold: float
    behavioral_classifications: List[str]
    recency_weight: float = 0.3
    frequency_weight: float = 0.7


@dataclass
class CampaignConfig:
    """Configuration for campaign and response generation.

    Attributes:
        num_campaigns: Number of campaigns to generate
        channels: List of campaign channels
        exposure_rate: Percentage of population exposed (0.0-1.0)
        response_rate: Percentage of exposed individuals who respond (0.0-1.0)
        conversion_rate: Percentage of responders who convert (0.0-1.0)
        campaign_duration_days: Duration range for campaigns
    """

    num_campaigns: int
    channels: List[str]
    exposure_rate: float
    response_rate: float
    conversion_rate: float
    campaign_duration_days: Dict[str, int]


@dataclass
class GenerationConfig:
    """Complete configuration for dataset generation.

    Attributes:
        seed: Random seed for reproducibility (0-2147483647)
        catalog_name: Unity Catalog name (default: bryan_li)
        schema_name: Schema name within catalog (default: synthetic_data)
        household_config: Household generation configuration
        demographics_config: Demographics configuration
        engagement_config: Engagement configuration
        audience_config: Audience configuration
        campaign_config: Campaign configuration
        incremental: Whether to append to existing tables
    """

    seed: int
    catalog_name: str = "bryan_li"
    schema_name: str = "synthetic_data"
    household_config: Optional[HouseholdConfig] = None
    demographics_config: Optional[DemographicsConfig] = None
    engagement_config: Optional[EngagementConfig] = None
    audience_config: Optional[AudienceConfig] = None
    campaign_config: Optional[CampaignConfig] = None
    incremental: bool = False


@dataclass
class SessionState:
    """Wizard session state management.

    Attributes:
        session_id: Unique session identifier
        current_step: Current wizard step
        config: Partial or complete generation configuration
        created_at: Timestamp when session was created
        job_id: Databricks job ID if generation started
        job_status: Current job status (pending, running, succeeded, failed, cancelled)
        updated_at: Timestamp when session was last updated
    """

    session_id: str  # UUID string format
    current_step: WizardStep
    config: Dict[str, any]
    created_at: any  # datetime or timestamp
    job_id: Optional[str] = None
    job_status: Optional[str] = None
    updated_at: Optional[any] = None  # datetime or timestamp

    def __post_init__(self):
        """Validate session_id is UUID format and job_status is valid enum value."""
        import uuid

        # Validate session_id is UUID format
        try:
            uuid.UUID(self.session_id)
        except (ValueError, AttributeError):
            raise ValueError(f"session_id must be valid UUID format, got: {self.session_id}")

        # Validate job_status if provided
        if self.job_status is not None:
            valid_statuses = {"pending", "running", "succeeded", "failed", "cancelled"}
            if self.job_status not in valid_statuses:
                raise ValueError(
                    f"job_status must be one of {valid_statuses}, got: {self.job_status}"
                )


# ============================================================================
# Delta Lake Table Schemas
# ============================================================================


def get_household_schema() -> StructType:
    """Schema for households table in Unity Catalog.

    Table: bryan_li.synthetic_data.households

    Returns:
        PySpark StructType schema definition
    """
    return StructType(
        [
            StructField("household_id", LongType(), nullable=False),
            StructField("location_city", StringType(), nullable=False),
            StructField("location_state", StringType(), nullable=False),
            StructField("location_zip", StringType(), nullable=False),
            StructField("income_bracket", StringType(), nullable=False),
            StructField("household_size", IntegerType(), nullable=False),
            StructField("created_at", TimestampType(), nullable=False),
        ]
    )


def get_individual_schema() -> StructType:
    """Schema for individuals table in Unity Catalog.

    Table: bryan_li.synthetic_data.individuals

    Returns:
        PySpark StructType schema definition
    """
    return StructType(
        [
            StructField("individual_id", LongType(), nullable=False),
            StructField("household_id", LongType(), nullable=False),
            StructField("age", IntegerType(), nullable=False),
            StructField("gender", StringType(), nullable=False),
            StructField("education", StringType(), nullable=False),
            StructField("employment_status", StringType(), nullable=False),
            StructField("created_at", TimestampType(), nullable=False),
        ]
    )


def get_identity_mapping_schema() -> StructType:
    """Schema for identity_mappings table in Unity Catalog.

    Table: bryan_li.synthetic_data.identity_mappings

    Returns:
        PySpark StructType schema definition
    """
    return StructType(
        [
            StructField("mapping_id", LongType(), nullable=False),
            StructField("individual_id", LongType(), nullable=False),
            StructField("identifier_type", StringType(), nullable=False),
            StructField("identifier_value", StringType(), nullable=False),
            StructField("first_seen", TimestampType(), nullable=False),
            StructField("last_seen", TimestampType(), nullable=False),
        ]
    )


def get_content_engagement_schema() -> StructType:
    """Schema for content_engagements table in Unity Catalog.

    Table: bryan_li.synthetic_data.content_engagements

    Returns:
        PySpark StructType schema definition
    """
    return StructType(
        [
            StructField("event_id", LongType(), nullable=False),
            StructField("individual_id", LongType(), nullable=False),
            StructField("content_id", StringType(), nullable=False),
            StructField("timestamp", TimestampType(), nullable=False),
            StructField("engagement_type", StringType(), nullable=False),
            StructField("duration_seconds", IntegerType(), nullable=True),
            StructField("content_category", StringType(), nullable=False),
        ]
    )


def get_viewership_pattern_schema() -> StructType:
    """Schema for viewership_patterns table in Unity Catalog.

    Table: bryan_li.synthetic_data.viewership_patterns

    Returns:
        PySpark StructType schema definition
    """
    return StructType(
        [
            StructField("pattern_id", LongType(), nullable=False),
            StructField("individual_id", LongType(), nullable=False),
            StructField("frequency_7d", IntegerType(), nullable=False),
            StructField("frequency_30d", IntegerType(), nullable=False),
            StructField("recency_days", IntegerType(), nullable=False),
            StructField(
                "preferred_categories",
                ArrayType(StringType()),
                nullable=False,
            ),
            StructField("calculated_at", TimestampType(), nullable=False),
        ]
    )


def get_audience_attribute_schema() -> StructType:
    """Schema for audience_attributes table in Unity Catalog.

    Table: bryan_li.synthetic_data.audience_attributes

    Returns:
        PySpark StructType schema definition
    """
    return StructType(
        [
            StructField("attribute_id", LongType(), nullable=False),
            StructField("individual_id", LongType(), nullable=False),
            StructField("segment", StringType(), nullable=False),
            StructField("affinity_score", DoubleType(), nullable=False),
            StructField("behavioral_classification", StringType(), nullable=False),
            StructField("propensity_score", DoubleType(), nullable=True),
            StructField("calculated_at", TimestampType(), nullable=False),
        ]
    )


def get_campaign_schema() -> StructType:
    """Schema for campaigns table in Unity Catalog.

    Table: bryan_li.synthetic_data.campaigns

    Returns:
        PySpark StructType schema definition
    """
    return StructType(
        [
            StructField("campaign_id", LongType(), nullable=False),
            StructField("name", StringType(), nullable=False),
            StructField("start_date", TimestampType(), nullable=False),
            StructField("end_date", TimestampType(), nullable=False),
            StructField("target_segment", StringType(), nullable=False),
            StructField("channels", ArrayType(StringType()), nullable=False),
            StructField("budget", DoubleType(), nullable=True),
        ]
    )


def get_campaign_exposure_schema() -> StructType:
    """Schema for campaign_exposures table in Unity Catalog.

    Table: bryan_li.synthetic_data.campaign_exposures

    Returns:
        PySpark StructType schema definition
    """
    return StructType(
        [
            StructField("exposure_id", LongType(), nullable=False),
            StructField("individual_id", LongType(), nullable=False),
            StructField("campaign_id", LongType(), nullable=False),
            StructField("timestamp", TimestampType(), nullable=False),
            StructField("channel", StringType(), nullable=False),
            StructField("frequency_cap", IntegerType(), nullable=False),
        ]
    )


def get_response_event_schema() -> StructType:
    """Schema for response_events table in Unity Catalog.

    Table: bryan_li.synthetic_data.response_events

    Returns:
        PySpark StructType schema definition
    """
    return StructType(
        [
            StructField("response_id", LongType(), nullable=False),
            StructField("individual_id", LongType(), nullable=False),
            StructField("campaign_id", LongType(), nullable=False),
            StructField("response_type", StringType(), nullable=False),
            StructField("timestamp", TimestampType(), nullable=False),
            StructField("value", DoubleType(), nullable=True),
        ]
    )


def get_outcome_metric_schema() -> StructType:
    """Schema for outcome_metrics table in Unity Catalog.

    Table: bryan_li.synthetic_data.outcome_metrics

    Returns:
        PySpark StructType schema definition
    """
    return StructType(
        [
            StructField("outcome_id", LongType(), nullable=False),
            StructField("response_id", LongType(), nullable=False),
            StructField("conversion_status", StringType(), nullable=False),
            StructField("revenue", DoubleType(), nullable=True),
            StructField("attribution_weight", DoubleType(), nullable=False),
            StructField("calculated_at", TimestampType(), nullable=False),
        ]
    )
