export default function LogoutButton() {
  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        padding: "10px 16px",
        background: "#b30000",
        color: "white",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
      }}
    >
      Logout
    </button>
  );
}
