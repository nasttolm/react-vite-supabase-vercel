import supabase from "./supabase"

/**
 * Get user profile
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - User profile
 */
export async function getUserProfile(userId) {
  try {
    const { data: profile, error } = await supabase.from("user_profiles").select("*").eq("id", userId).single()

    if (error) throw error

    return profile
  } catch (error) {
    console.error("Error getting user profile:", error)
    throw error
  }
}

// Update the updateUserProfile function to include nickname
export async function updateUserProfile(userId, userData) {
  try {
    // If there's an avatar file, upload it
    let avatarUrl = userData.avatar_url

    if (userData.avatar_file) {
      const fileExt = userData.avatar_file.name.split(".").pop()
      const fileName = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, userData.avatar_file)

      if (uploadError) throw uploadError

      // Get public URL for the avatar
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath)

      avatarUrl = publicUrl
    }

    // Update user profile
    const { data, error } = await supabase
      .from("user_profiles")
      .update({
        first_name: userData.first_name,
        last_name: userData.last_name,
        nickname: userData.nickname,
        avatar_url: avatarUrl,
        notification_settings: userData.notification_settings,
      })
      .eq("id", userId)
      .select()
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error("Error updating user profile:", error)
    throw error
  }
}

/**
 * Get user notification settings
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Notification settings
 */
export async function getUserNotificationSettings(userId) {
  try {
    const { data: profile, error } = await supabase
      .from("user_profiles")
      .select("notification_settings")
      .eq("id", userId)
      .single()

    if (error) throw error

    return (
      profile.notification_settings || {
        enabled: false,
        day: "sunday",
        time: "18:00",
      }
    )
  } catch (error) {
    console.error("Error getting notification settings:", error)
    throw error
  }
}

// Update the createUserProfile function to include nickname
export async function createUserProfile(profileData) {
  try {
    // If there's an avatar file, upload it
    let avatarUrl = null

    if (profileData.avatar_file) {
      const fileExt = profileData.avatar_file.name.split(".").pop()
      const fileName = `${profileData.id}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, profileData.avatar_file)

      if (uploadError) throw uploadError

      // Get public URL for the avatar
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath)

      avatarUrl = publicUrl
    }

    // Create user profile
    const { data, error } = await supabase
      .from("user_profiles")
      .insert({
        id: profileData.id,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        nickname: profileData.nickname,
        avatar_url: avatarUrl,
        notification_settings: profileData.notification_settings,
      })
      .select()
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error("Error creating user profile:", error)
    throw error
  }
}

// Add a function to check if a nickname is available
export async function isNicknameAvailable(nickname, excludeUserId = null) {
  try {
    let query = supabase.from("user_profiles").select("id").eq("nickname", nickname)

    // If we're updating a profile, exclude the current user
    if (excludeUserId) {
      query = query.neq("id", excludeUserId)
    }

    const { data, error } = await query.maybeSingle()

    if (error) throw error

    return !data // Return true if nickname is available (data is null)
  } catch (error) {
    console.error("Error checking nickname availability:", error)
    throw error
  }
}

