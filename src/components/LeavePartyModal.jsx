import React, { useState } from "react";
import supabase from "../supabase-client";
import Notification from "./Notification";

const LeavePartyModal = ({ isOpen, onClose, partyName, partyId, onLeft }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const handleLeaveParty = async () => {
    setLoading(true);
    setError("");

    try {
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("User not authenticated");
      }

      // Check if user is the host
      const { data: partyData, error: partyError } = await supabase
        .from("parties")
        .select("host_id")
        .eq("id", partyId)
        .single();

      if (partyError) {
        throw new Error(`Failed to fetch party: ${partyError.message}`);
      }

      if (partyData.host_id === user.id) {
        throw new Error(
          "Party hosts cannot leave their own party. Please delete the party instead."
        );
      }

      // Remove user from party_members
      const { error: leaveError } = await supabase
        .from("party_members")
        .delete()
        .eq("user_id", user.id)
        .eq("party_id", partyId);

      if (leaveError) {
        throw new Error(`Failed to leave party: ${leaveError.message}`);
      }

      console.log("Successfully left party");

      setNotification({
        show: true,
        message: `Successfully left ${partyName}`,
        type: "success",
      });

      onLeft();
      onClose();
    } catch (err) {
      console.error("Error leaving party:", err);
      setError(err.message);
      setNotification({
        show: true,
        message: err.message,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div>
        <dialog id="leave_party_modal" className="modal" open={isOpen}>
          <div className="modal-box">
            <form method="dialog">
              <button
                className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                onClick={onClose}
              >
                ✕
              </button>
            </form>

            <h3 className="font-bold text-xl mb-5">Leave Party</h3>

            <div className="mb-6">
              <p className="text-base-content/70">
                Are you sure you want to leave <strong>{partyName}</strong>?
              </p>
              <div className="alert alert-warning mt-4">
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
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <span>
                  This action cannot be undone. You will lose access to this
                  party and any remaining balance.
                </span>
              </div>
            </div>

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
                type="button"
                className="btn btn-ghost"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-error"
                onClick={handleLeaveParty}
                disabled={loading}
              >
                {loading ? "Leaving..." : "Leave Party"}
              </button>
            </div>
          </div>
        </dialog>
      </div>

      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.show}
        onClose={() =>
          setNotification({ show: false, message: "", type: "success" })
        }
      />
    </>
  );
};

export default LeavePartyModal;
