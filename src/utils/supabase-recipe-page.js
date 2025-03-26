import supabase from "./supabase"

export async function getRecipeById(id) {
  try {
    // Get the recipe basic info
    const { data: recipe, error: recipeError } = await supabase.from("recipes").select("*").eq("id", id).single()

    if (recipeError) throw recipeError

    // Get the category name separately - using the correct table name "category"
    let categoryName = "Uncategorized"
    if (recipe.category_id) {
      const { data: category, error: categoryError } = await supabase
        .from("category")
        .select("name")
        .eq("id", recipe.category_id)
        .single()

      if (!categoryError && category) {
        categoryName = category.name
      } else {
        console.error("Error fetching category:", categoryError)
      }
    }

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

    // Get the recipe ingredients with their details from the ingredients table
    const { data: ingredients, error: ingredientsError } = await supabase
      .from("recipe_ingredients")
      .select(`
        grams,
        ingredients:ingredient_id (
          id,
          name,
          calories
        )
      `)
      .eq("recipe_id", id)

    if (ingredientsError) throw ingredientsError

    // Get the recipe diets with their details from the diets table
    const { data: dietData, error: dietsError } = await supabase
      .from("recipe_diets")
      .select(`
        diet_id,
        diets:diet_id (
          id,
          name
        )
      `)
      .eq("recipe_id", id)

    if (dietsError) {
      console.error("Error fetching recipe diets:", dietsError)
    }

    // Format diet data the same way as in fetchAllRecipes
    const diets = dietData ? dietData.map((item) => item.diets) : []

    // Check if recipe is favorited by current user
    const { data: user } = await supabase.auth.getUser()
    let isFavorited = false

    if (user?.user) {
      const { data: favorite } = await supabase
        .from("favorites")
        .select("id")
        .eq("recipe_id", id)
        .eq("user_id", user.user.id)
        .single()

      isFavorited = !!favorite
    }

    return {
      ...recipe,
      categoryName,
      authorNickname,
      ingredients,
      diets,
      isFavorited,
    }
  } catch (error) {
    console.error("Error fetching recipe:", error)
    throw error
  }
}

export async function deleteRecipe(id) {
  try {
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("User not authenticated")
    }

    // Check if the user owns this recipe
    const { data: recipe, error: recipeError } = await supabase.from("recipes").select("user_id").eq("id", id).single()

    if (recipeError) throw recipeError

    if (recipe.user_id !== user.id) {
      throw new Error("You don't have permission to delete this recipe")
    }

    // Delete recipe ingredients
    const { error: ingredientsError } = await supabase.from("recipe_ingredients").delete().eq("recipe_id", id)

    if (ingredientsError) {
      console.error("Error deleting recipe ingredients:", ingredientsError)
      throw ingredientsError
    }

    // Delete recipe diets
    const { error: dietsError } = await supabase.from("recipe_diets").delete().eq("recipe_id", id)

    if (dietsError) {
      console.error("Error deleting recipe diets:", dietsError)
      throw dietsError
    }

    // Delete the recipe itself
    const { error: deleteError } = await supabase.from("recipes").delete().eq("id", id)

    if (deleteError) throw deleteError

    return true
  } catch (error) {
    console.error("Error deleting recipe:", error)
    throw error
  }
}

export async function toggleFavorite(recipeId) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("User not authenticated")
    }

    // Check if recipe is already favorited
    const { data: existingFavorite } = await supabase
      .from("favorites")
      .select("id")
      .eq("recipe_id", recipeId)
      .eq("user_id", user.id)
      .single()

    if (existingFavorite) {
      // Remove from favorites
      const { error: deleteError } = await supabase.from("favorites").delete().eq("id", existingFavorite.id)

      if (deleteError) throw deleteError
      return false // Return false to indicate recipe is no longer favorited
    } else {
      // Add to favorites
      const { error: insertError } = await supabase.from("favorites").insert({ recipe_id: recipeId, user_id: user.id })

      if (insertError) throw insertError
      return true // Return true to indicate recipe is now favorited
    }
  } catch (error) {
    console.error("Error toggling favorite:", error)
    throw error
  }
}

