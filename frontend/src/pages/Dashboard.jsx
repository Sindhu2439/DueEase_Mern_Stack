import { Link } from "react-router-dom";

function Dashboard() {
  return (
    <div>
      <h1>DueEase Dashboard</h1>

      <h2>Welcome to DueEase!</h2>

      <p>Manage your group expenses easily.</p>

      <Link to="/groups">
        <button>My Groups</button>
      </Link>

      <button>Expenses</button>
      <button>Balances</button>
      <button>Settlements</button>
    </div>
  );
}

export default Dashboard;