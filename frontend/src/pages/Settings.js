import React, { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
} from "@mui/icons-material";

const Settings = ({ apiService }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [currency, setCurrency] = useState("USD");
  const [dateFormat, setDateFormat] = useState("YYYY-MM-DD");
  const [backupFrequency, setBackupFrequency] = useState("weekly");

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSaveGeneralSettings = () => {
    // Mock API call to save general settings
    setTimeout(() => {
      setSnackbarMessage("Settings saved successfully!");
      setSnackbarOpen(true);
    }, 500);
  };

  const handleDarkModeToggle = () => {
    setDarkMode(!darkMode);
  };

  const handleExportData = () => {
    // Mock API call to export data
    setTimeout(() => {
      setSnackbarMessage("Data exported successfully!");
      setSnackbarOpen(true);
    }, 500);
  };

  const handleImportData = () => {
    // Mock API call to import data
    setTimeout(() => {
      setSnackbarMessage("Data imported successfully!");
      setSnackbarOpen(true);
    }, 500);
  };

  const handleBackupNow = () => {
    // Mock API call to create a backup
    setTimeout(() => {
      setSnackbarMessage("Backup created successfully!");
      setSnackbarOpen(true);
    }, 500);
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Settings
      </Typography>

      <Card sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="General" />
          <Tab label="Data Management" />
          <Tab label="About" />
        </Tabs>

        <CardContent>
          {/* General Settings Tab */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Appearance
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={darkMode}
                      onChange={handleDarkModeToggle}
                      color="primary"
                    />
                  }
                  label="Dark Mode"
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Regional Settings
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Currency</InputLabel>
                  <Select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    label="Currency"
                  >
                    <MenuItem value="USD">USD ($)</MenuItem>
                    <MenuItem value="EUR">EUR (€)</MenuItem>
                    <MenuItem value="GBP">GBP (£)</MenuItem>
                    <MenuItem value="JPY">JPY (¥)</MenuItem>
                    <MenuItem value="CAD">CAD ($)</MenuItem>
                    <MenuItem value="AUD">AUD ($)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Date Format</InputLabel>
                  <Select
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value)}
                    label="Date Format"
                  >
                    <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                    <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                    <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                    <MenuItem value="MMM DD, YYYY">MMM DD, YYYY</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Backup Settings
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Automatic Backup</InputLabel>
                  <Select
                    value={backupFrequency}
                    onChange={(e) => setBackupFrequency(e.target.value)}
                    label="Automatic Backup"
                  >
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                    <MenuItem value="never">Never</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <Button
                  variant="outlined"
                  onClick={handleBackupNow}
                  startIcon={<RefreshIcon />}
                  sx={{ mt: 1 }}
                >
                  Backup Now
                </Button>
              </Grid>

              <Grid item xs={12}>
                <Box
                  sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}
                >
                  <Button
                    variant="contained"
                    onClick={handleSaveGeneralSettings}
                  >
                    Save Settings
                  </Button>
                </Box>
              </Grid>
            </Grid>
          )}

          {/* Data Management Tab */}
          {activeTab === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Import & Export
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Export your financial data for backup or import data from
                  another source.
                </Typography>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleExportData}
                  >
                    Export All Data
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<UploadIcon />}
                    onClick={handleImportData}
                  >
                    Import Data
                  </Button>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Data Cleanup
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Remove outdated or unnecessary data from your account.
                </Typography>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() =>
                      window.confirm(
                        "Are you sure you want to delete all transaction history? This action cannot be undone."
                      )
                    }
                  >
                    Clear Transaction History
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() =>
                      window.confirm(
                        "Are you sure you want to reset all settings? This action cannot be undone."
                      )
                    }
                  >
                    Reset All Settings
                  </Button>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Warning: Data cleanup actions cannot be undone. Please make
                  sure to export your data before proceeding with any deletion.
                </Alert>
              </Grid>
            </Grid>
          )}

          {/* About Tab */}
          {activeTab === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  About Personal Finance Manager
                </Typography>
                <Typography variant="body1" paragraph>
                  Personal Finance Manager is a comprehensive tool to help you
                  track your finances, create budgets, and plan for the future.
                </Typography>
                <Typography variant="body2" paragraph>
                  Version: 0.1.0
                </Typography>
                <Typography variant="body2" paragraph>
                  Built with: React, Material UI, Electron, and Python Flask
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Privacy
                </Typography>
                <Typography variant="body2" paragraph>
                  Your financial data never leaves your device. All data is
                  stored locally, and no information is sent to external
                  servers.
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Support
                </Typography>
                <Typography variant="body2" paragraph>
                  For help and support, please visit the documentation or
                  contact the developer.
                </Typography>
                <Button variant="outlined">View Documentation</Button>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  License
                </Typography>
                <Typography variant="body2">
                  This software is licensed under the MIT License.
                </Typography>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Settings;
