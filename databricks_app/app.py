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
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');

        /* Material Design 3 Custom Theme */
        .stApp {{
            background: linear-gradient(135deg, {MD3_COLORS['background']} 0%, #F5F5F5 100%);
            color: {MD3_COLORS['on_background']};
            font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }}

        /* Material Design 3 Typography Scale */
        h1 {{
            font-family: 'Roboto', sans-serif;
            font-size: 57px;
            font-weight: 400;
            line-height: 64px;
            letter-spacing: -0.25px;
            color: {MD3_COLORS['on_background']};
            margin-bottom: 16px;
        }}

        h2 {{
            font-family: 'Roboto', sans-serif;
            font-size: 45px;
            font-weight: 400;
            line-height: 52px;
            color: {MD3_COLORS['on_background']};
            margin-bottom: 12px;
        }}

        h3 {{
            font-family: 'Roboto', sans-serif;
            font-size: 36px;
            font-weight: 400;
            line-height: 44px;
            color: {MD3_COLORS['on_background']};
            margin-bottom: 8px;
        }}

        /* Material Design 3 Elevated Buttons */
        .stButton > button {{
            background-color: {MD3_COLORS['primary']};
            color: {MD3_COLORS['on_primary']};
            border-radius: 100px;
            border: none;
            padding: 10px 24px;
            font-weight: 500;
            font-size: 14px;
            line-height: 20px;
            letter-spacing: 0.1px;
            box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.3),
                        0px 1px 3px 1px rgba(0, 0, 0, 0.15);
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            text-transform: none;
        }}

        .stButton > button:hover {{
            background-color: {MD3_COLORS['primary']};
            box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.3),
                        0px 2px 6px 2px rgba(0, 0, 0, 0.15);
            transform: translateY(-1px);
        }}

        .stButton > button:active {{
            box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.3),
                        0px 1px 3px 1px rgba(0, 0, 0, 0.15);
            transform: translateY(0);
        }}

        /* Filled Text Fields */
        .stTextInput > div > div > input,
        .stNumberInput > div > div > input,
        .stSelectbox > div > div > select {{
            background-color: {MD3_COLORS['surface_variant']};
            border: none;
            border-bottom: 1px solid {MD3_COLORS['outline']};
            border-radius: 4px 4px 0 0;
            padding: 16px 12px 8px;
            color: {MD3_COLORS['on_surface']};
            font-size: 16px;
            transition: all 0.2s ease;
        }}

        .stTextInput > div > div > input:focus,
        .stNumberInput > div > div > input:focus,
        .stSelectbox > div > div > select:focus {{
            border-bottom: 2px solid {MD3_COLORS['primary']};
            background-color: {MD3_COLORS['surface_variant']};
            outline: none;
        }}

        /* Material Design 3 Sliders */
        .stSlider > div > div > div > div {{
            background-color: {MD3_COLORS['primary']};
        }}

        .stSlider [role="slider"] {{
            background-color: {MD3_COLORS['primary']};
            box-shadow: 0px 1px 3px 0px rgba(0, 0, 0, 0.4);
        }}

        /* Material Design 3 Cards with Elevation */
        [data-testid="stVerticalBlock"] > [style*="flex-direction: column"] > [data-testid="stVerticalBlock"] {{
            background-color: {MD3_COLORS['surface']};
            border-radius: 12px;
            padding: 24px;
            margin: 8px 0;
            box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.3),
                        0px 1px 3px 1px rgba(0, 0, 0, 0.15);
            transition: box-shadow 0.2s ease;
        }}

        /* Progress Indicator */
        .stProgress > div > div > div > div {{
            background-color: {MD3_COLORS['primary']};
            border-radius: 4px;
        }}

        .stProgress > div > div > div {{
            background-color: {MD3_COLORS['surface_variant']};
            border-radius: 4px;
        }}

        /* Alert/Message Components */
        .stSuccess {{
            background-color: {MD3_COLORS['tertiary_container']} !important;
            color: {MD3_COLORS['on_tertiary_container']} !important;
            border-radius: 12px;
            border: none;
            padding: 16px;
            box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.3),
                        0px 1px 3px 1px rgba(0, 0, 0, 0.15);
        }}

        .stError {{
            background-color: {MD3_COLORS['error_container']} !important;
            color: {MD3_COLORS['on_error_container']} !important;
            border-radius: 12px;
            border: none;
            padding: 16px;
            box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.3),
                        0px 1px 3px 1px rgba(0, 0, 0, 0.15);
        }}

        .stInfo {{
            background-color: {MD3_COLORS['primary_container']} !important;
            color: {MD3_COLORS['on_primary_container']} !important;
            border-radius: 12px;
            border: none;
            padding: 16px;
            box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.3),
                        0px 1px 3px 1px rgba(0, 0, 0, 0.15);
        }}

        .stWarning {{
            background-color: #FFF4E5 !important;
            color: #6B4C00 !important;
            border-radius: 12px;
            border: none;
            padding: 16px;
            box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.3),
                        0px 1px 3px 1px rgba(0, 0, 0, 0.15);
        }}

        /* Divider */
        hr {{
            border: none;
            border-top: 1px solid {MD3_COLORS['outline']};
            margin: 24px 0;
        }}

        /* Multiselect */
        .stMultiSelect > div > div {{
            background-color: {MD3_COLORS['surface_variant']};
            border-radius: 4px;
            border: 1px solid {MD3_COLORS['outline']};
        }}

        /* Radio buttons */
        .stRadio > div {{
            gap: 8px;
        }}

        .stRadio > div > label {{
            background-color: {MD3_COLORS['surface_variant']};
            padding: 12px 16px;
            border-radius: 8px;
            transition: all 0.2s ease;
        }}

        .stRadio > div > label:hover {{
            background-color: {MD3_COLORS['primary_container']};
        }}

        /* Checkbox */
        .stCheckbox {{
            padding: 8px;
        }}

        /* Selectbox dropdown */
        [data-baseweb="select"] {{
            border-radius: 4px;
        }}

        /* Custom scrollbar */
        ::-webkit-scrollbar {{
            width: 8px;
            height: 8px;
        }}

        ::-webkit-scrollbar-track {{
            background: {MD3_COLORS['surface_variant']};
            border-radius: 4px;
        }}

        ::-webkit-scrollbar-thumb {{
            background: {MD3_COLORS['outline']};
            border-radius: 4px;
        }}

        ::-webkit-scrollbar-thumb:hover {{
            background: {MD3_COLORS['primary']};
        }}

        /* Animated transitions */
        * {{
            transition: background-color 0.2s ease, box-shadow 0.2s ease;
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

    # Material Design 3 progress bar
    st.progress(progress)

    # Material Design 3 step indicator with cards
    st.markdown(
        """
        <style>
        .step-indicator {
            display: flex;
            justify-content: space-between;
            gap: 8px;
            margin: 16px 0;
        }
        .step-card {
            flex: 1;
            padding: 12px;
            border-radius: 12px;
            text-align: center;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.3s ease;
        }
        .step-completed {
            background-color: #EADDFF;
            color: #21005D;
            box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.3);
        }
        .step-active {
            background-color: #6750A4;
            color: #FFFFFF;
            box-shadow: 0px 1px 3px 0px rgba(0, 0, 0, 0.4),
                        0px 2px 6px 2px rgba(0, 0, 0, 0.15);
        }
        .step-pending {
            background-color: #F5F5F5;
            color: #6B6B6B;
        }
        </style>
        """,
        unsafe_allow_html=True
    )

    # Step cards
    cols = st.columns(len(steps))
    for idx, (col, step_name) in enumerate(zip(cols, steps)):
        with col:
            if idx < current_step:
                st.markdown(
                    f'<div class="step-card step-completed">✓ {step_name}</div>',
                    unsafe_allow_html=True
                )
            elif idx == current_step:
                st.markdown(
                    f'<div class="step-card step-active">{step_name}</div>',
                    unsafe_allow_html=True
                )
            else:
                st.markdown(
                    f'<div class="step-card step-pending">{step_name}</div>',
                    unsafe_allow_html=True
                )


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
        from src.wizard.household_config import render_household_config
        render_household_config()

    elif current_step == 1:
        from src.wizard.demographics_config import render_demographics_config
        render_demographics_config()

    elif current_step == 2:
        from src.wizard.engagement_config import render_engagement_config
        render_engagement_config()

    elif current_step == 3:
        from src.wizard.campaign_config import render_campaign_config
        render_campaign_config()

    elif current_step == 4:
        from src.wizard.review_submit import render_review_submit
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
