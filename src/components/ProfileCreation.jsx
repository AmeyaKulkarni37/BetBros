import React, { useState } from "react";
import supabase from "../supabase-client";
import ImageCropper from "./ImageCropper";
import { updateProfileImage } from "../utils/imageUpload";

const ProfileCreation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    full_name: "",
    bio: "",
    avatar_url: "",
  });
  const [showImageCropper, setShowImageCropper] = useState(false);
  const [croppedImageBlob, setCroppedImageBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

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

      let avatarUrl = "";

      // Upload profile image if one was selected
      if (croppedImageBlob) {
        try {
          avatarUrl = await updateProfileImage(user.id, croppedImageBlob);
        } catch (uploadError) {
          console.error("Error uploading profile image:", uploadError);
          // Continue with profile creation even if image upload fails
          setError(
            "Profile image upload failed, but profile was created successfully"
          );
        }
      }

      // Create profile with or without avatar
      const profileData = {
        id: user.id,
        username: formData.username.trim(),
        full_name: formData.full_name.trim(),
        bio: formData.bio.trim(),
        avatar_url: avatarUrl,
      };

      const { error: profileError } = await supabase
        .from("profiles")
        .insert(profileData);

      if (profileError) {
        throw new Error(`Failed to create profile: ${profileError.message}`);
      }

      console.log("Profile created successfully");
      window.location.href = "/parties";
    } catch (err) {
      console.error("Error creating profile:", err);
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
            Create Your Profile
          </h2>
          <p className="mt-2 text-center text-sm text-base-content/60">
            Tell us a bit about yourself
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
            {loading ? "Creating Profile..." : "Create Profile"}
          </button>
        </form>

        {/* Image Cropper Modal */}
        <ImageCropper
          isOpen={showImageCropper}
          onClose={() => setShowImageCropper(false)}
          onImageCropped={handleImageCropped}
          aspectRatio={1} // 1:1 for profile pictures
        />
      </div>
    </div>
  );
};

export default ProfileCreation;
