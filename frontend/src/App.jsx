import { useEffect, useState } from "react";
import { Navigate, Route, Routes, Link, useNavigate, useLocation } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import "./App.css";

function App() {
  const [auth, setAuth] = useState(() => JSON.parse(localStorage.getItem("auth") || "null"));
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (auth?.access_token) {
      localStorage.setItem("auth", JSON.stringify(auth));
    }
  }, [auth]);

  const handleLogin = (data) => {
    setAuth(data);
  };

  const handleLogout = () => {
    localStorage.removeItem("auth");
    setAuth(null);
    navigate("/login");
  };

  const ProtectedRoute = ({ children }) => {
    if (!auth?.access_token) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  const PublicOnlyRoute = ({ children }) => {
    if (auth?.access_token) {
      return <Navigate to="/dashboard" replace />;
    }
    return children;
  };

  const isAuthed = Boolean(auth?.access_token);

  return (
    <div className="app-shell">
      {isAuthed && (
        <nav className="top-nav">
          <div className="top-nav-inner">
            <Link to="/dashboard" className="nav-brand">
              <span className="brand-mark" aria-hidden="true">AI</span>
              Resume Analyzer
            </Link>
            <div className="nav-links">
              <Link to="/dashboard" className={location.pathname === "/dashboard" ? "active" : ""}>
                Dashboard
              </Link>
              <Link to="/history" className={location.pathname === "/history" ? "active" : ""}>
                History
              </Link>
              <Link to="/profile" className={location.pathname === "/profile" ? "active" : ""}>
                Profile
              </Link>
              <button className="nav-logout" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </nav>
      )}

      <Routes>
        <Route
          path="/"
          element={
            <PublicOnlyRoute>
              <Landing />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login onLogin={handleLogin} />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicOnlyRoute>
              <Signup onLogin={handleLogin} />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard auth={auth} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <History token={auth?.access_token} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <div className="container">
                <section className="page-welcome">
                  <div>
                    <span className="eyebrow">Account</span>
                    <h1>Profile</h1>
                    <p className="subtitle">Your account details.</p>
                  </div>
                </section>
                <div className="card profile-card">
                  <div className="profile-row">
                    <span className="profile-label">Username</span>
                    <span>{auth?.user?.username}</span>
                  </div>
                  <div className="profile-row">
                    <span className="profile-label">Email</span>
                    <span>{auth?.user?.email}</span>
                  </div>
                </div>
              </div>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to={isAuthed ? "/dashboard" : "/"} replace />} />
      </Routes>
    </div>
  );
}

export default App;
