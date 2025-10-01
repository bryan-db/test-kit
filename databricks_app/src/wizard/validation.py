"""Validation functions for wizard configuration steps."""

from typing import Dict, Any, List


def _create_error(field: str, message: str) -> Dict[str, str]:
    """Create a structured error object.

    Args:
        field: The configuration field that failed validation
        message: Human-readable error message

    Returns:
        Structured error dictionary
    """
    return {"field": field, "message": message}


def _create_warning(field: str, message: str) -> Dict[str, str]:
    """Create a structured warning object.

    Args:
        field: The configuration field that triggered the warning
        message: Human-readable warning message

    Returns:
        Structured warning dictionary
    """
    return {"field": field, "message": message}


def validate_household_config(config: Dict[str, Any]) -> Dict[str, Any]:
    """Validate household configuration.

    Args:
        config: Household configuration dictionary

    Returns:
        Validation result with 'valid' boolean, 'errors' list, and 'warnings' list
    """
    errors: List[Dict[str, str]] = []
    warnings: List[Dict[str, str]] = []

    # Validate num_households is required
    if "num_households" not in config:
        errors.append(
            _create_error("num_households", "num_households is required")
        )
    else:
        num_households = config.get("num_households")
        if num_households < 1000:
            errors.append(
                _create_error("num_households", "num_households must be at least 1,000")
            )
        elif num_households > 10_000_000:
            errors.append(
                _create_error(
                    "num_households", "num_households must not exceed 10,000,000"
                )
            )

    # Validate income_brackets
    income_brackets = config.get("income_brackets", {})
    if income_brackets:
        total_weight = sum(income_brackets.values())
        if not (0.99 <= total_weight <= 1.01):  # Allow for floating point precision
            errors.append(
                _create_error(
                    "income_brackets",
                    f"Income bracket weights must sum to 1.0 (got {total_weight:.2f})",
                )
            )

    # Validate size_distribution
    size_dist = config.get("size_distribution", {})
    if size_dist:
        # Check for required fields
        if "mean" not in size_dist:
            errors.append(
                _create_error("size_distribution.mean", "size_distribution.mean is required")
            )
        elif not (1.0 <= size_dist["mean"] <= 6.0):
            errors.append(
                _create_error(
                    "size_distribution.mean",
                    "Household size mean must be between 1.0 and 6.0",
                )
            )

        if "std_dev" not in size_dist:
            errors.append(
                _create_error(
                    "size_distribution.std_dev", "size_distribution.std_dev is required"
                )
            )
        elif not (0.5 <= size_dist["std_dev"] <= 2.0):
            errors.append(
                _create_error(
                    "size_distribution.std_dev",
                    "Household size std_dev must be between 0.5 and 2.0",
                )
            )

    # Validate location_distribution
    location_dist = config.get("location_distribution", {})
    if location_dist:
        total_weight = sum(location_dist.values())
        if not (0.99 <= total_weight <= 1.01):
            errors.append(
                _create_error(
                    "location_distribution",
                    f"Location distribution weights must sum to 1.0 (got {total_weight:.2f})",
                )
            )

    return {"valid": len(errors) == 0, "errors": errors, "warnings": warnings}


def validate_demographics_config(config: Dict[str, Any]) -> Dict[str, Any]:
    """Validate demographics configuration.

    Args:
        config: Demographics configuration dictionary

    Returns:
        Validation result with 'valid' boolean, 'errors' list, and 'warnings' list
    """
    errors: List[Dict[str, str]] = []
    warnings: List[Dict[str, str]] = []

    # Validate age_range is required
    if "age_range" not in config:
        errors.append(_create_error("age_range", "age_range is required"))
    else:
        age_range = config.get("age_range", {})
        age_min = age_range.get("min")
        age_max = age_range.get("max")

        if age_min is not None and age_min < 18:
            errors.append(
                _create_error("age_range.min", "Age minimum must be at least 18")
            )

        if age_max is not None and age_max > 100:
            errors.append(
                _create_error("age_range.max", "Age maximum must not exceed 100")
            )

        if age_min is not None and age_max is not None and age_min >= age_max:
            errors.append(
                _create_error("age_range", "Age minimum must be less than age maximum")
            )

    # Validate gender_distribution is required
    if "gender_distribution" not in config:
        errors.append(
            _create_error("gender_distribution", "gender_distribution is required")
        )
    else:
        gender_dist = config.get("gender_distribution", {})
        total_weight = sum(gender_dist.values())
        if not (0.99 <= total_weight <= 1.01):
            errors.append(
                _create_error(
                    "gender_distribution",
                    f"Gender distribution weights must sum to 1.0 (got {total_weight:.2f})",
                )
            )

        # Validate individual weights are between 0 and 1
        for gender, weight in gender_dist.items():
            if not (0.0 <= weight <= 1.0):
                errors.append(
                    _create_error(
                        f"gender_distribution.{gender}",
                        f"Weight must be between 0.0 and 1.0",
                    )
                )

    # Validate education_distribution
    education_dist = config.get("education_distribution", {})
    if education_dist:
        total_weight = sum(education_dist.values())
        if not (0.99 <= total_weight <= 1.01):
            errors.append(
                _create_error(
                    "education_distribution",
                    f"Education distribution weights must sum to 1.0 (got {total_weight:.2f})",
                )
            )

        valid_levels = {
            "Less than High School",
            "High School",
            "Some College",
            "Associate",
            "Bachelor",
            "Master",
            "Doctorate",
        }
        for level in education_dist.keys():
            if level not in valid_levels:
                errors.append(
                    _create_error(
                        "education_distribution",
                        f"Invalid education level: '{level}'",
                    )
                )

    # Validate employment_distribution
    employment_dist = config.get("employment_distribution", {})
    if employment_dist:
        total_weight = sum(employment_dist.values())
        if not (0.99 <= total_weight <= 1.01):
            errors.append(
                _create_error(
                    "employment_distribution",
                    f"Employment distribution weights must sum to 1.0 (got {total_weight:.2f})",
                )
            )

    # Validate identity_mappings
    identity_mappings = config.get("identity_mappings", {})
    if identity_mappings:
        identifiers_per_person = identity_mappings.get("identifiers_per_person", {})
        if identifiers_per_person:
            mean = identifiers_per_person.get("mean")
            if mean is not None:
                if not (2 <= mean <= 15):
                    errors.append(
                        _create_error(
                            "identity_mappings.identifiers_per_person.mean",
                            "identifiers_per_person.mean must be between 2 and 15",
                        )
                    )

        # Support both identifier_types and identifier_type_distribution
        identifier_types = identity_mappings.get("identifier_types") or identity_mappings.get("identifier_type_distribution", {})
        if identifier_types:
            field_name = "identifier_types" if "identifier_types" in identity_mappings else "identifier_type_distribution"
            for id_type, probability in identifier_types.items():
                if not (0.0 <= probability <= 1.0):
                    errors.append(
                        _create_error(
                            f"identity_mappings.{field_name}.{id_type}",
                            f"Probability must be between 0.0 and 1.0",
                        )
                    )

    return {"valid": len(errors) == 0, "errors": errors, "warnings": warnings}


def validate_engagement_config(config: Dict[str, Any]) -> Dict[str, Any]:
    """Validate engagement configuration.

    Args:
        config: Engagement configuration dictionary

    Returns:
        Validation result with 'valid' boolean and 'errors' list
    """
    errors = []

    # Validate num_events_per_person
    num_events = config.get("num_events_per_person", {})
    if num_events:
        mean = num_events.get("mean")
        if mean is not None and mean < 1:
            errors.append("num_events_per_person.mean must be at least 1")

    # Validate event_types
    event_types = config.get("event_types", {})
    if event_types:
        total_weight = sum(event_types.values())
        if not (0.99 <= total_weight <= 1.01):
            errors.append(
                f"Event type weights must sum to 1.0 (got {total_weight:.2f})"
            )

    # Validate duration_range
    duration_range = config.get("duration_range", {})
    if duration_range:
        dur_min = duration_range.get("min")
        dur_max = duration_range.get("max")

        if dur_min is not None and dur_min < 0:
            errors.append("Duration minimum must be non-negative")

        if (
            dur_min is not None
            and dur_max is not None
            and dur_min >= dur_max
        ):
            errors.append("Duration minimum must be less than duration maximum")

    # Validate content_categories
    content_categories = config.get("content_categories", {})
    if content_categories and isinstance(content_categories, dict):
        total_weight = sum(content_categories.values())
        if not (0.99 <= total_weight <= 1.01):
            errors.append(
                f"Content category weights must sum to 1.0 (got {total_weight:.2f})"
            )

    # Validate temporal_pattern
    temporal_pattern = config.get("temporal_pattern")
    if temporal_pattern:
        valid_patterns = {"uniform", "daily", "weekly", "seasonal"}
        if temporal_pattern not in valid_patterns:
            errors.append(
                f"temporal_pattern must be one of {valid_patterns}"
            )

    return {"valid": len(errors) == 0, "errors": errors, "warnings": []}


def validate_audience_config(config: Dict[str, Any]) -> Dict[str, Any]:
    """Validate audience configuration.

    Args:
        config: Audience configuration dictionary

    Returns:
        Validation result with 'valid' boolean and 'errors' list
    """
    errors = []

    # Validate affinity_threshold
    affinity_threshold = config.get("affinity_threshold")
    if affinity_threshold is not None:
        if not (0.0 <= affinity_threshold <= 1.0):
            errors.append("affinity_threshold must be between 0.0 and 1.0")

    # Validate recency_weight
    recency_weight = config.get("recency_weight")
    if recency_weight is not None:
        if not (0.0 <= recency_weight <= 1.0):
            errors.append("recency_weight must be between 0.0 and 1.0")

    # Validate frequency_weight
    frequency_weight = config.get("frequency_weight")
    if frequency_weight is not None:
        if not (0.0 <= frequency_weight <= 1.0):
            errors.append("frequency_weight must be between 0.0 and 1.0")

    # Validate weights sum to 1.0
    if recency_weight is not None and frequency_weight is not None:
        total_weight = recency_weight + frequency_weight
        if not (0.99 <= total_weight <= 1.01):
            errors.append(
                f"recency_weight + frequency_weight must sum to 1.0 (got {total_weight:.2f})"
            )

    # Validate segments
    segments = config.get("segments", [])
    if not segments:
        errors.append("At least one audience segment must be defined")

    # Validate behavioral_classifications
    behavioral_classifications = config.get("behavioral_classifications", [])
    if not behavioral_classifications:
        errors.append("At least one behavioral classification must be defined")

    return {"valid": len(errors) == 0, "errors": errors, "warnings": []}


def validate_campaign_config(config: Dict[str, Any]) -> Dict[str, Any]:
    """Validate campaign configuration.

    Args:
        config: Campaign configuration dictionary

    Returns:
        Validation result with 'valid' boolean and 'errors' list
    """
    errors = []

    # Validate num_campaigns
    num_campaigns = config.get("num_campaigns")
    if num_campaigns is not None:
        if num_campaigns < 1:
            errors.append("num_campaigns must be at least 1")
        if num_campaigns > 1000:
            errors.append("num_campaigns must not exceed 1000")

    # Validate channels
    channels = config.get("channels", [])
    if not channels:
        errors.append("At least one campaign channel must be defined")

    # Validate exposure_rate
    exposure_rate = config.get("exposure_rate")
    if exposure_rate is not None:
        if not (0.0 < exposure_rate <= 1.0):
            errors.append("exposure_rate must be between 0.0 (exclusive) and 1.0")

    # Validate response_rate
    response_rate = config.get("response_rate")
    if response_rate is not None:
        if not (0.0 <= response_rate <= 1.0):
            errors.append("response_rate must be between 0.0 and 1.0")

    # Validate conversion_rate
    conversion_rate = config.get("conversion_rate")
    if conversion_rate is not None:
        if not (0.0 <= conversion_rate <= 1.0):
            errors.append("conversion_rate must be between 0.0 and 1.0")

    # Validate campaign_duration_days
    duration_days = config.get("campaign_duration_days", {})
    if duration_days:
        dur_min = duration_days.get("min")
        dur_max = duration_days.get("max")

        if dur_min is not None and dur_min < 1:
            errors.append("campaign_duration_days.min must be at least 1")

        if (
            dur_min is not None
            and dur_max is not None
            and dur_min > dur_max
        ):
            errors.append(
                "campaign_duration_days.min must not exceed campaign_duration_days.max"
            )

    return {"valid": len(errors) == 0, "errors": errors, "warnings": []}
