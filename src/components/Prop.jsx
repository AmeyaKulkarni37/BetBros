import React from "react";
import { useRef, useState, useEffect } from "react";
import PlaceBetModal from "./PlaceBetModal";
import ResolveBetModal from "./ResolveBetModal";

const Prop = ({
  title,
  description,
  option1,
  odds1,
  option2,
  odds2,
  onEdit,
  betId,
  partyId,
  onBetPlaced,
  isHost = false,
  isResolved = false,
  winningChoice = null,
}) => {
  const modalRef = useRef();
  const [currentBet, setCurrentBet] = useState(null);
  const [showResolveModal, setShowResolveModal] = useState(false);

  // show modal when currentBet changes
  useEffect(() => {
    if (currentBet && modalRef.current) {
      modalRef.current.showModal();
    }
  }, [currentBet]);

  const openModal = ({ betName, choice, odds }) => {
    setCurrentBet({ betName, choice, odds });
  };

  const handlePlaceBet = ({ betName, choice, odds, amount }) => {
    console.log(
      `Placed $${amount} on ${choice} for "${betName}" at odds ${odds}`
    );
    // Call the parent callback to refresh data
    if (onBetPlaced) {
      onBetPlaced();
    }
  };

  const handleEditClick = () => {
    if (onEdit) {
      onEdit({
        title,
        description,
        option1,
        odds1,
        option2,
        odds2,
      });
    }
  };

  const handleResolveClick = () => {
    setShowResolveModal(true);
  };

  const handleResolved = () => {
    if (onBetPlaced) {
      onBetPlaced();
    }
  };

  const getBetStatusDisplay = () => {
    if (!isResolved) return null;

    return (
      <div className="absolute top-2 right-2">
        <div className="badge badge-success">RESOLVED</div>
        <div className="text-xs mt-1 text-center">Winner: {winningChoice}</div>
      </div>
    );
  };

  return (
    <>
      <div className="card card-border bg-base-100 w-100% relative">
        {getBetStatusDisplay()}
        <div className="card-body pt-3 pb-5 px-5">
          <div className="flex justify-between items-top">
            <h2 className="card-title">{title}</h2>
            <div className="dropdown dropdown-start">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-circle border-none avatar"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="#ffffff"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="feather feather-more-vertical"
                >
                  <circle cx="12" cy="12" r="1.5"></circle>
                  <circle cx="12" cy="5" r="1.5"></circle>
                  <circle cx="12" cy="19" r="1.5"></circle>
                </svg>
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content menu bg-base-300 rounded-box z-1 w-25 p-2 shadow-sm"
              >
                {isHost && !isResolved && (
                  <li>
                    <button
                      className="text-green-300"
                      onClick={handleResolveClick}
                    >
                      Resolve
                    </button>
                  </li>
                )}
                <li>
                  <button onClick={handleEditClick}>Edit</button>
                </li>
                <li>
                  <button className="text-red-400">Delete</button>
                </li>
              </ul>
            </div>
          </div>

          <p className="py-2">{description}</p>
          <div className="card-actions justify-center">
            <button
              className="btn btn-primary flex flex-col items-center w-1/3 p-7 border-none hover:bg-indigo-700"
              onClick={() =>
                openModal({ betName: title, choice: option1, odds: odds1 })
              }
              disabled={isResolved}
            >
              <h3>{option1}</h3>
              <p>{odds1}</p>
            </button>
            <button
              className="btn btn-primary flex flex-col items-center w-1/3 p-7 border-none hover:bg-indigo-700"
              onClick={() =>
                openModal({ betName: title, choice: option2, odds: odds2 })
              }
              disabled={isResolved}
            >
              <h3>{option2}</h3>
              <p>{odds2}</p>
            </button>
          </div>
        </div>
        {currentBet && (
          <PlaceBetModal
            ref={modalRef}
            betName={currentBet.betName}
            choice={currentBet.choice}
            odds={currentBet.odds}
            betId={betId}
            partyId={partyId}
            onSubmit={handlePlaceBet}
          />
        )}
      </div>

      <ResolveBetModal
        isOpen={showResolveModal}
        onClose={() => setShowResolveModal(false)}
        bet={{
          bet_id: betId,
          bet_info: {
            title,
            description,
            option1,
            odds1,
            option2,
            odds2,
          },
        }}
        partyId={partyId}
        onResolved={handleResolved}
      />
    </>
  );
};

export default Prop;
