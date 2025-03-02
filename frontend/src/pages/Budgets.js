import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Alert,
  Collapse,
  InputAdornment,
  FormControlLabel,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Snackbar,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ArrowForward as ArrowForwardIcon,
  Warning as WarningIcon,
  SwapHoriz as SwapIcon,
} from "@mui/icons-material";
import { format, addMonths, subMonths } from "date-fns";

const Budgets = ({ apiService }) => {
  // Get the current date and format it as YYYY-MM
  const getCurrentYearMonth = () => {
    const now = new Date();
    return format(now, "yyyy-MM");
  };

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [subcategoryBudgets, setSubcategoryBudgets] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [availableToAllocate, setAvailableToAllocate] = useState(0);
  const [expandedCategories, setExpandedCategories] = useState({});
  // Initialize with the current month
  const [currentMonth, setCurrentMonth] = useState(getCurrentYearMonth());
  const [allocationDialogOpen, setAllocationDialogOpen] = useState(false);
  const [moveMoneyDialogOpen, setMoveMoneyDialogOpen] = useState(false);
  const [subcategoryAllocationDialogOpen, setSubcategoryAllocationDialogOpen] =
    useState(false);
  const [currentAllocation, setCurrentAllocation] = useState({
    categoryId: null,
    amount: 0,
  });
  const [currentSubcategoryAllocation, setCurrentSubcategoryAllocation] =
    useState({
      categoryId: null,
      categoryName: "",
      subcategory: "",
      amount: 0,
    });
  const [moneyMovement, setMoneyMovement] = useState({
    fromCategory: "available",
    toCategory: null,
    amount: 0,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    fetchData();
  }, [apiService, currentMonth]);

  // Helper function to get month options for the selector
  const getMonthOptions = () => {
    const options = [];
    // Generate options for the past 12 months and future 3 months
    for (let i = -11; i <= 3; i++) {
      const date =
        i === 0
          ? new Date()
          : i < 0
          ? subMonths(new Date(), Math.abs(i))
          : addMonths(new Date(), i);
      const value = format(date, "yyyy-MM");
      options.push({
        value,
        label: format(date, "MMMM yyyy"),
      });
    }
    return options;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch categories
      const categoriesData = await apiService.getCategories();
      setCategories(categoriesData);

      // Parse the selected month properly
      const [year, month] = currentMonth
        .split("-")
        .map((num) => parseInt(num, 10));

      // Generate date range for the selected month (YNAB style)
      // First day of the selected month at 00:00:00.000
      const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);

      // Last day of the selected month at 23:59:59.999
      const lastDay = new Date(year, month, 0).getDate(); // Get last day of month
      const endDate = new Date(year, month - 1, lastDay, 23, 59, 59, 999);

      console.log(`Fetching data for month: ${currentMonth}`);
      console.log(`Formatted month display: ${format(startDate, "MMMM yyyy")}`);
      console.log(
        `Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`
      );

      // Fetch budgets for current month with precise date formatting
      const budgetsData = await apiService.getBudgets({
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        month_year: currentMonth, // Add explicit month-year parameter
      });

      console.log(
        `Received ${budgetsData.length} budgets from API:`,
        budgetsData
      );

      // Process budgets - separate main category budgets from subcategory budgets
      const budgetsByCategory = {};
      const subcategoryBudgetMap = {};

      budgetsData.forEach((budget) => {
        if (budget.subcategory) {
          // This is a subcategory budget
          const key = `${budget.category}:${budget.subcategory}`;
          subcategoryBudgetMap[key] = budget;
        } else {
          // This is a main category budget
          budgetsByCategory[budget.category] = budget;
        }
      });

      console.log("Processed budgets by category:", budgetsByCategory);
      console.log("Processed subcategory budgets:", subcategoryBudgetMap);

      setBudgets(budgetsByCategory);
      setSubcategoryBudgets(subcategoryBudgetMap);

      // Fetch accounts for total available calculation
      const accountsData = await apiService.getAccounts();
      setAccounts(accountsData);

      // Fetch transactions for the current month with precise date query
      console.log(
        `Fetching transactions for month: ${format(startDate, "MMMM yyyy")}`
      );

      const transactionsData = await apiService.getTransactions({
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      });

      console.log(
        `Received ${
          transactionsData.length
        } transactions in date range (${format(startDate, "MMM d")} - ${format(
          endDate,
          "MMM d"
        )})`,
        transactionsData.slice(0, 2) // Log first 2 transactions for debugging
      );

      // Filter out any transactions that don't belong to the current month
      const filteredTransactions = transactionsData.filter((tx) => {
        const txDate = new Date(tx.date);
        return txDate >= startDate && txDate <= endDate;
      });

      console.log(
        `After date filtering: ${filteredTransactions.length} transactions remaining`
      );
      setTransactions(filteredTransactions);

      // Calculate available to allocate
      const totalBalance = accountsData.reduce(
        (sum, account) => sum + account.balance,
        0
      );

      // Only uncategorized income goes to Available to Allocate
      const uncategorizedIncome = filteredTransactions
        .filter((tx) => tx.is_income && !tx.category)
        .reduce((sum, tx) => sum + tx.amount, 0);

      // Calculate total allocated (both to categories and subcategories)
      const totalAllocated =
        Object.values(budgetsByCategory).reduce(
          (sum, budget) => sum + budget.amount,
          0
        ) +
        Object.values(subcategoryBudgetMap).reduce(
          (sum, budget) => sum + budget.amount,
          0
        );

      // Set Available to Allocate
      setAvailableToAllocate(
        totalBalance + uncategorizedIncome - totalAllocated
      );
    } catch (error) {
      console.error("Error fetching budget data:", error);
      setSnackbar({
        open: true,
        message: "Failed to load budget data. Please check your connection.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (event) => {
    const newMonth = event.target.value;
    console.log(`Month changed from ${currentMonth} to ${newMonth}`);

    // Clear existing data before loading new month
    setTransactions([]);
    setBudgets({});
    setSubcategoryBudgets({});

    // Update the current month in state
    setCurrentMonth(newMonth);

    // Display loading indicator
    setLoading(true);

    // Parse for display in the snackbar
    const [year, month] = newMonth.split("-").map((num) => parseInt(num, 10));
    const monthDisplay = new Date(year, month - 1, 1);

    // Display feedback in the UI
    setSnackbar({
      open: true,
      message: `Loading budget data for ${format(
        monthDisplay,
        "MMMM yyyy"
      )}...`,
      severity: "info",
    });

    // Parse the date correctly for logging
    const newStartDate = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0).getDate();
    const newEndDate = new Date(year, month - 1, lastDay, 23, 59, 59, 999);

    console.log(
      `New date range: ${newStartDate.toISOString()} to ${newEndDate.toISOString()}`
    );

    // fetchData will be triggered automatically by the useEffect hook that depends on currentMonth
  };

  const toggleCategoryExpansion = (categoryId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  // Calculate category activity for the selected month only - YNAB style
  const calculateCategoryActivity = (categoryName) => {
    // Return 0 if no transactions yet
    if (!transactions || transactions.length === 0) {
      return 0;
    }

    console.log(
      `Calculating activity for category: ${categoryName}, transactions: ${transactions.length}`
    );

    // In YNAB, the activity is the sum of the transaction amounts
    // Expenses (negative amounts) reduce the available funds
    // Income (positive amounts) add to the available funds, but only if categorized
    return transactions
      .filter((tx) => tx.category === categoryName)
      .reduce((sum, tx) => {
        // Simply add the transaction amount - expenses are negative, income is positive
        return sum + parseFloat(tx.amount);
      }, 0);
  };

  // Calculate subcategory activity for the selected month only - YNAB style
  const calculateSubcategoryActivity = (categoryName, subcategoryName) => {
    // Return 0 if no transactions yet
    if (!transactions || transactions.length === 0) {
      return 0;
    }

    // Only include transactions that match both category and subcategory
    return transactions
      .filter(
        (tx) =>
          tx.category === categoryName && tx.subcategory === subcategoryName
      )
      .reduce((sum, tx) => {
        // Simply add the transaction amount - expenses are negative, income is positive
        return sum + parseFloat(tx.amount);
      }, 0);
  };

  const handleOpenAllocationDialog = (categoryId, currentAmount = 0) => {
    setCurrentAllocation({
      categoryId,
      amount: currentAmount,
    });
    setAllocationDialogOpen(true);
  };

  const handleCloseAllocationDialog = () => {
    setAllocationDialogOpen(false);
    setCurrentAllocation({ categoryId: null, amount: 0 });
  };

  const handleOpenSubcategoryAllocationDialog = (
    categoryId,
    categoryName,
    subcategory,
    currentAmount = 0
  ) => {
    setCurrentSubcategoryAllocation({
      categoryId,
      categoryName,
      subcategory,
      amount: currentAmount,
    });
    setSubcategoryAllocationDialogOpen(true);
  };

  const handleCloseSubcategoryAllocationDialog = () => {
    setSubcategoryAllocationDialogOpen(false);
    setCurrentSubcategoryAllocation({
      categoryId: null,
      categoryName: "",
      subcategory: "",
      amount: 0,
    });
  };

  const handleOpenMoveMoneyDialog = () => {
    setMoveMoneyDialogOpen(true);
    // Default to moving from available funds
    setMoneyMovement({
      fromCategory: "available",
      toCategory: null,
      amount: 0,
    });
  };

  const handleCloseMoveMoneyDialog = () => {
    setMoveMoneyDialogOpen(false);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleSaveAllocation = async () => {
    try {
      const category = categories.find(
        (c) => c.id === currentAllocation.categoryId
      );
      if (!category) return;

      const categoryName =
        typeof category.name === "object" ? category.name.name : category.name;

      const existingBudget = budgets[categoryName];

      // Parse the current month to create proper date
      const [year, month] = currentMonth
        .split("-")
        .map((num) => parseInt(num, 10));
      const startDate = new Date(year, month - 1, 1);

      const budgetData = {
        category: categoryName,
        amount: currentAllocation.amount,
        period: "monthly",
        start_date: startDate.toISOString(),
      };

      if (existingBudget) {
        await apiService.updateBudget(existingBudget.id, budgetData);
      } else {
        await apiService.createBudget(budgetData);
      }

      await fetchData();
      handleCloseAllocationDialog();
      setSnackbar({
        open: true,
        message: "Budget allocation saved successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error saving budget allocation:", error);
      setSnackbar({
        open: true,
        message:
          "Failed to save budget allocation. Please check your connection.",
        severity: "error",
      });
    }
  };

  const handleSaveSubcategoryAllocation = async () => {
    try {
      const { categoryName, subcategory, amount } =
        currentSubcategoryAllocation;

      // Create a key for the subcategory budget
      const subcategoryKey = `${categoryName}:${subcategory}`;
      const existingBudget = subcategoryBudgets[subcategoryKey];

      // Parse the current month to create proper date
      const [year, month] = currentMonth
        .split("-")
        .map((num) => parseInt(num, 10));
      const startDate = new Date(year, month - 1, 1);

      const budgetData = {
        category: categoryName,
        subcategory: subcategory,
        amount: amount,
        period: "monthly",
        start_date: startDate.toISOString(),
      };

      if (existingBudget) {
        await apiService.updateBudget(existingBudget.id, budgetData);
      } else {
        await apiService.createBudget(budgetData);
      }

      await fetchData();
      handleCloseSubcategoryAllocationDialog();
      setSnackbar({
        open: true,
        message: "Subcategory budget allocation saved successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error saving subcategory budget allocation:", error);
      setSnackbar({
        open: true,
        message:
          "Failed to save subcategory allocation. Please check your connection.",
        severity: "error",
      });
    }
  };

  // Method to move money from a category to available
  const handleMoveToAvailable = (categoryName) => {
    const budget = budgets[categoryName];
    if (!budget || budget.amount <= 0) return;

    setMoneyMovement({
      fromCategory: categoryName,
      toCategory: "available", // Special value to indicate moving to available funds
      amount: budget.amount,
    });

    setMoveMoneyDialogOpen(true);
  };

  const handleMoveMoney = async () => {
    try {
      const { fromCategory, toCategory, amount } = moneyMovement;

      if (!toCategory || amount <= 0) {
        setSnackbar({
          open: true,
          message:
            "Please select a destination category and enter a valid amount",
          severity: "warning",
        });
        return;
      }

      // Parse current month for correct date formatting
      const [year, month] = currentMonth
        .split("-")
        .map((num) => parseInt(num, 10));
      const startDate = new Date(year, month - 1, 1);

      // If moving from available funds, just add to the target category
      if (fromCategory === "available") {
        if (availableToAllocate < amount) {
          setSnackbar({
            open: true,
            message: "Not enough funds available to allocate",
            severity: "error",
          });
          return;
        }

        // Update target category (increase amount)
        const targetBudget = budgets[toCategory];
        if (targetBudget) {
          await apiService.updateBudget(targetBudget.id, {
            ...targetBudget,
            amount: targetBudget.amount + amount,
          });
        } else {
          await apiService.createBudget({
            category: toCategory,
            amount: amount,
            period: "monthly",
            start_date: startDate.toISOString(),
          });
        }
      }
      // Moving to available funds (special handling)
      else if (toCategory === "available") {
        const sourceBudget = budgets[fromCategory];
        if (!sourceBudget) {
          setSnackbar({
            open: true,
            message: "Source budget not found",
            severity: "error",
          });
          return;
        }

        // Update source category (reduce amount)
        await apiService.updateBudget(sourceBudget.id, {
          ...sourceBudget,
          amount: Math.max(0, sourceBudget.amount - amount), // Ensure we don't go negative
        });
      }
      // Moving from one category to another
      else {
        const sourceBudget = budgets[fromCategory];
        if (!sourceBudget) {
          setSnackbar({
            open: true,
            message: "Source budget not found",
            severity: "error",
          });
          return;
        }

        if (getAvailableForCategory(fromCategory) < amount) {
          setSnackbar({
            open: true,
            message: "Not enough funds available in the source category",
            severity: "error",
          });
          return;
        }

        // Update source category (reduce amount)
        await apiService.updateBudget(sourceBudget.id, {
          ...sourceBudget,
          amount: sourceBudget.amount - amount,
        });

        // Update target category (increase amount)
        const targetBudget = budgets[toCategory];
        if (targetBudget) {
          await apiService.updateBudget(targetBudget.id, {
            ...targetBudget,
            amount: targetBudget.amount + amount,
          });
        } else {
          await apiService.createBudget({
            category: toCategory,
            amount: amount,
            period: "monthly",
            start_date: startDate.toISOString(),
          });
        }
      }

      await fetchData();
      handleCloseMoveMoneyDialog();
      setSnackbar({
        open: true,
        message: "Money moved successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error moving money between categories:", error);
      setSnackbar({
        open: true,
        message:
          "Failed to move money. Please check your connection to the backend.",
        severity: "error",
      });
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      signDisplay: "auto",
    }).format(amount);
  };

  const getAvailableForCategory = (categoryName) => {
    const budget = budgets[categoryName] || { amount: 0 };
    const activity = calculateCategoryActivity(categoryName);
    return budget.amount + activity; // activity is negative for expenses
  };

  const getAvailableForSubcategory = (categoryName, subcategoryName) => {
    const key = `${categoryName}:${subcategoryName}`;
    const budget = subcategoryBudgets[key] || { amount: 0 };
    const activity = calculateSubcategoryActivity(
      categoryName,
      subcategoryName
    );
    return budget.amount + activity; // activity is negative for expenses
  };

  const getSubcategoryBudgetAmount = (categoryName, subcategoryName) => {
    const key = `${categoryName}:${subcategoryName}`;
    const budget = subcategoryBudgets[key];
    return budget ? budget.amount : 0;
  };

  const getProgressColor = (available, budgeted) => {
    if (available >= 0) return "success";
    if (available >= budgeted * -0.1) return "warning";
    return "error";
  };

  // Helper to safely get category name
  const getCategoryName = (category) => {
    if (!category) return "";
    return typeof category.name === "object"
      ? category.name.name
      : category.name;
  };

  // Helper to safely get subcategory name
  const getSubcategoryName = (subcategory) => {
    if (!subcategory) return "";
    return typeof subcategory === "object" ? subcategory.name : subcategory;
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
        <Typography variant="h4">Budget</Typography>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Month</InputLabel>
          <Select
            value={currentMonth}
            onChange={handleMonthChange}
            label="Month"
          >
            {getMonthOptions().map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Available to Allocate Banner */}
      <Paper
        elevation={3}
        sx={{
          p: 2,
          mb: 3,
          bgcolor: availableToAllocate >= 0 ? "success.dark" : "error.dark",
          color: "white",
          cursor: "pointer",
        }}
        onClick={handleOpenMoveMoneyDialog}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography variant="h6">Ready to Assign</Typography>
            <Typography variant="body2">
              {availableToAllocate >= 0
                ? "Click to allocate money to categories"
                : "You've allocated more than you have"}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="h4" sx={{ mr: 2 }}>
              {formatCurrency(availableToAllocate)}
            </Typography>
            <SwapIcon />
          </Box>
        </Box>
      </Paper>

      {/* Budget Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Category</TableCell>
              <TableCell align="right">Budgeted</TableCell>
              <TableCell align="right">Activity</TableCell>
              <TableCell align="right">Available</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((category) => {
              const categoryName = getCategoryName(category);
              return (
                <React.Fragment key={category.id}>
                  {/* Category Row */}
                  <TableRow
                    sx={{
                      bgcolor: "background.default",
                      "&:hover": { bgcolor: "action.hover" },
                      cursor: "pointer",
                    }}
                    onClick={() => toggleCategoryExpansion(category.id)}
                  >
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <IconButton size="small" sx={{ mr: 1 }}>
                          {expandedCategories[category.id] ? (
                            <ExpandLessIcon />
                          ) : (
                            <ExpandMoreIcon />
                          )}
                        </IconButton>
                        <Typography variant="subtitle1">
                          {categoryName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAllocationDialog(
                            category.id,
                            budgets[categoryName]?.amount || 0
                          );
                        }}
                      >
                        {formatCurrency(budgets[categoryName]?.amount || 0)}
                      </Button>
                    </TableCell>
                    <TableCell align="right">
                      <span
                        style={{
                          color: (() => {
                            const value =
                              calculateCategoryActivity(categoryName);
                            if (value < 0) return "#d32f2f"; // error.main
                            if (value > 0) return "#2e7d32"; // success.main
                            return "#fff"; // white for zero
                          })(),
                          fontWeight: "bold",
                        }}
                      >
                        {formatCurrency(
                          calculateCategoryActivity(categoryName)
                        )}
                      </span>
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        color: (() => {
                          const value = getAvailableForCategory(categoryName);
                          if (value < 0) return "#d32f2f"; // error.main
                          if (value > 0) return "#2e7d32"; // success.main
                          return "#fff"; // white for zero
                        })(),
                        fontWeight: "bold",
                      }}
                    >
                      {formatCurrency(getAvailableForCategory(categoryName))}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Move to Available">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveToAvailable(categoryName);
                          }}
                        >
                          <SwapIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>

                  {/* Subcategories (when expanded) */}
                  <TableRow>
                    <TableCell colSpan={4} sx={{ py: 0, border: 0 }}>
                      <Collapse
                        in={expandedCategories[category.id]}
                        timeout="auto"
                        unmountOnExit
                      >
                        <Box sx={{ py: 2 }}>
                          <Table size="small">
                            <TableBody>
                              {category.subcategories &&
                                Array.isArray(category.subcategories) &&
                                category.subcategories.map((subcategory) => {
                                  const subcategoryName =
                                    getSubcategoryName(subcategory);
                                  const activity = calculateSubcategoryActivity(
                                    categoryName,
                                    subcategoryName
                                  );
                                  const budgetAmount =
                                    getSubcategoryBudgetAmount(
                                      categoryName,
                                      subcategoryName
                                    );
                                  const available = getAvailableForSubcategory(
                                    categoryName,
                                    subcategoryName
                                  );

                                  return (
                                    <TableRow key={subcategoryName}>
                                      <TableCell sx={{ pl: 6 }}>
                                        {subcategoryName}
                                      </TableCell>
                                      <TableCell align="right">
                                        <Button
                                          variant="outlined"
                                          size="small"
                                          onClick={() =>
                                            handleOpenSubcategoryAllocationDialog(
                                              category.id,
                                              categoryName,
                                              subcategoryName,
                                              budgetAmount
                                            )
                                          }
                                        >
                                          {formatCurrency(budgetAmount)}
                                        </Button>
                                      </TableCell>
                                      <TableCell align="right">
                                        <span
                                          style={{
                                            color: (() => {
                                              if (activity < 0)
                                                return "#d32f2f"; // error.main
                                              if (activity > 0)
                                                return "#2e7d32"; // success.main
                                              return "#fff"; // white for zero
                                            })(),
                                            fontWeight: "bold",
                                          }}
                                        >
                                          {formatCurrency(activity)}
                                        </span>
                                      </TableCell>
                                      <TableCell
                                        align="right"
                                        sx={{
                                          color: (() => {
                                            if (available < 0) return "#d32f2f"; // error.main
                                            if (available > 0) return "#2e7d32"; // success.main
                                            return "#fff"; // white for zero
                                          })(),
                                          fontWeight: "bold",
                                        }}
                                      >
                                        {formatCurrency(available)}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                            </TableBody>
                          </Table>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Allocation Dialog */}
      <Dialog
        open={allocationDialogOpen}
        onClose={handleCloseAllocationDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Allocate Budget</DialogTitle>
        <DialogContent>
          <TextField
            label="Amount"
            type="number"
            fullWidth
            margin="normal"
            value={currentAllocation.amount}
            onChange={(e) =>
              setCurrentAllocation((prev) => ({
                ...prev,
                amount: parseFloat(e.target.value) || 0,
              }))
            }
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">$</InputAdornment>
              ),
            }}
          />

          {/* Dynamic allocation preview */}
          {currentAllocation.categoryId && categories.length > 0 && (
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
              {(() => {
                const category = categories.find(
                  (c) => c.id === currentAllocation.categoryId
                );
                const categoryName = category ? getCategoryName(category) : "";
                const currentBudget = budgets[categoryName]?.amount || 0;
                const difference = currentAllocation.amount - currentBudget;
                const newAvailable = availableToAllocate - difference;

                return (
                  <>
                    <Typography
                      variant="subtitle1"
                      gutterBottom
                      fontWeight="bold"
                    >
                      Allocation Preview
                    </Typography>

                    <Grid container spacing={2}>
                      {/* Category info */}
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Category:
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {categoryName}
                        </Typography>
                        <Box
                          sx={{ display: "flex", alignItems: "center", mt: 1 }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            Current:
                          </Typography>
                          <Typography variant="body1" sx={{ ml: 1 }}>
                            {formatCurrency(currentBudget)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Typography variant="body2" color="text.secondary">
                            New:
                          </Typography>
                          <Typography
                            variant="body1"
                            fontWeight="bold"
                            color={
                              difference > 0
                                ? "success.main"
                                : difference < 0
                                ? "error.main"
                                : "text.primary"
                            }
                            sx={{ ml: 1 }}
                          >
                            {formatCurrency(currentAllocation.amount)}
                          </Typography>
                        </Box>
                      </Grid>

                      {/* Available funds */}
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Available to Allocate:
                        </Typography>
                        <Box
                          sx={{ display: "flex", alignItems: "center", mt: 1 }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            Current:
                          </Typography>
                          <Typography variant="body1" sx={{ ml: 1 }}>
                            {formatCurrency(availableToAllocate)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Typography variant="body2" color="text.secondary">
                            New:
                          </Typography>
                          <Typography
                            variant="body1"
                            fontWeight="bold"
                            color={
                              newAvailable >= 0 ? "success.main" : "error.main"
                            }
                            sx={{ ml: 1 }}
                          >
                            {formatCurrency(newAvailable)}
                          </Typography>
                        </Box>
                      </Grid>

                      {/* Change indicator */}
                      {difference !== 0 && (
                        <Grid item xs={12} sx={{ mt: 1 }}>
                          <Divider />
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              mt: 1,
                              py: 1,
                            }}
                          >
                            <Typography
                              variant="body1"
                              color={
                                difference > 0
                                  ? "primary.main"
                                  : "text.secondary"
                              }
                              fontWeight="medium"
                            >
                              {difference > 0
                                ? `${formatCurrency(
                                    difference
                                  )} will be added from available funds`
                                : difference < 0
                                ? `${formatCurrency(
                                    Math.abs(difference)
                                  )} will be returned to available funds`
                                : "No change in allocation"}
                            </Typography>
                          </Box>
                        </Grid>
                      )}
                    </Grid>
                  </>
                );
              })()}
            </Paper>
          )}

          {currentAllocation.amount > availableToAllocate && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              This allocation exceeds your available funds
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAllocationDialog}>Cancel</Button>
          <Button
            onClick={handleSaveAllocation}
            variant="contained"
            disabled={currentAllocation.amount < 0}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Subcategory Allocation Dialog */}
      <Dialog
        open={subcategoryAllocationDialogOpen}
        onClose={handleCloseSubcategoryAllocationDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Allocate to Subcategory</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" gutterBottom>
            {currentSubcategoryAllocation.categoryName} &gt;{" "}
            {currentSubcategoryAllocation.subcategory}
          </Typography>
          <TextField
            label="Amount"
            type="number"
            fullWidth
            margin="normal"
            value={currentSubcategoryAllocation.amount}
            onChange={(e) =>
              setCurrentSubcategoryAllocation((prev) => ({
                ...prev,
                amount: parseFloat(e.target.value) || 0,
              }))
            }
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">$</InputAdornment>
              ),
            }}
          />

          {/* Dynamic subcategory allocation preview */}
          {currentSubcategoryAllocation.categoryName &&
            currentSubcategoryAllocation.subcategory && (
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
                {(() => {
                  const categoryName =
                    currentSubcategoryAllocation.categoryName;
                  const subcategory = currentSubcategoryAllocation.subcategory;
                  const key = `${categoryName}:${subcategory}`;
                  const currentBudget = subcategoryBudgets[key]?.amount || 0;
                  const parentBudget = budgets[categoryName]?.amount || 0;
                  const difference =
                    currentSubcategoryAllocation.amount - currentBudget;

                  // Calculate total allocated to subcategories
                  const allSubcategoryBudgets = Object.entries(
                    subcategoryBudgets
                  )
                    .filter(([key]) => key.startsWith(`${categoryName}:`))
                    .reduce((sum, [_, budget]) => sum + budget.amount, 0);

                  // Calculate the new subcategory total
                  const newSubcategoryTotal =
                    allSubcategoryBudgets -
                    currentBudget +
                    currentSubcategoryAllocation.amount;

                  // Calculate how much is allocated to parent vs subcategories
                  const allocatedToParent =
                    parentBudget - allSubcategoryBudgets;
                  const newAllocatedToParent =
                    parentBudget - newSubcategoryTotal;

                  return (
                    <>
                      <Typography
                        variant="subtitle1"
                        gutterBottom
                        fontWeight="bold"
                      >
                        Subcategory Allocation Preview
                      </Typography>

                      <Grid container spacing={2}>
                        {/* Subcategory info */}
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Subcategory Budget:
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              mt: 1,
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              Current:
                            </Typography>
                            <Typography variant="body1" sx={{ ml: 1 }}>
                              {formatCurrency(currentBudget)}
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Typography variant="body2" color="text.secondary">
                              New:
                            </Typography>
                            <Typography
                              variant="body1"
                              fontWeight="bold"
                              color={
                                difference > 0
                                  ? "success.main"
                                  : difference < 0
                                  ? "error.main"
                                  : "text.primary"
                              }
                              sx={{ ml: 1 }}
                            >
                              {formatCurrency(
                                currentSubcategoryAllocation.amount
                              )}
                            </Typography>
                          </Box>
                        </Grid>

                        {/* Parent category */}
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Parent Category:
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              mt: 1,
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              Remaining:
                            </Typography>
                            <Typography
                              variant="body1"
                              sx={{ ml: 1 }}
                              color={
                                allocatedToParent < 0
                                  ? "error.main"
                                  : "text.primary"
                              }
                            >
                              {formatCurrency(allocatedToParent)}
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Typography variant="body2" color="text.secondary">
                              New Remaining:
                            </Typography>
                            <Typography
                              variant="body1"
                              fontWeight="bold"
                              color={
                                newAllocatedToParent < 0
                                  ? "error.main"
                                  : "text.primary"
                              }
                              sx={{ ml: 1 }}
                            >
                              {formatCurrency(newAllocatedToParent)}
                            </Typography>
                          </Box>
                        </Grid>

                        {/* Allocation summary */}
                        <Grid item xs={12} sx={{ mt: 1 }}>
                          <Divider />
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              mt: 1,
                              py: 1,
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              Summary:
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                mt: 1,
                              }}
                            >
                              <Typography variant="body2">
                                Total category budget:
                              </Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {formatCurrency(parentBudget)}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                              }}
                            >
                              <Typography variant="body2">
                                Allocated to subcategories:
                              </Typography>
                              <Typography
                                variant="body2"
                                fontWeight="medium"
                                color={
                                  newSubcategoryTotal > parentBudget
                                    ? "error.main"
                                    : "text.primary"
                                }
                              >
                                {formatCurrency(newSubcategoryTotal)}
                              </Typography>
                            </Box>
                            {newSubcategoryTotal > parentBudget && (
                              <Typography
                                variant="body2"
                                color="error"
                                sx={{ mt: 1 }}
                              >
                                Warning: Subcategory allocations exceed the
                                parent category budget
                              </Typography>
                            )}
                            {difference !== 0 && (
                              <Typography
                                variant="body1"
                                color={
                                  difference > 0
                                    ? "primary.main"
                                    : "text.secondary"
                                }
                                fontWeight="medium"
                                align="center"
                                sx={{ mt: 1 }}
                              >
                                {difference > 0
                                  ? `${formatCurrency(
                                      difference
                                    )} will be added to this subcategory`
                                  : `${formatCurrency(
                                      Math.abs(difference)
                                    )} will be removed from this subcategory`}
                              </Typography>
                            )}
                          </Box>
                        </Grid>
                      </Grid>
                    </>
                  );
                })()}
              </Paper>
            )}

          {currentSubcategoryAllocation.amount > availableToAllocate && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              This allocation exceeds your available funds
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSubcategoryAllocationDialog}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveSubcategoryAllocation}
            variant="contained"
            disabled={currentSubcategoryAllocation.amount < 0}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Move Money Dialog */}
      <Dialog
        open={moveMoneyDialogOpen}
        onClose={handleCloseMoveMoneyDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Move Money</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>From</InputLabel>
                <Select
                  value={moneyMovement.fromCategory}
                  onChange={(e) =>
                    setMoneyMovement((prev) => ({
                      ...prev,
                      fromCategory: e.target.value,
                    }))
                  }
                  label="From"
                >
                  <MenuItem value="available">
                    Available to Allocate ({formatCurrency(availableToAllocate)}
                    )
                  </MenuItem>
                  {categories.map((category) => {
                    const categoryName = getCategoryName(category);
                    const available = getAvailableForCategory(categoryName);
                    return (
                      <MenuItem
                        key={category.id}
                        value={categoryName}
                        disabled={available <= 0}
                      >
                        {categoryName} ({formatCurrency(available)})
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>To</InputLabel>
                <Select
                  value={moneyMovement.toCategory || ""}
                  onChange={(e) =>
                    setMoneyMovement((prev) => ({
                      ...prev,
                      toCategory: e.target.value,
                    }))
                  }
                  label="To"
                >
                  {moneyMovement.fromCategory !== "available" && (
                    <MenuItem value="available">Available to Allocate</MenuItem>
                  )}
                  {categories.map((category) => {
                    const categoryName = getCategoryName(category);
                    return (
                      <MenuItem
                        key={category.id}
                        value={categoryName}
                        disabled={moneyMovement.fromCategory === categoryName}
                      >
                        {categoryName}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Amount"
                type="number"
                fullWidth
                value={moneyMovement.amount}
                onChange={(e) =>
                  setMoneyMovement((prev) => ({
                    ...prev,
                    amount: parseFloat(e.target.value) || 0,
                  }))
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">$</InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Dynamic calculation preview */}
            {moneyMovement.amount > 0 && moneyMovement.toCategory && (
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
                    Transfer Preview
                  </Typography>

                  <Grid container spacing={2}>
                    {/* From category */}
                    <Grid item xs={5}>
                      <Typography variant="body2" color="text.secondary">
                        From:
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {moneyMovement.fromCategory === "available"
                          ? "Available to Allocate"
                          : moneyMovement.fromCategory}
                      </Typography>
                      <Box
                        sx={{ display: "flex", alignItems: "center", mt: 1 }}
                      >
                        <Typography
                          variant="body1"
                          color="text.primary"
                          sx={{ mr: 1 }}
                        >
                          {formatCurrency(
                            moneyMovement.fromCategory === "available"
                              ? availableToAllocate
                              : budgets[moneyMovement.fromCategory]?.amount || 0
                          )}
                        </Typography>
                        <ArrowForwardIcon color="action" fontSize="small" />
                        <Typography
                          variant="body1"
                          color="error.main"
                          fontWeight="bold"
                          sx={{ ml: 1 }}
                        >
                          {formatCurrency(
                            moneyMovement.fromCategory === "available"
                              ? availableToAllocate - moneyMovement.amount
                              : (budgets[moneyMovement.fromCategory]?.amount ||
                                  0) - moneyMovement.amount
                          )}
                        </Typography>
                      </Box>
                    </Grid>

                    {/* Arrow */}
                    <Grid
                      item
                      xs={2}
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <SwapIcon color="primary" fontSize="large" />
                    </Grid>

                    {/* To category */}
                    <Grid item xs={5}>
                      <Typography variant="body2" color="text.secondary">
                        To:
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {moneyMovement.toCategory}
                      </Typography>
                      <Box
                        sx={{ display: "flex", alignItems: "center", mt: 1 }}
                      >
                        <Typography
                          variant="body1"
                          color="text.primary"
                          sx={{ mr: 1 }}
                        >
                          {formatCurrency(
                            budgets[moneyMovement.toCategory]?.amount || 0
                          )}
                        </Typography>
                        <ArrowForwardIcon color="action" fontSize="small" />
                        <Typography
                          variant="body1"
                          color="success.main"
                          fontWeight="bold"
                          sx={{ ml: 1 }}
                        >
                          {formatCurrency(
                            (budgets[moneyMovement.toCategory]?.amount || 0) +
                              moneyMovement.amount
                          )}
                        </Typography>
                      </Box>
                    </Grid>

                    {/* Amount indicator */}
                    <Grid item xs={12} sx={{ mt: 1 }}>
                      <Divider />
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          mt: 1,
                          py: 1,
                        }}
                      >
                        <Typography
                          variant="h6"
                          color="primary.main"
                          fontWeight="bold"
                        >
                          {formatCurrency(moneyMovement.amount)} will be moved
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMoveMoneyDialog}>Cancel</Button>
          <Button
            onClick={handleMoveMoney}
            variant="contained"
            disabled={
              !moneyMovement.toCategory ||
              moneyMovement.amount <= 0 ||
              (moneyMovement.fromCategory !== "available" &&
                getAvailableForCategory(moneyMovement.fromCategory) <
                  moneyMovement.amount) ||
              (moneyMovement.fromCategory === "available" &&
                availableToAllocate < moneyMovement.amount)
            }
          >
            Move Money
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
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Budgets;
