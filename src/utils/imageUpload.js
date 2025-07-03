import supabase from "../supabase-client";

export const uploadImage = async (imageBlob, bucket, folder, fileName) => {
  try {
    // Create a unique filename
    const timestamp = Date.now();
    const fileExtension = "jpg"; // We convert to JPEG in the cropper
    const uniqueFileName = `${folder}/${fileName}_${timestamp}.${fileExtension}`;

    // Upload the image
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(uniqueFileName, imageBlob, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (error) {
      throw error;
    }

    // Get the public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(data.path);

    return {
      path: data.path,
      publicUrl: publicUrl,
    };
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

export const deleteImage = async (bucket, path) => {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Error deleting image:", error);
    throw error;
  }
};

export const updateProfileImage = async (userId, imageBlob) => {
  try {
    // Upload the new image
    const uploadResult = await uploadImage(
      imageBlob,
      "profile-images",
      userId,
      "avatar"
    );

    // Update the profile with the new avatar URL
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: uploadResult.publicUrl })
      .eq("id", userId);

    if (updateError) {
      // If profile update fails, try to clean up the uploaded image
      await deleteImage("profile-images", uploadResult.path);
      throw updateError;
    }

    return uploadResult.publicUrl;
  } catch (error) {
    console.error("Error updating profile image:", error);
    throw error;
  }
};

export const updatePartyImage = async (partyId, imageBlob) => {
  try {
    console.log("Starting party image upload for party:", partyId);
    console.log("Image blob size:", imageBlob.size);

    // Upload the new image
    const uploadResult = await uploadImage(
      imageBlob,
      "party-images",
      "parties",
      `party_${partyId}`
    );

    console.log("Image uploaded successfully:", uploadResult);

    // Update the party with the new image URL
    const { data, error: updateError } = await supabase
      .from("parties")
      .update({ image_url: uploadResult.publicUrl })
      .eq("id", partyId)
      .select();

    if (updateError) {
      console.error("Database update error:", updateError);
      // If party update fails, try to clean up the uploaded image
      await deleteImage("party-images", uploadResult.path);
      throw updateError;
    }

    console.log("Party updated successfully:", data);
    return uploadResult.publicUrl;
  } catch (error) {
    console.error("Error updating party image:", error);
    throw error;
  }
};
