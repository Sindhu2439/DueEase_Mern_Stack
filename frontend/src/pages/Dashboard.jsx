import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../Navbar";

function Dashboard() {
  const [groups, setGroups] = useState([]);
  const [expenseCount, setExpenseCount] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");

      const groupResponse = await fetch(
        "http://localhost:5000/api/groups",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const groupData = await groupResponse.json();

      if (!groupResponse.ok) {
        console.error(groupData.message);
        return;
      }

      const userGroups = groupData.groups || groupData || [];

      setGroups(userGroups);

      let totalExpenses = 0;
      let totalAmount = 0;

      /*
        Fetch expenses for every group.
        This allows the dashboard statistics
        to reflect real database data.
      */

      for (const group of userGroups) {
        try {
          const expenseResponse = await fetch(
            `http://localhost:5000/api/expenses/group/${group._id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );

          const expenseData =
            await expenseResponse.json();

          if (expenseResponse.ok) {
            const groupExpenses =
              expenseData.expenses || [];

            totalExpenses += groupExpenses.length;

            groupExpenses.forEach((expense) => {
              totalAmount +=
                Number(expense.amount) || 0;
            });
          }
        } catch (error) {
          console.error(
            `Unable to load expenses for ${group.name}`,
            error
          );
        }
      }

      setExpenseCount(totalExpenses);
      setTotalSpent(totalAmount);

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
  }, []);

  /*
    A member may belong to multiple groups.
    Using a Set prevents counting the same
    person multiple times.
  */

  const uniqueMemberIds = new Set();

  groups.forEach((group) => {
    (group.members || []).forEach((member) => {
      uniqueMemberIds.add(member._id);
    });
  });

  const totalMembers =
    uniqueMemberIds.size;

  return (
    <div>
      <Navbar />

      <main className="dashboard-container">

        {/* =====================================
            HERO
        ===================================== */}

        <section className="dashboard-hero">

          <div className="dashboard-hero-content">

            <span className="dashboard-badge">
              Smart Expense Management
            </span>

            <h1>
              Welcome to <span>DueEase</span> 👋
            </h1>

            <p>
              Manage group expenses, track balances,
              analyze spending, and settle debts with
              fewer transactions.
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


        {/* =====================================
            LIVE STATISTICS
        ===================================== */}

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
                  : `₹${totalSpent.toFixed(2)}`}
              </h2>
            </div>

          </div>

        </section>


        {/* =====================================
            MAIN FEATURES
        ===================================== */}

        <section className="dashboard-section">

          <div className="section-title">

            <div>
              <h2>
                Manage Your Expenses
              </h2>

              <p>
                Everything you need to manage shared
                expenses in one place.
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
                Create groups for roommates, trips,
                friends, or college expenses.
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
                Record expenses and split them equally,
                by exact amounts, or percentages.
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
                Quickly see who owes money and who
                should receive money.
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
                Reduce unnecessary transactions using
                DueEase's debt simplification algorithm.
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
                Understand spending patterns with
                charts and expense insights.
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
                JWT authentication and protected
                routes help keep your expense data
                secure.
              </p>

              <span>
                JWT Authentication
              </span>

            </div>

          </div>

        </section>


        {/* =====================================
            HOW DUEEASE WORKS
        ===================================== */}

        <section className="dashboard-info">

          <h2>
            How DueEase Works
          </h2>

          <p>
            Track shared expenses from payment to
            final settlement in a simple workflow.
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
                  Add friends, roommates, or trip
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
                  Record shared expenses and choose
                  how the cost should be divided.
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
                  See exactly who owes money and who
                  needs to receive money.
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
                  Use optimized settlements to reduce
                  the number of payments required.
                </p>
              </div>

            </div>

          </div>

        </section>


        {/* =====================================
            RECRUITER HIGHLIGHT
        ===================================== */}

        <section className="dashboard-highlight">

          <div>

            <span className="dashboard-badge">
              Why DueEase?
            </span>

            <h2>
              More than a basic expense tracker.
            </h2>

            <p>
              DueEase combines JWT authentication,
              flexible expense splitting, balance
              calculation, analytics, and a debt
              simplification algorithm into one
              full-stack application.
            </p>

          </div>

          <Link
            to="/settlements"
            className="primary-action"
          >
            Explore Smart Settlements →
          </Link>

        </section>

      </main>
    </div>
  );
}

export default Dashboard;