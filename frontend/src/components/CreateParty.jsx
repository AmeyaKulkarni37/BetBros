import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../supabase-client";
import ImageCropper from "./ImageCropper";
import { updatePartyImage } from "../utils/imageUpload";

const CreateParty = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    starting_balance: 100,
  });
  const [showImageCropper, setShowImageCropper] = useState(false);
  const [croppedImageBlob, setCroppedImageBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "starting_balance" ? Number(value) : value,
    }));
  };

  const handleImageCropped = (imageBlob) => {
    setCroppedImageBlob(imageBlob);
    // Create a preview URL for the cropped image
    const url = URL.createObjectURL(imageBlob);
    setPreviewUrl(url);
  };

  const removeImage = () => {
    setCroppedImageBlob(null);
    setPreviewUrl("");
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const generateJoinCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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

      // Create party first
      const partyData = {
        name: formData.name.trim(),
        host_id: user.id,
        starting_balance: formData.starting_balance,
        join_code: generateJoinCode(),
        image_url: "", // Will be updated if image is provided
      };

      const { data: party, error: partyError } = await supabase
        .from("parties")
        .insert(partyData)
        .select()
        .single();

      if (partyError) {
        throw new Error(`Failed to create party: ${partyError.message}`);
      }

      // Upload party image if one was selected
      if (croppedImageBlob) {
        try {
          await updatePartyImage(party.id, croppedImageBlob);
        } catch (uploadError) {
          console.error("Error uploading party image:", uploadError);
          // Continue even if image upload fails
          setError(
            "Party image upload failed, but party was created successfully"
          );
        }
      }

      // Add creator as first member
      const { error: memberError } = await supabase
        .from("party_members")
        .insert({
          user_id: user.id,
          party_id: party.id,
          balance: formData.starting_balance,
        });

      if (memberError) {
        console.error("Error adding creator as member:", memberError);
        // This is not critical, continue to party page
      }

      console.log("Party created successfully");
      navigate(`/party/${party.id}`);
    } catch (err) {
      console.error("Error creating party:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-base-content">
            Create New Party
          </h2>
          <p className="mt-2 text-center text-sm text-base-content/60">
            Set up your betting party
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Party Image Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              {previewUrl ? (
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-base-300">
                  <img
                    src={previewUrl}
                    alt="Party preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-base-300 flex items-center justify-center border-2 border-base-300">
                  <svg
                    className="w-8 h-8 text-base-content/40"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
            </div>

            <div className="flex space-x-2">
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => setShowImageCropper(true)}
              >
                {previewUrl ? "Change Image" : "Add Image"}
              </button>
              {previewUrl && (
                <button
                  type="button"
                  className="btn btn-sm btn-ghost text-error"
                  onClick={removeImage}
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="label">
                <span className="label-text">Party Name *</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="input input-bordered w-full"
                placeholder="Enter party name"
                required
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text">Starting Balance *</span>
              </label>
              <input
                type="number"
                name="starting_balance"
                value={formData.starting_balance}
                onChange={handleInputChange}
                className="input input-bordered w-full"
                placeholder="100"
                min="1"
                step="0.01"
                required
              />
              <label className="label">
                <span className="label-text-alt text-base-content/60">
                  Amount each member starts with
                </span>
              </label>
            </div>
          </div>

          {error && (
            <div className="alert alert-error">
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

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? "Creating Party..." : "Create Party"}
          </button>
        </form>

        {/* Image Cropper Modal */}
        <ImageCropper
          isOpen={showImageCropper}
          onClose={() => setShowImageCropper(false)}
          onImageCropped={handleImageCropped}
          aspectRatio={1} // 1:1 for circular party images
        />
      </div>
    </div>
  );
};

export default CreateParty;
