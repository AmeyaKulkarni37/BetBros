import React, { useState } from "react";
import supabase from "../supabase-client";
import Notification from "./Notification";

const ResolveBetModal = ({ isOpen, onClose, bet, partyId, onResolved }) => {
  const [winningChoice, setWinningChoice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success",
  });

  if (!isOpen || !bet) return null;

  const { bet_info } = bet;

  const calculateWinnings = (amount, odds) => {
    const oddsNum = parseInt(odds);

    if (oddsNum > 0) {
      // Positive odds (e.g., +110): win $110 on $100 bet
      return amount + (amount * oddsNum) / 100;
    } else {
      // Negative odds (e.g., -110): need to bet $110 to win $100
      return amount + (amount * 100) / Math.abs(oddsNum);
    }
  };

  const handleResolve = async () => {
    if (!winningChoice) {
      setError("Please select the winning choice");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Get current user to verify they're the host
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("User not authenticated");
      }

      // Verify user is the host of this party
      const { data: partyData, error: partyError } = await supabase
        .from("parties")
        .select("host_id")
        .eq("id", partyId)
        .single();

      if (partyError || partyData.host_id !== user.id) {
        throw new Error("Only the party host can resolve bets");
      }

      // Get all wagers for this bet
      const { data: wagers, error: wagersError } = await supabase
        .from("wagers")
        .select("*")
        .eq("bet_id", bet.bet_id)
        .eq("status", "active");

      if (wagersError) {
        throw new Error(`Failed to fetch wagers: ${wagersError.message}`);
      }

      console.log("Resolving bet with wagers:", wagers);

      // Update the bet as resolved
      const { error: betUpdateError } = await supabase
        .from("bets")
        .update({
          resolved_at: new Date(),
          winning_choice: winningChoice,
        })
        .eq("bet_id", bet.bet_id);

      if (betUpdateError) {
        throw new Error(`Failed to update bet: ${betUpdateError.message}`);
      }

      let winnersCount = 0;
      let totalWinnings = 0;

      // Process each wager
      for (const wager of wagers) {
        const isWinner = wager.choice === winningChoice;
        const newStatus = isWinner ? "win" : "loss";

        // Update wager status
        const { error: wagerUpdateError } = await supabase
          .from("wagers")
          .update({ status: newStatus })
          .eq("wager_id", wager.wager_id);

        if (wagerUpdateError) {
          console.error(
            `Failed to update wager ${wager.wager_id}:`,
            wagerUpdateError
          );
          continue;
        }

        // Update user balance
        if (isWinner) {
          const winnings = calculateWinnings(wager.amount, wager.odds);
          winnersCount++;
          totalWinnings += winnings;
          console.log(
            `User ${wager.user_id} wins $${winnings} (bet $${wager.amount} at ${wager.odds})`
          );

          // Get current balance
          const { data: currentBalance, error: balanceError } = await supabase
            .from("party_members")
            .select("balance")
            .eq("user_id", wager.user_id)
            .eq("party_id", partyId)
            .single();

          if (!balanceError && currentBalance) {
            const newBalance = currentBalance.balance + winnings;

            const { error: updateBalanceError } = await supabase
              .from("party_members")
              .update({ balance: newBalance })
              .eq("user_id", wager.user_id)
              .eq("party_id", partyId);

            if (updateBalanceError) {
              console.error(
                `Failed to update balance for user ${wager.user_id}:`,
                updateBalanceError
              );
            } else {
              console.log(
                `Updated balance for user ${wager.user_id} to $${newBalance}`
              );
            }
          }
        } else {
          console.log(`User ${wager.user_id} loses $${wager.amount}`);
        }
      }

      console.log("Bet resolved successfully");

      // Show success notification
      setNotification({
        show: true,
        message: `Bet resolved! ${winnersCount} winner(s) received $${totalWinnings.toFixed(
          2
        )} in total winnings.`,
        type: "success",
      });

      onResolved();
      onClose();
    } catch (err) {
      console.error("Error resolving bet:", err);
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
        <dialog id="resolve_bet_modal" className="modal" open={isOpen}>
          <div className="modal-box">
            <form method="dialog">
              <button
                className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                onClick={onClose}
              >
                ✕
              </button>
            </form>

            <h3 className="font-bold text-xl mb-5">Resolve Bet</h3>

            <div className="mb-6">
              <h4 className="font-semibold mb-2">{bet_info.title}</h4>
              <p className="text-sm text-base-content/70 mb-4">
                {bet_info.description}
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-3">
                  <h5 className="font-medium">{bet_info.option1}</h5>
                  <p className="text-sm text-base-content/60">
                    {bet_info.odds1}
                  </p>
                </div>
                <div className="border rounded-lg p-3">
                  <h5 className="font-medium">{bet_info.option2}</h5>
                  <p className="text-sm text-base-content/60">
                    {bet_info.odds2}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="label">
                <span className="label-text font-medium">
                  Select Winning Side
                </span>
              </label>
              <div className="space-y-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="winningChoice"
                    value={bet_info.option1}
                    checked={winningChoice === bet_info.option1}
                    onChange={(e) => setWinningChoice(e.target.value)}
                    className="radio radio-primary"
                  />
                  <span>
                    {bet_info.option1} ({bet_info.odds1})
                  </span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="winningChoice"
                    value={bet_info.option2}
                    checked={winningChoice === bet_info.option2}
                    onChange={(e) => setWinningChoice(e.target.value)}
                    className="radio radio-primary"
                  />
                  <span>
                    {bet_info.option2} ({bet_info.odds2})
                  </span>
                </label>
              </div>

              {winningChoice && (
                <div className="mt-4 p-3 bg-base-200 rounded-lg">
                  <p className="text-sm font-medium">Preview:</p>
                  <p className="text-xs text-base-content/70">
                    Selecting "{winningChoice}" as the winner will resolve this
                    bet.
                  </p>
                </div>
              )}
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
                className="btn btn-primary"
                onClick={handleResolve}
                disabled={loading || !winningChoice}
              >
                {loading ? "Resolving..." : "Resolve Bet"}
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

export default ResolveBetModal;
