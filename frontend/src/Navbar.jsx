import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setMenuOpen(false);
    navigate("/");
  };

  return (
    <nav className="dueease-navbar" ref={menuRef}>

      <h2 className="dueease-logo">
        DueEase
      </h2>

      {/* Desktop Menu */}
      <div className="dueease-desktop-menu">

        <Link to="/dashboard">
          Dashboard
        </Link>

        <Link to="/groups">
          Groups
        </Link>

        <Link to="/expenses">
          Expenses
        </Link>

        <Link to="/balances">
          Balances
        </Link>

        <Link to="/settlements">
          Settlements
        </Link>

        <Link to="/analytics">
          Analytics
        </Link>

        <Link to="/profile">
          Profile
        </Link>

        <button
          type="button"
          onClick={handleLogout}
        >
          Logout
        </button>

      </div>


      {/* Mobile Hamburger */}
      <button
        type="button"
        className={`dueease-hamburger ${menuOpen ? "active" : ""}`}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle navigation menu"
        aria-expanded={menuOpen}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>


      {/* Mobile Menu */}
      {menuOpen && (
        <div className="dueease-mobile-menu">

          <Link to="/dashboard" onClick={closeMenu}>
            Dashboard
          </Link>

          <Link to="/groups" onClick={closeMenu}>
            Groups
          </Link>

          <Link to="/expenses" onClick={closeMenu}>
            Expenses
          </Link>

          <Link to="/balances" onClick={closeMenu}>
            Balances
          </Link>

          <Link to="/settlements" onClick={closeMenu}>
            Settlements
          </Link>

          <Link to="/analytics" onClick={closeMenu}>
            Analytics
          </Link>

          <Link to="/profile" onClick={closeMenu}>
            Profile
          </Link>

          <button
            type="button"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>
      )}

    </nav>
  );
}

export default Navbar;