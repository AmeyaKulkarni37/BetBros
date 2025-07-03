import React, { useState } from "react";
import supabase from "../supabase-client";
import Notification from "./Notification";

const DeletePartyModal = ({
  isOpen,
  onClose,
  partyName,
  partyId,
  onDeleted,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const handleDeleteParty = async () => {
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

      // Verify user is the host
      const { data: partyData, error: partyError } = await supabase
        .from("parties")
        .select("host_id")
        .eq("id", partyId)
        .single();

      if (partyError) {
        throw new Error(`Failed to fetch party: ${partyError.message}`);
      }

      if (partyData.host_id !== user.id) {
        throw new Error("Only the party host can delete the party");
      }

      // Delete the party (this will cascade delete all related data due to foreign key constraints)
      const { error: deleteError } = await supabase
        .from("parties")
        .delete()
        .eq("id", partyId);

      if (deleteError) {
        throw new Error(`Failed to delete party: ${deleteError.message}`);
      }

      console.log("Successfully deleted party");

      setNotification({
        show: true,
        message: `Successfully deleted ${partyName}`,
        type: "success",
      });

      onDeleted();
      onClose();
    } catch (err) {
      console.error("Error deleting party:", err);
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
        <dialog id="delete_party_modal" className="modal" open={isOpen}>
          <div className="modal-box">
            <form method="dialog">
              <button
                className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                onClick={onClose}
              >
                ✕
              </button>
            </form>

            <h3 className="font-bold text-xl mb-5">Delete Party</h3>

            <div className="mb-6">
              <p className="text-base-content/70">
                Are you sure you want to delete <strong>{partyName}</strong>?
              </p>
              <div className="alert alert-error mt-4">
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
                  <strong>This action cannot be undone!</strong> This will
                  permanently delete the party, all props, bets, and member
                  data.
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
                onClick={handleDeleteParty}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete Party"}
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

export default DeletePartyModal;
