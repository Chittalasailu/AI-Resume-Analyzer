import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

function Signup({ onLogin }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://127.0.0.1:8000/signup", {
        username,
        email,
        password,
      });
      const response = await axios.post("http://127.0.0.1:8000/login", {
        username,
        password,
      });
      onLogin(response.data);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Signup failed");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Create your account</h2>
        <p>Start using the AI Resume Analyzer as a multi-user workspace.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" required />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
          {error && <p className="validation-message">{error}</p>}
          <button type="submit">Create Account</button>
        </form>
        <p className="auth-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
