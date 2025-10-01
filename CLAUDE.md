# test-kit Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-10-01

## Active Technologies
- Python 3.11+ (Databricks Runtime 14.3 LTS or higher) + Databricks SDK, Faker (synthetic data generation), PySpark, Dash/Streamlit (Databricks Apps frontend), databricks-connec (001-create-a-databricks)
- JavaScript ES6+ (React 18.x, Node.js 18+) + React, Material-UI (MUI) v5, React Router, Databricks SDK for JavaScript, Vite (build tool) (002-react-js-version)
- Browser localStorage for configuration persistence, Unity Catalog (Delta Lake) for generated datasets via Feature 001 backend (002-react-js-version)

## Project Structure
```
src/
tests/
```

## Commands
cd src [ONLY COMMANDS FOR ACTIVE TECHNOLOGIES][ONLY COMMANDS FOR ACTIVE TECHNOLOGIES] pytest [ONLY COMMANDS FOR ACTIVE TECHNOLOGIES][ONLY COMMANDS FOR ACTIVE TECHNOLOGIES] ruff check .

## Code Style
Python 3.11+ (Databricks Runtime 14.3 LTS or higher): Follow standard conventions

## Recent Changes
- 002-react-js-version: Added JavaScript ES6+ (React 18.x, Node.js 18+) + React, Material-UI (MUI) v5, React Router, Databricks SDK for JavaScript, Vite (build tool)
- 001-create-a-databricks: Added Python 3.11+ (Databricks Runtime 14.3 LTS or higher) + Databricks SDK, Faker (synthetic data generation), PySpark, Dash/Streamlit (Databricks Apps frontend), databricks-connec

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
