import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Divider,
  LinearProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from "@mui/material";
import {
  AccountBalance as AccountsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ArrowForward as ArrowForwardIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
} from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title
);

const Dashboard = ({ apiService }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [netWorth, setNetWorth] = useState({
    assets: 0,
    liabilities: 0,
    net_worth: 0,
  });
  const [budgets, setBudgets] = useState([]);
  const [spendingData, setSpendingData] = useState({
    labels: [],
    datasets: [],
  });
  const [balanceData, setBalanceData] = useState({ labels: [], datasets: [] });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch accounts
        const accountsData = await apiService.getAccounts();
        setAccounts(accountsData);

        // Fetch recent transactions
        const transactionsData = await apiService.getTransactions({ limit: 5 });
        setTransactions(transactionsData);

        // Calculate net worth from accounts
        const assets = accountsData
          .filter((account) =>
            ["checking", "savings", "investment", "cash", "other"].includes(
              account.type
            )
          )
          .reduce((sum, account) => sum + account.balance, 0);

        const liabilities = accountsData
          .filter((account) =>
            ["credit", "loan", "mortgage", "debt"].includes(account.type)
          )
          .reduce((sum, account) => sum + account.balance, 0);

        setNetWorth({
          assets,
          liabilities,
          net_worth: assets - liabilities,
        });

        // Fetch budget data
        const budgetsData = await apiService.getBudgets();
        setBudgets(budgetsData);

        // Fetch spending by category for chart
        const spendingByCategory = await apiService.getSpendingByCategory(
          "month"
        );

        // Prepare data for spending chart
        const chartData = {
          labels: spendingByCategory.map((item) => item.category),
          datasets: [
            {
              data: spendingByCategory.map((item) => item.spending),
              backgroundColor: [
                "#FF6384",
                "#36A2EB",
                "#FFCE56",
                "#4BC0C0",
                "#9966FF",
                "#FF9F40",
                "#8AC249",
                "#EA80FC",
                "#00E5FF",
                "#FF5252",
              ],
              borderWidth: 1,
            },
          ],
        };
        setSpendingData(chartData);

        // Mock data for balance trend (would be replaced with actual API call)
        const today = new Date();
        const labels = Array.from({ length: 7 }, (_, i) => {
          const date = new Date(today);
          date.setDate(date.getDate() - (6 - i));
          return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
        });

        const balanceChartData = {
          labels,
          datasets: [
            {
              label: "Balance",
              data: [8500, 8700, 8600, 8900, 8700, 9200, 9500],
              borderColor: "#3f51b5",
              backgroundColor: "rgba(63, 81, 181, 0.1)",
              tension: 0.4,
              fill: true,
            },
          ],
        };
        setBalanceData(balanceChartData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [apiService]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (loading) {
    return <LinearProgress />;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {/* Net Worth Summary */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Assets
              </Typography>
              <Typography variant="h4">
                {formatCurrency(netWorth.assets)}
              </Typography>
              <Typography
                variant="body2"
                color="success.main"
                sx={{ display: "flex", alignItems: "center" }}
              >
                <TrendingUpIcon fontSize="small" sx={{ mr: 0.5 }} />
                +2.5% this month
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Liabilities
              </Typography>
              <Typography variant="h4">
                {formatCurrency(Math.abs(netWorth.liabilities))}
              </Typography>
              <Typography
                variant="body2"
                color="error.main"
                sx={{ display: "flex", alignItems: "center" }}
              >
                <TrendingDownIcon fontSize="small" sx={{ mr: 0.5 }} />
                +1.2% this month
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Net Worth
              </Typography>
              <Typography variant="h4">
                {formatCurrency(netWorth.net_worth)}
              </Typography>
              <Typography
                variant="body2"
                color={netWorth.net_worth >= 0 ? "success.main" : "error.main"}
                sx={{ display: "flex", alignItems: "center" }}
              >
                {netWorth.net_worth >= 0 ? (
                  <>
                    <TrendingUpIcon fontSize="small" sx={{ mr: 0.5 }} />
                    +3.7% this month
                  </>
                ) : (
                  <>
                    <TrendingDownIcon fontSize="small" sx={{ mr: 0.5 }} />
                    -1.5% this month
                  </>
                )}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts & Lists */}
      <Grid container spacing={3}>
        {/* Left Column - Spending & Accounts */}
        <Grid item xs={12} md={7}>
          {/* Monthly Spending */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Monthly Spending by Category
              </Typography>
              <Box
                sx={{ height: 300, display: "flex", justifyContent: "center" }}
              >
                {spendingData.labels.length > 0 ? (
                  <Doughnut
                    data={spendingData}
                    options={{
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: "right",
                        },
                      },
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                    }}
                  >
                    <Typography variant="body1" color="text.secondary">
                      No spending data available
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Accounts List */}
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h6">Accounts</Typography>
                <Button
                  startIcon={<AddIcon />}
                  variant="outlined"
                  size="small"
                  onClick={() => navigate("/accounts")}
                >
                  Add Account
                </Button>
              </Box>

              <List>
                {accounts.length > 0 ? (
                  accounts.slice(0, 5).map((account) => (
                    <React.Fragment key={account.id}>
                      <ListItem
                        secondaryAction={
                          <IconButton
                            edge="end"
                            onClick={() => navigate(`/accounts/${account.id}`)}
                          >
                            <ArrowForwardIcon />
                          </IconButton>
                        }
                      >
                        <ListItemText
                          primary={account.name}
                          secondary={account.institution}
                        />
                        <Typography
                          variant="body1"
                          sx={{ minWidth: 100, textAlign: "right", mr: 2 }}
                        >
                          {formatCurrency(account.balance)}
                        </Typography>
                      </ListItem>
                      <Divider component="li" />
                    </React.Fragment>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText
                      primary="No accounts found"
                      secondary="Add your first account to get started"
                    />
                  </ListItem>
                )}

                {accounts.length > 5 && (
                  <ListItem>
                    <Button
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => navigate("/accounts")}
                      fullWidth
                      sx={{ justifyContent: "center", mt: 1 }}
                    >
                      View All Accounts
                    </Button>
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Balance Trend & Transactions */}
        <Grid item xs={12} md={5}>
          {/* Balance Trend */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Balance Trend
              </Typography>
              <Box sx={{ height: 200 }}>
                <Line
                  data={balanceData}
                  options={{
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      x: {
                        grid: {
                          display: false,
                        },
                      },
                      y: {
                        beginAtZero: false,
                      },
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h6">Recent Transactions</Typography>
                <Button
                  startIcon={<AddIcon />}
                  variant="outlined"
                  size="small"
                  onClick={() => navigate("/transactions")}
                >
                  Add Transaction
                </Button>
              </Box>

              <List>
                {transactions.length > 0 ? (
                  transactions.map((transaction) => (
                    <React.Fragment key={transaction.id}>
                      <ListItem>
                        <ListItemText
                          primary={transaction.description}
                          secondary={new Date(
                            transaction.date
                          ).toLocaleDateString()}
                        />
                        <Typography
                          variant="body2"
                          color={
                            transaction.is_income ? "success.main" : "inherit"
                          }
                        >
                          {transaction.is_income ? "+" : ""}
                          {formatCurrency(transaction.amount)}
                        </Typography>
                      </ListItem>
                      <Divider component="li" />
                    </React.Fragment>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText
                      primary="No transactions found"
                      secondary="Add your first transaction to get started"
                    />
                  </ListItem>
                )}

                {transactions.length > 0 && (
                  <ListItem>
                    <Button
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => navigate("/transactions")}
                      fullWidth
                      sx={{ justifyContent: "center", mt: 1 }}
                    >
                      View All Transactions
                    </Button>
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
