import React, { useState } from "react";
import supabase from "../supabase-client"; // adjust path if needed

const JoinPartyModal = () => {
  const [partyCode, setPartyCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleJoinParty = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // First, find the party with the given code
      const { data: partyData, error: partyError } = await supabase
        .from("parties")
        .select("*")
        .eq("join_code", partyCode)
        .single();

      if (partyError) {
        if (partyError.code === "PGRST116") {
          throw new Error("Invalid party code. Please check and try again.");
        }
        throw partyError;
      }

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error("You must be logged in to join a party");

      // Check if user is already a member of this party
      const { data: existingMember, error: memberCheckError } = await supabase
        .from("party_members")
        .select("*")
        .eq("user_id", user.id)
        .eq("party_id", partyData.id)
        .maybeSingle();

      if (memberCheckError) throw memberCheckError;

      if (existingMember) {
        throw new Error("You're already a member of this party!");
      }

      // Join the party (add to party_members)
      const { error: joinError } = await supabase.from("party_members").insert([
        {
          user_id: user.id,
          party_id: partyData.id,
          balance: parseFloat(partyData.starting_balance),
          joined_at: new Date(),
        },
      ]);

      if (joinError) throw joinError;

      // Close modal and reset form
      document.getElementById("join_party_modal").close();
      setPartyCode("");

      // Refresh the page to show the joined party in the list
      window.location.reload();

      // Optional: redirect to the party details page
      // window.location.href = `/parties/${partyData.id}`;
    } catch (err) {
      console.error("Error joining party:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <dialog id="join_party_modal" className="modal">
        <div className="modal-box">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
              ✕
            </button>
          </form>
          <h3 className="font-bold text-xl mb-5">Join Party</h3>
          <form
            onSubmit={handleJoinParty}
            className="flex flex-col justify-center items-left"
          >
            <label className="label">
              <span className="label-text text-white">Party Code</span>
            </label>
            <input
              type="text"
              value={partyCode}
              onChange={(e) => setPartyCode(e.target.value)}
              placeholder="Enter Party Code"
              className="input input-bordered w-full max-w-xs mb-3"
              required
            />

            {error && (
              <div className="alert alert-error mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="stroke-current shrink-0 h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div className="modal-action">
              <button
                type="submit"
                disabled={loading}
                className="btn bg-blue-600 hover:bg-blue-700"
              >
                {loading ? "Joining..." : "Join Party"}
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  );
};

export default JoinPartyModal;
