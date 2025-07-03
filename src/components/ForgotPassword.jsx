import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../supabase-client";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage(
          "Password reset link sent to your email! Check your inbox and spam folder."
        );
        setTimeout(() => {
          navigate("/login");
        }, 5000);
      }
    } catch {
      setMessage("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="bg-base-300 p-8 rounded-xl shadow w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6">Reset Password</h1>

        <p className="text-center text-sm mb-6 text-base-content/70">
          Enter your email address and we'll send you a link to reset your
          password.
        </p>

        <form onSubmit={handleResetPassword} className="space-y-4">
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

          {message && (
            <div
              className={`text-sm text-center p-3 rounded ${
                message.includes("sent")
                  ? "text-success bg-success/20"
                  : "text-error bg-error/20"
              }`}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          Remember your password?{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-primary hover:underline cursor-pointer"
          >
            Log In
          </span>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
