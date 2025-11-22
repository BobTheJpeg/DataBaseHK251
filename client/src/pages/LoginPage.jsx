import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("user", JSON.stringify(data.user));

      switch (data.user.role) {
        case "server":
          navigate("/server");
          break;
        case "chef":
        case "head_chef":
          navigate("/chef");
          break;
        case "receptionist":
          navigate("/reception");
          break;
        case "manager":
          navigate("/manager");
          break;
        case "storage_manager":
          navigate("/storage");
          break;
        default:
          navigate("/login");
      }
    } catch (err) {
      console.error(err);
      setError("Network error");
    }
  }

  return (
    <div className="page">
      <div className="form" style={{ maxWidth: "380px" }}>
        <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
          Employee Login
        </h1>

        {error && (
          <p
            style={{ color: "red", marginBottom: "15px", textAlign: "center" }}
          >
            {error}
          </p>
        )}

        <form onSubmit={handleLogin}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            placeholder="Enter your email"
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            placeholder="Enter your password"
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {/* Button */}
          <button
            className="btn"
            style={{
              width: "100%",
              marginTop: "10px",
            }}
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
