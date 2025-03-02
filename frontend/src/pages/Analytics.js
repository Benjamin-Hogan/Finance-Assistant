import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Tabs,
  Tab,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
} from "@mui/material";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar, Pie, Doughnut } from "react-chartjs-2";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Analytics = ({ apiService }) => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [timeframe, setTimeframe] = useState("month");
  const [spendingData, setSpendingData] = useState([]);
  const [incomeData, setIncomeData] = useState([]);
  const [balanceData, setBalanceData] = useState([]);
  const [projections, setProjections] = useState(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, [apiService, timeframe]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Fetch spending by category
      const spending = await apiService.getSpendingByCategory(timeframe);
      setSpendingData(spending);

      // Fetch income by source
      const income = await apiService.getIncomeBySource(timeframe);
      setIncomeData(income);

      // Fetch future projections (12 months)
      const projectionData = await apiService.getProjections(12);
      setProjections(projectionData);

      // Mock balance data (would normally come from an API endpoint)
      const mockBalanceData = generateMockBalanceData();
      setBalanceData(mockBalanceData);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Generate mock balance data for demonstration
  const generateMockBalanceData = () => {
    const today = new Date();
    const data = [];
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      data.push({
        date: date.toISOString().split("T")[0],
        balance: 5000 + Math.random() * 2000 - i * 50 + i * i * 2,
      });
    }
    return data;
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleTimeframeChange = (event) => {
    setTimeframe(event.target.value);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Chart configurations
  const spendingChartData = {
    labels: spendingData.map((item) => item.category).slice(0, 7),
    datasets: [
      {
        label: "Spending",
        data: spendingData.map((item) => Math.abs(item.spending)).slice(0, 7),
        backgroundColor: [
          "#FF6384",
          "#36A2EB",
          "#FFCE56",
          "#4BC0C0",
          "#9966FF",
          "#FF9F40",
          "#607D8B",
        ],
        borderWidth: 1,
      },
    ],
  };

  const incomeChartData = {
    labels: incomeData.map((item) => item.category),
    datasets: [
      {
        label: "Income",
        data: incomeData.map((item) => item.income),
        backgroundColor: [
          "#4CAF50",
          "#8BC34A",
          "#CDDC39",
          "#FFC107",
          "#FF9800",
          "#FF5722",
        ],
        borderWidth: 1,
      },
    ],
  };

  const balanceChartData = {
    labels: balanceData.map((item) => item.date),
    datasets: [
      {
        label: "Balance",
        data: balanceData.map((item) => item.balance),
        fill: true,
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        tension: 0.4,
      },
    ],
  };

  const balanceOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Balance Over Time",
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "right",
      },
    },
  };

  // If projections data is available, prepare chart data
  const projectionsChartData = projections
    ? {
        labels: projections.projections.map((item) => item.month),
        datasets: [
          {
            type: "line",
            label: "Projected Balance",
            data: projections.projections.map((item) => item.projected_balance),
            borderColor: "rgb(75, 192, 192)",
            backgroundColor: "rgba(75, 192, 192, 0.5)",
            yAxisID: "y",
          },
          {
            type: "bar",
            label: "Projected Income",
            data: projections.projections.map((item) => item.projected_income),
            backgroundColor: "rgba(76, 175, 80, 0.5)",
            yAxisID: "y1",
          },
          {
            type: "bar",
            label: "Projected Expenses",
            data: projections.projections.map((item) =>
              Math.abs(item.projected_expenses)
            ),
            backgroundColor: "rgba(255, 99, 132, 0.5)",
            yAxisID: "y1",
          },
        ],
      }
    : null;

  const projectionsOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Future Projections",
      },
    },
    scales: {
      y: {
        type: "linear",
        display: true,
        position: "left",
      },
      y1: {
        type: "linear",
        display: true,
        position: "right",
        grid: {
          drawOnChartArea: false,
        },
      },
    },
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
        <Typography variant="h4">Analytics</Typography>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Timeframe</InputLabel>
          <Select
            value={timeframe}
            label="Timeframe"
            onChange={handleTimeframeChange}
          >
            <MenuItem value="week">Last Week</MenuItem>
            <MenuItem value="month">Last Month</MenuItem>
            <MenuItem value="quarter">Last Quarter</MenuItem>
            <MenuItem value="year">Last Year</MenuItem>
            <MenuItem value="all">All Time</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3 }}
      >
        <Tab label="Overview" />
        <Tab label="Spending" />
        <Tab label="Income" />
        <Tab label="Balance" />
        <Tab label="Projections" />
      </Tabs>

      {/* Overview Tab */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Spending by Category
                </Typography>
                <Box sx={{ height: 350, position: "relative" }}>
                  <Doughnut
                    data={spendingChartData}
                    options={{
                      ...pieOptions,
                      maintainAspectRatio: false,
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Income by Source
                </Typography>
                <Box sx={{ height: 350, position: "relative" }}>
                  <Pie
                    data={incomeChartData}
                    options={{
                      ...pieOptions,
                      maintainAspectRatio: false,
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Balance Over Time
                </Typography>
                <Box sx={{ height: 400, position: "relative" }}>
                  <Line
                    data={balanceChartData}
                    options={{
                      ...balanceOptions,
                      maintainAspectRatio: false,
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Spending Tab */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Spending by Category
                </Typography>
                <Box sx={{ height: 450, position: "relative" }}>
                  <Bar
                    data={{
                      labels: spendingData.map((item) => item.category),
                      datasets: [
                        {
                          label: "Amount Spent",
                          data: spendingData.map((item) =>
                            Math.abs(item.spending)
                          ),
                          backgroundColor: "rgba(255, 99, 132, 0.5)",
                        },
                      ],
                    }}
                    options={{
                      maintainAspectRatio: false,
                      responsive: true,
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Top Spending Categories
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {spendingData.slice(0, 5).map((item, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 0.5,
                        }}
                      >
                        <Typography variant="body2">{item.category}</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(Math.abs(item.spending))}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={
                          (Math.abs(item.spending) /
                            Math.abs(spendingData[0]?.spending || 1)) *
                          100
                        }
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Income Tab */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Income by Source
                </Typography>
                <Box sx={{ height: 450, position: "relative" }}>
                  <Bar
                    data={{
                      labels: incomeData.map((item) => item.category),
                      datasets: [
                        {
                          label: "Income",
                          data: incomeData.map((item) => item.income),
                          backgroundColor: "rgba(75, 192, 192, 0.5)",
                        },
                      ],
                    }}
                    options={{
                      maintainAspectRatio: false,
                      responsive: true,
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Income Distribution
                </Typography>
                <Box sx={{ height: 350, position: "relative" }}>
                  <Doughnut
                    data={incomeChartData}
                    options={{
                      ...pieOptions,
                      maintainAspectRatio: false,
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Balance Tab */}
      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Balance Over Time
                </Typography>
                <Box sx={{ height: 450, position: "relative" }}>
                  <Line
                    data={balanceChartData}
                    options={{
                      ...balanceOptions,
                      maintainAspectRatio: false,
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Key Balance Metrics
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Current Balance
                    </Typography>
                    <Typography variant="h6">
                      {formatCurrency(
                        balanceData[balanceData.length - 1]?.balance
                      )}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Average Balance
                    </Typography>
                    <Typography variant="h6">
                      {formatCurrency(
                        balanceData.reduce(
                          (sum, item) => sum + item.balance,
                          0
                        ) / balanceData.length
                      )}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Lowest Balance
                    </Typography>
                    <Typography variant="h6">
                      {formatCurrency(
                        Math.min(...balanceData.map((item) => item.balance))
                      )}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Highest Balance
                    </Typography>
                    <Typography variant="h6">
                      {formatCurrency(
                        Math.max(...balanceData.map((item) => item.balance))
                      )}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Balance Change
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Net Change (Period)
                    </Typography>
                    <Typography
                      variant="h6"
                      color={
                        balanceData[balanceData.length - 1]?.balance -
                          balanceData[0]?.balance >=
                        0
                          ? "success.main"
                          : "error.main"
                      }
                    >
                      {formatCurrency(
                        balanceData[balanceData.length - 1]?.balance -
                          balanceData[0]?.balance
                      )}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Percent Change
                    </Typography>
                    <Typography
                      variant="h6"
                      color={
                        balanceData[balanceData.length - 1]?.balance -
                          balanceData[0]?.balance >=
                        0
                          ? "success.main"
                          : "error.main"
                      }
                    >
                      {(
                        ((balanceData[balanceData.length - 1]?.balance -
                          balanceData[0]?.balance) /
                          Math.abs(balanceData[0]?.balance)) *
                        100
                      ).toFixed(2)}
                      %
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Average Daily Change
                    </Typography>
                    <Typography
                      variant="h6"
                      color={
                        (balanceData[balanceData.length - 1]?.balance -
                          balanceData[0]?.balance) /
                          balanceData.length >=
                        0
                          ? "success.main"
                          : "error.main"
                      }
                    >
                      {formatCurrency(
                        (balanceData[balanceData.length - 1]?.balance -
                          balanceData[0]?.balance) /
                          balanceData.length
                      )}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Volatility
                    </Typography>
                    <Typography variant="h6">
                      {formatCurrency(
                        Math.sqrt(
                          balanceData.reduce(
                            (sum, item) =>
                              sum +
                              Math.pow(
                                item.balance -
                                  balanceData.reduce(
                                    (avg, i) =>
                                      avg + i.balance / balanceData.length,
                                    0
                                  ),
                                2
                              ) /
                                balanceData.length,
                            0
                          )
                        )
                      )}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Projections Tab */}
      {activeTab === 4 && projections && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Future Financial Projections
                </Typography>
                <Box sx={{ height: 450, position: "relative" }}>
                  <Bar
                    data={projectionsChartData}
                    options={{
                      ...projectionsOptions,
                      maintainAspectRatio: false,
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Projection Summary
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Current Balance
                    </Typography>
                    <Typography variant="h6">
                      {formatCurrency(projections.current_balance)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Projected in 12 Months
                    </Typography>
                    <Typography variant="h6">
                      {formatCurrency(
                        projections.projections[
                          projections.projections.length - 1
                        ]?.projected_balance
                      )}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Monthly Income
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      {formatCurrency(projections.avg_monthly_income)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Monthly Expenses
                    </Typography>
                    <Typography variant="h6" color="error.main">
                      {formatCurrency(
                        Math.abs(projections.avg_monthly_expenses)
                      )}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Monthly Net
                    </Typography>
                    <Typography
                      variant="h6"
                      color={
                        projections.monthly_net >= 0
                          ? "success.main"
                          : "error.main"
                      }
                    >
                      {formatCurrency(projections.monthly_net)}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Savings Rate
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2">
                      {formatCurrency(projections.monthly_net)} /{" "}
                      {formatCurrency(projections.avg_monthly_income)}
                    </Typography>
                    <Typography variant="body2">
                      {(
                        (projections.monthly_net /
                          projections.avg_monthly_income) *
                        100
                      ).toFixed(1)}
                      %
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.max(
                      0,
                      Math.min(
                        100,
                        (projections.monthly_net /
                          projections.avg_monthly_income) *
                          100
                      )
                    )}
                    color={projections.monthly_net >= 0 ? "success" : "error"}
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 3, mb: 2 }}
                >
                  Financial Independence Progress
                </Typography>
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2">
                      {formatCurrency(projections.current_balance)} /{" "}
                      {formatCurrency(
                        projections.avg_monthly_expenses * 25 * 12
                      )}
                    </Typography>
                    <Typography variant="body2">
                      {(
                        (projections.current_balance /
                          (Math.abs(projections.avg_monthly_expenses) *
                            25 *
                            12)) *
                        100
                      ).toFixed(1)}
                      %
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(
                      100,
                      (projections.current_balance /
                        (Math.abs(projections.avg_monthly_expenses) *
                          25 *
                          12)) *
                        100
                    )}
                    color="info"
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mt: 1 }}
                  >
                    Based on the 4% rule (25x annual expenses)
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Analytics;
