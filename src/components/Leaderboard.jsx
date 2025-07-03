import React, { useState, useMemo } from "react";

const Leaderboard = ({ leaderboardData, currentUserId }) => {
  const [showFullLeaderboard, setShowFullLeaderboard] = useState(false);

  // Process leaderboard data to handle ties
  const processedLeaderboard = useMemo(() => {
    if (!leaderboardData || leaderboardData.length === 0) return [];

    // Sort by balance (descending) and add rank
    const sorted = [...leaderboardData].sort((a, b) => b.balance - a.balance);

    // Handle ties
    const ranked = [];
    let currentRank = 1;
    let currentBalance = null;
    let tieCount = 0;

    sorted.forEach((member, index) => {
      if (member.balance !== currentBalance) {
        // New balance, update rank
        currentRank = index + 1;
        currentBalance = member.balance;
        tieCount = 0;
      } else {
        // Same balance, increment tie count
        tieCount++;
      }

      // Determine display rank
      let displayRank;
      if (tieCount === 0) {
        displayRank = currentRank.toString();
      } else {
        displayRank = `T-${currentRank}`;
      }

      ranked.push({
        ...member,
        displayRank,
        actualRank: currentRank,
        isTied: tieCount > 0,
      });
    });

    return ranked;
  }, [leaderboardData]);

  const top3 = processedLeaderboard.slice(0, 3);
  const rest = processedLeaderboard.slice(3);

  // Find current user's position
  const currentUserPosition = processedLeaderboard.findIndex(
    (member) => member.profiles.id === currentUserId
  );

  const getRankIcon = (rank) => {
    switch (rank) {
      case "1":
        return "🥇";
      case "2":
        return "🥈";
      case "3":
        return "🥉";
      default:
        return "";
    }
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case "1":
        return "text-yellow-400";
      case "2":
        return "text-gray-300";
      case "3":
        return "text-amber-600";
      default:
        return "text-base-content";
    }
  };

  if (processedLeaderboard.length === 0) {
    return (
      <div className="bg-base-300 p-4 rounded-xl shadow">
        <h2 className="text-lg font-semibold mb-2">Leaderboard</h2>
        <p className="text-sm text-base-content/70">No members yet</p>
      </div>
    );
  }

  return (
    <div className="bg-base-300 p-4 rounded-xl shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Leaderboard</h2>
        <span className="text-sm text-base-content/60">
          {processedLeaderboard.length} member
          {processedLeaderboard.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Top 3 */}
      <div className="space-y-3 mb-4">
        {top3.map((member, index) => (
          <div
            key={`${member.profiles.username}-${index}`}
            className={`flex items-center justify-between p-3 bg-base-200 rounded-lg ${
              member.profiles.id === currentUserId ? "ring-2 ring-primary" : ""
            }`}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`text-lg font-bold ${getRankColor(
                  member.displayRank
                )}`}
              >
                {getRankIcon(member.displayRank)} {member.displayRank}
              </div>
              <div>
                <div className="font-medium">
                  {member.profiles.username}
                  {member.profiles.id === currentUserId && (
                    <span className="ml-2 text-xs bg-primary text-primary-content px-2 py-1 rounded">
                      You
                    </span>
                  )}
                </div>
                <div className="text-xs text-base-content/60">
                  {member.profiles.full_name}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-lg">
                ${member.balance.toFixed(2)}
              </div>
              {member.isTied && (
                <div className="text-xs text-base-content/60">Tied</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Current user position (if not in top 3) */}
      {currentUserPosition >= 3 && (
        <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <div className="text-sm font-medium text-primary mb-1">
            Your Position
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-sm font-medium text-base-content/70">
                {processedLeaderboard[currentUserPosition].displayRank}
              </div>
              <div>
                <div className="font-medium text-sm">You</div>
                <div className="text-xs text-base-content/60">
                  {processedLeaderboard[currentUserPosition].profiles.full_name}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium">
                ${processedLeaderboard[currentUserPosition].balance.toFixed(2)}
              </div>
              {processedLeaderboard[currentUserPosition].isTied && (
                <div className="text-xs text-base-content/60">Tied</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Show more/less button */}
      {processedLeaderboard.length > 3 && (
        <button
          className="btn btn-sm btn-outline w-full"
          onClick={() => setShowFullLeaderboard(!showFullLeaderboard)}
        >
          {showFullLeaderboard
            ? "Show Less"
            : `Show All (${processedLeaderboard.length})`}
        </button>
      )}

      {/* Full leaderboard dropdown */}
      {showFullLeaderboard && rest.length > 0 && (
        <div className="mt-4 space-y-2 border-t pt-4">
          {rest.map((member, index) => (
            <div
              key={`${member.profiles.username}-${index + 3}`}
              className={`flex items-center justify-between p-2 bg-base-200 rounded ${
                member.profiles.id === currentUserId
                  ? "ring-2 ring-primary"
                  : ""
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="text-sm font-medium text-base-content/70">
                  {member.displayRank}
                </div>
                <div>
                  <div className="font-medium text-sm">
                    {member.profiles.username}
                    {member.profiles.id === currentUserId && (
                      <span className="ml-2 text-xs bg-primary text-primary-content px-1 py-0.5 rounded">
                        You
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-base-content/60">
                    {member.profiles.full_name}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">${member.balance.toFixed(2)}</div>
                {member.isTied && (
                  <div className="text-xs text-base-content/60">Tied</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
