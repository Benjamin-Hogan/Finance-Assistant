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
    return this.handleRequest(() =>
      this.client.get("/transactions", { params })
    );
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
    return this.handleRequest(() => this.client.get("/budgets", { params }));
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
