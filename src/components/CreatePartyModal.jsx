import React, { useState } from "react";
import supabase from "../supabase-client"; // adjust path if needed

const CreatePartyModal = ({ user }) => {
  const [partyName, setPartyName] = useState("");
  const [startingBalance, setStartingBalance] = useState(100);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  // Generate a random 6-character alphanumeric code
  const generateJoinCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateParty = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (!user) {
        throw new Error("You must be logged in to create a party");
      }

      // Generate a unique join code first
      const generatedJoinCode = generateJoinCode();
      setJoinCode(generatedJoinCode);
      console.log("Generated join code:", generatedJoinCode);

      let imageUrl = null;

      // Handle image upload if provided
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;

        console.log("Uploading image...");
        const { error: uploadError } = await supabase.storage
          .from("party-images")
          .upload(fileName, imageFile);

        if (uploadError) {
          console.error("Image upload error:", uploadError);
          throw uploadError;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("party-images").getPublicUrl(fileName);

        imageUrl = publicUrl;
        console.log("Image uploaded:", imageUrl);
      }

      // Create the party first
      console.log("Creating party with data:", {
        name: partyName,
        host_id: user.id,
        starting_balance: parseFloat(startingBalance),
        join_code: generatedJoinCode,
      });

      const { data: newParty, error: partyError } = await supabase
        .from("parties")
        .insert([
          {
            name: partyName,
            host_id: user.id,
            image_url: imageUrl,
            created_at: new Date(),
            starting_balance: parseFloat(startingBalance),
            join_code: generatedJoinCode,
          },
        ])
        .select();

      if (partyError) {
        console.error("Party creation error:", partyError);
        throw partyError;
      }

      console.log("Party creation response:", newParty);

      const partyId = newParty[0].id;

      // Now insert into party_members with the retrieved ID
      console.log("Adding user to party_members with party_id:", partyId);
      const { error: memberError } = await supabase
        .from("party_members")
        .insert([
          {
            user_id: user.id,
            party_id: partyId,
            balance: parseFloat(startingBalance),
            joined_at: new Date(),
          },
        ]);

      if (memberError) {
        console.error("Error adding member:", memberError);
        throw memberError;
      }

      console.log("Successfully added user to party!");
      // Show success message
      setSuccess(true);

      // Refresh the page to show the new party in the list
      setTimeout(() => {
        window.location.reload();
      }, 2000);

      // Optional: redirect to the new party
      // setTimeout(() => {
      //   window.location.href = `/parties/${partyId}`;
      // }, 3000);
    } catch (err) {
      console.error("Error creating party:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    // Reset form and states when modal is closed
    setPartyName("");
    setStartingBalance(100);
    setImageFile(null);
    setError(null);
    setSuccess(false);
    setJoinCode("");
    document.getElementById("create_party_modal").close();
  };

  return (
    <div>
      <dialog id="create_party_modal" className="modal">
        <div className="modal-box">
          <form method="dialog">
            <button
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
              onClick={handleCloseModal}
            >
              ✕
            </button>
          </form>

          <h3 className="font-bold text-xl mb-5">Create Party</h3>

          {success ? (
            <div className="alert alert-success mb-4">
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="font-bold">Party created successfully!</h3>
                <div className="text-sm">
                  Share this code with friends to join:{" "}
                  <span className="font-bold">{joinCode}</span>
                </div>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleCreateParty}
              className="flex flex-col justify-center items-left"
            >
              <label className="label">
                <span className="label-text text-white">Party Name</span>
              </label>
              <input
                type="text"
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                placeholder="Enter Party Name"
                className="input input-bordered w-full max-w-xs mb-3"
                required
              />

              <label className="label">
                <span className="label-text text-white">Starting Balance</span>
              </label>
              <input
                type="number"
                min="100"
                value={startingBalance}
                onChange={(e) => setStartingBalance(e.target.value)}
                className="input input-bordered w-full max-w-xs mb-3"
                required
              />

              <label className="label">
                <span className="label-text text-white">
                  Upload Party Image
                </span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])}
                className="file-input file-input-bordered w-full max-w-xs mb-3"
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
                  className="btn bg-green-600 hover:bg-green-700"
                >
                  {loading ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          )}
        </div>
      </dialog>
    </div>
  );
};

export default CreatePartyModal;
