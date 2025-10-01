"""
Streamlit app entry point for Synthetic Identity Graph Generator.

This Databricks App provides a multi-step wizard interface for configuring
and generating synthetic identity graph datasets.

Material Design 3 styling: https://m3.material.io/
"""

import streamlit as st
import json
from typing import Dict, Any, Optional
from datetime import datetime

# Material Design 3 color tokens
MD3_COLORS = {
    "primary": "#6750A4",
    "on_primary": "#FFFFFF",
    "primary_container": "#EADDFF",
    "on_primary_container": "#21005D",
    "secondary": "#625B71",
    "on_secondary": "#FFFFFF",
    "secondary_container": "#E8DEF8",
    "on_secondary_container": "#1D192B",
    "tertiary": "#7D5260",
    "on_tertiary": "#FFFFFF",
    "tertiary_container": "#FFD8E4",
    "on_tertiary_container": "#31111D",
    "error": "#BA1A1A",
    "on_error": "#FFFFFF",
    "error_container": "#FFDAD6",
    "on_error_container": "#410002",
    "background": "#FFFBFE",
    "on_background": "#1C1B1F",
    "surface": "#FFFBFE",
    "on_surface": "#1C1B1F",
    "surface_variant": "#E7E0EC",
    "on_surface_variant": "#49454F",
    "outline": "#79747E",
}


def apply_md3_styling():
    """Apply Material Design 3 styling to Streamlit app."""
    st.markdown(
        f"""
        <style>
        /* Material Design 3 Custom Theme */
        .stApp {{
            background-color: {MD3_COLORS['background']};
            color: {MD3_COLORS['on_background']};
        }}

        /* Headers */
        h1, h2, h3 {{
            color: {MD3_COLORS['on_background']};
            font-family: 'Roboto', sans-serif;
        }}

        /* Primary buttons */
        .stButton > button {{
            background-color: {MD3_COLORS['primary']};
            color: {MD3_COLORS['on_primary']};
            border-radius: 20px;
            border: none;
            padding: 10px 24px;
            font-weight: 500;
            transition: all 0.3s;
        }}

        .stButton > button:hover {{
            background-color: {MD3_COLORS['primary_container']};
            color: {MD3_COLORS['on_primary_container']};
            box-shadow: 0 1px 2px 0 rgba(0,0,0,0.3), 0 1px 3px 1px rgba(0,0,0,0.15);
        }}

        /* Secondary buttons */
        .stButton > button[kind="secondary"] {{
            background-color: {MD3_COLORS['secondary_container']};
            color: {MD3_COLORS['on_secondary_container']};
        }}

        /* Input fields */
        .stTextInput > div > div > input,
        .stNumberInput > div > div > input,
        .stSelectbox > div > div > select {{
            border: 1px solid {MD3_COLORS['outline']};
            border-radius: 4px;
            background-color: {MD3_COLORS['surface']};
            color: {MD3_COLORS['on_surface']};
        }}

        /* Sliders */
        .stSlider > div > div > div > div {{
            background-color: {MD3_COLORS['primary']};
        }}

        /* Cards */
        .stContainer {{
            background-color: {MD3_COLORS['surface']};
            border-radius: 12px;
            padding: 16px;
            box-shadow: 0 1px 2px 0 rgba(0,0,0,0.3), 0 1px 3px 1px rgba(0,0,0,0.15);
        }}

        /* Progress bar */
        .stProgress > div > div > div > div {{
            background-color: {MD3_COLORS['primary']};
        }}

        /* Success messages */
        .stSuccess {{
            background-color: {MD3_COLORS['tertiary_container']};
            color: {MD3_COLORS['on_tertiary_container']};
            border-radius: 12px;
        }}

        /* Error messages */
        .stError {{
            background-color: {MD3_COLORS['error_container']};
            color: {MD3_COLORS['on_error_container']};
            border-radius: 12px;
        }}

        /* Info messages */
        .stInfo {{
            background-color: {MD3_COLORS['primary_container']};
            color: {MD3_COLORS['on_primary_container']};
            border-radius: 12px;
        }}
        </style>
        """,
        unsafe_allow_html=True,
    )


def initialize_session_state():
    """Initialize Streamlit session state with default values."""
    if "wizard_step" not in st.session_state:
        st.session_state.wizard_step = 0

    if "config" not in st.session_state:
        st.session_state.config = {}

    if "session_id" not in st.session_state:
        import uuid
        st.session_state.session_id = str(uuid.uuid4())

    if "job_id" not in st.session_state:
        st.session_state.job_id = None

    if "job_status" not in st.session_state:
        st.session_state.job_status = None


def load_checkpoint() -> Optional[Dict[str, Any]]:
    """Load wizard checkpoint from Unity Catalog Volumes if exists.

    Returns:
        Checkpoint data or None if no checkpoint exists
    """
    try:
        # TODO: Implement volume checkpoint loading
        # volume_path = f"/Volumes/bryan_li/synthetic_data/wizard_checkpoints/{st.session_state.session_id}.json"
        # if dbutils.fs.ls(volume_path):
        #     content = dbutils.fs.head(volume_path)
        #     return json.loads(content)
        return None
    except Exception:
        return None


def save_checkpoint():
    """Save wizard checkpoint to Unity Catalog Volumes."""
    try:
        # TODO: Implement volume checkpoint saving
        # volume_path = f"/Volumes/bryan_li/synthetic_data/wizard_checkpoints/{st.session_state.session_id}.json"
        # checkpoint_data = {
        #     "session_id": st.session_state.session_id,
        #     "wizard_step": st.session_state.wizard_step,
        #     "config": st.session_state.config,
        #     "timestamp": datetime.now().isoformat()
        # }
        # dbutils.fs.put(volume_path, json.dumps(checkpoint_data, indent=2))
        pass
    except Exception as e:
        st.warning(f"Failed to save checkpoint: {e}")


def render_progress_indicator():
    """Render Material Design 3 style progress indicator."""
    steps = [
        "Households",
        "Demographics",
        "Engagement",
        "Campaign",
        "Review & Generate"
    ]

    current_step = st.session_state.wizard_step
    progress = (current_step + 1) / len(steps)

    st.progress(progress)

    # Step indicator
    cols = st.columns(len(steps))
    for idx, (col, step_name) in enumerate(zip(cols, steps)):
        with col:
            if idx < current_step:
                st.markdown(f"✅ **{step_name}**")
            elif idx == current_step:
                st.markdown(f"🔵 **{step_name}**")
            else:
                st.markdown(f"⚪ {step_name}")


def next_step():
    """Navigate to next wizard step."""
    st.session_state.wizard_step += 1
    save_checkpoint()


def previous_step():
    """Navigate to previous wizard step."""
    if st.session_state.wizard_step > 0:
        st.session_state.wizard_step -= 1
        save_checkpoint()


def main():
    """Main Streamlit app entry point."""
    # Page configuration
    st.set_page_config(
        page_title="Synthetic Identity Graph Generator",
        page_icon="🔮",
        layout="wide",
        initial_sidebar_state="collapsed"
    )

    # Apply Material Design 3 styling
    apply_md3_styling()

    # Initialize session state
    initialize_session_state()

    # Load checkpoint if exists
    checkpoint = load_checkpoint()
    if checkpoint and "config" in checkpoint:
        st.session_state.config = checkpoint["config"]
        st.session_state.wizard_step = checkpoint.get("wizard_step", 0)

    # Header
    st.title("🔮 Synthetic Identity Graph Generator")
    st.markdown("Generate realistic synthetic consumer data for analytics and testing")

    st.divider()

    # Progress indicator
    render_progress_indicator()

    st.divider()

    # Route to appropriate wizard step
    current_step = st.session_state.wizard_step

    if current_step == 0:
        from databricks_app.src.wizard.household_config import render_household_config
        render_household_config()

    elif current_step == 1:
        from databricks_app.src.wizard.demographics_config import render_demographics_config
        render_demographics_config()

    elif current_step == 2:
        from databricks_app.src.wizard.engagement_config import render_engagement_config
        render_engagement_config()

    elif current_step == 3:
        from databricks_app.src.wizard.campaign_config import render_campaign_config
        render_campaign_config()

    elif current_step == 4:
        from databricks_app.src.wizard.review_submit import render_review_submit
        render_review_submit()

    # Navigation footer
    st.divider()
    if current_step < 4:
        col1, col2 = st.columns(2)
        with col1:
            if current_step > 0:
                st.button("⬅️ Previous", on_click=previous_step, key="prev_nav")
        with col2:
            # Next button will be in individual step components
            pass


if __name__ == "__main__":
    main()
