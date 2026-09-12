import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email,
            password
          })
        }
      );

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);

        alert("Login successful!");

        navigate("/dashboard");
      } else {
        alert(data.message || "Invalid email or password");
      }
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>DueEase</h1>

        <p className="auth-subtitle">
          Smart Group Expense Management
        </p>

        <h2>Login</h2>

        <form onSubmit={handleLogin}>
          <label>Email</label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Password</label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit">
            Login
          </button>
        </form>

        <p className="auth-link">
          Don't have an account?{" "}
          <Link to="/register">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;