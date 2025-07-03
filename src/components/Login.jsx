import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../supabase-client";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthError(error.message);
    } else {
      navigate("/parties");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="bg-base-300 p-8 rounded-xl shadow w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6">Log In</h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              className="input input-bordered w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              className="input input-bordered w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          {authError && (
            <div className="text-error text-sm text-center bg-error/20 p-3 rounded">
              {authError}
            </div>
          )}

          <button type="submit" className="btn btn-primary w-full">
            Log In
          </button>
        </form>

        <div className="mt-6 space-y-3 text-center text-sm">
          <div>
            <span
              onClick={() => navigate("/forgot-password")}
              className="text-primary hover:underline cursor-pointer"
            >
              Forgot your password?
            </span>
          </div>
          <div>
            Don't have an account?{" "}
            <span
              onClick={() => navigate("/signup")}
              className="text-primary hover:underline cursor-pointer"
            >
              Sign Up
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
