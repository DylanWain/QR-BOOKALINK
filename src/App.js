import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Auth Pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// Protected Pages
import MyEvents from "./pages/MyEvents";
import CreateEvent from "./pages/CreateEvent";
import EventCreated from "./pages/EventCreated";
import Dashboard from "./pages/Dashboard";
import QRScanner from "./pages/QRScanner";
import Home from "./pages/Home";

// Public Pages
import PaymentPage from "./pages/PaymentPage";
import StripePaymentPage from "./pages/StripePaymentPage";
import TicketSuccess from "./pages/TicketSuccess";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F3F4F6",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
          <div style={{ fontSize: "18px", fontWeight: 600, color: "#666" }}>
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

// Main App Routes
function AppRoutes() {
  return (
    <Routes>
      {/* Home Route */}
      <Route path="/" element={<Home />} />

      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected Routes */}
      <Route
        path="/my-events"
        element={
          <ProtectedRoute>
            <MyEvents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-event"
        element={
          <ProtectedRoute>
            <CreateEvent />
          </ProtectedRoute>
        }
      />
      <Route
        path="/event-created/:eventId"
        element={
          <ProtectedRoute>
            <EventCreated />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dash/:eventId"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/scan"
        element={
          <ProtectedRoute>
            <QRScanner />
          </ProtectedRoute>
        }
      />

      {/* Public Routes */}
      <Route path="/pay/:eventId" element={<PaymentPage />} />
      <Route path="/stripe-pay/:eventId" element={<StripePaymentPage />} />
      <Route path="/ticket/:ticketCode" element={<TicketSuccess />} />

      {/* 404 - Catch all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

// 404 Not Found Component
const NotFound = () => {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F3F4F6",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "#FFFFFF",
          border: "4px solid #000000",
          borderRadius: "20px",
          padding: "40px",
          boxShadow: "8px 8px 0px #000000",
          textAlign: "center",
          maxWidth: "400px",
          width: "100%",
        }}
      >
        <div style={{ fontSize: "80px", marginBottom: "16px" }}>😕</div>
        <h1 style={{ fontSize: "32px", fontWeight: 900, marginBottom: "12px" }}>
          Page Not Found
        </h1>
        <p style={{ fontSize: "16px", color: "#666", marginBottom: "24px" }}>
          The page you're looking for doesn't exist.
        </p>
        
          href="/"
          style={{
            display: "inline-block",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "#FFFFFF",
            border: "3px solid #000000",
            borderRadius: "12px",
            padding: "16px 32px",
            fontSize: "16px",
            fontWeight: 800,
            textDecoration: "none",
            boxShadow: "4px 4px 0px #000000",
          }}
        >
          ← Go Home
        </a>
      </div>
    </div>
  );
};

// Main App with Auth Provider
function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
