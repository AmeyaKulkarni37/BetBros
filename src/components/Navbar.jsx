import React from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import CreatePartyModal from "./CreatePartyModal";
import JoinPartyModal from "./JoinPartyModal";
import ProfileModal from "./ProfileModal";
import { useEffect, useState, useCallback } from "react";
import supabase from "../supabase-client";

const Navbar = ({ onCreateProp, onBalanceRefresh }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [userBalance, setUserBalance] = useState(0);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const fetchUserBalance = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Fetch user balance for current party (if on party details page)
        const partyMatch = location.pathname.match(/^\/parties\/(.+)$/);
        if (partyMatch) {
          const partyId = partyMatch[1];
          const { data: memberData, error: balanceError } = await supabase
            .from("party_members")
            .select("balance")
            .eq("user_id", user.id)
            .eq("party_id", partyId)
            .single();

          if (!balanceError && memberData) {
            setUserBalance(memberData.balance);
            console.log("Navbar balance updated to:", memberData.balance);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching balance in navbar:", err);
    }
  }, [location.pathname]);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUser(user);

        // Fetch user profile
        const { data: profileData, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (!error && profileData) {
          setProfile(profileData);
        }

        // Fetch initial balance
        await fetchUserBalance();
      } else {
        setUser(null);
        setProfile(null);
        setUserBalance(0);
      }
    };

    fetchUser();
  }, [location.pathname, fetchUserBalance]); // Add fetchUserBalance to dependencies

  // Expose balance refresh function to parent
  useEffect(() => {
    if (onBalanceRefresh) {
      onBalanceRefresh(fetchUserBalance);
    }
  }, [onBalanceRefresh, fetchUserBalance]); // Add fetchUserBalance to dependencies

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error logging out:", error);
      } else {
        navigate("/login");
      }
    } catch (err) {
      console.error("Unexpected error during logout:", err);
    }
  };

  const handleProfileUpdate = (updatedProfile) => {
    setProfile(updatedProfile);
  };

  // PartyDetails navbar
  if (/^\/parties\/[^/]+$/.test(location.pathname)) {
    return (
      <>
        <div className="navbar bg-base-100 shadow-sm flex justify-between border-b">
          <a className="btn btn-ghost text-xl hidden sm:flex">
            <img src="/logo.png" alt="BetBros Logo" className="h-7" />
          </a>

          <div className="buttons flex justify-between w-1000">
            <Link className="btn btn-ghost btn-rectangle w-38" to="/parties">
              <svg
                fill="#ffffff"
                height="20px"
                width="20px"
                version="1.1"
                id="Layer_1"
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                viewBox="0 0 330 330"
                xmlSpace="preserve"
              >
                <path
                  id="XMLID_92_"
                  d="M111.213,165.004L250.607,25.607c5.858-5.858,5.858-15.355,0-21.213c-5.858-5.858-15.355-5.858-21.213,0.001
	l-150,150.004C76.58,157.211,75,161.026,75,165.004c0,3.979,1.581,7.794,4.394,10.607l150,149.996
	C232.322,328.536,236.161,330,240,330s7.678-1.464,10.607-4.394c5.858-5.858,5.858-15.355,0-21.213L111.213,165.004z"
                />
              </svg>
              Back to Parties
            </Link>
            <button
              className="btn btn-ghost btn-rectangle bg-green-600 w-38 hover:bg-green-700"
              onClick={onCreateProp}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                width={25}
                height={25}
              >
                <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                <g
                  id="SVGRepo_tracerCarrier"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></g>
                <g id="SVGRepo_iconCarrier">
                  {" "}
                  <path
                    d="M4 12H20M12 4V20"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>{" "}
                </g>
              </svg>
              Create Prop
            </button>
            <button className="btn btn-ghost btn-rectangle w-38">
              Balance: ${userBalance.toFixed(2)}
            </button>
          </div>

          <div className="dropdown dropdown-end w-40 flex justify-end">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-ghost btn-circle avatar"
            >
              <div className="w-10 rounded-full">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile avatar"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    stroke="#ffffff"
                  >
                    <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                    <g
                      id="SVGRepo_tracerCarrier"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></g>
                    <g id="SVGRepo_iconCarrier">
                      {" "}
                      <path
                        opacity="0.4"
                        d="M12 22.01C17.5228 22.01 22 17.5329 22 12.01C22 6.48716 17.5228 2.01001 12 2.01001C6.47715 2.01001 2 6.48716 2 12.01C2 17.5329 6.47715 22.01 12 22.01Z"
                        fill="#ffffff"
                      ></path>{" "}
                      <path
                        d="M12 6.93994C9.93 6.93994 8.25 8.61994 8.25 10.6899C8.25 12.7199 9.84 14.3699 11.95 14.4299C11.98 14.4299 12.02 14.4299 12.04 14.4299C12.06 14.4299 12.09 14.4299 12.11 14.4299C12.12 14.4299 12.13 14.4299 12.13 14.4299C14.15 14.3599 15.74 12.7199 15.75 10.6899C15.75 8.61994 14.07 6.93994 12 6.93994Z"
                        fill="#ffffff"
                      ></path>{" "}
                      <path
                        d="M18.7807 19.36C17.0007 21 14.6207 22.01 12.0007 22.01C9.3807 22.01 7.0007 21 5.2207 19.36C5.4607 18.45 6.1107 17.62 7.0607 16.98C9.7907 15.16 14.2307 15.16 16.9407 16.98C17.9007 17.62 18.5407 18.45 18.7807 19.36Z"
                        fill="#ffffff"
                      ></path>{" "}
                    </g>
                  </svg>
                )}
              </div>
            </div>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow"
            >
              <li>
                <div className="flex flex-col items-start py-2">
                  <span className="font-semibold">
                    {profile?.full_name || profile?.username || "User"}
                  </span>
                  {profile?.username && profile?.full_name && (
                    <span className="text-xs text-base-content/60">
                      @{profile.username}
                    </span>
                  )}
                </div>
              </li>
              <li className="border-t border-base-content/20">
                <a onClick={() => setShowProfileModal(true)}>Profile</a>
              </li>
              <li>
                <a>Settings</a>
              </li>
              <li>
                <a onClick={handleLogout}>Logout</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Profile Modal */}
        <ProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          profile={profile}
          onProfileUpdate={handleProfileUpdate}
        />
      </>
    );
  }

  // PartyList navbar
  return (
    <>
      <div className="navbar bg-base-100 shadow-sm flex justify-between border-b">
        <a className="btn btn-ghost text-xl">
          <img src="/logo.png" alt="BetBros Logo" className="h-7" />
        </a>

        <div className="buttons flex justify-between w-80 gap-3">
          <button
            className="btn btn-ghost btn-rectangle bg-green-600 w-38 hover:bg-green-700"
            onClick={() =>
              document.getElementById("create_party_modal").showModal()
            }
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              width={25}
              height={25}
            >
              <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
              <g
                id="SVGRepo_tracerCarrier"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></g>
              <g id="SVGRepo_iconCarrier">
                {" "}
                <path
                  d="M4 12H20M12 4V20"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>{" "}
              </g>
            </svg>
            Create Party
          </button>
          <button
            className="btn btn-ghost btn-rectangle w-38 border border-white hover:bg-blue-700"
            onClick={() =>
              document.getElementById("join_party_modal").showModal()
            }
          >
            Join Party
          </button>
        </div>

        <div className="dropdown dropdown-end w-40 flex justify-end">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost btn-circle avatar"
          >
            <div className="w-10 rounded-full">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile avatar"
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  stroke="#ffffff"
                >
                  <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                  <g
                    id="SVGRepo_tracerCarrier"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></g>
                  <g id="SVGRepo_iconCarrier">
                    {" "}
                    <path
                      opacity="0.4"
                      d="M12 22.01C17.5228 22.01 22 17.5329 22 12.01C22 6.48716 17.5228 2.01001 12 2.01001C6.47715 2.01001 2 6.48716 2 12.01C2 17.5329 6.47715 22.01 12 22.01Z"
                      fill="#ffffff"
                    ></path>{" "}
                    <path
                      d="M12 6.93994C9.93 6.93994 8.25 8.61994 8.25 10.6899C8.25 12.7199 9.84 14.3699 11.95 14.4299C11.98 14.4299 12.02 14.4299 12.04 14.4299C12.06 14.4299 12.09 14.4299 12.11 14.4299C12.12 14.4299 12.13 14.4299 12.13 14.4299C14.15 14.3599 15.74 12.7199 15.75 10.6899C15.75 8.61994 14.07 6.93994 12 6.93994Z"
                      fill="#ffffff"
                    ></path>{" "}
                    <path
                      d="M18.7807 19.36C17.0007 21 14.6207 22.01 12.0007 22.01C9.3807 22.01 7.0007 21 5.2207 19.36C5.4607 18.45 6.1107 17.62 7.0607 16.98C9.7907 15.16 14.2307 15.16 16.9407 16.98C17.9007 17.62 18.5407 18.45 18.7807 19.36Z"
                      fill="#ffffff"
                    ></path>{" "}
                  </g>
                </svg>
              )}
            </div>
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow"
          >
            <li>
              <div className="flex flex-col items-start py-2">
                <span className="font-semibold">
                  {profile?.full_name || profile?.username || "User"}
                </span>
                {profile?.username && profile?.full_name && (
                  <span className="text-xs text-base-content/60">
                    @{profile.username}
                  </span>
                )}
              </div>
            </li>
            <li className="border-t border-base-content/20">
              <a onClick={() => setShowProfileModal(true)}>Profile</a>
            </li>
            <li>
              <a>Settings</a>
            </li>
            <li>
              <a onClick={handleLogout}>Logout</a>
            </li>
          </ul>
        </div>
      </div>
      <CreatePartyModal user={user} />
      <JoinPartyModal />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        profile={profile}
        onProfileUpdate={handleProfileUpdate}
      />
    </>
  );
};

export default Navbar;
