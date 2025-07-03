import React, { useEffect, useState } from "react";
import Prop from "./Prop";
import PropModal from "./PropModal";
import Navbar from "./Navbar";
import LeavePartyModal from "./LeavePartyModal";
import DeletePartyModal from "./DeletePartyModal";
import Leaderboard from "./Leaderboard";
import { useParams, useNavigate } from "react-router-dom";
import supabase from "../supabase-client";
import PartyEditModal from "./PartyEditModal";
import ResolveBetModal from "./ResolveBetModal";

const PartyDetails = () => {
  const { partyId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("active");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [propData, setPropData] = useState(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // State for fetched data
  const [party, setParty] = useState(null);
  const [propBets, setPropBets] = useState([]);
  const [yourBets, setYourBets] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [joinCode, setJoinCode] = useState(null);
  const [refreshNavbarBalance, setRefreshNavbarBalance] = useState(null);
  const [isHost, setIsHost] = useState(false);

  const fetchPartyData = async () => {
    setLoading(true);

    try {
      // Get current user (we know they're authenticated because of ProtectedRoute)
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("User not authenticated");
      }

      setUserId(user.id);

      // Fetch party details
      const { data: partyData, error: partyError } = await supabase
        .from("parties")
        .select("*")
        .eq("id", partyId)
        .single();

      if (partyError) {
        console.error("Error fetching party:", partyError.message);
      } else {
        setParty(partyData);
        console.log("partyID: ", partyId);

        // Check if current user is the host
        setIsHost(partyData.host_id === user.id);
      }

      const { data, error } = await supabase
        .from("parties")
        .select("join_code")
        .eq("id", partyId)
        .single();
      if (error) {
        console.error("Error fetching party join code:", error.message);
      } else {
        console.log("Party join code:", data.join_code);
        setJoinCode(data.join_code);
      }

      // Fetch props (bets) for this party
      const { data: propsData, error: propsError } = await supabase
        .from("bets")
        .select("*")
        .eq("party_id", partyId);

      if (propsError) {
        console.error("Error fetching props:", propsError.message);
      } else {
        setPropBets(propsData || []);

        // Now fetch wagers after we have the props
        if (propsData && propsData.length > 0) {
          // Fetch user's wagers by joining with bets table to filter by party_id
          const { data: wagersData, error: wagersError } = await supabase
            .from("wagers")
            .select(
              `
              wager_id,
              user_id,
              bet_id,
              choice,
              odds,
              amount,
              placed_at,
              status,
              bets!inner(bet_info)
            `
            )
            .eq("user_id", user.id)
            .in(
              "bet_id",
              propsData.map((prop) => prop.bet_id)
            );

          if (wagersError) {
            console.error("Error fetching wagers:", wagersError.message);
          } else {
            setYourBets(wagersData || []);
          }
        } else {
          // No props, so no wagers
          setYourBets([]);
        }
      }

      // Fetch leaderboard data by joining party_members with profiles
      const { data: leaderboardData, error: leaderboardError } = await supabase
        .from("party_members")
        .select(
          `
          user_id,
          balance
        `
        )
        .eq("party_id", partyId)
        .order("balance", { ascending: false });

      if (leaderboardError) {
        console.error("Error fetching leaderboard:", leaderboardError.message);
      } else if (leaderboardData && leaderboardData.length > 0) {
        // Fetch profiles for all users in the leaderboard
        const userIds = leaderboardData.map((member) => member.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, username, full_name")
          .in("id", userIds);

        if (profilesError) {
          console.error("Error fetching profiles:", profilesError.message);
        } else {
          // Combine the data
          const combinedLeaderboard = leaderboardData.map((member) => {
            const profile = profilesData.find((p) => p.id === member.user_id);
            return {
              ...member,
              profiles: profile || {
                id: member.user_id,
                username: "Unknown",
                full_name: "Unknown User",
              },
            };
          });
          setLeaderboard(combinedLeaderboard);
        }
      } else {
        setLeaderboard([]);
      }
    } catch (err) {
      console.error("Error fetching party data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (partyId) {
      fetchPartyData();
    }
  }, [partyId]);

  const handleEditClick = (prop) => {
    setPropData(prop);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleAddProp = () => {
    setPropData(null);
    setModalMode("add");
    setIsModalOpen(true);
  };

  const handlePropSubmit = async (formData) => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("User not authenticated");
        return;
      }

      if (modalMode === "add") {
        const betInsertData = {
          party_id: partyId,
          created_by: userId,
          bet_info: formData,
          created_at: new Date(),
          resolved_at: null,
        };

        const { data, error } = await supabase
          .from("bets")
          .insert(betInsertData)
          .select();

        if (error) {
          console.error("Error adding bet:", error);
          return;
        }

        // Update local state
        setPropBets([...propBets, data[0]]);
      } else {
        // Update mode (adjust this based on how you're editing)
        const { error } = await supabase
          .from("bets")
          .update({
            bet_info: formData,
          })
          .eq("bet_id", propData.bet_id);

        if (error) {
          console.error("Error updating bet:", error);
          return;
        }

        // Update local state
        setPropBets(
          propBets.map((prop) =>
            prop.bet_id === propData.bet_id
              ? { ...prop, bet_info: formData }
              : prop
          )
        );
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error("Error in prop submission:", err);
    }
  };

  const handleBetPlaced = () => {
    // Refresh party data after a bet is placed
    fetchPartyData();
    // Also refresh the navbar balance
    if (refreshNavbarBalance) {
      refreshNavbarBalance();
    }
  };

  const handleNavbarBalanceRefresh = (refreshFunction) => {
    setRefreshNavbarBalance(() => refreshFunction);
  };

  const handleLeaveParty = () => {
    // Redirect to dashboard after leaving party
    navigate("/parties");
  };

  const handleDeleteParty = () => {
    // Redirect to dashboard after deleting party
    navigate("/parties");
  };

  const handleShowLeaveModal = () => {
    setShowLeaveModal(true);
  };

  const handleShowDeleteModal = () => {
    // Add an extra confirmation step for delete
    if (
      window.confirm(
        "Are you sure you want to delete this party? This action cannot be undone."
      )
    ) {
      setShowDeleteModal(true);
    }
  };

  const handleShowEditModal = () => {
    setShowEditModal(true);
  };

  const handlePartyUpdate = (updatedParty) => {
    console.log("PartyDetails: Received party update:", updatedParty);
    setParty(updatedParty);
    // Also refresh the party data from the server to ensure we have the latest data
    fetchPartyData();
  };

  if (loading) {
    return (
      <>
        <Navbar
          onCreateProp={handleAddProp}
          onBalanceRefresh={handleNavbarBalanceRefresh}
        />
        <div className="container mx-auto px-4 pt-10 w-4/5">
          <p className="text-xl">Loading party details...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar
        onCreateProp={handleAddProp}
        onBalanceRefresh={handleNavbarBalanceRefresh}
      />
      <div className="container mx-auto px-4 pt-10 w-4/5">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold">{party?.name || "Party"}</h1>
            <p className="text-base-content/70 mt-1">
              {isHost ? "You are the host" : "You are a member"}
            </p>
          </div>
          <div className="flex gap-2">
            {!isHost && (
              <button
                className="btn btn-outline btn-error"
                onClick={handleShowLeaveModal}
              >
                Leave Party
              </button>
            )}
            {isHost && (
              <>
                <button
                  className="btn btn-outline btn-primary"
                  onClick={handleShowEditModal}
                >
                  Edit Party
                </button>
                <button
                  className="btn btn-outline btn-error"
                  onClick={handleShowDeleteModal}
                >
                  Delete Party
                </button>
              </>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bets Section (takes 2/3 on large screens) */}
          <div className="bg-base-300 lg:col-span-2 space-y-4 p-5 rounded-xl shadow">
            <h2 className="text-xl font-semibold mb-4">Props</h2>
            {propBets.length === 0 ? (
              <p className="text-base-content/70">
                No props have been created for this party yet.
              </p>
            ) : propBets.filter((prop) => !prop.resolved_at).length === 0 ? (
              <p className="text-base-content/70">
                All props have been resolved. Check the "Cleared" tab in "Your
                Bets" to see results.
              </p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {propBets
                  .filter((prop) => !prop.resolved_at)
                  .map((prop) => (
                    <Prop
                      key={prop.bet_id}
                      betId={prop.bet_id}
                      partyId={partyId}
                      title={prop.bet_info.title}
                      description={prop.bet_info.description}
                      option1={prop.bet_info.option1}
                      odds1={prop.bet_info.odds1}
                      option2={prop.bet_info.option2}
                      odds2={prop.bet_info.odds2}
                      onEdit={() => handleEditClick(prop)}
                      onBetPlaced={handleBetPlaced}
                      isHost={isHost}
                      isResolved={!!prop.resolved_at}
                      winningChoice={prop.winning_choice}
                    />
                  ))}
              </div>
            )}
          </div>

          {/* Right Panel: Leaderboard & Invite */}
          <div className="space-y-6">
            {/* Leaderboard */}
            <Leaderboard leaderboardData={leaderboard} currentUserId={userId} />
            {/* Invite */}
            <div className="bg-base-300 p-4 rounded-xl shadow">
              <h2 className="text-lg font-semibold mb-2">
                Invite Your Friends!
              </h2>
              <div className="mt-2">
                <div className="p-4 bg-base-100 rounded-lg flex flex-col items-center justify-center">
                  <p className="text-3xl font-bold text-white my-2 tracking-[.2em]">
                    {joinCode || "Loading..."}
                  </p>
                  <button
                    className="btn btn-primary btn-sm mt-2"
                    onClick={() => {
                      navigator.clipboard.writeText(joinCode || "");
                    }}
                  >
                    Copy Join Code
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Your Bets */}
        <div className="bg-base-300 p-5 rounded-xl shadow mt-10">
          <h2 className="text-xl font-semibold mb-4">Your Bets</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="flex mb-4">
              <button
                className={`px-4 py-2 font-medium ${
                  activeTab === "active"
                    ? "border-b-2 border-primary text-primary"
                    : "text-base-content/60"
                }`}
                onClick={() => setActiveTab("active")}
              >
                Active
              </button>
              <button
                className={`px-4 py-2 font-medium ml-4 ${
                  activeTab === "cleared"
                    ? "border-b-2 border-primary text-primary"
                    : "text-base-content/60"
                }`}
                onClick={() => setActiveTab("cleared")}
              >
                Cleared
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Prop</th>
                  <th>Line</th>
                  <th>Amount</th>
                  {activeTab === "active" ? <th>Odds</th> : <th>Result</th>}
                </tr>
              </thead>
              <tbody>
                {yourBets.length > 0 ? (
                  activeTab === "active" ? (
                    yourBets
                      .filter((wager) => wager.status === "active")
                      .map((wager) => (
                        <tr key={wager.wager_id}>
                          <td>{wager.bets.bet_info.title}</td>
                          <td>{wager.choice}</td>
                          <td>${wager.amount}</td>
                          <td>{wager.odds}</td>
                        </tr>
                      ))
                  ) : (
                    yourBets
                      .filter((wager) => wager.status !== "active")
                      .map((wager) => {
                        const calculateWinnings = (amount, odds) => {
                          const oddsNum = parseInt(odds);
                          if (oddsNum > 0) {
                            return amount + (amount * oddsNum) / 100;
                          } else {
                            return amount + (amount * 100) / Math.abs(oddsNum);
                          }
                        };

                        const winnings =
                          wager.status === "win"
                            ? calculateWinnings(wager.amount, wager.odds)
                            : 0;
                        const profit =
                          wager.status === "win"
                            ? winnings - wager.amount
                            : -wager.amount;

                        return (
                          <tr key={wager.wager_id}>
                            <td>{wager.bets.bet_info.title}</td>
                            <td>{wager.choice}</td>
                            <td>${wager.amount}</td>
                            <td
                              className={
                                wager.status === "win"
                                  ? "text-success"
                                  : "text-error"
                              }
                            >
                              {wager.status === "win" ? (
                                <div>
                                  <div>Win</div>
                                  <div className="text-xs">
                                    +${profit.toFixed(2)}
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div>Loss</div>
                                  <div className="text-xs">
                                    -${wager.amount}
                                  </div>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                  )
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="text-center text-base-content/70"
                    >
                      {activeTab === "active"
                        ? "No active bets"
                        : "No cleared bets"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <PropModal
        isOpen={isModalOpen}
        mode={modalMode}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handlePropSubmit}
        propData={propData}
      />

      <LeavePartyModal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        partyName={party?.name || "Party"}
        partyId={partyId}
        onLeft={handleLeaveParty}
      />

      <DeletePartyModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        partyName={party?.name || "Party"}
        partyId={partyId}
        onDeleted={handleDeleteParty}
      />

      <PartyEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        party={party}
        currentUser={{ id: userId }}
        onPartyUpdate={handlePartyUpdate}
      />
    </>
  );
};

export default PartyDetails;
