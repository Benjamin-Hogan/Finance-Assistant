import axios from "axios";

class ApiService {
  constructor() {
    this.baseUrl = "http://127.0.0.1:5002/api";
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  // Error handling helper
  async handleRequest(request) {
    try {
      const response = await request();
      return response.data;
    } catch (error) {
      console.error("API request failed:", error);
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
        throw new Error(error.response.data.message || "Server error");
      } else if (error.request) {
        // The request was made but no response was received
        console.error("No response received:", error.request);
        throw new Error(
          "No response from server. Please check your connection."
        );
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Request error:", error.message);
        throw new Error("Request failed: " + error.message);
      }
    }
  }

  // Accounts
  async getAccounts() {
    return this.handleRequest(() => this.client.get("/accounts"));
  }

  async getAccount(id) {
    return this.handleRequest(() => this.client.get(`/accounts/${id}`));
  }

  async createAccount(accountData) {
    return this.handleRequest(() => this.client.post("/accounts", accountData));
  }

  async updateAccount(id, accountData) {
    return this.handleRequest(() =>
      this.client.put(`/accounts/${id}`, accountData)
    );
  }

  async deleteAccount(id) {
    return this.handleRequest(() => this.client.delete(`/accounts/${id}`));
  }

  async getNetWorth() {
    try {
      const response = await this.client.get("/accounts/net-worth");
      return response.data;
    } catch (error) {
      console.error("Error fetching net worth:", error);
      throw error;
    }
  }

  // Transactions
  async getTransactions(params = {}) {
    console.log("ApiService.getTransactions called with params:", params);

    // Ensure date parameters are properly formatted
    const requestParams = { ...params };

    // Special handling for date parameters to ensure proper URL encoding
    if (requestParams.start_date) {
      console.log(`Original start_date: ${requestParams.start_date}`);
      requestParams.start_date = encodeURIComponent(requestParams.start_date);
    }

    if (requestParams.end_date) {
      console.log(`Original end_date: ${requestParams.end_date}`);
      requestParams.end_date = encodeURIComponent(requestParams.end_date);
    }

    // Log the actual URL that will be called
    const queryString = new URLSearchParams(requestParams).toString();
    console.log(`GET /transactions with query params: ${queryString}`);

    // Use axios directly with explicit query string to ensure parameters are sent correctly
    return this.handleRequest(() =>
      this.client.get(`/transactions?${queryString}`)
    ).then((data) => {
      console.log(
        `getTransactions response: ${data.length} transactions received`
      );
      return data;
    });
  }

  async getTransaction(id) {
    return this.handleRequest(() => this.client.get(`/transactions/${id}`));
  }

  async createTransaction(transactionData) {
    return this.handleRequest(() =>
      this.client.post("/transactions", transactionData)
    );
  }

  async updateTransaction(id, transactionData) {
    return this.handleRequest(() =>
      this.client.put(`/transactions/${id}`, transactionData)
    );
  }

  async deleteTransaction(id) {
    return this.handleRequest(() => this.client.delete(`/transactions/${id}`));
  }

  // Scheduled Transactions
  async getScheduledTransactions() {
    return this.handleRequest(() => this.client.get("/scheduled-transactions"));
  }

  async getScheduledTransaction(id) {
    return this.handleRequest(() =>
      this.client.get(`/scheduled-transactions/${id}`)
    );
  }

  async createScheduledTransaction(data) {
    return this.handleRequest(() =>
      this.client.post("/scheduled-transactions", data)
    );
  }

  async updateScheduledTransaction(id, data) {
    return this.handleRequest(() =>
      this.client.put(`/scheduled-transactions/${id}`, data)
    );
  }

  async deleteScheduledTransaction(id) {
    return this.handleRequest(() =>
      this.client.delete(`/scheduled-transactions/${id}`)
    );
  }

  async processScheduledTransactions() {
    return this.handleRequest(() =>
      this.client.post("/scheduled-transactions/process")
    );
  }

  // Budgets
  async getBudgets(params = {}) {
    console.log("ApiService.getBudgets called with params:", params);

    // Create a new object for the parameters to avoid modifying the original
    const requestParams = { ...params };

    // Special handling for date parameters to ensure proper formatting
    if (requestParams.start_date) {
      console.log(`Original start_date: ${requestParams.start_date}`);
      // Ensure date is in ISO format for consistency
      if (requestParams.start_date instanceof Date) {
        requestParams.start_date = requestParams.start_date.toISOString();
      }
      requestParams.start_date = encodeURIComponent(requestParams.start_date);
    }

    if (requestParams.end_date) {
      console.log(`Original end_date: ${requestParams.end_date}`);
      // Ensure date is in ISO format for consistency
      if (requestParams.end_date instanceof Date) {
        requestParams.end_date = requestParams.end_date.toISOString();
      }
      requestParams.end_date = encodeURIComponent(requestParams.end_date);
    }

    // Special handling for month_year parameter - make sure it's passed clearly
    if (requestParams.month_year) {
      console.log(`Using month_year parameter: ${requestParams.month_year}`);
      // month_year should remain as YYYY-MM format
      requestParams.month_year = encodeURIComponent(requestParams.month_year);
    }

    // Log the actual URL that will be called
    const queryString = new URLSearchParams(requestParams).toString();
    console.log(
      `GET /budgets API call: ${this.baseUrl}/budgets?${queryString}`
    );

    // Explicit handling of the response for debugging
    try {
      const response = await this.client.get(`/budgets?${queryString}`);
      const data = response.data;

      console.log(`getBudgets response: ${data.length} budgets retrieved`);

      // Log a sample of budgets for debugging (first 2)
      if (data.length > 0) {
        console.log("Sample budget data:", data.slice(0, 2));
      }

      return data;
    } catch (error) {
      console.error("Error in getBudgets API call:", error);
      if (error.response) {
        console.error("Server response:", error.response.data);
      }
      throw error;
    }
  }

  async getBudget(id) {
    return this.handleRequest(() => this.client.get(`/budgets/${id}`));
  }

  async createBudget(budgetData) {
    return this.handleRequest(() => this.client.post("/budgets", budgetData));
  }

  async updateBudget(id, budgetData) {
    return this.handleRequest(() =>
      this.client.put(`/budgets/${id}`, budgetData)
    );
  }

  async deleteBudget(id) {
    return this.handleRequest(() => this.client.delete(`/budgets/${id}`));
  }

  // Analytics
  async getSpendingByCategory(timeframe = "month") {
    try {
      const response = await this.client.get("/analytics/spending", {
        params: { timeframe },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching spending by category:", error);
      throw error;
    }
  }

  async getIncomeBySource(timeframe = "month") {
    try {
      const response = await this.client.get("/analytics/income", {
        params: { timeframe },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching income by source:", error);
      throw error;
    }
  }

  async getProjections(months = 12) {
    try {
      const response = await this.client.get("/analytics/projections", {
        params: { months },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching projections:", error);
      throw error;
    }
  }

  // Import
  async importData(formData) {
    return this.handleRequest(() =>
      this.client.post("/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
    );
  }

  // Categories
  async getCategories() {
    return this.handleRequest(() => this.client.get("/categories"));
  }

  async getCategory(id) {
    return this.handleRequest(() => this.client.get(`/categories/${id}`));
  }

  async createCategory(categoryData) {
    return this.handleRequest(() =>
      this.client.post("/categories", categoryData)
    );
  }

  async updateCategory(id, categoryData) {
    return this.handleRequest(() =>
      this.client.put(`/categories/${id}`, categoryData)
    );
  }

  async deleteCategory(id) {
    return this.handleRequest(() => this.client.delete(`/categories/${id}`));
  }

  async getSubcategories(categoryId) {
    try {
      const response = await this.client.get(
        `/categories/${categoryId}/subcategories`
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching subcategories for ${categoryId}:`, error);
      throw error;
    }
  }

  async addSubcategory(categoryId, subcategoryData) {
    try {
      const response = await this.client.post(
        `/categories/${categoryId}/subcategories`,
        subcategoryData
      );
      return response.data;
    } catch (error) {
      console.error(`Error adding subcategory to ${categoryId}:`, error);
      throw error;
    }
  }

  // Test connection
  async testConnection() {
    return this.handleRequest(() => this.client.get("/test-connection"));
  }
}

export default ApiService;
