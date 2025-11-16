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

      // Save token + user info
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect based on role
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
    <div style={{ width: "350px", margin: "60px auto" }}>
      <h2>Employee Login</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleLogin}>
        <div>
          <label>Email</label>
          <br />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <div style={{ marginTop: "10px" }}>
          <label>Password</label>
          <br />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <button style={{ marginTop: "15px", padding: "10px", width: "100%" }}>
          Login
        </button>
      </form>
    </div>
  );
}
