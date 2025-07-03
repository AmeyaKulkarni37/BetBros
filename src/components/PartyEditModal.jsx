import React, { useState, useEffect } from "react";
import supabase from "../supabase-client";
import ImageCropper from "./ImageCropper";
import { updatePartyImage } from "../utils/imageUpload";

const PartyEditModal = ({
  isOpen,
  onClose,
  party,
  onPartyUpdate,
  currentUser,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    starting_balance: 100,
  });
  const [showImageCropper, setShowImageCropper] = useState(false);
  const [croppedImageBlob, setCroppedImageBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  // Check if current user is the host
  const isHost = currentUser && party && currentUser.id === party.host_id;

  // Reset form when modal opens/closes or party changes
  useEffect(() => {
    if (party) {
      setFormData({
        name: party.name || "",
        starting_balance: party.starting_balance || 100,
      });
      setPreviewUrl(party.image_url || "");
    }

    // Reset states when modal closes
    if (!isOpen) {
      setError("");
      setSuccess("");
      setCroppedImageBlob(null);
      if (previewUrl && !party?.image_url) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl("");
      }
    }
  }, [party, isOpen]);

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
    if (previewUrl && !party?.image_url) {
      URL.revokeObjectURL(previewUrl);
    }
    const url = URL.createObjectURL(imageBlob);
    setPreviewUrl(url);
  };

  const removeImage = () => {
    setCroppedImageBlob(null);
    if (previewUrl && !party?.image_url) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (!isHost) {
        throw new Error("Only the party host can edit party details");
      }

      console.log("Starting party update for party:", party.id);
      console.log("Current party image_url:", party?.image_url);
      console.log("Has cropped image blob:", !!croppedImageBlob);
      console.log("Preview URL:", previewUrl);

      let imageUrl = party?.image_url || "";

      // Upload new party image if one was selected
      if (croppedImageBlob) {
        try {
          console.log("Uploading new party image...");
          imageUrl = await updatePartyImage(party.id, croppedImageBlob);
          console.log("New image URL:", imageUrl);
        } catch (uploadError) {
          console.error("Error uploading party image:", uploadError);
          throw new Error("Failed to upload party image");
        }
      } else if (!previewUrl && party?.image_url) {
        // User removed the image
        console.log("User removed the image, setting to null");
        imageUrl = null;
      }

      // Update party data
      const updateData = {
        name: formData.name.trim(),
        starting_balance: formData.starting_balance,
      };

      // Only include image_url in update if it has changed
      if (imageUrl !== party?.image_url) {
        updateData.image_url = imageUrl;
      }

      console.log("Update data:", updateData);
      console.log("Image URL changed:", imageUrl !== party?.image_url);

      const { data, error: updateError } = await supabase
        .from("parties")
        .update(updateData)
        .eq("id", party.id)
        .select();

      if (updateError) {
        console.error("Party update error:", updateError);
        throw new Error(`Failed to update party: ${updateError.message}`);
      }

      console.log("Party update successful:", data);
      setSuccess("Party updated successfully!");

      // Update parent component
      if (onPartyUpdate) {
        onPartyUpdate({
          ...party,
          ...updateData,
        });
      }

      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Error updating party:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-base-100 rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Edit Party</h3>
            <button
              className="btn btn-sm btn-circle btn-ghost"
              onClick={onClose}
              type="button"
            >
              ✕
            </button>
          </div>

          {!isHost ? (
            <div className="text-center py-8">
              <p className="text-base-content/70 mb-4">
                Only the party host can edit party details.
              </p>
              <button className="btn btn-primary" onClick={onClose}>
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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
                      Amount each new member starts with
                    </span>
                  </label>
                </div>
              </div>

              {/* Error/Success Messages */}
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

              {success && (
                <div className="alert alert-success">
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
                  <span>{success}</span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  className="btn btn-ghost flex-1"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Update Party"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Image Cropper Modal */}
      <ImageCropper
        isOpen={showImageCropper}
        onClose={() => setShowImageCropper(false)}
        onImageCropped={handleImageCropped}
        aspectRatio={1} // 1:1 for circular party images
      />
    </>
  );
};

export default PartyEditModal;
