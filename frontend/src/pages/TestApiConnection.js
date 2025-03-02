import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from "@mui/material";

const TestApiConnection = ({ apiService }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [accounts, setAccounts] = useState([]);

  const fetchAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getAccounts();
      setAccounts(data);
      console.log("API Response:", data);
    } catch (err) {
      console.error("Error fetching accounts:", err);
      setError(
        "Failed to connect to the backend API. Please check if the server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch on component mount
    fetchAccounts();
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        API Connection Test
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              onClick={fetchAccounts}
              disabled={loading}
            >
              Test API Connection
            </Button>
          </Box>

          {loading && (
            <Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              <Typography>Connecting to backend...</Typography>
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {!loading && !error && accounts && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="success">
                Successfully connected to the backend API!
              </Alert>
              <Typography variant="h6" sx={{ mt: 2 }}>
                Response from API:
              </Typography>
              <Box
                component="pre"
                sx={{
                  mt: 1,
                  p: 2,
                  bgcolor: "background.paper",
                  borderRadius: 1,
                  overflow: "auto",
                  maxHeight: 300,
                }}
              >
                {JSON.stringify(accounts, null, 2)}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default TestApiConnection;
