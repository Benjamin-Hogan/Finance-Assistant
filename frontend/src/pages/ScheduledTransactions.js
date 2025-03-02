import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  Grid,
  InputAdornment,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { format as formatDate, parseISO } from "date-fns";

const ScheduledTransactions = ({ apiService }) => {
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState({
    account_id: "",
    amount: "",
    description: "",
    frequency: "monthly",
    start_date: new Date().toISOString(),
    is_income: false,
    active: true,
  });
  const [editMode, setEditMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [processLoading, setProcessLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch scheduled transactions
        const scheduledData = await apiService.getScheduledTransactions();
        setSchedules(scheduledData);

        // Fetch accounts for dropdown
        const accountsData = await apiService.getAccounts();
        setAccounts(accountsData);
      } catch (error) {
        console.error("Error fetching data:", error);
        setSnackbar({
          open: true,
          message: "Failed to load data",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [apiService]);

  const handleProcessScheduled = async () => {
    setProcessLoading(true);
    try {
      const result = await apiService.processScheduledTransactions();
      setSnackbar({
        open: true,
        message: `Successfully processed ${result.processed} scheduled transactions`,
        severity: "success",
      });

      // Refresh the scheduled transactions list
      const scheduledData = await apiService.getScheduledTransactions();
      setSchedules(scheduledData);
    } catch (error) {
      console.error("Error processing scheduled transactions:", error);
      setSnackbar({
        open: true,
        message: "Failed to process scheduled transactions",
        severity: "error",
      });
    } finally {
      setProcessLoading(false);
    }
  };

  const handleOpenDialog = (schedule = null) => {
    if (schedule) {
      setCurrentSchedule({
        ...schedule,
        start_date: schedule.start_date || new Date().toISOString(),
        end_date: schedule.end_date || null,
      });
      setEditMode(true);
    } else {
      setCurrentSchedule({
        account_id: accounts.length > 0 ? accounts[0].id : "",
        amount: "",
        description: "",
        frequency: "monthly",
        start_date: new Date().toISOString(),
        is_income: false,
        active: true,
      });
      setEditMode(false);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleOpenDeleteDialog = (scheduleId) => {
    setSelectedScheduleId(scheduleId);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    setCurrentSchedule((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "amount"
          ? parseFloat(value) || ""
          : value,
    }));
  };

  const handleDateChange = (date, fieldName) => {
    setCurrentSchedule((prev) => ({
      ...prev,
      [fieldName]: date ? date.toISOString() : null,
    }));
  };

  const handleSaveSchedule = async () => {
    try {
      if (editMode) {
        await apiService.updateScheduledTransaction(
          currentSchedule.id,
          currentSchedule
        );
        setSnackbar({
          open: true,
          message: "Scheduled transaction updated successfully",
          severity: "success",
        });
      } else {
        await apiService.createScheduledTransaction(currentSchedule);
        setSnackbar({
          open: true,
          message: "Scheduled transaction created successfully",
          severity: "success",
        });
      }
      handleCloseDialog();

      // Refresh scheduled transactions
      const scheduledData = await apiService.getScheduledTransactions();
      setSchedules(scheduledData);
    } catch (error) {
      console.error("Error saving scheduled transaction:", error);
      setSnackbar({
        open: true,
        message: `Failed to ${
          editMode ? "update" : "create"
        } scheduled transaction`,
        severity: "error",
      });
    }
  };

  const handleDeleteSchedule = async () => {
    try {
      await apiService.deleteScheduledTransaction(selectedScheduleId);
      setSnackbar({
        open: true,
        message: "Scheduled transaction deleted successfully",
        severity: "success",
      });
      handleCloseDeleteDialog();

      // Refresh scheduled transactions
      const scheduledData = await apiService.getScheduledTransactions();
      setSchedules(scheduledData);
    } catch (error) {
      console.error("Error deleting scheduled transaction:", error);
      setSnackbar({
        open: true,
        message: "Failed to delete scheduled transaction",
        severity: "error",
      });
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      signDisplay: "always",
    }).format(amount);
  };

  const formatDateString = (dateString) => {
    if (!dateString) return "—";
    try {
      const date = parseISO(dateString);
      return formatDate(date, "MMM d, yyyy");
    } catch (e) {
      return dateString;
    }
  };

  const getFrequencyLabel = (frequency) => {
    const labels = {
      daily: "Daily",
      weekly: "Weekly",
      monthly: "Monthly",
      yearly: "Yearly",
    };
    return labels[frequency] || frequency;
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  if (loading) {
    return <LinearProgress />;
  }

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">Scheduled Transactions</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleProcessScheduled}
            disabled={processLoading}
            sx={{ mr: 2 }}
          >
            Process Due Transactions
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Scheduled Transaction
          </Button>
        </Box>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            About Scheduled Transactions
          </Typography>
          <Typography variant="body1">
            Scheduled transactions allow you to automatically create
            transactions at regular intervals. They're perfect for recurring
            expenses like rent, subscriptions, or income like paychecks.
          </Typography>
        </CardContent>
      </Card>

      {schedules.length === 0 ? (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="h6" gutterBottom>
                No Scheduled Transactions Found
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Set up recurring transactions like rent, utilities, or paychecks
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Add Scheduled Transaction
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table
            sx={{ minWidth: 650 }}
            aria-label="scheduled transactions table"
          >
            <TableHead>
              <TableRow>
                <TableCell>Description</TableCell>
                <TableCell>Account</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Frequency</TableCell>
                <TableCell>Next Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {schedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell>{schedule.description}</TableCell>
                  <TableCell>{schedule.account_name}</TableCell>
                  <TableCell
                    sx={{
                      color: schedule.is_income ? "success.main" : "inherit",
                    }}
                  >
                    {formatCurrency(schedule.amount)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getFrequencyLabel(schedule.frequency)}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {formatDateString(schedule.next_occurrence)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={schedule.active ? "Active" : "Inactive"}
                      size="small"
                      color={schedule.active ? "success" : "default"}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(schedule)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDeleteDialog(schedule.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create/Edit Scheduled Transaction Dialog */}
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Dialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {editMode
              ? "Edit Scheduled Transaction"
              : "Create New Scheduled Transaction"}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  name="description"
                  label="Description"
                  fullWidth
                  value={currentSchedule.description}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Account</InputLabel>
                  <Select
                    name="account_id"
                    value={currentSchedule.account_id}
                    onChange={handleInputChange}
                    label="Account"
                  >
                    {accounts.map((account) => (
                      <MenuItem key={account.id} value={account.id}>
                        {account.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  name="amount"
                  label="Amount"
                  type="number"
                  fullWidth
                  value={currentSchedule.amount}
                  onChange={handleInputChange}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">$</InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Frequency</InputLabel>
                  <Select
                    name="frequency"
                    value={currentSchedule.frequency}
                    onChange={handleInputChange}
                    label="Frequency"
                  >
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                    <MenuItem value="yearly">Yearly</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Start Date"
                  value={
                    currentSchedule.start_date
                      ? parseISO(currentSchedule.start_date)
                      : null
                  }
                  onChange={(date) => handleDateChange(date, "start_date")}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth required />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="End Date (Optional)"
                  value={
                    currentSchedule.end_date
                      ? parseISO(currentSchedule.end_date)
                      : null
                  }
                  onChange={(date) => handleDateChange(date, "end_date")}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>

              {currentSchedule.frequency === "monthly" && (
                <Grid item xs={12} md={6}>
                  <TextField
                    name="day_of_month"
                    label="Day of Month"
                    type="number"
                    fullWidth
                    value={currentSchedule.day_of_month || ""}
                    onChange={handleInputChange}
                    InputProps={{ inputProps: { min: 1, max: 31 } }}
                    helperText="Leave blank to use the same day as start date"
                  />
                </Grid>
              )}

              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={Boolean(currentSchedule.is_income)}
                      onChange={handleInputChange}
                      name="is_income"
                      color="success"
                    />
                  }
                  label="This is income"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={Boolean(currentSchedule.active)}
                      onChange={handleInputChange}
                      name="active"
                      color="primary"
                    />
                  }
                  label="Active"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  name="notes"
                  label="Notes"
                  fullWidth
                  multiline
                  rows={2}
                  value={currentSchedule.notes || ""}
                  onChange={handleInputChange}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              onClick={handleSaveSchedule}
              variant="contained"
              disabled={
                !currentSchedule.description ||
                !currentSchedule.amount ||
                !currentSchedule.account_id ||
                !currentSchedule.start_date
              }
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </LocalizationProvider>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this scheduled transaction?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button
            onClick={handleDeleteSchedule}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ScheduledTransactions;
