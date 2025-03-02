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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Snackbar,
  Alert,
  Paper,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";

const Accounts = ({ apiService }) => {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentAccount, setCurrentAccount] = useState({
    name: "",
    type: "checking",
    balance: "",
    institution: "",
    account_number: "",
    currency: "USD",
  });
  const [editMode, setEditMode] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const data = await apiService.getAccounts();
      setAccounts(data);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      setSnackbar({
        open: true,
        message: "Failed to load accounts",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [apiService]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleOpenMenu = (event, accountId) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedAccountId(accountId);
  };

  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
  };

  const handleOpenDialog = (account = null) => {
    handleCloseMenu();
    if (account) {
      setCurrentAccount({ ...account });
      setEditMode(true);
    } else {
      setCurrentAccount({
        name: "",
        type: "checking",
        balance: "",
        institution: "",
        account_number: "",
        currency: "USD",
      });
      setEditMode(false);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleOpenDeleteDialog = () => {
    handleCloseMenu();
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentAccount((prev) => ({
      ...prev,
      [name]: name === "balance" ? parseFloat(value) || "" : value,
    }));
  };

  const handleSaveAccount = async () => {
    try {
      if (editMode) {
        await apiService.updateAccount(currentAccount.id, currentAccount);
        setSnackbar({
          open: true,
          message: "Account updated successfully",
          severity: "success",
        });
      } else {
        await apiService.createAccount(currentAccount);
        setSnackbar({
          open: true,
          message: "Account created successfully",
          severity: "success",
        });
      }
      handleCloseDialog();
      fetchAccounts();
    } catch (error) {
      console.error("Error saving account:", error);
      setSnackbar({
        open: true,
        message: `Failed to ${editMode ? "update" : "create"} account`,
        severity: "error",
      });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await apiService.deleteAccount(selectedAccountId);
      setSnackbar({
        open: true,
        message: "Account deleted successfully",
        severity: "success",
      });
      handleCloseDeleteDialog();
      fetchAccounts();
    } catch (error) {
      console.error("Error deleting account:", error);
      setSnackbar({
        open: true,
        message: "Failed to delete account",
        severity: "error",
      });
    }
  };

  // Group accounts by type
  const groupedAccounts = accounts.reduce((groups, account) => {
    const group = groups[account.type] || [];
    group.push(account);
    groups[account.type] = group;
    return groups;
  }, {});

  const accountTypes = Object.keys(groupedAccounts);

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
        <Typography variant="h4">Accounts</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Account
        </Button>
      </Box>

      {accountTypes.length === 0 ? (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="h6" gutterBottom>
                No Accounts Found
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Add your first account to start tracking your finances
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Add Account
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        accountTypes.map((type) => (
          <Box key={type} sx={{ mb: 4 }}>
            <Typography
              variant="h6"
              sx={{ mb: 2, textTransform: "capitalize" }}
            >
              {type} Accounts
            </Typography>
            <Grid container spacing={3}>
              {groupedAccounts[type].map((account) => (
                <Grid item xs={12} sm={6} md={4} key={account.id}>
                  <Card>
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 2,
                        }}
                      >
                        <Typography variant="h6">{account.name}</Typography>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Chip
                            label={account.type}
                            size="small"
                            color={
                              account.type === "checking" ||
                              account.type === "savings"
                                ? "primary"
                                : account.type === "investment"
                                ? "success"
                                : account.type === "credit" ||
                                  account.type === "loan"
                                ? "error"
                                : "default"
                            }
                            sx={{ mr: 1 }}
                          />
                          <Tooltip title="Account Options">
                            <IconButton
                              size="small"
                              onClick={(e) => handleOpenMenu(e, account.id)}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                      {account.institution && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          gutterBottom
                        >
                          {account.institution}
                        </Typography>
                      )}
                      <Divider sx={{ my: 2 }} />
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Current Balance
                        </Typography>
                        <Typography
                          variant="h6"
                          color={
                            account.balance >= 0 ? "inherit" : "error.main"
                          }
                        >
                          {formatCurrency(account.balance)}
                        </Typography>
                      </Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", textAlign: "right", mt: 1 }}
                      >
                        Last updated:{" "}
                        {new Date(account.last_updated).toLocaleDateString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        ))
      )}

      {/* Account Options Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem
          onClick={() =>
            handleOpenDialog(accounts.find((a) => a.id === selectedAccountId))
          }
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleOpenDeleteDialog}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: "error.main" }}>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Add/Edit Account Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editMode ? "Edit Account" : "Add New Account"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, pb: 1 }}>
            <TextField
              name="name"
              label="Account Name"
              fullWidth
              margin="normal"
              value={currentAccount.name}
              onChange={handleInputChange}
              required
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Account Type</InputLabel>
              <Select
                name="type"
                value={currentAccount.type}
                onChange={handleInputChange}
                label="Account Type"
              >
                <MenuItem value="checking">Checking</MenuItem>
                <MenuItem value="savings">Savings</MenuItem>
                <MenuItem value="credit">Credit Card</MenuItem>
                <MenuItem value="investment">Investment</MenuItem>
                <MenuItem value="loan">Loan</MenuItem>
                <MenuItem value="mortgage">Mortgage</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField
              name="balance"
              label="Current Balance"
              type="number"
              fullWidth
              margin="normal"
              value={currentAccount.balance}
              onChange={handleInputChange}
              required
              InputProps={{
                startAdornment: "$",
              }}
            />
            <TextField
              name="institution"
              label="Financial Institution"
              fullWidth
              margin="normal"
              value={currentAccount.institution || ""}
              onChange={handleInputChange}
            />
            <TextField
              name="account_number"
              label="Account Number (Last 4 digits)"
              fullWidth
              margin="normal"
              value={currentAccount.account_number || ""}
              onChange={handleInputChange}
              inputProps={{ maxLength: 4 }}
              helperText="For your reference only"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Currency</InputLabel>
              <Select
                name="currency"
                value={currentAccount.currency}
                onChange={handleInputChange}
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

            {/* Account Impact Preview */}
            {currentAccount.balance !== "" && (
              <Box sx={{ mt: 3 }}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
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
                    Account Impact Preview
                  </Typography>

                  {(() => {
                    // Calculate current net worth from existing accounts
                    const isAssetType = ![
                      "credit",
                      "loan",
                      "mortgage",
                      "debt",
                    ].includes(currentAccount.type);

                    // Calculate net worth information
                    const existingAssets = accounts
                      .filter(
                        (account) =>
                          !["credit", "loan", "mortgage", "debt"].includes(
                            account.type
                          ) &&
                          (!editMode || account.id !== currentAccount.id)
                      )
                      .reduce((sum, account) => sum + account.balance, 0);

                    const existingLiabilities = accounts
                      .filter(
                        (account) =>
                          ["credit", "loan", "mortgage", "debt"].includes(
                            account.type
                          ) &&
                          (!editMode || account.id !== currentAccount.id)
                      )
                      .reduce((sum, account) => sum + account.balance, 0);

                    // Calculate new values with this account
                    const newBalance = parseFloat(currentAccount.balance) || 0;
                    const newAssets = isAssetType
                      ? existingAssets + newBalance
                      : existingAssets;

                    const newLiabilities = !isAssetType
                      ? existingLiabilities + newBalance
                      : existingLiabilities;

                    const currentNetWorth =
                      existingAssets - existingLiabilities;
                    const newNetWorth = newAssets - newLiabilities;
                    const netWorthChange = newNetWorth - currentNetWorth;

                    return (
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Account Type
                          </Typography>
                          <Typography variant="body1">
                            {currentAccount.type.charAt(0).toUpperCase() +
                              currentAccount.type.slice(1)}
                            {isAssetType ? " (Asset)" : " (Liability)"}
                          </Typography>

                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                              Account Balance
                            </Typography>
                            <Typography
                              variant="body1"
                              fontWeight="bold"
                              color={
                                (isAssetType && newBalance > 0) ||
                                (!isAssetType && newBalance < 0)
                                  ? "success.main"
                                  : "error.main"
                              }
                            >
                              {formatCurrency(newBalance)}
                            </Typography>
                          </Box>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Net Worth Impact
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
                            <Typography
                              variant="body1"
                              sx={{ ml: 1 }}
                              color={
                                currentNetWorth >= 0
                                  ? "success.main"
                                  : "error.main"
                              }
                            >
                              {formatCurrency(currentNetWorth)}
                            </Typography>
                          </Box>

                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Typography variant="body2" color="text.secondary">
                              New:
                            </Typography>
                            <Typography
                              variant="body1"
                              fontWeight="bold"
                              sx={{ ml: 1 }}
                              color={
                                newNetWorth >= 0 ? "success.main" : "error.main"
                              }
                            >
                              {formatCurrency(newNetWorth)}
                            </Typography>
                          </Box>

                          {editMode && (
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
                                Change:
                              </Typography>
                              <Typography
                                variant="body1"
                                fontWeight="bold"
                                sx={{ ml: 1 }}
                                color={
                                  netWorthChange >= 0
                                    ? "success.main"
                                    : "error.main"
                                }
                              >
                                {netWorthChange > 0 ? "+" : ""}
                                {formatCurrency(netWorthChange)}
                              </Typography>
                            </Box>
                          )}
                        </Grid>

                        <Grid item xs={12}>
                          <Divider sx={{ my: 1 }} />
                          <Alert
                            severity={isAssetType ? "info" : "warning"}
                            variant="outlined"
                            sx={{ mt: 1 }}
                          >
                            {isAssetType
                              ? "Assets contribute positively to your net worth."
                              : "Liabilities reduce your net worth. Make sure to enter a positive value for the balance amount."}
                          </Alert>
                        </Grid>
                      </Grid>
                    );
                  })()}
                </Paper>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSaveAccount}
            variant="contained"
            disabled={
              !currentAccount.name || currentAccount.balance === undefined
            }
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this account? This action cannot be
            undone.
          </Typography>
          <Typography variant="body2" color="error.main" sx={{ mt: 1 }}>
            All transactions associated with this account will also be deleted.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button
            onClick={handleDeleteAccount}
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

export default Accounts;
