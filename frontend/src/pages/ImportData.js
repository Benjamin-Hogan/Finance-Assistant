import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Alert,
  AlertTitle,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  Description as FileIcon,
  Check as CheckIcon,
} from "@mui/icons-material";

const ImportData = ({ apiService }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAccounts();
  }, [apiService]);

  const fetchAccounts = async () => {
    try {
      const accountsData = await apiService.getAccounts();
      setAccounts(accountsData);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      setError("Failed to load accounts. Please try again later.");
    }
  };

  const handleAccountChange = (event) => {
    setSelectedAccount(event.target.value);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Preview CSV file
      previewCSV(file);
    }
  };

  const previewCSV = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target.result;
      const lines = csv.split("\n");
      const headers = lines[0].split(",");

      const previewRows = [];
      // Parse up to 5 rows for preview
      for (let i = 1; i < Math.min(lines.length, 6); i++) {
        if (lines[i].trim() === "") continue;

        const rowData = lines[i].split(",");
        const row = {};

        headers.forEach((header, index) => {
          row[header.trim()] = rowData[index]?.trim() || "";
        });

        previewRows.push(row);
      }

      setPreviewData(previewRows);
    };

    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!selectedAccount || !selectedFile) {
      setError("Please select an account and upload a CSV file.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await apiService.importCsv(selectedFile, selectedAccount);
      setImportResult(result);
      setActiveStep(2);
    } catch (error) {
      console.error("Error importing CSV:", error);
      setError(
        "Failed to import CSV file. Please check the file format and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setActiveStep(0);
    setSelectedAccount("");
    setSelectedFile(null);
    setPreviewData([]);
    setImportResult(null);
    setError(null);
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <>
            <Typography variant="body1" gutterBottom>
              Select the account you want to import transactions for:
            </Typography>
            <FormControl fullWidth sx={{ my: 2 }}>
              <InputLabel>Account</InputLabel>
              <Select
                value={selectedAccount}
                onChange={handleAccountChange}
                label="Account"
              >
                {accounts.map((account) => (
                  <MenuItem key={account.id} value={account.id}>
                    {account.name} ({account.type})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box sx={{ mt: 1 }}>
              <Button
                variant="contained"
                onClick={() => selectedAccount && setActiveStep(1)}
                disabled={!selectedAccount}
              >
                Continue
              </Button>
            </Box>
          </>
        );
      case 1:
        return (
          <>
            <Typography variant="body1" gutterBottom>
              Upload a CSV file with your transaction data:
            </Typography>
            <Box sx={{ my: 3 }}>
              <input
                accept=".csv"
                style={{ display: "none" }}
                id="csv-file-upload"
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="csv-file-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<UploadIcon />}
                  fullWidth
                  sx={{ py: 5, border: "2px dashed" }}
                >
                  {selectedFile ? selectedFile.name : "Choose CSV File"}
                </Button>
              </label>
            </Box>

            {selectedFile && previewData.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Preview:
                </Typography>
                <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        {Object.keys(previewData[0]).map((header) => (
                          <TableCell key={header}>{header}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {previewData.map((row, index) => (
                        <TableRow key={index}>
                          {Object.values(row).map((cell, cellIndex) => (
                            <TableCell key={cellIndex}>{cell}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Typography variant="caption" sx={{ display: "block", mt: 1 }}>
                  Showing preview of first {previewData.length} rows
                </Typography>
              </Box>
            )}

            <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
              <Button variant="outlined" onClick={() => setActiveStep(0)}>
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleImport}
                disabled={!selectedFile}
                startIcon={<CheckIcon />}
              >
                Import Transactions
              </Button>
            </Box>
          </>
        );
      case 2:
        return (
          <>
            <Typography variant="body1" gutterBottom>
              Import completed!
            </Typography>

            {importResult && (
              <Alert severity="success" sx={{ my: 2 }}>
                <AlertTitle>Success</AlertTitle>
                <Typography variant="body2">
                  Successfully imported {importResult.imported || 0}{" "}
                  transactions.
                </Typography>
                {importResult.skipped > 0 && (
                  <Typography variant="body2">
                    Skipped {importResult.skipped} duplicate transactions.
                  </Typography>
                )}
              </Alert>
            )}

            <Box sx={{ mt: 3 }}>
              <Button variant="contained" onClick={handleReset}>
                Import More Transactions
              </Button>
            </Box>
          </>
        );
      default:
        return "Unknown step";
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Import Transactions
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              {loading ? (
                <Box sx={{ width: "100%" }}>
                  <LinearProgress />
                  <Typography
                    variant="body2"
                    sx={{ mt: 2, textAlign: "center" }}
                  >
                    Importing transactions, please wait...
                  </Typography>
                </Box>
              ) : (
                <Stepper activeStep={activeStep} orientation="vertical">
                  <Step>
                    <StepLabel>Select Account</StepLabel>
                    <StepContent>{getStepContent(0)}</StepContent>
                  </Step>
                  <Step>
                    <StepLabel>Upload CSV File</StepLabel>
                    <StepContent>{getStepContent(1)}</StepContent>
                  </Step>
                  <Step>
                    <StepLabel>Import Complete</StepLabel>
                    <StepContent>{getStepContent(2)}</StepContent>
                  </Step>
                </Stepper>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                CSV Format Guidelines
              </Typography>
              <Typography variant="body2" paragraph>
                Your CSV file should include the following columns:
              </Typography>
              <ul>
                <li>
                  <Typography variant="body2">Date (YYYY-MM-DD)</Typography>
                </li>
                <li>
                  <Typography variant="body2">Description</Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Amount (positive for income, negative for expenses)
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">Category (optional)</Typography>
                </li>
              </ul>
              <Typography variant="body2" paragraph>
                Example:
              </Typography>
              <Box
                component="pre"
                sx={{
                  p: 1,
                  bgcolor: "background.paper",
                  borderRadius: 1,
                  overflow: "auto",
                  fontSize: "0.75rem",
                }}
              >
                Date,Description,Amount,Category 2023-01-15,Grocery
                Store,-45.67,Food 2023-01-16,Salary,2000.00,Income
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ImportData;
