import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../supabase-client";

const CreateProfile = () => {
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image must be less than 5MB");
        return;
      }

      setAvatarFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setAvatarPreview(e.target.result);
      reader.readAsDataURL(file);
      setError("");
    }
  };

  const uploadAvatar = async (userId) => {
    if (!avatarFile) return null;

    try {
      const fileExt = avatarFile.name.split(".").pop();
      const fileName = `${userId}/avatar.${fileExt}`;

      const { error } = await supabase.storage
        .from("profile-images")
        .upload(fileName, avatarFile, {
          upsert: true, // Replace if already exists
        });

      if (error) throw error;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("profile-images").getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading avatar:", error);
      throw new Error("Failed to upload avatar");
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

      // Check if username is already taken
      const { data: existingProfile, error: checkError } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", username.toLowerCase())
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      if (existingProfile) {
        throw new Error("Username is already taken");
      }

      // Upload avatar if provided
      let avatarUrl = null;
      if (avatarFile) {
        avatarUrl = await uploadAvatar(user.id);
      }

      // Create profile
      const { error: profileError } = await supabase.from("profiles").insert({
        id: user.id,
        username: username.toLowerCase(),
        full_name: fullName,
        bio: bio,
        avatar_url: avatarUrl,
      });

      if (profileError) throw profileError;

      // Success! Navigate to parties
      navigate("/parties");
    } catch (err) {
      console.error("Error creating profile:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="bg-base-300 p-8 rounded-xl shadow w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6">
          Create Your Profile
        </h1>
        <p className="text-center text-sm mb-6 text-base-content/70">
          Set up your profile to get started with betting!
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 rounded-full bg-base-100 flex items-center justify-center mb-4 overflow-hidden">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-12 h-12 text-base-content/50"
                >
                  <path
                    opacity="0.4"
                    d="M12 22.01C17.5228 22.01 22 17.5329 22 12.01C22 6.48716 17.5228 2.01001 12 2.01001C6.47715 2.01001 2 6.48716 2 12.01C2 17.5329 6.47715 22.01 12 22.01Z"
                    fill="currentColor"
                  />
                  <path
                    d="M12 6.93994C9.93 6.93994 8.25 8.61994 8.25 10.6899C8.25 12.7199 9.84 14.3699 11.95 14.4299C11.98 14.4299 12.02 14.4299 12.04 14.4299C12.06 14.4299 12.09 14.4299 12.11 14.4299C12.12 14.4299 12.13 14.4299 12.13 14.4299C14.15 14.3599 15.74 12.7199 15.75 10.6899C15.75 8.61994 14.07 6.93994 12 6.93994Z"
                    fill="currentColor"
                  />
                  <path
                    d="M18.7807 19.36C17.0007 21 14.6207 22.01 12.0007 22.01C9.3807 22.01 7.0007 21 5.2207 19.36C5.4607 18.45 6.1107 17.62 7.0607 16.98C9.7907 15.16 14.2307 15.16 16.9407 16.98C17.9007 17.62 18.5407 18.45 18.7807 19.36Z"
                    fill="currentColor"
                  />
                </svg>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="file-input file-input-bordered file-input-sm w-full max-w-xs"
            />
            <p className="text-xs text-base-content/60 mt-1">
              Optional - Max 5MB
            </p>
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Username <span className="text-error">*</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              required
              placeholder="choose a unique username"
              pattern="[a-z0-9_]+"
              title="Username can only contain lowercase letters, numbers, and underscores"
              minLength={3}
              maxLength={20}
            />
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Full Name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="Your full name"
              maxLength={50}
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium mb-1">Bio</label>
            <textarea
              className="textarea textarea-bordered w-full"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself (optional)"
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-base-content/60 mt-1">
              {bio.length}/200 characters
            </p>
          </div>

          {error && (
            <div className="text-error text-sm text-center bg-error/20 p-3 rounded">
              {error}
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
      </div>
    </div>
  );
};

export default CreateProfile;
