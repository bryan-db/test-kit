"""Review and submit wizard step."""

import streamlit as st
import json
import random
from typing import Dict, Any, Optional
from databricks.sdk import WorkspaceClient
from databricks.sdk.service import jobs


def render_review_submit():
    """Render review and submit step with job submission."""
    st.header("📋 Review & Generate Dataset")
    st.markdown("Review your configuration and submit the generation job")

    # Configuration summary
    st.subheader("Configuration Summary")

    config = st.session_state.config

    # Display configuration in expandable sections
    with st.expander("🏠 Household Configuration", expanded=False):
        household_config = config.get("household_config", {})
        st.json(household_config)

    with st.expander("👥 Demographics Configuration", expanded=False):
        demographics_config = config.get("demographics_config", {})
        st.json(demographics_config)

    with st.expander("📊 Engagement Configuration", expanded=False):
        engagement_config = config.get("engagement_config", {})
        st.json(engagement_config)

    with st.expander("📢 Campaign Configuration", expanded=False):
        campaign_config = config.get("campaign_config", {})
        st.json(campaign_config)

    st.divider()

    # Generation settings
    st.subheader("Generation Settings")

    col1, col2 = st.columns(2)

    with col1:
        # Random seed input
        use_random_seed = st.checkbox("Use random seed", value=True, key="use_random_seed")
        if use_random_seed:
            seed = random.randint(0, 2147483647)
            st.info(f"🎲 Random seed: {seed}")
        else:
            seed = st.number_input(
                "Seed value (for reproducibility)",
                min_value=0,
                max_value=2147483647,
                value=42,
                key="seed_input"
            )

    with col2:
        # Catalog and schema inputs
        catalog_name = st.text_input(
            "Unity Catalog name",
            value="bryan_li",
            key="catalog_name"
        )
        schema_name = st.text_input(
            "Schema name",
            value="synthetic_data",
            key="schema_name"
        )

    st.divider()

    # Estimated output
    st.subheader("Estimated Output")

    num_households = config.get("household_config", {}).get("num_households", 0)
    num_individuals = int(num_households * 2.5)
    num_identifiers = num_individuals * config.get("demographics_config", {}).get("identity_mappings", {}).get("identifiers_per_person", {}).get("mean", 4)
    events_per_person = config.get("engagement_config", {}).get("events_per_person", {}).get("mean", 50)
    num_events = num_individuals * events_per_person
    num_campaigns = config.get("campaign_config", {}).get("num_campaigns", 10)

    metrics_col1, metrics_col2, metrics_col3 = st.columns(3)

    with metrics_col1:
        st.metric("Households", f"{num_households:,}")
        st.metric("Individuals", f"{num_individuals:,}")
        st.metric("Identity Mappings", f"{int(num_identifiers):,}")

    with metrics_col2:
        st.metric("Content Engagements", f"{int(num_events):,}")
        st.metric("Campaigns", f"{num_campaigns:,}")

    with metrics_col3:
        # Estimate generation time
        if num_households < 50_000:
            time_estimate = "< 2 minutes"
        elif num_households < 100_000:
            time_estimate = "2-4 minutes"
        elif num_households < 500_000:
            time_estimate = "3-4 minutes"
        else:
            time_estimate = "4-5 minutes"

        st.metric("Estimated Time", time_estimate)

    st.divider()

    # Permission check and job submission
    st.subheader("Generate Dataset")

    # Check if job is already running
    if st.session_state.get("job_id") and st.session_state.get("job_status") == "running":
        st.info("🔄 Job is currently running. Check progress below.")
        display_job_progress()
    else:
        # Generate button
        if st.button("🚀 Generate Dataset", type="primary", key="generate_button"):
            submit_generation_job(
                config=config,
                seed=seed,
                catalog_name=catalog_name,
                schema_name=schema_name
            )

    # Navigation
    st.divider()
    col1, col2 = st.columns(2)
    with col1:
        if st.button("⬅️ Previous", key="prev_review"):
            st.session_state.wizard_step -= 1
            st.rerun()


def submit_generation_job(
    config: Dict[str, Any],
    seed: int,
    catalog_name: str,
    schema_name: str
) -> None:
    """Submit Databricks job with generation notebook.

    Args:
        config: Complete wizard configuration
        seed: Random seed for generation
        catalog_name: Target Unity Catalog
        schema_name: Target schema
    """
    try:
        # Step 1: Check permissions
        st.info("🔐 Checking Unity Catalog permissions...")

        from databricks_app.src.utils.auth import verify_catalog_permissions

        has_perms, missing = verify_catalog_permissions(
            catalog_name=catalog_name,
            schema_name=schema_name,
            user_principal=None  # Will use current user
        )

        if not has_perms:
            from databricks_app.src.utils.auth import format_permission_error

            error_msg = format_permission_error(
                catalog_name=catalog_name,
                schema_name=schema_name,
                user_principal="current_user",
                missing_privileges=missing
            )
            st.error(error_msg)
            return

        st.success("✅ Permissions verified")

        # Step 2: Prepare job configuration
        st.info("📦 Preparing job configuration...")

        generation_config = {
            "seed": seed,
            "catalog_name": catalog_name,
            "schema_name": schema_name,
            "household_config": config.get("household_config", {}),
            "demographics_config": config.get("demographics_config", {}),
            "engagement_config": config.get("engagement_config", {}),
            "audience_config": config.get("audience_config", {
                "segments": ["Tech Enthusiast", "Sports Fan", "News Junkie", "Entertainment Seeker", "Casual User"],
                "behavioral_thresholds": {
                    "heavy_user_min_daily": 10.0,
                    "moderate_user_min_daily": 2.0,
                    "light_user_min_daily": 0.5
                }
            }),
            "campaign_config": config.get("campaign_config", {})
        }

        config_json = json.dumps(generation_config)

        # Step 3: Submit job to Databricks
        st.info("🚀 Submitting job to Databricks...")

        w = WorkspaceClient()

        # Note: In production, you would upload the notebook to workspace first
        # For now, we'll create a job with the notebook path
        notebook_path = "/Workspace/Users/bryan.li@databricks.com/test-kit/databricks_app/generation_notebook"

        job_run = w.jobs.submit(
            run_name=f"synthetic-data-gen-{seed}",
            tasks=[
                jobs.SubmitTask(
                    task_key="generate_data",
                    notebook_task=jobs.NotebookTask(
                        notebook_path=notebook_path,
                        base_parameters={"config_json": config_json}
                    ),
                    new_cluster=jobs.ClusterSpec(
                        spark_version="14.3.x-scala2.12",
                        node_type_id="m5.4xlarge",
                        num_workers=8,
                        spark_conf={
                            "spark.databricks.delta.optimizeWrite.enabled": "true",
                            "spark.databricks.delta.autoCompact.enabled": "true",
                            "spark.sql.adaptive.enabled": "true",
                            "spark.databricks.photon.enabled": "true"
                        }
                    )
                )
            ]
        )

        # Store job ID in session state
        st.session_state.job_id = str(job_run.run_id)
        st.session_state.job_status = "running"

        st.success(f"✅ Job submitted successfully! Run ID: {job_run.run_id}")
        st.info("🔄 Job is now running. Refresh the page to see progress.")

        # Display job link
        workspace_url = w.config.host
        job_url = f"{workspace_url}/#job/{job_run.run_id}"
        st.markdown(f"[View job in Databricks workspace]({job_url})")

        st.rerun()

    except Exception as e:
        st.error(f"❌ Failed to submit job: {str(e)}")
        import traceback
        with st.expander("Error details"):
            st.code(traceback.format_exc())


def display_job_progress():
    """Display job progress with polling."""
    from databricks_app.src.utils.progress import poll_job_status, format_status_message, format_duration

    job_id = st.session_state.get("job_id")

    if not job_id:
        st.warning("No job ID found")
        return

    try:
        status = poll_job_status(job_id)

        # Display status message
        st.markdown(format_status_message(status))

        # Display progress bar
        st.progress(status.percent_complete / 100.0)

        # Display timing info
        if status.execution_duration:
            st.info(f"⏱️ Duration: {format_duration(status.execution_duration)}")

        # Update session state
        if status.is_successful:
            st.session_state.job_status = "completed"
            st.success("🎉 Dataset generation completed successfully!")
            st.balloons()
        elif status.is_failed:
            st.session_state.job_status = "failed"
            st.error(f"Generation failed: {status.state_message}")
        elif status.is_cancelled:
            st.session_state.job_status = "cancelled"
            st.warning("Job was cancelled")

        # Auto-refresh every 5 seconds if still running
        if status.is_running:
            import time
            time.sleep(5)
            st.rerun()

    except Exception as e:
        st.error(f"Failed to poll job status: {str(e)}")
