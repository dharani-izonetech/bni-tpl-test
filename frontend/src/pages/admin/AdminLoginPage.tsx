import { FormEvent, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Shield, Loader2, ArrowLeft } from "lucide-react";
import { loginAdmin } from "@/lib/adminAuth";
import "@/components/admin.css";

const AdminLoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/admin/dashboard";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const success = await loginAdmin(username, password);
      if (success) {
        navigate(from, { replace: true });
      } else {
        setError("Invalid username or password. Please try again.");
      }
    } catch {
      setError("Login failed. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-wrap relative">
      <button
        onClick={() => navigate(-1)}
        className="admin-btn-secondary absolute left-4 top-4 border-none px-2 shadow-none sm:left-8 sm:top-8"
        aria-label="Go back"
      >
        <ArrowLeft size={24} />
      </button>
      <div className="admin-login-card">
        <div className="admin-login-icon">
          <Shield size={32} />
        </div>
        <h1 className="admin-login-title">Admin Login</h1>
        <p className="admin-login-sub">Enter your credentials to access the admin panel</p>

        {error && <div className="admin-login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="admin-form-grid" style={{ textAlign: "left" }}>
            <div className="admin-form-field">
              <label className="admin-form-label">Username</label>
              <input
                className="admin-form-input"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label">Password</label>
              <input
                className="admin-form-input"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="admin-btn-primary"
              style={{ width: "100%", justifyContent: "center", padding: "14px", fontSize: "16px" }}
              disabled={loading}
            >
              {loading ? (
                <><Loader2 size={18} className="spin" /> Signing in...</>
              ) : (
                "Sign In"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginPage;
