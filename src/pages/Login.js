import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signIn } from "../config/supabase";

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");

    const { data, error } = await signIn(formData.email, formData.password);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate("/my-events");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F3F4F6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ maxWidth: "500px", width: "100%", padding: "20px" }}>
        {/* Logo/Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1
            style={{
              fontSize: "48px",
              fontWeight: 900,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: "8px",
            }}
          >
            🎉 BookaLink
          </h1>
          <p style={{ fontSize: "18px", color: "#666666", fontWeight: 600 }}>
            Events
          </p>
        </div>

        {/* Login Card */}
        <div
          style={{
            background: "#FFFFFF",
            border: "4px solid #000000",
            borderRadius: "20px",
            padding: "40px",
            boxShadow: "8px 8px 0px #000000",
          }}
        >
          <h2
            style={{ fontSize: "28px", fontWeight: 900, marginBottom: "8px" }}
          >
            Welcome Back
          </h2>
          <p
            style={{ fontSize: "16px", color: "#666666", marginBottom: "32px" }}
          >
            Sign in to manage your events
          </p>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: 700,
                }}
              >
                Email
              </label>
              <input
                type="email"
                placeholder="you@email.com"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                style={{
                  width: "100%",
                  padding: "14px",
                  border: "3px solid #000000",
                  borderRadius: "12px",
                  fontSize: "16px",
                  fontWeight: 600,
                  fontFamily: "inherit",
                }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: 700,
                }}
              >
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                style={{
                  width: "100%",
                  padding: "14px",
                  border: "3px solid #000000",
                  borderRadius: "12px",
                  fontSize: "16px",
                  fontWeight: 600,
                  fontFamily: "inherit",
                }}
              />
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  background: "#FFE5E5",
                  border: "2px solid #EF4444",
                  borderRadius: "12px",
                  padding: "12px",
                  marginBottom: "20px",
                  color: "#EF4444",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                background: loading
                  ? "#CCCCCC"
                  : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "#FFFFFF",
                border: "4px solid #000000",
                borderRadius: "16px",
                padding: "16px",
                fontSize: "18px",
                fontWeight: 900,
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "6px 6px 0px #000000",
                marginBottom: "16px",
              }}
            >
              {loading ? "⏳ Signing in..." : "🚀 Sign In"}
            </button>

            {/* Sign Up Link */}
            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: "14px", color: "#666666" }}>
                Don't have an account?{" "}
              </span>
              <Link
                to="/signup"
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#667eea",
                  textDecoration: "none",
                }}
              >
                Sign Up
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
