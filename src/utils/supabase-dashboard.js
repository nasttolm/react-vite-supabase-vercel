// utils/supabase-dashboard.js

import supabase from "./supabase"


export const fetchAllRecipes = async () => {
  try {
    // First, get all recipes
    const { data: recipes, error: recipesError } = await supabase
      .from("recipes")
      .select("*")
      .order("created_at", { ascending: false })

    if (recipesError) {
      throw recipesError
    }

    if (!recipes || recipes.length === 0) {
      return []
    }

    // For each recipe, get its diets and author information
    const recipesWithDetails = await Promise.all(
      recipes.map(async (recipe) => {
        try {
          // Get diets for the recipe
          const { data: dietData, error: dietError } = await supabase
            .from("recipe_diets")
            .select(`
              diets(id, name)
            `)
            .eq("recipe_id", recipe.id)

          if (dietError) {
            console.error("Error fetching diets for recipe:", recipe.id, dietError)
            return { ...recipe, diets: [], authorNickname: "Unknown" }
          }

          // Transform the diet data to a more convenient format
          const diets = dietData.map((item) => item.diets) || []

          // Get author information if user_id exists
          let authorNickname = "Unknown"
          if (recipe.user_id) {
            const { data: userProfile, error: userError } = await supabase
              .from("user_profiles")
              .select("nickname, first_name")
              .eq("id", recipe.user_id)
              .single()

            if (!userError && userProfile) {
              authorNickname = userProfile.nickname || userProfile.first_name || "Unknown"
            } else {
              console.error("Error fetching user profile:", userError)
            }
          }

          return {
            ...recipe,
            diets,
            authorNickname,
          }
        } catch (error) {
          console.error("Error processing details for recipe:", recipe.id, error)
          return { ...recipe, diets: [], authorNickname: "Unknown" }
        }
      }),
    )

    return recipesWithDetails
  } catch (error) {
    console.error("Error fetching recipes:", error)
    return []
  }
}


export const fetchRecipesByDiets = async (dietIds) => {
  try {
    if (!dietIds || dietIds.length === 0) {
      return await fetchAllRecipes()
    }

    // Get recipe IDs that have ANY of the selected diets
    const { data: recipeIds, error: dietError } = await supabase
      .from("recipe_diets")
      .select("recipe_id, diet_id")
      .in("diet_id", dietIds)

    if (dietError) {
      throw dietError
    }

    if (!recipeIds || recipeIds.length === 0) {
      return []
    }

    // Get unique recipe IDs
    const uniqueRecipeIds = [...new Set(recipeIds.map((item) => item.recipe_id))]

    if (uniqueRecipeIds.length === 0) {
      return []
    }

    // Fetch the filtered recipes
    const { data: recipes, error: recipesError } = await supabase
      .from("recipes")
      .select("*")
      .in("id", uniqueRecipeIds)
      .order("created_at", { ascending: false })

    if (recipesError) {
      throw recipesError
    }

    // For each recipe, get its diets
    const recipesWithDiets = await Promise.all(
      recipes.map(async (recipe) => {
        try {
          const { data: dietData, error: dietError } = await supabase
            .from("recipe_diets")
            .select(`
              diets(id, name)
            `)
            .eq("recipe_id", recipe.id)

          if (dietError) {
            console.error("Error fetching diets for recipe:", recipe.id, dietError)
            return { ...recipe, diets: [] }
          }

          // Transform the diet data to a more convenient format
          const diets = dietData.map((item) => item.diets) || []

          return {
            ...recipe,
            diets,
          }
        } catch (error) {
          console.error("Error processing diets for recipe:", recipe.id, error)
          return { ...recipe, diets: [] }
        }
      }),
    )

    return recipesWithDiets
  } catch (error) {
    console.error("Error fetching recipes by diets:", error)
    return []
  }
}

/**
 * Fetch all available diets from the database
 * @returns {Promise<Array>} Array of diet objects
 */
export const fetchAllDiets = async () => {
  try {
    const { data, error } = await supabase.from("diets").select("*").order("name")

    if (error) {
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Error fetching diets:", error)
    return []
  }
}

/**
 * Fetch recipe by ID
 * @param {number} id - Recipe ID
 * @returns {Promise<Object|null>} Recipe object or null if not found
 */
export const fetchRecipeById = async (id) => {
  try {
    const { data, error } = await supabase.from("recipes").select("*").eq("id", id).single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error("Error fetching recipe by ID:", error)
    return null
  }
}

/**
 * Create a new recipe
 * @param {Object} recipeData - Recipe data
 * @returns {Promise<Object|null>} Created recipe or null if failed
 */
export const createRecipe = async (recipeData) => {
  try {
    const { data, error } = await supabase.from("recipes").insert([recipeData]).select()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error("Error creating recipe:", error)
    return null
  }
}

/**
 * Update an existing recipe
 * @param {number} id - Recipe ID
 * @param {Object} recipeData - Updated recipe data
 * @returns {Promise<Object|null>} Updated recipe or null if failed
 */
export const updateRecipe = async (id, recipeData) => {
  try {
    const { data, error } = await supabase.from("recipes").update(recipeData).eq("id", id).select()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error("Error updating recipe:", error)
    return null
  }
}

/**
 * Delete a recipe
 * @param {number} id - Recipe ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteRecipe = async (id) => {
  try {
    const { error } = await supabase.from("recipes").delete().eq("id", id)

    if (error) {
      throw error
    }

    return true
  } catch (error) {
    console.error("Error deleting recipe:", error)
    return false
  }
}

/**
 * Fetch user's favorite recipes
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of favorite recipes
 */
export const fetchFavoriteRecipes = async (userId) => {
  try {
    // For debugging
    console.log("Fetching favorites for user:", userId)

    // Get IDs of favorite recipes from the favorites table
    // Using a simpler query to avoid potential issues
    const { data: favoritesData, error: favoritesError } = await supabase
      .from("favorites")
      .select("recipe_id")
      .eq("user_id", userId)

    if (favoritesError) {
      console.error("Error fetching favorites:", favoritesError)
      throw favoritesError
    }

    console.log("Favorites data:", favoritesData)

    if (!favoritesData || favoritesData.length === 0) {
      return []
    }

    // Get the recipes themselves
    const recipeIds = favoritesData.map((fav) => fav.recipe_id)
    console.log("Recipe IDs:", recipeIds)

    const { data, error } = await supabase.from("recipes").select("*").in("id", recipeIds)

    if (error) {
      console.error("Error fetching favorite recipes:", error)
      throw error
    }

    // For each recipe, get its diets and author information
    const recipesWithDetails = await Promise.all(
      data.map(async (recipe) => {
        try {
          const { data: dietData, error: dietError } = await supabase
            .from("recipe_diets")
            .select(`
              diets(id, name)
            `)
            .eq("recipe_id", recipe.id)

          if (dietError) {
            console.error("Error fetching diets for recipe:", recipe.id, dietError)
            return { ...recipe, diets: [], authorNickname: "Unknown" }
          }

          // Transform the diet data to a more convenient format
          const diets = dietData.map((item) => item.diets) || []

          // Get author information if user_id exists
          let authorNickname = "Unknown"
          if (recipe.user_id) {
            const { data: userProfile, error: userError } = await supabase
              .from("user_profiles")
              .select("nickname, first_name")
              .eq("id", recipe.user_id)
              .single()

            if (!userError && userProfile) {
              authorNickname = userProfile.nickname || userProfile.first_name || "Unknown"
            } else {
              console.error("Error fetching user profile:", userError)
            }
          }

          return {
            ...recipe,
            diets,
            authorNickname,
          }
        } catch (error) {
          console.error("Error processing details for recipe:", recipe.id, error)
          return { ...recipe, diets: [], authorNickname: "Unknown" }
        }
      }),
    )

    return recipesWithDetails || []
  } catch (error) {
    console.error("Error in fetchFavoriteRecipes:", error)
    return []
  }
}

/**
 * Toggle favorite status for a recipe
 * @param {string} userId - User ID
 * @param {string} recipeId - Recipe ID
 * @returns {Promise<boolean>} Success status
 */
export const toggleFavoriteRecipe = async (userId, recipeId) => {
  try {
    // For debugging
    console.log("Toggle favorite for user:", userId, "recipe:", recipeId)

    // Check if recipe is already favorited
    const { data: existingFavorite, error: checkError } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", userId)
      .eq("recipe_id", recipeId)
      .maybeSingle() // Use maybeSingle instead of single to avoid errors when no record is found

    if (checkError) {
      console.error("Error checking favorite:", checkError)
      throw checkError
    }

    console.log("Existing favorite:", existingFavorite)

    if (existingFavorite) {
      // Remove from favorites
      const { error: deleteError } = await supabase.from("favorites").delete().eq("id", existingFavorite.id)

      if (deleteError) {
        console.error("Error deleting favorite:", deleteError)
        throw deleteError
      }

      console.log("Favorite removed")
    } else {
      // Add to favorites
      const { error: insertError } = await supabase.from("favorites").insert({
        user_id: userId,
        recipe_id: recipeId,
      })

      if (insertError) {
        console.error("Error adding favorite:", insertError)
        throw insertError
      }

      console.log("Favorite added")
    }

    return true
  } catch (error) {
    console.error("Error in toggleFavoriteRecipe:", error)
    return false
  }
}

/**
 * Check if a recipe is favorited by the user
 * @param {string} userId - User ID
 * @param {string} recipeId - Recipe ID
 * @returns {Promise<boolean>} True if favorited
 */
export const isRecipeFavorited = async (userId, recipeId) => {
  try {
    // For debugging
    console.log("Checking if favorited for user:", userId, "recipe:", recipeId)

    const { data, error } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", userId)
      .eq("recipe_id", recipeId)
      .maybeSingle() // Use maybeSingle instead of single to avoid errors when no record is found

    if (error) {
      console.error("Error checking favorite status:", error)
      throw error
    }

    console.log("Is favorited result:", !!data)
    return !!data
  } catch (error) {
    console.error("Error in isRecipeFavorited:", error)
    return false
  }
}

/**
 * Fetch all recipe categories
 * @returns {Promise<Array>} Array of categories
 */
export const fetchCategories = async () => {
  try {
    const { data, error } = await supabase.from("category").select("id, name").order("name")

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching categories:", error)
    return []
  }
}

/**
 * Fetch all dietary preferences
 * @returns {Promise<Array>} Array of dietary preferences
 */
export const fetchDietaryPreferences = async () => {
  try {
    const { data, error } = await supabase.from("diets").select("id, name").order("name")

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching dietary preferences:", error)
    return []
  }
}

/**
 * Fetch recipes by category ID
 * @param {number} categoryId - Category ID
 * @returns {Promise<Array>} Array of recipes in the category
 */
export const fetchRecipesByCategory = async (categoryId) => {
  try {
    const { data: recipes, error } = await supabase
      .from("recipes")
      .select("*")
      .eq("category_id", categoryId)
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    if (!recipes || recipes.length === 0) {
      return []
    }

   
    const recipesWithDetails = await Promise.all(
      recipes.map(async (recipe) => {
        try {
          const { data: dietData, error: dietError } = await supabase
            .from("recipe_diets")
            .select(`
              diets(id, name)
            `)
            .eq("recipe_id", recipe.id)

          if (dietError) {
            console.error("Error fetching diets for recipe:", recipe.id, dietError)
            return { ...recipe, diets: [], authorNickname: "Unknown" }
          }

          // Transform the diet data to a more convenient format
          const diets = dietData.map((item) => item.diets) || []

          // Get author information if user_id exists
          let authorNickname = "Unknown"
          if (recipe.user_id) {
            const { data: userProfile, error: userError } = await supabase
              .from("user_profiles")
              .select("nickname, first_name")
              .eq("id", recipe.user_id)
              .single()

            if (!userError && userProfile) {
              authorNickname = userProfile.nickname || userProfile.first_name || "Unknown"
            } else {
              console.error("Error fetching user profile:", userError)
            }
          }

          return {
            ...recipe,
            diets,
            authorNickname,
          }
        } catch (error) {
          console.error("Error processing details for recipe:", recipe.id, error)
          return { ...recipe, diets: [], authorNickname: "Unknown" }
        }
      }),
    )

    return recipesWithDetails
  } catch (error) {
    console.error("Error fetching recipes by category:", error)
    return []
  }
}

/**
 * Fetch recipes by diet ID
 * @param {number} dietId - Diet ID
 * @returns {Promise<Array>} Array of recipes with the diet
 */
export const fetchRecipesByDiet = async (dietId) => {
  try {
    // Get recipe IDs from the junction table
    const { data: recipeIds, error: recipeIdsError } = await supabase
      .from("recipe_diets")
      .select("recipe_id")
      .eq("diet_id", dietId)

    if (recipeIdsError) throw recipeIdsError
    if (!recipeIds || recipeIds.length === 0) return []

    // Extract just the IDs
    const ids = recipeIds.map((item) => item.recipe_id)

    // Get the full recipe data
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .in("id", ids)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching recipes by diet:", error)
    return []
  }
}

/**
 * Fetch recipes by ingredient ID
 * @param {number} ingredientId - Ingredient ID
 * @returns {Promise<Array>} Array of recipes with the ingredient
 */
export const fetchRecipesByIngredient = async (ingredientId) => {
  try {
    // Get recipe IDs from the junction table
    const { data: recipeIds, error: recipeIdsError } = await supabase
      .from("recipe_ingredients")
      .select("recipe_id")
      .eq("ingredient_id", ingredientId)

    if (recipeIdsError) throw recipeIdsError
    if (!recipeIds || recipeIds.length === 0) return []

    // Extract just the IDs
    const ids = recipeIds.map((item) => item.recipe_id)

    // Get the full recipe data
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .in("id", ids)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching recipes by ingredient:", error)
    return []
  }
}

/**
 * Search recipes by title or description
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of matching recipes
 */
export const searchRecipes = async (query) => {
  try {
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error searching recipes:", error)
    return []
  }
}

/**
 * Fetch recipes by cooking time range
 * @param {number} minTime - Minimum cooking time in minutes
 * @param {number} maxTime - Maximum cooking time in minutes
 * @returns {Promise<Array>} Array of recipes within the time range
 */
export const fetchRecipesByCookingTime = async (minTime, maxTime) => {
  try {
    let query = supabase.from("recipes").select("*").gte("cooking_time", minTime)

    if (maxTime) {
      query = query.lte("cooking_time", maxTime)
    }

    const { data, error } = await query.order("cooking_time", { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching recipes by cooking time:", error)
    return []
  }
}

/**
 * Apply combined filters to recipes
 * @param {Object} filters - Filter object
 * @returns {Promise<Array>} Filtered recipes
 */
export const filterRecipes = async (filters) => {
  try {
    let recipeIds = null

    // If filtering by diet, get recipe IDs first
    if (filters.dietId) {
      const { data: dietRecipeIds, error: dietError } = await supabase
        .from("recipe_diets")
        .select("recipe_id")
        .eq("diet_id", filters.dietId)

      if (dietError) throw dietError
      if (!dietRecipeIds || dietRecipeIds.length === 0) return []

      recipeIds = dietRecipeIds.map((item) => item.recipe_id)
    }

    // If filtering by ingredient, further filter recipe IDs
    if (filters.ingredientId) {
      const { data: ingredientRecipeIds, error: ingredientError } = await supabase
        .from("recipe_ingredients")
        .select("recipe_id")
        .eq("ingredient_id", filters.ingredientId)

      if (ingredientError) throw ingredientError

      if (!ingredientRecipeIds || ingredientRecipeIds.length === 0) return []

      const ingredientIds = ingredientRecipeIds.map((item) => item.recipe_id)

      // If we already have recipeIds from diet filter, find intersection
      if (recipeIds) {
        recipeIds = recipeIds.filter((id) => ingredientIds.includes(id))
        if (recipeIds.length === 0) return []
      } else {
        recipeIds = ingredientIds
      }
    }

    // Main query
    let query = supabase.from("recipes").select("*")

    // Apply recipe IDs filter if we have any
    if (recipeIds) {
      query = query.in("id", recipeIds)
    }

    // Category filter
    if (filters.categoryId) {
      query = query.eq("category_id", filters.categoryId)
    }

    // Text search
    if (filters.searchQuery) {
      query = query.or(`title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`)
    }

    // Cooking time filter
    if (filters.minTime !== undefined) {
      query = query.gte("cooking_time", filters.minTime)
    }

    if (filters.maxTime) {
      query = query.lte("cooking_time", filters.maxTime)
    }

    // Sorting
    if (filters.sortBy) {
      query = query.order(filters.sortBy, { ascending: filters.sortAscending })
    } else {
      query = query.order("created_at", { ascending: false })
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error filtering recipes:", error)
    return []
  }
}

/**
 * Get diets for a specific recipe
 * @param {number} recipeId - Recipe ID
 * @returns {Promise<Array>} Array of diets for the recipe
 */
export const getDietsForRecipe = async (recipeId) => {
  try {
    const { data, error } = await supabase
      .from("recipe_diets")
      .select(`
        diet_id,
        diets(id, name)
      `)
      .eq("recipe_id", recipeId)

    if (error) throw error

    // Transform to a more convenient format
    return data.map((item) => item.diets) || []
  } catch (error) {
    console.error("Error fetching diets for recipe:", error)
    return []
  }
}

/**
 * Get user profile by user ID
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} User profile or null if not found
 */
export const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase.from("user_profiles").select("*").eq("id", userId).single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return null
  }
}


export const fetchAllCategories = async () => {
  try {
    const { data, error } = await supabase.from("category").select("*").order("name")

    if (error) {
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Error fetching categories:", error)
    return []
  }
}

/**
 * Search users by nickname
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of matching users
 */
export const searchUsersByNickname = async (query) => {
  try {
    if (!query || query.trim().length < 2) return []

    const { data, error } = await supabase
      .from("user_profiles")
      .select("id, first_name, last_name, nickname, avatar_url")
      .ilike("nickname", `%${query}%`)
      .limit(5)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error searching users by nickname:", error)
    return []
  }
}


export const fetchRecipesByAuthorNickname = async (nickname) => {
  try {
    if (!nickname || nickname.trim() === "") {
      return []
    }


    const { data: userProfiles, error: userError } = await supabase
      .from("user_profiles")
      .select("id")
      .ilike("nickname", `%${nickname}%`)

    if (userError) {
      throw userError
    }

    if (!userProfiles || userProfiles.length === 0) {
      return []
    }


    const userIds = userProfiles.map((profile) => profile.id)


    const { data: recipes, error: recipesError } = await supabase
      .from("recipes")
      .select("*")
      .in("user_id", userIds)
      .order("created_at", { ascending: false })

    if (recipesError) {
      throw recipesError
    }

    if (!recipes || recipes.length === 0) {
      return []
    }

 
    const recipesWithDetails = await Promise.all(
      recipes.map(async (recipe) => {
        try {

          const { data: dietData, error: dietError } = await supabase
            .from("recipe_diets")
            .select(`
              diets(id, name)
            `)
            .eq("recipe_id", recipe.id)

          if (dietError) {
            console.error("Error fetching diets for recipe:", recipe.id, dietError)
            return { ...recipe, diets: [], authorNickname: "Unknown" }
          }


          const diets = dietData.map((item) => item.diets) || []


          let authorNickname = "Unknown"
          if (recipe.user_id) {
            const { data: userProfile, error: userError } = await supabase
              .from("user_profiles")
              .select("nickname, first_name")
              .eq("id", recipe.user_id)
              .single()

            if (!userError && userProfile) {
              authorNickname = userProfile.nickname || userProfile.first_name || "Unknown"
            } else {
              console.error("Error fetching user profile:", userError)
            }
          }

          return {
            ...recipe,
            diets,
            authorNickname,
          }
        } catch (error) {
          console.error("Error processing details for recipe:", recipe.id, error)
          return { ...recipe, diets: [], authorNickname: "Unknown" }
        }
      }),
    )

    return recipesWithDetails
  } catch (error) {
    console.error("Error fetching recipes by author nickname:", error)
    return []
  }
}


export default {
  fetchAllRecipes,
  fetchRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  fetchFavoriteRecipes,
  toggleFavoriteRecipe,
  isRecipeFavorited,
  fetchCategories,
  fetchDietaryPreferences,
  fetchRecipesByCategory,
  fetchRecipesByDiet,
  fetchRecipesByDiets,
  fetchRecipesByIngredient,
  searchRecipes,
  fetchRecipesByCookingTime,
  filterRecipes,
  getDietsForRecipe,
  getUserProfile,
  fetchAllDiets,
  fetchAllCategories,
  searchUsersByNickname,
  fetchRecipesByAuthorNickname,
}

