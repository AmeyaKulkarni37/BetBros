import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import PartyList from "./components/PartyList";
import PartyDetails from "./components/PartyDetails";
import Login from "./components/Login";
import SignUp from "./components/SignUp";
import ForgotPassword from "./components/ForgotPassword";
import CreateProfile from "./components/CreateProfile";
import ProtectedRoute from "./components/ProtectedRoute";
import supabase from "./supabase-client";

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (error) {
        console.error("Error getting session:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public routes - redirect to /parties if already logged in */}
        <Route
          path="/login"
          element={user ? <Navigate to="/parties" replace /> : <Login />}
        />
        <Route
          path="/signup"
          element={user ? <Navigate to="/parties" replace /> : <SignUp />}
        />
        <Route
          path="/forgot-password"
          element={
            user ? <Navigate to="/parties" replace /> : <ForgotPassword />
          }
        />

        {/* Profile creation route - requires auth but not profile */}
        <Route
          path="/create-profile"
          element={
            <ProtectedRoute requireProfile={false}>
              <CreateProfile />
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/parties" replace />} />

        {/* Protected routes - require both auth and profile */}
        <Route
          path="/parties"
          element={
            <ProtectedRoute requireProfile={true}>
              <PartyList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parties/:partyId"
          element={
            <ProtectedRoute requireProfile={true}>
              <PartyDetails />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
