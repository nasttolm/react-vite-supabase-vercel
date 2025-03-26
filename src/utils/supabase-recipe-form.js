import supabase from "./supabase"
import { searchSpoonacularIngredients, getSpoonacularIngredientInfo } from "./spoonacular-api"

// Function to upload recipe image to Supabase Storage
export async function uploadRecipeImage(file) {
  try {
    // Generate a unique file name using timestamp and random string
    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${fileName}`

    // Upload the file to the recipe-images bucket
    const { error: uploadError, data } = await supabase.storage.from("recipe-images").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (uploadError) {
      throw uploadError
    }

    // Get the public URL for the uploaded image
    const {
      data: { publicUrl },
    } = supabase.storage.from("recipe-images").getPublicUrl(filePath)

    return publicUrl
  } catch (error) {
    console.error("Error uploading image:", error)
    throw error
  }
}

// Update searchIngredients function to return measurement units and calories
export async function searchIngredients(query) {
  try {
    // If the query is empty, return an empty array
    if (!query || query.trim().length === 0) {
      return []
    }

    // Search in our database
    const { data: localIngredients, error } = await supabase
      .from("ingredients")
      .select("id, name, calories, spoonacular_id, metric_unit, metric_value, us_unit, us_value, source")
      .ilike("name", `%${query}%`)
      .order("name")
      .limit(10)

    if (error) throw error

    // Add source to local ingredients
    const localResults = (localIngredients || []).map((ingredient) => ({
      ...ingredient,
      source: ingredient.source || (ingredient.spoonacular_id ? "spoonacular" : "user"),
      caloriesNote: ingredient.metric_unit
        ? `${ingredient.calories} kcal per ${ingredient.metric_value || 100}${ingredient.metric_unit}`
        : `${ingredient.calories} kcal/100g`,
    }))

    // Get list of spoonacular_ids that already exist in local database
    const existingSpoonacularIds = localIngredients.filter((ing) => ing.spoonacular_id).map((ing) => ing.spoonacular_id)

    // Search in Spoonacular API
    const spoonacularResults = await searchSpoonacularIngredients(query, 5)

    // Filter Spoonacular results to exclude those already in the database
    const filteredSpoonacularResults = spoonacularResults.filter((item) => {
      const itemId = item.id.replace("spoonacular_", "")
      return !existingSpoonacularIds.includes(itemId)
    })

    // Combine results
    const combinedResults = [...localResults, ...filteredSpoonacularResults]

    // Sort by relevance (starts with query, then alphabetically)
    combinedResults.sort((a, b) => {
      const aStartsWithQuery = a.name.toLowerCase().startsWith(query.toLowerCase())
      const bStartsWithQuery = b.name.toLowerCase().startsWith(query.toLowerCase())

      if (aStartsWithQuery && !bStartsWithQuery) return -1
      if (!aStartsWithQuery && bStartsWithQuery) return 1

      return a.name.localeCompare(b.name)
    })

    return combinedResults
  } catch (error) {
    console.error("Error searching ingredients:", error)
    throw error
  }
}

// Update getIngredientInfo function to return measurement units
export async function getIngredientInfo(id) {
  try {
    // Check if the ingredient is from Spoonacular
    if (id.toString().startsWith("spoonacular_")) {
      return await getSpoonacularIngredientInfo(id)
    }

    // Otherwise get from our database
    const { data, error } = await supabase
      .from("ingredients")
      .select("id, name, calories, metric_unit, metric_value, us_unit, us_value, source")
      .eq("id", id)
      .single()

    if (error) throw error

    return {
      ...data,
      source: data.source || "user",
      // Add calorie information per unit
      caloriesPerUnit: data.calories,
      caloriesNote: data.metric_unit
        ? `${data.calories} kcal per ${data.metric_value || 100}${data.metric_unit}`
        : `${data.calories} kcal per 100g`,
    }
  } catch (error) {
    console.error("Error fetching ingredient info:", error)
    throw error
  }
}

// Function to search diets
export async function searchDiets(query) {
  try {
    const { data, error } = await supabase.from("diets").select("id, name").ilike("name", `%${query}%`).limit(10)

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error searching diets:", error)
    throw error
  }
}

// Update createIngredient function to add measurement units
export async function createIngredient({ name, calories }) {
  try {
    const { data, error } = await supabase
      .from("ingredients")
      .insert({
        name,
        calories,
        source: "user", // Mark as a user-created ingredient
        metric_unit: "g",
        metric_value: 100,
        us_unit: "oz",
        us_value: 3.5,
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error creating ingredient:", error)
    throw error
  }
}

// Update createRecipe function to properly log ingredients
export async function createRecipe({
  name,
  description,
  category,
  imageUrl,
  steps,
  ingredients,
  diets,
  cooking_time,
  servings,
}) {
  try {
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) throw new Error("User not authenticated")

    // Ensure category is a valid ID
    const categoryId = Number(category)
    if (isNaN(categoryId)) {
      throw new Error("Invalid category ID")
    }

    console.log("Creating recipe with category ID:", categoryId)

    // Create recipe
    const { data: recipe, error: recipeError } = await supabase
      .from("recipes")
      .insert({
        user_id: user.id,
        title: name,
        description,
        category_id: categoryId, // Using the numeric category ID
        image_url: imageUrl,
        steps: steps.filter((step) => step.trim()),
        cooking_time: cooking_time, // New field
        servings: servings, // New field
      })
      .select()
      .single()

    console.log(
      "Steps being sent to database:",
      steps.filter((step) => step.trim()),
    )

    if (recipeError) {
      console.error("Error creating recipe:", recipeError)
      throw recipeError
    }

    console.log("Recipe created successfully:", recipe)

    // Add ingredients with their IDs
    if (ingredients.length > 0) {
      const ingredientsToInsert = ingredients.map((ing) => ({
        recipe_id: recipe.id,
        ingredient_id: ing.id,
        grams: Number.parseInt(ing.grams),
      }))

      console.log("Inserting ingredients:", JSON.stringify(ingredientsToInsert, null, 2))

      const { error: ingredientsError } = await supabase.from("recipe_ingredients").insert(ingredientsToInsert)

      if (ingredientsError) {
        console.error("Error adding ingredients:", ingredientsError)
        throw ingredientsError
      }
    }

    // Add diets - FIXED: Only include recipe_id and diet_id
    if (diets.length > 0) {
      const dietsToInsert = diets.map((diet) => ({
        recipe_id: recipe.id,
        diet_id: diet.id,
        // Removed name field as it's already in the diets table
      }))

      console.log("Inserting diets:", dietsToInsert)

      const { error: dietsError } = await supabase.from("recipe_diets").insert(dietsToInsert)

      if (dietsError) {
        console.error("Error adding diets:", dietsError)
        throw dietsError
      }
    }

    return recipe
  } catch (error) {
    console.error("Error creating recipe:", error)
    throw error
  }
}

// Function to get categories
export async function getCategories() {
  try {
    const { data, error } = await supabase.from("category").select("id, name")

    if (error) {
      console.error("Error fetching categories:", error)
      throw error
    }

    console.log("Categories loaded:", data)
    return data
  } catch (error) {
    console.error("Error fetching categories:", error)
    throw error
  }
}

// Function to get all diets
export async function getAllDiets() {
  try {
    const { data, error } = await supabase.from("diets").select("id, name")

    if (error) {
      console.error("Error fetching diets:", error)
      throw error
    }

    console.log("Diets loaded:", data)
    return data
  } catch (error) {
    console.error("Error fetching diets:", error)
    throw error
  }
}

// Update getRecipeById function to return measurement units
export async function getRecipeById(id) {
  try {
    // Get the recipe
    const { data: recipe, error: recipeError } = await supabase.from("recipes").select("*").eq("id", id).single()

    if (recipeError) throw recipeError

    // Get the recipe ingredients with their details from the ingredients table
    const { data: ingredients, error: ingredientsError } = await supabase
      .from("recipe_ingredients")
      .select(`
        id,
        grams,
        ingredients (id, name, calories, metric_unit, metric_value, us_unit, us_value, source)
      `)
      .eq("recipe_id", id)

    if (ingredientsError) throw ingredientsError

    // Get the recipe diets with their details from the diets table
    const { data: diets, error: dietsError } = await supabase
      .from("recipe_diets")
      .select(`
        id,
        diets (id, name)
      `)
      .eq("recipe_id", id)

    if (dietsError) throw dietsError

    return {
      ...recipe,
      ingredients,
      diets,
    }
  } catch (error) {
    console.error("Error fetching recipe:", error)
    throw error
  }
}

