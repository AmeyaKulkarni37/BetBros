import React from "react";
import { useRef, useImperativeHandle, forwardRef, useState } from "react";
import supabase from "../supabase-client";

const PlaceBetModal = forwardRef(
  ({ betName = "", choice, odds, onSubmit, betId, partyId }, ref) => {
    const modalRef = useRef();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [userBalance, setUserBalance] = useState(0);

    // Allow parent to call modalRef.current.showModal()
    useImperativeHandle(ref, () => ({
      showModal: async () => {
        await fetchUserBalance();
        modalRef.current?.showModal();
      },
      close: () => modalRef.current?.close(),
    }));

    const fetchUserBalance = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) return;

        const { data: memberData, error: balanceError } = await supabase
          .from("party_members")
          .select("balance")
          .eq("user_id", user.id)
          .eq("party_id", partyId)
          .single();

        if (!balanceError && memberData) {
          setUserBalance(memberData.balance);
        }
      } catch (err) {
        console.error("Error fetching balance:", err);
      }
    };

    const handleSubmit = async (event) => {
      event.preventDefault();
      setLoading(true);
      setError("");

      const amount = Number(event.target.amount.value);

      try {
        // Validate amount
        if (amount <= 0) {
          throw new Error("Bet amount must be greater than 0");
        }

        if (amount > userBalance) {
          throw new Error(
            `Insufficient balance. You have $${userBalance.toFixed(
              2
            )} available.`
          );
        }

        // Get current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
          throw new Error("User not authenticated");
        }

        // First, get the current balance from the database to ensure we have the latest value
        const { data: currentMemberData, error: currentBalanceError } =
          await supabase
            .from("party_members")
            .select("balance")
            .eq("user_id", user.id)
            .eq("party_id", partyId)
            .single();

        if (currentBalanceError) {
          throw new Error(
            `Failed to fetch current balance: ${currentBalanceError.message}`
          );
        }

        const currentBalance = currentMemberData.balance;
        console.log("Current balance from DB:", currentBalance);

        // Double-check balance is sufficient
        if (amount > currentBalance) {
          throw new Error(
            `Insufficient balance. Current balance: $${currentBalance.toFixed(
              2
            )}`
          );
        }

        // Create the wager first
        const { error: wagerError } = await supabase.from("wagers").insert({
          user_id: user.id,
          bet_id: betId,
          choice: choice,
          odds: odds,
          amount: amount,
          placed_at: new Date(),
          status: "active",
        });

        if (wagerError) {
          throw new Error(`Failed to place bet: ${wagerError.message}`);
        }

        console.log("Wager created successfully");

        // Update user balance using the current balance from DB
        const newBalance = currentBalance - amount;
        console.log("Updating balance from", currentBalance, "to", newBalance);
        console.log("Update query params:", {
          user_id: user.id,
          party_id: partyId,
        });

        // First, let's verify the row exists
        const { data: verifyData, error: verifyError } = await supabase
          .from("party_members")
          .select("balance, user_id, party_id")
          .eq("user_id", user.id)
          .eq("party_id", partyId)
          .single();

        if (verifyError) {
          console.error("Verify error:", verifyError);
          throw new Error(
            `Failed to verify party membership: ${verifyError.message}`
          );
        }

        console.log("Verified row exists:", verifyData);

        // Try the update without select() first
        const { error: balanceError } = await supabase
          .from("party_members")
          .update({ balance: newBalance })
          .eq("user_id", user.id)
          .eq("party_id", partyId);

        if (balanceError) {
          console.error("Balance update error:", balanceError);
          throw new Error(`Failed to update balance: ${balanceError.message}`);
        }

        console.log("Balance update completed successfully");

        // Verify the update worked
        const { data: verifyUpdateData, error: verifyUpdateError } =
          await supabase
            .from("party_members")
            .select("balance")
            .eq("user_id", user.id)
            .eq("party_id", partyId)
            .single();

        if (verifyUpdateError) {
          console.error("Verify update error:", verifyUpdateError);
        } else {
          console.log("Balance after update:", verifyUpdateData.balance);
        }

        // Update local state with new balance
        setUserBalance(newBalance);

        // Call parent's onSubmit callback
        onSubmit({ betName, choice, odds, amount });

        // Close modal and reset form
        modalRef.current.close();
        event.target.reset();
      } catch (err) {
        console.error("Error placing bet:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div>
        <dialog ref={modalRef} className="modal">
          <div className="modal-box">
            <form method="dialog">
              <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
                ✕
              </button>
            </form>
            <h2 className="font-bold text-xl mb-5">{betName}</h2>
            <p className="text-lg mb-3">
              {choice} at odds {odds}
            </p>
            <p className="text-sm mb-5 text-base-content/70">
              Available Balance: ${userBalance.toFixed(2)}
            </p>

            <form onSubmit={handleSubmit}>
              <div>
                <label className="label text-white">Amount</label>
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={userBalance}
                  className="input input-bordered w-55 max-w-xs ml-3"
                  required
                  placeholder="Enter Amount"
                  disabled={loading}
                />
              </div>

              {error && (
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
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <div className="modal-action">
                <button
                  type="submit"
                  className="btn bg-green-600 hover:bg-green-700"
                  disabled={loading}
                >
                  {loading ? "Placing Bet..." : "Confirm Bet"}
                </button>
              </div>
            </form>
          </div>
        </dialog>
      </div>
    );
  }
);

export default PlaceBetModal;
