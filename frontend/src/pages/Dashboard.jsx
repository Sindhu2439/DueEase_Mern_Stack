import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../Navbar";
import socket from "../socket";
import API_BASE_URL from "../config";

function Dashboard() {
  const [groups, setGroups] = useState([]);
  const [expenseCount, setExpenseCount] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [userName, setUserName] = useState("there");
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      const profileResponse = await fetch(
        `${API_BASE_URL}/api/auth/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const profileData = await profileResponse.json();

      if (
        profileResponse.ok &&
        profileData.user
      ) {
        setUserName(
          profileData.user.name || "there"
        );
      }

      const groupResponse = await fetch(
        `${API_BASE_URL}/api/groups`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const groupData =
        await groupResponse.json();

      if (!groupResponse.ok) {
        console.error(
          groupData.message
        );
        return;
      }

      const userGroups =
        groupData.groups ||
        groupData ||
        [];

      setGroups(userGroups);

      let totalExpenses = 0;
      let totalAmount = 0;
      let allExpenses = [];

      for (const group of userGroups) {
        try {
          const expenseResponse =
            await fetch(
              `${API_BASE_URL}/api/expenses/group/${group._id}`,
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`
                }
              }
            );

          const expenseData =
            await expenseResponse.json();

          if (expenseResponse.ok) {
            const groupExpenses =
              expenseData.expenses ||
              [];

            totalExpenses +=
              groupExpenses.length;

            groupExpenses.forEach(
              (expense) => {
                totalAmount +=
                  Number(
                    expense.amount
                  ) || 0;

                allExpenses.push({
                  ...expense,
                  groupName:
                    group.name
                });
              }
            );
          }
        } catch (error) {
          console.error(
            `Unable to load expenses for ${group.name}`,
            error
          );
        }
      }

      allExpenses.sort(
        (a, b) => {
          const dateA = new Date(
            a.createdAt || 0
          );

          const dateB = new Date(
            b.createdAt || 0
          );

          return dateB - dateA;
        }
      );

      setExpenseCount(
        totalExpenses
      );

      setTotalSpent(
        totalAmount
      );

      setRecentExpenses(
        allExpenses.slice(0, 5)
      );
    } catch (error) {
      console.error(
        "Dashboard error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    socket.connect();

    const handleExpenseAdded =
      () => {
        fetchDashboardData();
      };

    const handleExpenseDeleted =
      () => {
        fetchDashboardData();
      };

    const handleGroupUpdated =
      () => {
        fetchDashboardData();
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
  }, []);

  const totalMembers = useMemo(() => {
    const uniqueMemberIds =
      new Set();

    groups.forEach((group) => {
      (group.members || []).forEach(
        (member) => {
          if (member?._id) {
            uniqueMemberIds.add(
              member._id
            );
          }
        }
      );
    });

    return uniqueMemberIds.size;
  }, [groups]);

  const averageExpense =
    expenseCount > 0
      ? totalSpent / expenseCount
      : 0;

  const formatCurrency = (
    amount
  ) => {
    return `₹${Number(
      amount || 0
    ).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    )}`;
  };

  const formatDate = (
    date
  ) => {
    if (!date) {
      return "Recently";
    }

    return new Date(
      date
    ).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    );
  };

  return (
    <div className="dashboard-page">

      <Navbar />

      <main className="dashboard-container">

        {/* HERO */}

        <section className="dashboard-hero">

          <div className="dashboard-hero-content">

            <span className="dashboard-badge">
              Smart Expense Management
            </span>

            <h1>
              Welcome back,{" "}
              <span>
                {userName}
              </span>{" "}
              👋
            </h1>

            <p>
              Manage group expenses,
              track balances, analyze
              spending, and settle debts
              with fewer transactions.
            </p>

            <div className="dashboard-actions">

              <Link
                to="/expenses"
                className="primary-action"
              >
                + Add Expense
              </Link>

              <Link
                to="/groups"
                className="secondary-action"
              >
                Manage Groups
              </Link>

            </div>

          </div>

          <div className="dashboard-hero-icon">
            💸
          </div>

        </section>


        {/* STATISTICS */}

        <section className="dashboard-stats">

          <div className="stat-card">

            <div className="stat-icon">
              👥
            </div>

            <div>
              <span>
                Total Groups
              </span>

              <h2>
                {loading
                  ? "..."
                  : groups.length}
              </h2>

              <small>
                Active expense groups
              </small>
            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon">
              🧑‍🤝‍🧑
            </div>

            <div>
              <span>
                Unique Members
              </span>

              <h2>
                {loading
                  ? "..."
                  : totalMembers}
              </h2>

              <small>
                Across your groups
              </small>
            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon">
              🧾
            </div>

            <div>
              <span>
                Total Expenses
              </span>

              <h2>
                {loading
                  ? "..."
                  : expenseCount}
              </h2>

              <small>
                Recorded expenses
              </small>
            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon">
              💰
            </div>

            <div>
              <span>
                Total Spending
              </span>

              <h2>
                {loading
                  ? "..."
                  : formatCurrency(
                      totalSpent
                    )}
              </h2>

              <small>
                All group expenses
              </small>
            </div>

          </div>

        </section>


        {/* OVERVIEW */}

        <section className="dashboard-overview-grid">

          <div className="dashboard-overview-card">

            <div className="overview-card-header">

              <div>

                <span className="dashboard-card-label">
                  Spending Overview
                </span>

                <h2>
                  {loading
                    ? "..."
                    : formatCurrency(
                        totalSpent
                      )}
                </h2>

              </div>

              <div className="overview-icon">
                📊
              </div>

            </div>

            <p>
              Total amount recorded
              across all your expense
              groups.
            </p>

          </div>


          <div className="dashboard-overview-card">

            <div className="overview-card-header">

              <div>

                <span className="dashboard-card-label">
                  Average Expense
                </span>

                <h2>
                  {loading
                    ? "..."
                    : formatCurrency(
                        averageExpense
                      )}
                </h2>

              </div>

              <div className="overview-icon">
                💳
              </div>

            </div>

            <p>
              Average amount per
              recorded expense.
            </p>

          </div>

        </section>


        {/* RECENT EXPENSES */}

        <section className="dashboard-section">

          <div className="section-title">

            <div>

              <span className="dashboard-card-label">
                Activity
              </span>

              <h2>
                Recent Expenses
              </h2>

              <p>
                Quickly review your
                latest shared expenses.
              </p>

            </div>

            <Link
              to="/expenses"
              className="dashboard-view-link"
            >
              View All →
            </Link>

          </div>


          <div className="recent-expenses-card">

            {loading ? (

              <div className="dashboard-empty-state">

                <div className="empty-icon">
                  ⏳
                </div>

                <h3>
                  Loading expenses...
                </h3>

                <p>
                  Fetching your latest
                  expense activity.
                </p>

              </div>

            ) : recentExpenses.length ===
              0 ? (

              <div className="dashboard-empty-state">

                <div className="empty-icon">
                  🧾
                </div>

                <h3>
                  No expenses yet
                </h3>

                <p>
                  Add your first shared
                  expense to start
                  tracking spending.
                </p>

                <Link
                  to="/expenses"
                  className="primary-action"
                >
                  + Add Expense
                </Link>

              </div>

            ) : (

              <div className="recent-expense-list">

                {recentExpenses.map(
                  (expense) => (

                    <div
                      className="recent-expense-item"
                      key={
                        expense._id
                      }
                    >

                      <div className="recent-expense-icon">
                        💰
                      </div>

                      <div className="recent-expense-info">

                        <h3>
                          {
                            expense.description ||
                            "Unnamed Expense"
                          }
                        </h3>

                        <p>
                          {
                            expense.groupName ||
                            "Group"
                          }{" "}
                          •{" "}
                          {formatDate(
                            expense.createdAt
                          )}
                        </p>

                      </div>

                      <div className="recent-expense-amount">
                        {formatCurrency(
                          expense.amount
                        )}
                      </div>

                    </div>

                  )
                )}

              </div>

            )}

          </div>

        </section>


        {/* FEATURES */}

        <section className="dashboard-section">

          <div className="section-title">

            <div>

              <span className="dashboard-card-label">
                Everything in one place
              </span>

              <h2>
                Manage Your Expenses
              </h2>

              <p>
                Everything you need to
                manage shared expenses
                in one place.
              </p>

            </div>

          </div>


          <div className="dashboard-feature-grid">

            <Link
              to="/groups"
              className="dashboard-feature-card"
            >

              <div className="feature-icon">
                👥
              </div>

              <h3>
                Groups
              </h3>

              <p>
                Create groups for
                roommates, trips,
                friends, or college
                expenses.
              </p>

              <span>
                Manage Groups →
              </span>

            </Link>


            <Link
              to="/expenses"
              className="dashboard-feature-card"
            >

              <div className="feature-icon">
                💰
              </div>

              <h3>
                Expenses
              </h3>

              <p>
                Record expenses and
                split them equally,
                by exact amounts, or
                percentages.
              </p>

              <span>
                Manage Expenses →
              </span>

            </Link>


            <Link
              to="/balances"
              className="dashboard-feature-card"
            >

              <div className="feature-icon">
                📊
              </div>

              <h3>
                Balances
              </h3>

              <p>
                Quickly see who owes
                money and who should
                receive money.
              </p>

              <span>
                View Balances →
              </span>

            </Link>


            <Link
              to="/settlements"
              className="dashboard-feature-card"
            >

              <div className="feature-icon">
                🤝
              </div>

              <h3>
                Smart Settlements
              </h3>

              <p>
                Reduce unnecessary
                transactions using
                DueEase's debt
                simplification algorithm.
              </p>

              <span>
                View Settlements →
              </span>

            </Link>


            <Link
              to="/analytics"
              className="dashboard-feature-card"
            >

              <div className="feature-icon">
                📈
              </div>

              <h3>
                Analytics
              </h3>

              <p>
                Understand spending
                patterns with charts
                and expense insights.
              </p>

              <span>
                View Analytics →
              </span>

            </Link>


            <div className="dashboard-feature-card">

              <div className="feature-icon">
                🔐
              </div>

              <h3>
                Secure Access
              </h3>

              <p>
                JWT authentication and
                protected routes help
                keep your expense data
                secure.
              </p>

              <span>
                JWT Authentication
              </span>

            </div>

          </div>

        </section>


        {/* WORKFLOW */}

        <section className="dashboard-info">

          <span className="dashboard-card-label">
            Simple workflow
          </span>

          <h2>
            How DueEase Works
          </h2>

          <p>
            Track shared expenses from
            payment to final settlement
            in a simple workflow.
          </p>


          <div className="dashboard-steps">

            <div className="dashboard-step">

              <div className="step-number">
                1
              </div>

              <div>

                <h3>
                  Create a Group
                </h3>

                <p>
                  Add friends,
                  roommates, or trip
                  members to your group.
                </p>

              </div>

            </div>


            <div className="dashboard-step">

              <div className="step-number">
                2
              </div>

              <div>

                <h3>
                  Add Expenses
                </h3>

                <p>
                  Record shared
                  expenses and choose
                  how the cost should be
                  divided.
                </p>

              </div>

            </div>


            <div className="dashboard-step">

              <div className="step-number">
                3
              </div>

              <div>

                <h3>
                  Track Balances
                </h3>

                <p>
                  See exactly who owes
                  money and who needs
                  to receive money.
                </p>

              </div>

            </div>


            <div className="dashboard-step">

              <div className="step-number">
                4
              </div>

              <div>

                <h3>
                  Settle Smartly
                </h3>

                <p>
                  Use optimized
                  settlements to reduce
                  the number of payments
                  required.
                </p>

              </div>

            </div>

          </div>

        </section>


        {/* FINAL HIGHLIGHT */}

        <section className="dashboard-highlight">

          <div>

            <span className="dashboard-badge">
              Why DueEase?
            </span>

            <h2>
              More than a basic
              expense tracker.
            </h2>

            <p>
              DueEase combines JWT
              authentication, flexible
              expense splitting, balance
              calculation, analytics,
              real-time updates, UPI
              payments, and a debt
              simplification algorithm
              into one full-stack
              application.
            </p>

          </div>

          <Link
            to="/settlements"
            className="primary-action"
          >
            Explore Smart
            Settlements →
          </Link>

        </section>

      </main>

    </div>
  );
}

export default Dashboard;