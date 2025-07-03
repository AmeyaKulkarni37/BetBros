import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import supabase from "../supabase-client";

const ProtectedRoute = ({ children, requireProfile = true }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.error("Auth error:", error);
          setUser(null);
          setProfile(null);
        } else if (user) {
          setUser(user);

          // Check if user has a profile (if required)
          if (requireProfile) {
            const { data: profileData, error: profileError } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", user.id)
              .single();

            if (profileError && profileError.code !== "PGRST116") {
              console.error("Profile check error:", profileError);
            }

            setProfile(profileData);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error("Unexpected auth error:", err);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);

        // Check profile when user logs in
        if (requireProfile) {
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (profileError && profileError.code !== "PGRST116") {
            console.error("Profile check error:", profileError);
          }

          setProfile(profileData);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [requireProfile]);

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

  // Not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated but no profile (and profile is required)
  if (requireProfile && !profile) {
    return <Navigate to="/create-profile" replace />;
  }

  return children;
};

export default ProtectedRoute;
