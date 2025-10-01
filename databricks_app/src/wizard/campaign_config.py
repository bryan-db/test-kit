"""Campaign configuration wizard step."""

import streamlit as st
from databricks_app.src.wizard.validation import validate_campaign_config


def render_campaign_config():
    """Render campaign configuration step."""
    st.header("📢 Campaign Configuration")
    st.markdown("Configure marketing campaigns, exposures, and response patterns")

    # Initialize config if not exists
    if "campaign_config" not in st.session_state.config:
        st.session_state.config["campaign_config"] = {
            "num_campaigns": 10,
            "campaign_duration_days": {"min": 14, "max": 90},
            "channels": ["email", "social", "display"],
            "reach_percentage": 0.30,
            "response_rate_range": {"min": 0.01, "max": 0.10}
        }

    config = st.session_state.config["campaign_config"]

    # Number of campaigns
    st.subheader("Number of Campaigns")
    num_campaigns = st.slider(
        "Number of marketing campaigns to generate",
        min_value=1,
        max_value=100,
        value=config.get("num_campaigns", 10),
        key="num_campaigns"
    )
    config["num_campaigns"] = num_campaigns

    st.divider()

    # Campaign duration
    st.subheader("Campaign Duration")
    col1, col2 = st.columns(2)

    with col1:
        duration_min = st.slider(
            "Minimum duration (days)",
            min_value=7,
            max_value=180,
            value=config.get("campaign_duration_days", {}).get("min", 14),
            key="duration_min"
        )

    with col2:
        duration_max = st.slider(
            "Maximum duration (days)",
            min_value=7,
            max_value=365,
            value=config.get("campaign_duration_days", {}).get("max", 90),
            key="duration_max"
        )

    if duration_min >= duration_max:
        st.error("⚠️ Minimum duration must be less than maximum duration")

    config["campaign_duration_days"] = {"min": duration_min, "max": duration_max}

    st.divider()

    # Channels
    st.subheader("Marketing Channels")
    available_channels = ["email", "social", "display", "video", "ctv"]

    selected_channels = st.multiselect(
        "Select channels for campaign distribution",
        options=available_channels,
        default=config.get("channels", ["email", "social", "display"]),
        key="channels"
    )

    if not selected_channels:
        st.error("⚠️ At least one channel must be selected")

    config["channels"] = selected_channels

    st.divider()

    # Reach percentage
    st.subheader("Campaign Reach")
    reach_percentage = st.slider(
        "Percentage of individuals exposed to campaigns",
        min_value=0.01,
        max_value=1.0,
        value=config.get("reach_percentage", 0.30),
        step=0.01,
        format="%.2f",
        key="reach_percentage"
    )
    config["reach_percentage"] = reach_percentage

    num_individuals = st.session_state.config.get("household_config", {}).get("num_households", 10000) * 2.5
    exposed_individuals = int(num_individuals * reach_percentage)
    st.info(f"👥 Estimated exposed individuals: **{exposed_individuals:,}** ({reach_percentage*100:.0f}%)")

    st.divider()

    # Response rate range
    st.subheader("Response Rate Range")
    col1, col2 = st.columns(2)

    with col1:
        response_min = st.slider(
            "Minimum response rate",
            min_value=0.001,
            max_value=0.5,
            value=config.get("response_rate_range", {}).get("min", 0.01),
            step=0.001,
            format="%.3f",
            key="response_min"
        )

    with col2:
        response_max = st.slider(
            "Maximum response rate",
            min_value=0.001,
            max_value=0.5,
            value=config.get("response_rate_range", {}).get("max", 0.10),
            step=0.001,
            format="%.3f",
            key="response_max"
        )

    if response_min >= response_max:
        st.error("⚠️ Minimum response rate must be less than maximum response rate")

    config["response_rate_range"] = {"min": response_min, "max": response_max}

    # Estimate responses
    avg_response_rate = (response_min + response_max) / 2
    estimated_responses = int(exposed_individuals * avg_response_rate)
    st.info(f"📊 Estimated responses: **{estimated_responses:,}** (avg rate: {avg_response_rate*100:.1f}%)")

    st.divider()

    # Audience config (optional, auto-populated)
    if "audience_config" not in st.session_state.config:
        st.session_state.config["audience_config"] = {
            "segments": ["Tech Enthusiast", "Sports Fan", "News Junkie", "Entertainment Seeker", "Casual User"],
            "behavioral_thresholds": {
                "heavy_user_min_daily": 10.0,
                "moderate_user_min_daily": 2.0,
                "light_user_min_daily": 0.5
            }
        }

    # Validation and navigation
    validation_result = validate_campaign_config(config)

    if not validation_result["valid"]:
        st.error("❌ Configuration has errors:")
        for error in validation_result["errors"]:
            st.error(f"  - **{error['field']}**: {error['message']}")

    # Save and navigate
    st.session_state.config["campaign_config"] = config

    col1, col2 = st.columns(2)
    with col1:
        if st.button("⬅️ Previous", key="prev_campaign"):
            st.session_state.wizard_step -= 1
            st.rerun()
    with col2:
        if st.button("Next ➡️", disabled=not validation_result["valid"], key="next_campaign"):
            st.session_state.wizard_step += 1
            st.rerun()
