"""Household configuration wizard step."""

import streamlit as st
from databricks_app.src.wizard.validation import validate_household_config


def render_household_config():
    """Render household configuration step."""
    st.header("🏠 Household Configuration")
    st.markdown("Configure the number and characteristics of synthetic households")

    # Initialize config if not exists
    if "household_config" not in st.session_state.config:
        st.session_state.config["household_config"] = {
            "num_households": 10000,
            "size_distribution": {"mean": 2.5, "std_dev": 1.2},
            "income_brackets": {
                "<30K": 0.20,
                "30-60K": 0.30,
                "60-100K": 0.25,
                "100-150K": 0.15,
                "150K+": 0.10
            }
        }

    config = st.session_state.config["household_config"]

    # Number of households (log scale)
    st.subheader("Number of Households")
    num_households = st.select_slider(
        "Select number of households to generate",
        options=[1_000, 5_000, 10_000, 50_000, 100_000, 500_000, 1_000_000, 5_000_000, 10_000_000],
        value=config.get("num_households", 10_000),
        format_func=lambda x: f"{x:,}",
        key="num_households"
    )
    config["num_households"] = num_households

    st.info(f"📊 Estimated individuals (at 2.5 avg): **{int(num_households * 2.5):,}**")

    st.divider()

    # Household size distribution
    st.subheader("Household Size Distribution")
    col1, col2 = st.columns(2)

    with col1:
        size_mean = st.slider(
            "Average household size",
            min_value=1.0,
            max_value=6.0,
            value=config.get("size_distribution", {}).get("mean", 2.5),
            step=0.1,
            key="size_mean"
        )

    with col2:
        size_std = st.slider(
            "Standard deviation",
            min_value=0.5,
            max_value=2.0,
            value=config.get("size_distribution", {}).get("std_dev", 1.2),
            step=0.1,
            key="size_std"
        )

    config["size_distribution"] = {"mean": size_mean, "std_dev": size_std}

    st.divider()

    # Income bracket distribution
    st.subheader("Income Bracket Distribution")
    st.markdown("Adjust the distribution of household income brackets (must sum to 1.0)")

    brackets = ["<30K", "30-60K", "60-100K", "100-150K", "150K+"]
    income_config = config.get("income_brackets", {})

    # Create sliders for each bracket
    income_values = {}
    for bracket in brackets:
        income_values[bracket] = st.slider(
            f"**{bracket}** income bracket",
            min_value=0.0,
            max_value=1.0,
            value=income_config.get(bracket, 0.2),
            step=0.01,
            key=f"income_{bracket}"
        )

    # Check if sum equals 1.0
    total = sum(income_values.values())
    if abs(total - 1.0) > 0.01:
        st.warning(f"⚠️ Income brackets sum to {total:.2f}, but must equal 1.0")
    else:
        st.success(f"✅ Income brackets sum to {total:.2f}")

    config["income_brackets"] = income_values

    st.divider()

    # Validation and navigation
    validation_result = validate_household_config(config)

    if not validation_result["valid"]:
        st.error("❌ Configuration has errors:")
        for error in validation_result["errors"]:
            st.error(f"  - **{error['field']}**: {error['message']}")

    # Save and navigate
    st.session_state.config["household_config"] = config

    if st.button("Next ➡️", disabled=not validation_result["valid"], key="next_household"):
        st.session_state.wizard_step += 1
        st.rerun()
