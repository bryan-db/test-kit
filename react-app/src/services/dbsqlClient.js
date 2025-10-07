/**
 * DBSQL Client Service - Backend Proxy for Databricks SQL Queries
 * Feature: 004-data-exploration-frontend
 * Task: T030
 *
 * Provides REST API wrapper for Databricks Statement Execution API 2.0
 * with connection pooling, parameterized queries, and exponential backoff retry.
 */

import axios from 'axios';

class DBSQLClient {
  constructor(databricksHost = null, databricksToken = null, warehouseId = null) {
    this.databricksHost = databricksHost || import.meta.env.VITE_DATABRICKS_HOST;
    this.databricksToken = databricksToken || import.meta.env.VITE_DATABRICKS_TOKEN;
    this.warehouseId = warehouseId || import.meta.env.VITE_DATABRICKS_WAREHOUSE_ID;

    // Validate required configuration
    if (!this.databricksToken || !this.warehouseId) {
      throw new Error(
        'Missing required Databricks configuration. Ensure ' +
        'VITE_DATABRICKS_TOKEN and VITE_DATABRICKS_WAREHOUSE_ID are set.'
      );
    }

    // Configure axios client with authentication
    // In development, use relative URLs so Vite proxy can handle CORS
    // In production, use full Databricks host URL
    const baseURL = import.meta.env.DEV
      ? '/api/2.0'  // Relative URL - proxied by Vite dev server
      : `https://${this.databricksHost}/api/2.0`;  // Full URL for production

    this.client = axios.create({
      baseURL: baseURL,
      headers: {
        'Authorization': `Bearer ${this.databricksToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 60 second timeout
    });

    console.log(`DBSQLClient initialized with baseURL: ${baseURL}`);
  }

  /**
   * Execute a SQL query with automatic retry logic
   *
   * @param {string} statement - SQL query string
   * @param {Array} parameters - Query parameters for parameterization
   * @param {number} maxRetries - Maximum retry attempts (default: 3)
   * @returns {Promise<Array>} Query results as array of objects
   */
  async executeQuery(statement, parameters = [], maxRetries = 3) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this._executeQueryInternal(statement, parameters);
      } catch (error) {
        // Check if error is retryable
        if (!this._isRetryableError(error) || attempt === maxRetries - 1) {
          throw error;
        }

        // Exponential backoff: 500ms, 1s, 2s
        const backoffMs = 500 * Math.pow(2, attempt);
        console.warn(`Query failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${backoffMs}ms...`);
        await this._sleep(backoffMs);
      }
    }
  }

  /**
   * Internal method to execute query via Statement Execution API 2.0
   */
  async _executeQueryInternal(statement, parameters) {
    const payload = {
      warehouse_id: this.warehouseId,
      statement: statement,
      parameters: parameters,
      wait_timeout: '50s', // Wait up to 50s for query completion
      disposition: 'INLINE', // Return results inline
      format: 'JSON_ARRAY' // Return as JSON array
    };

    try {
      // Submit statement
      const response = await this.client.post('/sql/statements', payload);

      const statementId = response.data.statement_id;
      const status = response.data.status.state;

      // If query completed immediately, return results
      if (status === 'SUCCEEDED') {
        return this._parseResults(response.data.result);
      }

      // If query is still running, poll for results
      if (status === 'PENDING' || status === 'RUNNING') {
        return await this._pollForResults(statementId);
      }

      // Query failed
      throw new Error(`Query failed with status: ${status}. Error: ${response.data.status.error?.message}`);

    } catch (error) {
      if (error.response) {
        // API error response
        throw new Error(`DBSQL API Error: ${error.response.status} - ${error.response.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Poll for query results when query takes longer than wait_timeout
   */
  async _pollForResults(statementId, maxPollAttempts = 30) {
    for (let attempt = 0; attempt < maxPollAttempts; attempt++) {
      await this._sleep(2000); // Poll every 2 seconds

      try {
        const statusResponse = await this.client.get(`/sql/statements/${statementId}`);
        const status = statusResponse.data.status.state;

        if (status === 'SUCCEEDED') {
          return this._parseResults(statusResponse.data.result);
        }

        if (status === 'FAILED' || status === 'CANCELED' || status === 'CLOSED') {
          throw new Error(`Query ${status.toLowerCase()}: ${statusResponse.data.status.error?.message}`);
        }

        // Continue polling if PENDING or RUNNING
      } catch (error) {
        console.error(`Error polling statement ${statementId}:`, error);
        throw error;
      }
    }

    throw new Error(`Query timeout: Statement ${statementId} did not complete within ${maxPollAttempts * 2}s`);
  }

  /**
   * Parse DBSQL results into array of objects
   */
  _parseResults(result) {
    if (!result || !result.data_array) {
      return [];
    }

    const columns = result.manifest?.schema?.columns || [];
    const rows = result.data_array || [];

    // Transform rows into objects with column names as keys
    return rows.map(row => {
      const obj = {};
      columns.forEach((col, index) => {
        obj[col.name] = row[index];
      });
      return obj;
    });
  }

  /**
   * Determine if an error should trigger a retry
   */
  _isRetryableError(error) {
    if (!error.response) {
      // Network errors are retryable
      return error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT';
    }

    const status = error.response.status;
    // Retry on 503 (Service Unavailable) and 429 (Too Many Requests)
    return status === 503 || status === 429;
  }

  /**
   * Sleep utility for backoff
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cancel a running query
   */
  async cancelQuery(statementId) {
    try {
      await this.client.post(`/sql/statements/${statementId}/cancel`);
      return true;
    } catch (error) {
      console.error(`Failed to cancel statement ${statementId}:`, error);
      return false;
    }
  }
}

// Singleton instance for reuse across components
let dbsqlClientInstance = null;

export function getDBSQLClient() {
  if (!dbsqlClientInstance) {
    dbsqlClientInstance = new DBSQLClient();
  }
  return dbsqlClientInstance;
}

export default DBSQLClient;
