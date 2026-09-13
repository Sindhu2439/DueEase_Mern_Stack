import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <nav>
      <h2>DueEase</h2>

      <div>
        <Link to="/dashboard">Dashboard</Link>{" "}
        <Link to="/groups">Groups</Link>{" "}
        <Link to="/expenses">Expenses</Link>{" "}
        <Link to="/balances">Balances</Link>{" "}
        <Link to="/settlements">Settlements</Link>{" "}
        <Link to="/analytics">Analytics</Link>{" "}

        <button onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;