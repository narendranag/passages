import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register as apiRegister } from "../api";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setSubmitting(true);
    try {
      const data = await apiRegister({ email, password, name });
      login(data);
      navigate("/my/passages");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="text-xl font-semibold text-white hover:text-gray-300">
            Passages
          </Link>
          <p className="text-sm text-gray-500 mt-1">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-4 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-surface-800 border border-gray-800 rounded-lg px-4 py-3 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-600"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-surface-800 border border-gray-800 rounded-lg px-4 py-3 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-600"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full bg-surface-800 border border-gray-800 rounded-lg px-4 py-3 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-600"
              placeholder="At least 8 characters"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-surface-600 hover:bg-blue-900/40 text-gray-200 border border-gray-700 rounded-lg px-4 py-3 font-medium transition-colors disabled:opacity-50"
          >
            {submitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-400/70 hover:text-blue-400">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
