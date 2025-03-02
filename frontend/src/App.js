import React, { useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { Box } from "@mui/material";

// Layouts
import Layout from "./components/Layout";

// Pages
import Dashboard from "./pages/Dashboard";
import Accounts from "./pages/Accounts";
import Transactions from "./pages/Transactions";
import Budgets from "./pages/Budgets";
import Analytics from "./pages/Analytics";
import ImportData from "./pages/ImportData";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import TestApiConnection from "./pages/TestApiConnection";
import Categories from "./pages/Categories";

// API Service
import ApiService from "./services/ApiService";

function App() {
  const location = useLocation();
  const [apiService] = useState(new ApiService());

  return (
    <Box sx={{ display: "flex", height: "100%" }}>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard apiService={apiService} />} />
          <Route
            path="/accounts"
            element={<Accounts apiService={apiService} />}
          />
          <Route
            path="/transactions"
            element={<Transactions apiService={apiService} />}
          />
          <Route
            path="/budgets"
            element={<Budgets apiService={apiService} />}
          />
          <Route
            path="/categories"
            element={<Categories apiService={apiService} />}
          />
          <Route
            path="/analytics"
            element={<Analytics apiService={apiService} />}
          />
          <Route
            path="/import"
            element={<ImportData apiService={apiService} />}
          />
          <Route
            path="/settings"
            element={<Settings apiService={apiService} />}
          />
          <Route
            path="/test-api"
            element={<TestApiConnection apiService={apiService} />}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </Box>
  );
}

export default App;
