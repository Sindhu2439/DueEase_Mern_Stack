import { useEffect, useState } from "react";
import Navbar from "../Navbar";
import socket from "../socket";
import toast from "react-hot-toast";
import API_BASE_URL from "../config";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from "recharts";

function Analytics() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/groups`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        setGroups(
          Array.isArray(data.groups)
            ? data.groups
            : Array.isArray(data)
            ? data
            : []
        );
      } else {
        toast.error(
          data.message || "Unable to load groups"
        );
      }
    } catch (error) {
      console.error(error);
      toast.error(
        "Unable to connect to server"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async (groupId) => {
    if (!groupId) {
      setAnalytics(null);
      return;
    }

    try {
      setAnalyticsLoading(true);

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/api/expenses/group/${groupId}/analytics`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        setAnalytics({
          totalSpending:
            Number(data.totalSpending) || 0,

          totalExpenses:
            Number(data.totalExpenses) || 0,

          yourPaidAmount:
            Number(data.yourPaidAmount) || 0,

          yourShare:
            Number(data.yourShare) || 0,

          paidByMember:
            Array.isArray(data.paidByMember)
              ? data.paidByMember
              : [],

          spendingByExpense:
            Array.isArray(
              data.spendingByExpense
            )
              ? data.spendingByExpense
              : [],

          monthlySpending:
            Array.isArray(
              data.monthlySpending
            )
              ? data.monthlySpending
              : []
        });
      } else {
        toast.error(
          data.message ||
            "Unable to load analytics"
        );

        setAnalytics(null);
      }
    } catch (error) {
      console.error(error);

      toast.error(
        "Unable to connect to server"
      );

      setAnalytics(null);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();

    socket.connect();

    const handleExpenseAdded = (data) => {
      if (
        data?.expense?.group &&
        data.expense.group.toString() ===
          selectedGroup
      ) {
        fetchAnalytics(selectedGroup);

        toast.success(
          "Analytics updated"
        );
      }
    };

    const handleExpenseDeleted = () => {
      if (selectedGroup) {
        fetchAnalytics(selectedGroup);

        toast.success(
          "Analytics updated"
        );
      }
    };

    const handleGroupUpdated = () => {
      fetchGroups();

      if (selectedGroup) {
        fetchAnalytics(selectedGroup);
      }
    };

    socket.on(
      "expenseAdded",
      handleExpenseAdded
    );

    socket.on(
      "expenseDeleted",
      handleExpenseDeleted
    );

    socket.on(
      "groupUpdated",
      handleGroupUpdated
    );

    return () => {
      socket.off(
        "expenseAdded",
        handleExpenseAdded
      );

      socket.off(
        "expenseDeleted",
        handleExpenseDeleted
      );

      socket.off(
        "groupUpdated",
        handleGroupUpdated
      );

      socket.disconnect();
    };
  }, [selectedGroup]);

  const handleGroupChange = (e) => {
    const groupId = e.target.value;

    setSelectedGroup(groupId);

    fetchAnalytics(groupId);
  };

  const paidByMember =
    analytics?.paidByMember || [];

  const spendingByExpense =
    analytics?.spendingByExpense || [];

  const monthlySpending =
    analytics?.monthlySpending || [];

  const formatCurrency = (amount) => {
    return `₹${Number(
      amount || 0
    ).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  return (
    <div className="analytics-page">

      <Navbar />

      <main className="page-container">

        {/* PAGE HEADER */}

        <div className="page-header">

          <span className="dashboard-card-label">
            Insights & Reports
          </span>

          <h1>
            Expense Analytics
          </h1>

          <p>
            Understand your group's spending,
            compare contributions, and track
            expense patterns over time.
          </p>

        </div>


        {/* GROUP SELECTOR */}

        <section className="form-card analytics-selector">

          <div>

            <span className="dashboard-card-label">
              Analytics Filter
            </span>

            <h2>
              Select a Group
            </h2>

            <p>
              Choose a group to view detailed
              expense analytics.
            </p>

          </div>

          {loading ? (

            <div className="analytics-loading">
              Loading groups...
            </div>

          ) : groups.length === 0 ? (

            <div className="empty-state">

              <div className="empty-icon">
                👥
              </div>

              <h3>
                No groups found
              </h3>

              <p>
                Create a group first to view
                analytics.
              </p>

            </div>

          ) : (

            <select
              value={selectedGroup}
              onChange={handleGroupChange}
            >

              <option value="">
                Select a group
              </option>

              {groups.map((group) => (

                <option
                  key={group._id}
                  value={group._id}
                >
                  {group.name}
                </option>

              ))}

            </select>

          )}

        </section>


        {/* NO GROUP SELECTED */}

        {!selectedGroup &&
          !loading &&
          groups.length > 0 && (

            <section className="analytics-empty-dashboard">

              <div className="analytics-empty-icon">
                📊
              </div>

              <h2>
                Select a group to get started
              </h2>

              <p>
                Choose one of your groups above
                to view spending insights,
                member contributions, expense
                breakdowns, and monthly trends.
              </p>

            </section>

          )}


        {/* ANALYTICS LOADING */}

        {analyticsLoading && (

          <div className="analytics-loading analytics-main-loading">

            <div className="analytics-loading-icon">
              📊
            </div>

            <h3>
              Preparing your analytics...
            </h3>

            <p>
              Calculating spending insights.
            </p>

          </div>

        )}


        {analytics &&
          !analyticsLoading && (
            <>

              {/* SUMMARY */}

              <section className="analytics-summary">

                <div className="analytics-stat-card">

                  <div className="analytics-stat-icon">
                    💰
                  </div>

                  <div>

                    <p>
                      Total Spending
                    </p>

                    <h2>
                      {formatCurrency(
                        analytics.totalSpending
                      )}
                    </h2>

                    <small>
                      Group-wide spending
                    </small>

                  </div>

                </div>


                <div className="analytics-stat-card">

                  <div className="analytics-stat-icon">
                    🧾
                  </div>

                  <div>

                    <p>
                      Total Expenses
                    </p>

                    <h2>
                      {analytics.totalExpenses}
                    </h2>

                    <small>
                      Recorded transactions
                    </small>

                  </div>

                </div>


                <div className="analytics-stat-card">

                  <div className="analytics-stat-icon">
                    👤
                  </div>

                  <div>

                    <p>
                      Your Paid Amount
                    </p>

                    <h2>
                      {formatCurrency(
                        analytics.yourPaidAmount
                      )}
                    </h2>

                    <small>
                      Amount you paid
                    </small>

                  </div>

                </div>


                <div className="analytics-stat-card">

                  <div className="analytics-stat-icon">
                    📊
                  </div>

                  <div>

                    <p>
                      Your Share
                    </p>

                    <h2>
                      {formatCurrency(
                        analytics.yourShare
                      )}
                    </h2>

                    <small>
                      Your calculated share
                    </small>

                  </div>

                </div>

              </section>


              {/* SPENDING BY MEMBER */}

              <section className="analytics-section">

                <div className="section-title">

                  <div>

                    <span className="dashboard-card-label">
                      Contribution Analysis
                    </span>

                    <h2>
                      Spending by Member
                    </h2>

                    <p className="section-subtitle">
                      Compare how much each
                      member has paid.
                    </p>

                  </div>

                </div>


                {paidByMember.length ===
                0 ? (

                  <div className="empty-state">

                    <div className="empty-icon">
                      👥
                    </div>

                    <h3>
                      No member spending data
                    </h3>

                    <p>
                      Add expenses to see
                      member contributions.
                    </p>

                  </div>

                ) : (

                  <div
                    style={{
                      width: "100%",
                      height: "400px",
                      minHeight: "400px"
                    }}
                  >

                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >

                      <BarChart
                        data={paidByMember.map(
                          (person) => ({
                            name:
                              person.name ||
                              "User",

                            amount:
                              Number(
                                person.amount
                              ) || 0
                          })
                        )}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 20
                        }}
                      >

                        <CartesianGrid
                          strokeDasharray="3 3"
                        />

                        <XAxis
                          dataKey="name"
                        />

                        <YAxis />

                        <Tooltip
                          formatter={(value) =>
                            formatCurrency(
                              value
                            )
                          }
                        />

                        <Bar
                          dataKey="amount"
                          name="Amount Paid"
                          fill="#2563eb"
                          radius={[
                            8,
                            8,
                            0,
                            0
                          ]}
                        />

                      </BarChart>

                    </ResponsiveContainer>

                  </div>

                )}

              </section>


              {/* EXPENSE DISTRIBUTION */}

              <section className="analytics-section">

                <div className="section-title">

                  <div>

                    <span className="dashboard-card-label">
                      Spending Breakdown
                    </span>

                    <h2>
                      Expense Distribution
                    </h2>

                    <p className="section-subtitle">
                      See how total spending is
                      distributed across
                      expenses.
                    </p>

                  </div>

                </div>


                {spendingByExpense.length ===
                0 ? (

                  <div className="empty-state">

                    <div className="empty-icon">
                      🧾
                    </div>

                    <h3>
                      No expense data
                    </h3>

                    <p>
                      Add expenses to see
                      the distribution.
                    </p>

                  </div>

                ) : (

                  <div
                    style={{
                      width: "100%",
                      height: "400px",
                      minHeight: "400px"
                    }}
                  >

                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >

                      <PieChart>

                        <Pie
                          data={spendingByExpense.map(
                            (expense) => ({
                              name:
                                expense.description ||
                                "Expense",

                              value:
                                Number(
                                  expense.amount
                                ) || 0
                            })
                          )}
                          cx="50%"
                          cy="50%"
                          outerRadius={130}
                          dataKey="value"
                          label
                        >

                          {spendingByExpense.map(
                            (_, index) => (
                              <Cell
                                key={`cell-${index}`}
                              />
                            )
                          )}

                        </Pie>

                        <Tooltip
                          formatter={(value) =>
                            formatCurrency(
                              value
                            )
                          }
                        />

                        <Legend />

                      </PieChart>

                    </ResponsiveContainer>

                  </div>

                )}

              </section>


              {/* MEMBER DETAILS */}

              <section className="analytics-section">

                <div className="section-title">

                  <div>

                    <span className="dashboard-card-label">
                      Member Insights
                    </span>

                    <h2>
                      Member Details
                    </h2>

                    <p className="section-subtitle">
                      Detailed contribution
                      information for the
                      selected group.
                    </p>

                  </div>

                </div>


                {paidByMember.length ===
                0 ? (

                  <div className="empty-state">

                    <div className="empty-icon">
                      👤
                    </div>

                    <h3>
                      No member data
                    </h3>

                    <p>
                      Add expenses to see
                      member details.
                    </p>

                  </div>

                ) : (

                  <div className="member-spending-list">

                    {paidByMember.map(
                      (person) => {

                        const percentage =
                          analytics.totalSpending >
                          0
                            ? (
                                (Number(
                                  person.amount
                                ) /
                                  Number(
                                    analytics.totalSpending
                                  )) *
                                100
                              )
                            : 0;

                        return (
                          <div
                            className="member-spending-card"
                            key={
                              person.userId ||
                              person.email ||
                              person.name
                            }
                          >

                            <div className="member-spending-header">

                              <div className="member-spending-user">

                                <div className="analytics-avatar">

                                  {person.name
                                    ? person.name
                                        .charAt(
                                          0
                                        )
                                        .toUpperCase()
                                    : "U"}

                                </div>

                                <div>

                                  <strong>
                                    {person.name ||
                                      "User"}
                                  </strong>

                                  <small>
                                    {person.email ||
                                      ""}
                                  </small>

                                </div>

                              </div>


                              <strong>
                                {formatCurrency(
                                  person.amount
                                )}
                              </strong>

                            </div>


                            <div className="analytics-progress">

                              <div
                                className="analytics-progress-fill"
                                style={{
                                  width: `${Math.min(
                                    percentage,
                                    100
                                  )}%`
                                }}
                              />

                            </div>


                            <span className="analytics-percentage">

                              {percentage.toFixed(
                                1
                              )}
                              % of total spending

                            </span>

                          </div>
                        );
                      }
                    )}

                  </div>

                )}

              </section>


              {/* EXPENSE BREAKDOWN */}

              <section className="analytics-section">

                <div className="section-title">

                  <div>

                    <span className="dashboard-card-label">
                      Transaction Details
                    </span>

                    <h2>
                      Expense Breakdown
                    </h2>

                    <p className="section-subtitle">
                      Individual expenses
                      recorded in this group.
                    </p>

                  </div>

                </div>


                {spendingByExpense.length ===
                0 ? (

                  <div className="empty-state">

                    <div className="empty-icon">
                      💸
                    </div>

                    <h3>
                      No expenses yet
                    </h3>

                    <p>
                      Add expenses to see
                      the breakdown.
                    </p>

                  </div>

                ) : (

                  <div className="expense-breakdown-grid">

                    {spendingByExpense.map(
                      (expense, index) => (

                        <div
                          className="analytics-expense-card"
                          key={
                            expense._id ||
                            index
                          }
                        >

                          <div className="analytics-expense-icon">
                            💸
                          </div>

                          <div className="analytics-expense-info">

                            <h3>
                              {expense.description ||
                                "Expense"}
                            </h3>

                            <p>
                              Paid by{" "}
                              <strong>
                                {expense.paidBy ||
                                  "User"}
                              </strong>
                            </p>

                          </div>

                          <strong className="analytics-expense-amount">

                            {formatCurrency(
                              expense.amount
                            )}

                          </strong>

                        </div>

                      )
                    )}

                  </div>

                )}

              </section>


              {/* MONTHLY SPENDING */}

              <section className="analytics-section">

                <div className="section-title">

                  <div>

                    <span className="dashboard-card-label">
                      Trend Analysis
                    </span>

                    <h2>
                      Monthly Spending
                    </h2>

                    <p className="section-subtitle">
                      Track how group spending
                      changes over time.
                    </p>

                  </div>

                </div>


                {monthlySpending.length ===
                0 ? (

                  <div className="empty-state">

                    <div className="empty-icon">
                      📈
                    </div>

                    <h3>
                      No monthly data
                    </h3>

                    <p>
                      Add expenses to generate
                      monthly spending trends.
                    </p>

                  </div>

                ) : (

                  <div
                    style={{
                      width: "100%",
                      height: "400px",
                      minHeight: "400px"
                    }}
                  >

                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >

                      <LineChart
                        data={monthlySpending.map(
                          (item) => ({
                            month:
                              item.month,

                            amount:
                              Number(
                                item.amount
                              ) || 0
                          })
                        )}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 20
                        }}
                      >

                        <CartesianGrid
                          strokeDasharray="3 3"
                        />

                        <XAxis
                          dataKey="month"
                        />

                        <YAxis />

                        <Tooltip
                          formatter={(value) =>
                            formatCurrency(
                              value
                            )
                          }
                        />

                        <Line
                          type="monotone"
                          dataKey="amount"
                          name="Monthly Spending"
                          stroke="#2563eb"
                          strokeWidth={3}
                          dot={{
                            r: 6
                          }}
                        />

                      </LineChart>

                    </ResponsiveContainer>

                  </div>

                )}

              </section>


              {/* ANALYTICS FOOTER */}

              <section className="dashboard-highlight">

                <div>

                  <span className="dashboard-badge">
                    DueEase Insights
                  </span>

                  <h2>
                    Make every expense easier
                    to understand.
                  </h2>

                  <p>
                    Use contribution analysis,
                    spending breakdowns, and
                    monthly trends to understand
                    where your group's money is
                    going.
                  </p>

                </div>

              </section>

            </>
          )}

      </main>

    </div>
  );
}

export default Analytics;