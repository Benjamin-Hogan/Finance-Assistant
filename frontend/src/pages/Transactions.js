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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  Tooltip,
  Snackbar,
  Alert,
  Grid,
  Divider,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format as formatDate, parseISO } from "date-fns";

const Transactions = ({ apiService }) => {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState(0);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [accountFilter, setAccountFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Transaction dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState({
    account_id: "",
    date: new Date().toISOString().split("T")[0],
    amount: "",
    description: "",
    category: "",
    subcategory: "",
    is_income: false,
    notes: "",
  });
  const [editMode, setEditMode] = useState(false);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);

  // Scheduled Transactions states
  const [schedules, setSchedules] = useState([]);
  const [processLoading, setProcessLoading] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState({
    account_id: "",
    amount: "",
    description: "",
    frequency: "monthly",
    start_date: new Date().toISOString(),
    is_income: false,
    active: true,
  });
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState(null);

  // Notification state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Subcategories based on selected category
  const [subcategories, setSubcategories] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch transactions
      const data = await apiService.getTransactions();
      setTransactions(data);
      setFilteredTransactions(data);

      // Fetch accounts
      const accountsData = await apiService.getAccounts();
      setAccounts(accountsData);

      // Fetch scheduled transactions
      const scheduledData = await apiService.getScheduledTransactions();
      setSchedules(scheduledData);

      // Fetch categories
      try {
        const categoriesData = await apiService.getCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategories([
          {
            id: 1,
            name: "Housing",
            subcategories: ["Rent", "Mortgage", "Utilities"],
          },
          {
            id: 2,
            name: "Transportation",
            subcategories: ["Car", "Public Transit", "Gas"],
          },
          { id: 3, name: "Food", subcategories: ["Groceries", "Dining Out"] },
          {
            id: 4,
            name: "Entertainment",
            subcategories: ["Movies", "Games", "Subscriptions"],
          },
          {
            id: 5,
            name: "Shopping",
            subcategories: ["Clothing", "Electronics"],
          },
          { id: 6, name: "Health", subcategories: ["Medical", "Fitness"] },
          {
            id: 7,
            name: "Income",
            subcategories: ["Salary", "Bonus", "Interest"],
          },
        ]);
      }
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

  useEffect(() => {
    fetchData();
  }, [apiService]);

  useEffect(() => {
    filterTransactions();
  }, [
    searchTerm,
    accountFilter,
    categoryFilter,
    startDate,
    endDate,
    transactions,
  ]);

  useEffect(() => {
    // Update subcategories when category changes
    if (currentTransaction.category) {
      const category = categories.find(
        (c) =>
          (typeof c === "object" ? c.name : c) === currentTransaction.category
      );
      if (category && category.subcategories) {
        // Ensure subcategories are strings, not objects
        const processedSubcategories = category.subcategories.map((sub) =>
          typeof sub === "object" ? sub.name : sub
        );
        setSubcategories(processedSubcategories);
      } else {
        setSubcategories([]);
      }
    } else {
      setSubcategories([]);
    }
  }, [currentTransaction.category, categories]);

  const filterTransactions = () => {
    let filtered = [...transactions];

    if (searchTerm) {
      filtered = filtered.filter(
        (tx) =>
          tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (tx.notes &&
            tx.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (accountFilter) {
      filtered = filtered.filter(
        (tx) => tx.account_id.toString() === accountFilter
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter((tx) => tx.category === categoryFilter);
    }

    if (startDate) {
      filtered = filtered.filter((tx) => new Date(tx.date) >= startDate);
    }

    if (endDate) {
      filtered = filtered.filter((tx) => new Date(tx.date) <= endDate);
    }

    setFilteredTransactions(filtered);
  };

  const handleOpenDialog = (transaction = null) => {
    if (transaction) {
      // Edit existing transaction
      setCurrentTransaction({
        ...transaction,
        date: transaction.date.split("T")[0],
      });
      setEditMode(true);
    } else {
      // Create new transaction
      setCurrentTransaction({
        account_id: accounts.length > 0 ? accounts[0].id : "",
        date: new Date().toISOString().split("T")[0],
        amount: "",
        description: "",
        category: "",
        subcategory: "",
        is_income: false,
        notes: "",
      });
      setEditMode(false);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setCurrentTransaction((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else if (name === "amount") {
      // Handle amount input (ensure it's a number)
      const numValue = parseFloat(value) || "";
      setCurrentTransaction((prev) => ({
        ...prev,
        [name]: numValue,
      }));
    } else {
      setCurrentTransaction((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleDateChange = (date, field) => {
    if (date) {
      setCurrentTransaction((prev) => ({
        ...prev,
        [field]: date.toISOString().split("T")[0],
      }));
    }
  };

  const handleSaveTransaction = async () => {
    try {
      if (editMode) {
        await apiService.updateTransaction(
          currentTransaction.id,
          currentTransaction
        );
        setSnackbar({
          open: true,
          message: "Transaction updated successfully",
          severity: "success",
        });
      } else {
        await apiService.createTransaction(currentTransaction);
        setSnackbar({
          open: true,
          message: "Transaction created successfully",
          severity: "success",
        });
      }
      fetchData();
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving transaction:", error);
      setSnackbar({
        open: true,
        message: "Failed to save transaction",
        severity: "error",
      });
    }
  };

  const handleOpenDeleteDialog = (transactionId) => {
    setTransactionToDelete(transactionId);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setTransactionToDelete(null);
  };

  const handleDeleteTransaction = async () => {
    if (!transactionToDelete) return;

    try {
      await apiService.deleteTransaction(transactionToDelete);
      setSnackbar({
        open: true,
        message: "Transaction deleted successfully",
        severity: "success",
      });
      fetchData();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      setSnackbar({
        open: true,
        message: "Failed to delete transaction",
        severity: "error",
      });
    } finally {
      handleCloseDeleteDialog();
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getAccountName = (accountId) => {
    const account = accounts.find((a) => a.id === accountId);
    return account ? account.name : "Unknown Account";
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setAccountFilter("");
    setCategoryFilter("");
    setStartDate(null);
    setEndDate(null);
  };

  const isFormValid = () => {
    return (
      currentTransaction.account_id &&
      currentTransaction.date &&
      currentTransaction.amount &&
      currentTransaction.description &&
      currentTransaction.category
    );
  };

  // Scheduled Transaction Functions
  const handleProcessScheduled = async () => {
    setProcessLoading(true);
    try {
      const result = await apiService.processScheduledTransactions();
      setSnackbar({
        open: true,
        message: `Successfully processed ${result.processed} scheduled transactions`,
        severity: "success",
      });

      // Refresh all data
      fetchData();
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

  const handleOpenScheduleDialog = (schedule = null) => {
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
    setScheduleDialogOpen(true);
  };

  const handleCloseScheduleDialog = () => {
    setScheduleDialogOpen(false);
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
      handleCloseScheduleDialog();
      fetchData();
    } catch (error) {
      console.error("Error saving scheduled transaction:", error);
      setSnackbar({
        open: true,
        message: "Failed to save scheduled transaction",
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
      fetchData();
    } catch (error) {
      console.error("Error deleting scheduled transaction:", error);
      setSnackbar({
        open: true,
        message: "Failed to delete scheduled transaction",
        severity: "error",
      });
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

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
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
        <Typography variant="h4">Transactions</Typography>
        <Box>
          {activeTab === 1 && (
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleProcessScheduled}
              disabled={processLoading}
              sx={{ mr: 2 }}
            >
              Process Due
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() =>
              activeTab === 0 ? handleOpenDialog() : handleOpenScheduleDialog()
            }
          >
            Add {activeTab === 0 ? "Transaction" : "Scheduled"}
          </Button>
        </Box>
      </Box>

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Transactions" />
        <Tab label="Scheduled" />
      </Tabs>

      {activeTab === 0 ? (
        // Regular Transactions View
        <>
          {/* Filters Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h6">Filters</Typography>
                <Box>
                  <Button
                    variant="outlined"
                    startIcon={showFilters ? <ClearIcon /> : <FilterListIcon />}
                    onClick={toggleFilters}
                    sx={{ mr: 1 }}
                  >
                    {showFilters ? "Hide Filters" : "Show Filters"}
                  </Button>
                  {showFilters && (
                    <Button variant="outlined" onClick={clearFilters}>
                      Clear All
                    </Button>
                  )}
                </Box>
              </Box>

              {/* Basic search - always visible */}
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setSearchTerm("")}
                      >
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* Advanced filters - toggleable */}
              {showFilters && (
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Account</InputLabel>
                      <Select
                        value={accountFilter}
                        onChange={(e) => setAccountFilter(e.target.value)}
                        label="Account"
                      >
                        <MenuItem value="">All Accounts</MenuItem>
                        {accounts.map((account) => (
                          <MenuItem
                            key={account.id}
                            value={account.id.toString()}
                          >
                            {account.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        label="Category"
                      >
                        <MenuItem value="">All Categories</MenuItem>
                        {categories.map((category) => {
                          const categoryName =
                            typeof category === "object"
                              ? category.name
                              : category;
                          const categoryId =
                            typeof category === "object"
                              ? category.id
                              : category;
                          return (
                            <MenuItem key={categoryId} value={categoryName}>
                              {categoryName}
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="From Date"
                        value={startDate}
                        onChange={(date) => setStartDate(date)}
                        maxDate={endDate || undefined}
                        slotProps={{ textField: { fullWidth: true } }}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="To Date"
                        value={endDate}
                        onChange={(date) => setEndDate(date)}
                        minDate={startDate || undefined}
                        slotProps={{ textField: { fullWidth: true } }}
                      />
                    </LocalizationProvider>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>

          {/* Transactions Table */}
          {filteredTransactions.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="h6" gutterBottom>
                  No Transactions Found
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  {transactions.length === 0
                    ? "Start by adding your first transaction"
                    : "Try adjusting your filters to see more results"}
                </Typography>
                {transactions.length === 0 && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                  >
                    Add Transaction
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Account</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{formatDate(transaction.date)}</TableCell>
                      <TableCell>
                        {getAccountName(transaction.account_id)}
                      </TableCell>
                      <TableCell>
                        {transaction.description}
                        {transaction.notes && (
                          <Typography
                            variant="caption"
                            display="block"
                            color="text.secondary"
                          >
                            {transaction.notes}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Chip
                            label={transaction.category}
                            size="small"
                            color={
                              transaction.is_income ? "success" : "default"
                            }
                          />
                          {transaction.subcategory && (
                            <Chip
                              label={transaction.subcategory}
                              size="small"
                              variant="outlined"
                              sx={{ ml: 0.5 }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          color={
                            transaction.is_income
                              ? "success.main"
                              : "error.main"
                          }
                          fontWeight="medium"
                        >
                          {transaction.is_income ? "+" : "-"}
                          {formatCurrency(Math.abs(transaction.amount))}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(transaction)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleOpenDeleteDialog(transaction.id)
                            }
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

          {/* Transaction Dialogs */}
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Dialog
              open={dialogOpen}
              onClose={handleCloseDialog}
              maxWidth="md"
              fullWidth
            >
              <DialogTitle>
                {editMode ? "Edit Transaction" : "Add New Transaction"}
              </DialogTitle>
              <DialogContent dividers>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Account</InputLabel>
                      <Select
                        name="account_id"
                        value={currentTransaction.account_id}
                        onChange={handleInputChange}
                        label="Account"
                        required
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
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="Date"
                        value={
                          currentTransaction.date
                            ? new Date(currentTransaction.date)
                            : null
                        }
                        onChange={(date) => handleDateChange(date, "date")}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            margin: "normal",
                            required: true,
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      name="description"
                      label="Description"
                      fullWidth
                      margin="normal"
                      value={currentTransaction.description}
                      onChange={handleInputChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Category</InputLabel>
                      <Select
                        name="category"
                        value={currentTransaction.category}
                        onChange={handleInputChange}
                        label="Category"
                        required
                      >
                        {categories.map((category) => {
                          const categoryName =
                            typeof category === "object"
                              ? category.name
                              : category;
                          const categoryId =
                            typeof category === "object"
                              ? category.id
                              : category;
                          return (
                            <MenuItem key={categoryId} value={categoryName}>
                              {categoryName}
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl
                      fullWidth
                      margin="normal"
                      disabled={!currentTransaction.category}
                    >
                      <InputLabel>Subcategory</InputLabel>
                      <Select
                        name="subcategory"
                        value={currentTransaction.subcategory || ""}
                        onChange={handleInputChange}
                        label="Subcategory"
                      >
                        <MenuItem value="">None</MenuItem>
                        {subcategories.map((subcat, index) => {
                          // Handle both string subcategories and object subcategories
                          const value =
                            typeof subcat === "object" ? subcat.name : subcat;
                          return (
                            <MenuItem key={index} value={value}>
                              {value}
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      name="amount"
                      label="Amount"
                      type="number"
                      fullWidth
                      margin="normal"
                      value={currentTransaction.amount}
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
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        height: "100%",
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            name="is_income"
                            checked={currentTransaction.is_income}
                            onChange={handleInputChange}
                          />
                        }
                        label="This is income"
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      name="notes"
                      label="Notes"
                      fullWidth
                      margin="normal"
                      value={currentTransaction.notes || ""}
                      onChange={handleInputChange}
                      multiline
                      rows={3}
                    />
                  </Grid>

                  {/* Transaction Impact Preview */}
                  {currentTransaction.account_id &&
                    currentTransaction.amount > 0 && (
                      <Grid item xs={12}>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2,
                            mt: 2,
                            bgcolor: "background.paper",
                            borderRadius: 1,
                            borderColor: "divider",
                          }}
                        >
                          <Typography
                            variant="subtitle1"
                            gutterBottom
                            fontWeight="bold"
                          >
                            Transaction Impact Preview
                          </Typography>

                          {(() => {
                            const selectedAccount = accounts.find(
                              (acc) => acc.id === currentTransaction.account_id
                            );
                            if (!selectedAccount) return null;

                            const currentBalance = selectedAccount.balance;
                            const transactionAmount =
                              currentTransaction.amount || 0;
                            const isIncome = currentTransaction.is_income;
                            const newBalance = isIncome
                              ? currentBalance + transactionAmount
                              : currentBalance - transactionAmount;

                            const isPositiveChange =
                              isIncome || transactionAmount === 0;

                            return (
                              <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    Account: {selectedAccount.name}
                                  </Typography>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      mt: 1,
                                    }}
                                  >
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      Current Balance:
                                    </Typography>
                                    <Typography variant="body1" sx={{ ml: 1 }}>
                                      {formatCurrency(currentBalance)}
                                    </Typography>
                                  </Box>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                    }}
                                  >
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      New Balance:
                                    </Typography>
                                    <Typography
                                      variant="body1"
                                      fontWeight="bold"
                                      color={
                                        newBalance >= 0
                                          ? "success.main"
                                          : "error.main"
                                      }
                                      sx={{ ml: 1 }}
                                    >
                                      {formatCurrency(newBalance)}
                                    </Typography>
                                  </Box>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    Transaction Details
                                  </Typography>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      mt: 1,
                                    }}
                                  >
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      Type:
                                    </Typography>
                                    <Typography
                                      variant="body1"
                                      sx={{ ml: 1 }}
                                      color={
                                        isIncome ? "success.main" : "error.main"
                                      }
                                    >
                                      {isIncome ? "Income" : "Expense"}
                                    </Typography>
                                  </Box>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                    }}
                                  >
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      Amount:
                                    </Typography>
                                    <Typography
                                      variant="body1"
                                      fontWeight="bold"
                                      color={
                                        isIncome ? "success.main" : "error.main"
                                      }
                                      sx={{ ml: 1 }}
                                    >
                                      {isIncome ? "+" : "-"}
                                      {formatCurrency(transactionAmount)}
                                    </Typography>
                                  </Box>
                                </Grid>

                                <Grid item xs={12}>
                                  <Divider sx={{ my: 1 }} />
                                  <Alert
                                    severity={
                                      isPositiveChange ? "info" : "warning"
                                    }
                                    variant="outlined"
                                    sx={{ mt: 1 }}
                                  >
                                    {isPositiveChange
                                      ? "This will increase your account balance."
                                      : "This will decrease your account balance."}
                                  </Alert>
                                </Grid>
                              </Grid>
                            );
                          })()}
                        </Paper>
                      </Grid>
                    )}
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseDialog}>Cancel</Button>
                <Button
                  onClick={handleSaveTransaction}
                  variant="contained"
                  disabled={!isFormValid()}
                >
                  Save
                </Button>
              </DialogActions>
            </Dialog>
          </LocalizationProvider>
        </>
      ) : (
        // Scheduled Transactions View
        <>
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
              <CardContent sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="h6" gutterBottom>
                  No Scheduled Transactions Found
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  Set up recurring transactions like rent, utilities, or
                  paychecks
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenScheduleDialog()}
                >
                  Add Scheduled Transaction
                </Button>
              </CardContent>
            </Card>
          ) : (
            <TableContainer component={Paper}>
              <Table>
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
                          color: schedule.is_income
                            ? "success.main"
                            : "inherit",
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
                        {formatDate(
                          parseISO(schedule.next_occurrence),
                          "MMM d, yyyy"
                        )}
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
                            onClick={() => handleOpenScheduleDialog(schedule)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedScheduleId(schedule.id);
                              setDeleteDialogOpen(true);
                            }}
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

          {/* Scheduled Transaction Dialog */}
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Dialog
              open={scheduleDialogOpen}
              onClose={handleCloseScheduleDialog}
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
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: true,
                        },
                      }}
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
                      slotProps={{ textField: { fullWidth: true } }}
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
                        <Checkbox
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
                        <Checkbox
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
                <Button onClick={handleCloseScheduleDialog}>Cancel</Button>
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
        </>
      )}

      {/* Common Dialogs */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this{" "}
            {activeTab === 0 ? "transaction" : "scheduled transaction"}?
            {activeTab === 1 && " This will stop all future occurrences."}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button
            onClick={
              activeTab === 0 ? handleDeleteTransaction : handleDeleteSchedule
            }
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
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Transactions;
