"""Demographics configuration wizard step."""

import streamlit as st
from src.wizard.validation import validate_demographics_config


def auto_adjust_distribution(categories, config_dict, prev_key, slider_key_prefix):
    """Auto-adjust distribution sliders to maintain sum of 1.0.

    Args:
        categories: List of category names
        config_dict: Current config dictionary
        prev_key: Session state key for previous values
        slider_key_prefix: Prefix for slider keys

    Returns:
        Dictionary of adjusted values
    """
    # Initialize previous values in session state if not exists
    if prev_key not in st.session_state:
        st.session_state[prev_key] = config_dict.copy()

    # Create sliders and collect values
    values = {}
    for category in categories:
        values[category] = st.slider(
            f"**{category}**",
            min_value=0.0,
            max_value=1.0,
            value=config_dict.get(category, 1.0 / len(categories)),
            step=0.01,
            key=f"{slider_key_prefix}_{category}"
        )

    # Detect which slider changed
    changed_category = None
    for category in categories:
        if abs(values[category] - st.session_state[prev_key].get(category, 1.0 / len(categories))) > 0.001:
            changed_category = category
            break

    # Auto-adjust other sliders to maintain sum of 1.0
    if changed_category:
        other_categories = [c for c in categories if c != changed_category]
        old_total_others = sum(st.session_state[prev_key].get(c, 1.0 / len(categories)) for c in other_categories)
        new_total_others = 1.0 - values[changed_category]

        if old_total_others > 0 and new_total_others >= 0:
            # Proportionally redistribute
            for category in other_categories:
                old_value = st.session_state[prev_key].get(category, 1.0 / len(categories))
                proportion = old_value / old_total_others if old_total_others > 0 else 1.0 / len(other_categories)
                values[category] = round(new_total_others * proportion, 2)

        # Update previous values
        st.session_state[prev_key] = values.copy()

    return values


def render_demographics_config():
    """Render demographics configuration step."""
    st.header("👥 Demographics Configuration")
    st.markdown("Configure individual demographics and identity mappings")

    # Initialize config if not exists
    if "demographics_config" not in st.session_state.config:
        st.session_state.config["demographics_config"] = {
            "age_range": {"min": 18, "max": 85},
            "gender_distribution": {
                "Male": 0.48,
                "Female": 0.48,
                "Non-Binary": 0.03,
                "Prefer not to say": 0.01
            },
            "education_distribution": {
                "High School": 0.30,
                "Some College": 0.20,
                "Bachelor": 0.30,
                "Master": 0.15,
                "Doctorate": 0.05
            },
            "identity_mappings": {
                "identifiers_per_person": {"mean": 4},
                "identifier_type_distribution": {
                    "email_hash": 0.6,
                    "cookie_id": 0.9,
                    "mobile_ad_id": 0.8,
                    "device_id": 0.7,
                    "ctv_id": 0.4,
                    "hashed_phone": 0.3
                }
            }
        }

    config = st.session_state.config["demographics_config"]

    # Age range
    st.subheader("Age Range")
    col1, col2 = st.columns(2)

    with col1:
        age_min = st.slider(
            "Minimum age",
            min_value=18,
            max_value=100,
            value=config.get("age_range", {}).get("min", 18),
            key="age_min"
        )

    with col2:
        age_max = st.slider(
            "Maximum age",
            min_value=18,
            max_value=100,
            value=config.get("age_range", {}).get("max", 85),
            key="age_max"
        )

    if age_min >= age_max:
        st.error("⚠️ Minimum age must be less than maximum age")

    config["age_range"] = {"min": age_min, "max": age_max}

    st.divider()

    # Gender distribution
    st.subheader("Gender Distribution")
    st.markdown("Adjust gender distribution (automatically adjusts others to maintain 1.0 sum)")

    genders = ["Male", "Female", "Non-Binary", "Prefer not to say"]
    gender_config = config.get("gender_distribution", {})

    gender_values = auto_adjust_distribution(
        genders, gender_config, "prev_gender_dist", "gender"
    )

    total_gender = sum(gender_values.values())
    st.success(f"✅ Gender distribution sums to {total_gender:.2f}")

    config["gender_distribution"] = gender_values

    st.divider()

    # Education distribution
    st.subheader("Education Distribution")
    st.markdown("Adjust education distribution (automatically adjusts others to maintain 1.0 sum)")

    education_levels = ["High School", "Some College", "Bachelor", "Master", "Doctorate"]
    education_config = config.get("education_distribution", {})

    education_values = auto_adjust_distribution(
        education_levels, education_config, "prev_education_dist", "education"
    )

    total_education = sum(education_values.values())
    st.success(f"✅ Education distribution sums to {total_education:.2f}")

    config["education_distribution"] = education_values

    st.divider()

    # Identity mappings
    st.subheader("Cross-Device Identity Mappings")

    identifiers_mean = st.slider(
        "Average identifiers per person",
        min_value=2,
        max_value=15,
        value=config.get("identity_mappings", {}).get("identifiers_per_person", {}).get("mean", 4),
        key="identifiers_mean"
    )

    config["identity_mappings"] = {
        "identifiers_per_person": {"mean": identifiers_mean},
        "identifier_type_distribution": {
            "email_hash": 0.6,
            "cookie_id": 0.9,
            "mobile_ad_id": 0.8,
            "device_id": 0.7,
            "ctv_id": 0.4,
            "hashed_phone": 0.3
        }
    }

    st.info(f"📱 ~{identifiers_mean} identifiers per person (email, cookies, mobile IDs, etc.)")

    st.divider()

    # Validation and navigation
    validation_result = validate_demographics_config(config)

    if not validation_result["valid"]:
        st.error("❌ Configuration has errors:")
        for error in validation_result["errors"]:
            st.error(f"  - **{error['field']}**: {error['message']}")

    # Save and navigate
    st.session_state.config["demographics_config"] = config

    col1, col2 = st.columns(2)
    with col1:
        if st.button("⬅️ Previous", key="prev_demographics"):
            st.session_state.wizard_step -= 1
            st.rerun()
    with col2:
        if st.button("Next ➡️", disabled=not validation_result["valid"], key="next_demographics"):
            st.session_state.wizard_step += 1
            st.rerun()
