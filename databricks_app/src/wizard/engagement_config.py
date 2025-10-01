"""Engagement configuration wizard step."""

import streamlit as st
from databricks_app.src.wizard.validation import validate_engagement_config


def render_engagement_config():
    """Render engagement configuration step."""
    st.header("📊 Content Engagement Configuration")
    st.markdown("Configure content engagement events and behavioral patterns")

    # Initialize config if not exists
    if "engagement_config" not in st.session_state.config:
        st.session_state.config["engagement_config"] = {
            "time_period_days": 90,
            "events_per_person": {"mean": 50, "distribution": "power_law"},
            "content_categories": ["News", "Sports", "Entertainment", "Education", "Technology", "Lifestyle"],
            "engagement_types": {
                "view": 0.70,
                "click": 0.20,
                "share": 0.05,
                "like": 0.04,
                "comment": 0.01
            },
            "temporal_pattern": "daily"
        }

    config = st.session_state.config["engagement_config"]

    # Time period
    st.subheader("Time Period")
    time_period = st.slider(
        "Number of days to generate engagement data",
        min_value=7,
        max_value=730,
        value=config.get("time_period_days", 90),
        key="time_period"
    )
    config["time_period_days"] = time_period

    st.info(f"📅 Generating {time_period} days of engagement data")

    st.divider()

    # Events per person
    st.subheader("Events Per Person")

    col1, col2 = st.columns(2)

    with col1:
        events_mean = st.slider(
            "Average events per person",
            min_value=10,
            max_value=1000,
            value=config.get("events_per_person", {}).get("mean", 50),
            key="events_mean"
        )

    with col2:
        distribution_type = st.selectbox(
            "Distribution type",
            options=["normal", "power_law", "exponential"],
            index=1,  # power_law default
            key="distribution_type"
        )

    config["events_per_person"] = {"mean": events_mean, "distribution": distribution_type}

    # Calculate total events
    num_individuals = st.session_state.config.get("household_config", {}).get("num_households", 10000) * 2.5
    total_events = int(num_individuals * events_mean)
    st.info(f"📈 Estimated total events: **{total_events:,}**")

    st.divider()

    # Content categories
    st.subheader("Content Categories")
    available_categories = ["News", "Sports", "Entertainment", "Education", "Technology", "Lifestyle", "Health", "Finance", "Travel", "Food"]

    selected_categories = st.multiselect(
        "Select content categories to generate",
        options=available_categories,
        default=config.get("content_categories", available_categories[:6]),
        key="categories"
    )
    config["content_categories"] = selected_categories

    st.divider()

    # Engagement type distribution
    st.subheader("Engagement Type Distribution")
    st.markdown("Distribution of engagement types (must sum to 1.0)")

    engagement_types = ["view", "click", "share", "like", "comment"]
    engagement_config = config.get("engagement_types", {})

    engagement_values = {}
    for eng_type in engagement_types:
        engagement_values[eng_type] = st.slider(
            f"**{eng_type.capitalize()}**",
            min_value=0.0,
            max_value=1.0,
            value=engagement_config.get(eng_type, 0.2),
            step=0.01,
            key=f"engagement_{eng_type}"
        )

    total_engagement = sum(engagement_values.values())
    if abs(total_engagement - 1.0) > 0.01:
        st.warning(f"⚠️ Engagement types sum to {total_engagement:.2f}, but must equal 1.0")
    else:
        st.success(f"✅ Engagement types sum to {total_engagement:.2f}")

    config["engagement_types"] = engagement_values

    st.divider()

    # Temporal pattern
    st.subheader("Temporal Pattern")
    temporal_pattern = st.radio(
        "Select engagement temporal pattern",
        options=["uniform", "daily", "weekly"],
        index=1,  # daily default
        key="temporal_pattern",
        help="Daily: Peak during evening hours. Weekly: Higher on weekends. Uniform: Evenly distributed."
    )
    config["temporal_pattern"] = temporal_pattern

    st.divider()

    # Validation and navigation
    validation_result = validate_engagement_config(config)

    if not validation_result["valid"]:
        st.error("❌ Configuration has errors:")
        for error in validation_result["errors"]:
            st.error(f"  - **{error['field']}**: {error['message']}")

    # Save and navigate
    st.session_state.config["engagement_config"] = config

    col1, col2 = st.columns(2)
    with col1:
        if st.button("⬅️ Previous", key="prev_engagement"):
            st.session_state.wizard_step -= 1
            st.rerun()
    with col2:
        if st.button("Next ➡️", disabled=not validation_result["valid"], key="next_engagement"):
            st.session_state.wizard_step += 1
            st.rerun()
