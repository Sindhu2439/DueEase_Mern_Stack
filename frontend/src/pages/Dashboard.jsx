import { Link } from "react-router-dom";
import Navbar from "../Navbar";

function Dashboard() {
  return (
    <div>
      <Navbar />

      <main className="dashboard-container">
        <section className="dashboard-header">
          <h1>Welcome to DueEase 👋</h1>

          <p>
            Manage your group expenses, balances, and
            settlements easily.
          </p>
        </section>

        <section className="dashboard-cards">
          <Link to="/groups" className="dashboard-card">
            <h2>👥 My Groups</h2>
            <p>
              Create groups and manage your group members.
            </p>
          </Link>

          <Link to="/expenses" className="dashboard-card">
            <h2>💰 Expenses</h2>
            <p>
              Record and split shared expenses easily.
            </p>
          </Link>

          <Link to="/balances" className="dashboard-card">
            <h2>📊 Balances</h2>
            <p>
              See who owes money and who should receive.
            </p>
          </Link>

          <Link
            to="/settlements"
            className="dashboard-card"
          >
            <h2>🤝 Settlements</h2>
            <p>
              Find the minimum payments needed to settle
              debts.
            </p>
          </Link>
        </section>

        <section className="dashboard-info">
          <h2>What can you do with DueEase?</h2>

          <ul>
            <li>Create and manage expense groups</li>
            <li>Add members to groups</li>
            <li>Record shared expenses</li>
            <li>Split expenses equally, exactly, or by percentage</li>
            <li>Track individual balances</li>
            <li>Calculate minimum settlement payments</li>
          </ul>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;