import { useEffect, useState } from "react";
import Navbar from "../Navbar";
import socket from "../socket";

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

      const response = await fetch(
        "http://localhost:5000/api/groups",
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
        alert(data.message || "Unable to load groups");
      }
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server");
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
        `http://localhost:5000/api/expenses/group/${groupId}/analytics`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        setAnalytics({
          totalSpending: Number(data.totalSpending) || 0,
          totalExpenses: Number(data.totalExpenses) || 0,
          yourPaidAmount: Number(data.yourPaidAmount) || 0,
          yourShare: Number(data.yourShare) || 0,

          paidByMember: Array.isArray(data.paidByMember)
            ? data.paidByMember
            : [],

          spendingByExpense: Array.isArray(
            data.spendingByExpense
          )
            ? data.spendingByExpense
            : [],

          monthlySpending: Array.isArray(
            data.monthlySpending
          )
            ? data.monthlySpending
            : []
        });
      } else {
        alert(
          data.message || "Unable to load analytics"
        );
        setAnalytics(null);
      }
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server");
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
        data.expense.group.toString() === selectedGroup
      ) {
        fetchAnalytics(selectedGroup);
      }
    };

    const handleExpenseDeleted = () => {
      if (selectedGroup) {
        fetchAnalytics(selectedGroup);
      }
    };

    const handleGroupUpdated = () => {
      fetchGroups();

      if (selectedGroup) {
        fetchAnalytics(selectedGroup);
      }
    };

    socket.on("expenseAdded", handleExpenseAdded);
    socket.on("expenseDeleted", handleExpenseDeleted);
    socket.on("groupUpdated", handleGroupUpdated);

    return () => {
      socket.off("expenseAdded", handleExpenseAdded);
      socket.off("expenseDeleted", handleExpenseDeleted);
      socket.off("groupUpdated", handleGroupUpdated);
      socket.disconnect();
    };
  }, [selectedGroup]);

  const handleGroupChange = (e) => {
    const groupId = e.target.value;

    setSelectedGroup(groupId);
    fetchAnalytics(groupId);
  };

  const paidByMember = analytics?.paidByMember || [];
  const spendingByExpense =
    analytics?.spendingByExpense || [];
  const monthlySpending =
    analytics?.monthlySpending || [];

  return (
    <div>
      <Navbar />

      <main className="page-container">

        <div className="page-header">
          <h1>Expense Analytics</h1>

          <p>
            Understand your group's spending and
            expense patterns.
          </p>
        </div>


        {/* GROUP SELECTION */}

        <section className="form-card analytics-selector">

          <h2>Select Group</h2>

          <p>
            Choose a group to view its expense
            analytics.
          </p>

          {loading ? (
            <p>Loading groups...</p>
          ) : groups.length === 0 ? (
            <div className="empty-state">

              <h3>No groups found</h3>

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


        {/* LOADING */}

        {analyticsLoading && (
          <div className="analytics-loading">
            <p>Loading analytics...</p>
          </div>
        )}


        {analytics && !analyticsLoading && (
          <>


            {/* SUMMARY */}

            <section className="analytics-summary">

              <div className="analytics-stat-card">

                <div className="analytics-stat-icon">
                  💰
                </div>

                <div>

                  <p>Total Spending</p>

                  <h2>
                    ₹
                    {Number(
                      analytics.totalSpending
                    ).toFixed(2)}
                  </h2>

                </div>

              </div>


              <div className="analytics-stat-card">

                <div className="analytics-stat-icon">
                  🧾
                </div>

                <div>

                  <p>Total Expenses</p>

                  <h2>
                    {analytics.totalExpenses}
                  </h2>

                </div>

              </div>


              <div className="analytics-stat-card">

                <div className="analytics-stat-icon">
                  👤
                </div>

                <div>

                  <p>Your Paid Amount</p>

                  <h2>
                    ₹
                    {Number(
                      analytics.yourPaidAmount
                    ).toFixed(2)}
                  </h2>

                </div>

              </div>


              <div className="analytics-stat-card">

                <div className="analytics-stat-icon">
                  📊
                </div>

                <div>

                  <p>Your Share</p>

                  <h2>
                    ₹
                    {Number(
                      analytics.yourShare
                    ).toFixed(2)}
                  </h2>

                </div>

              </div>

            </section>


            {/* SPENDING BY MEMBER */}

            <section className="analytics-section">

              <div className="section-title">

                <div>

                  <h2>
                    Spending by Member
                  </h2>

                  <p className="section-subtitle">
                    Compare how much each member
                    has paid.
                  </p>

                </div>

              </div>


              {paidByMember.length === 0 ? (

                <div className="empty-state">

                  <h3>
                    No member spending data
                  </h3>

                  <p>
                    Add expenses to see member
                    spending.
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
                          `₹${Number(
                            value
                          ).toFixed(2)}`
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

                  <h2>
                    Expense Distribution
                  </h2>

                  <p className="section-subtitle">
                    See how total spending is
                    distributed across expenses.
                  </p>

                </div>

              </div>


              {spendingByExpense.length === 0 ? (

                <div className="empty-state">

                  <h3>
                    No expense data
                  </h3>

                  <p>
                    Add expenses to see the
                    distribution chart.
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
                          `₹${Number(
                            value
                          ).toFixed(2)}`
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

                  <h2>
                    Member Details
                  </h2>

                  <p className="section-subtitle">
                    Detailed spending information.
                  </p>

                </div>

              </div>


              {paidByMember.length === 0 ? (

                <div className="empty-state">

                  <h3>
                    No member data
                  </h3>

                  <p>
                    Add expenses to see member
                    details.
                  </p>

                </div>

              ) : (

                <div className="member-spending-list">

                  {paidByMember.map(
                    (person) => {

                      const percentage =
                        analytics.totalSpending > 0
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
                                      .charAt(0)
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
                              ₹
                              {Number(
                                person.amount
                              ).toFixed(2)}
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

                            {percentage.toFixed(1)}%
                            {" "}of total spending

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

                  <h2>
                    Expense Breakdown
                  </h2>

                  <p className="section-subtitle">
                    Individual expenses recorded in
                    this group.
                  </p>

                </div>

              </div>


              {spendingByExpense.length === 0 ? (

                <div className="empty-state">

                  <h3>
                    No expenses yet
                  </h3>

                  <p>
                    Add expenses to see the
                    breakdown.
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

                          ₹
                          {Number(
                            expense.amount
                          ).toFixed(2)}

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

                  <h2>
                    Monthly Spending
                  </h2>

                  <p className="section-subtitle">
                    Track how group spending changes
                    over time.
                  </p>

                </div>

              </div>


              {monthlySpending.length === 0 ? (

                <div className="empty-state">

                  <h3>
                    No monthly data
                  </h3>

                  <p>
                    Add expenses to generate
                    monthly spending data.
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
                          `₹${Number(
                            value
                          ).toFixed(2)}`
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

          </>
        )}

      </main>
    </div>
  );
}

export default Analytics;