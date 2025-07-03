import React, { useEffect, useState } from "react";
import Navbar from "./Navbar";
import { useNavigate } from "react-router-dom";
import supabase from "../supabase-client";

const PartyList = () => {
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchParties = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get current user (we know they're authenticated because of ProtectedRoute)
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          throw new Error("User not authenticated");
        }

        // Fetch parties for this user with host profile information
        const { data, error } = await supabase
          .from("party_members")
          .select(
            `
            party_id, 
            parties(*)
          `
          )
          .eq("user_id", user.id);

        if (error) {
          throw new Error(`Failed to load parties: ${error.message}`);
        }

        // Fetch host profiles separately for each party
        const partiesWithHosts = await Promise.all(
          (data || []).map(async (partyMember) => {
            const { data: hostProfile } = await supabase
              .from("profiles")
              .select("username, full_name, avatar_url")
              .eq("id", partyMember.parties.host_id)
              .single();

            return {
              ...partyMember,
              parties: {
                ...partyMember.parties,
                host_profile: hostProfile,
              },
            };
          })
        );

        setParties(partiesWithHosts);
      } catch (err) {
        console.error("Error fetching parties:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchParties();
  }, []);

  const handlePartyClick = (partyId) => {
    navigate(`/parties/${partyId}`);
  };

  return (
    <>
      <Navbar onCreateProp={() => {}} />
      <div className="container mx-auto px-4 pt-10 w-4/5">
        <h1 className="text-3xl font-bold mb-10">My Parties</h1>

        {loading ? (
          <div className="text-center">
            <div className="loading loading-spinner loading-lg"></div>
            <p className="mt-4">Loading parties...</p>
          </div>
        ) : error ? (
          <div className="text-center">
            <p className="text-lg text-red-500 mb-4">{error}</p>
            <button
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        ) : parties.length === 0 ? (
          <div className="text-center">
            <p className="text-lg text-gray-600 mb-4">
              You're not in any parties yet.
            </p>
            <button
              className="btn btn-primary"
              onClick={() =>
                document.getElementById("create_party_modal").showModal()
              }
            >
              Create Your First Party
            </button>
          </div>
        ) : (
          <div className="partylist grid grid-cols-3 gap-y-10 justify-center items-center">
            {parties.map((partyMember) => (
              <div
                key={partyMember.parties.id}
                className="party w-60 h-100 border rounded-lg flex flex-col justify-evenly items-center hover:cursor-pointer hover:shadow-xl transition"
                onClick={() => handlePartyClick(partyMember.parties.id)}
              >
                <div className="party-header w-50">
                  <h2 className="text-center font-bold pb-5 text-3xl truncate">
                    {partyMember.parties.name}
                  </h2>
                  <p className="text-center text-lg text-wrap truncate">
                    Host:{" "}
                    {partyMember.parties.host_profile?.full_name ||
                      partyMember.parties.host_profile?.username ||
                      "Unknown"}
                  </p>
                </div>
                <div className="w-40 rounded-full flex justify-center">
                  {partyMember.parties.image_url ? (
                    <img
                      src={partyMember.parties.image_url}
                      alt="Party image"
                      className="w-32 h-32 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-base-300 flex items-center justify-center border-2 border-base-300">
                      <svg
                        className="w-16 h-16 text-base-content/40"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default PartyList;
