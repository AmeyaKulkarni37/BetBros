import React, { useState, useEffect } from "react";
import supabase from "../supabase-client";
import ImageCropper from "./ImageCropper";
import { updateProfileImage } from "../utils/imageUpload";

const ProfileModal = ({ isOpen, onClose, profile, onProfileUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    full_name: "",
    bio: "",
  });
  const [showImageCropper, setShowImageCropper] = useState(false);
  const [croppedImageBlob, setCroppedImageBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  // Reset form when modal opens/closes or profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || "",
        full_name: profile.full_name || "",
        bio: profile.bio || "",
      });
      setPreviewUrl(profile.avatar_url || "");
    }

    // Reset states when modal closes
    if (!isOpen) {
      setError("");
      setSuccess("");
      setCroppedImageBlob(null);
      if (previewUrl && !profile?.avatar_url) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl("");
      }
    }
  }, [profile, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageCropped = (imageBlob) => {
    setCroppedImageBlob(imageBlob);
    // Create a preview URL for the cropped image
    if (previewUrl && !profile?.avatar_url) {
      URL.revokeObjectURL(previewUrl);
    }
    const url = URL.createObjectURL(imageBlob);
    setPreviewUrl(url);
  };

  const removeImage = () => {
    setCroppedImageBlob(null);
    if (previewUrl && !profile?.avatar_url) {
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
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("User not authenticated");
      }

      let avatarUrl = profile?.avatar_url || "";

      // Upload new profile image if one was selected
      if (croppedImageBlob) {
        try {
          avatarUrl = await updateProfileImage(user.id, croppedImageBlob);
        } catch (uploadError) {
          console.error("Error uploading profile image:", uploadError);
          throw new Error("Failed to upload profile image");
        }
      } else if (!previewUrl && profile?.avatar_url) {
        // User removed the image
        avatarUrl = null;
      }

      // Update profile data
      const updateData = {
        username: formData.username.trim(),
        full_name: formData.full_name.trim(),
        bio: formData.bio.trim(),
      };

      // Only include avatar_url if it has changed
      if (avatarUrl !== profile?.avatar_url) {
        updateData.avatar_url = avatarUrl;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id);

      if (updateError) {
        throw new Error(`Failed to update profile: ${updateError.message}`);
      }

      setSuccess("Profile updated successfully!");

      // Update parent component
      if (onProfileUpdate) {
        onProfileUpdate({
          ...profile,
          ...updateData,
        });
      }

      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Error updating profile:", err);
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
            <h3 className="text-lg font-semibold">Edit Profile</h3>
            <button
              className="btn btn-sm btn-circle btn-ghost"
              onClick={onClose}
              type="button"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Profile Picture Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                {previewUrl ? (
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-base-300">
                    <img
                      src={previewUrl}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-base-300 flex items-center justify-center border-2 border-base-300">
                    <svg
                      className="w-12 h-12 text-base-content/40"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
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
                  {previewUrl ? "Change Photo" : "Add Photo"}
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
                  <span className="label-text">Username *</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="input input-bordered w-full"
                  placeholder="Choose a unique username"
                  required
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Full Name *</span>
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className="input input-bordered w-full"
                  placeholder="Your full name"
                  required
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Bio</span>
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  className="textarea textarea-bordered w-full"
                  placeholder="Tell us about yourself (optional)"
                  rows="3"
                />
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
                {loading ? "Updating..." : "Update Profile"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Image Cropper Modal */}
      <ImageCropper
        isOpen={showImageCropper}
        onClose={() => setShowImageCropper(false)}
        onImageCropped={handleImageCropped}
        aspectRatio={1} // 1:1 for profile pictures
      />
    </>
  );
};

export default ProfileModal;
