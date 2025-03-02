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
import { format } from "date-fns";

const Budgets = ({ apiService }) => {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [subcategoryBudgets, setSubcategoryBudgets] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [availableToAllocate, setAvailableToAllocate] = useState(0);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [currentMonth, setCurrentMonth] = useState(
    format(new Date(), "yyyy-MM")
  );
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

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch categories
      const categoriesData = await apiService.getCategories();
      setCategories(categoriesData);

      // Fetch budgets for current month
      const budgetsData = await apiService.getBudgets();

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

      setBudgets(budgetsByCategory);
      setSubcategoryBudgets(subcategoryBudgetMap);

      // Fetch accounts for total available calculation
      const accountsData = await apiService.getAccounts();
      setAccounts(accountsData);

      // Fetch transactions for the current month
      const startDate = new Date(currentMonth + "-01");
      const endDate = new Date(
        startDate.getFullYear(),
        startDate.getMonth() + 1,
        0
      );
      const transactionsData = await apiService.getTransactions({
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      });
      setTransactions(transactionsData);

      // Calculate available to allocate
      const totalBalance = accountsData.reduce(
        (sum, account) => sum + account.balance,
        0
      );

      // Add income transactions to available to allocate
      const monthlyIncome = transactionsData
        .filter((tx) => tx.is_income && !tx.category) // Only count uncategorized income
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

      setAvailableToAllocate(totalBalance + monthlyIncome - totalAllocated);
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
    setCurrentMonth(event.target.value);
  };

  const toggleCategoryExpansion = (categoryId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const calculateCategoryActivity = (categoryName) => {
    return transactions
      .filter((tx) => tx.category === categoryName && !tx.is_income)
      .reduce((sum, tx) => sum + tx.amount, 0);
  };

  const calculateSubcategoryActivity = (categoryName, subcategoryName) => {
    return transactions
      .filter(
        (tx) =>
          tx.category === categoryName &&
          tx.subcategory === subcategoryName &&
          !tx.is_income
      )
      .reduce((sum, tx) => sum + tx.amount, 0);
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
      const budgetData = {
        category: categoryName,
        amount: currentAllocation.amount,
        period: "monthly",
        start_date: new Date(currentMonth + "-01").toISOString(),
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

      const budgetData = {
        category: categoryName,
        subcategory: subcategory,
        amount: amount,
        period: "monthly",
        start_date: new Date(currentMonth + "-01").toISOString(),
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
            start_date: new Date(currentMonth + "-01").toISOString(),
          });
        }
      } else {
        // Moving from one category to another
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
            start_date: new Date(currentMonth + "-01").toISOString(),
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
            {Array.from({ length: 12 }, (_, i) => {
              const date = new Date();
              date.setMonth(date.getMonth() - i);
              const value = format(date, "yyyy-MM");
              return (
                <MenuItem key={value} value={value}>
                  {format(date, "MMMM yyyy")}
                </MenuItem>
              );
            })}
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
                    <TableCell align="right" sx={{ color: "error.main" }}>
                      {formatCurrency(calculateCategoryActivity(categoryName))}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        color:
                          getAvailableForCategory(categoryName) >= 0
                            ? "success.main"
                            : "error.main",
                        fontWeight: "bold",
                      }}
                    >
                      {formatCurrency(getAvailableForCategory(categoryName))}
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
                                      <TableCell
                                        align="right"
                                        sx={{
                                          color:
                                            activity < 0
                                              ? "error.main"
                                              : "inherit",
                                        }}
                                      >
                                        {formatCurrency(activity)}
                                      </TableCell>
                                      <TableCell
                                        align="right"
                                        sx={{
                                          color:
                                            available >= 0
                                              ? "success.main"
                                              : "error.main",
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
