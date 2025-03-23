import supabase from "./supabase"

/**
 * Fetch all saved meal plans for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of saved meal plans
 */
export const fetchSavedMealPlans = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("meal_plans")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error("Error fetching saved meal plans:", error)
    return []
  }
}

/**
 * Delete a meal plan
 * @param {string} planId - Plan ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteMealPlan = async (planId) => {
  try {
    const { error } = await supabase.from("meal_plans").delete().eq("id", planId)

    if (error) throw error

    return true
  } catch (error) {
    console.error("Error deleting meal plan:", error)
    return false
  }
}

