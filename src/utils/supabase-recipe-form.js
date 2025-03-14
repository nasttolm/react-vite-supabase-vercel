import supabase from "./supabase"

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

// Function to search ingredients from the ingredients table
export async function searchIngredients(query) {
  try {
    const { data, error } = await supabase
      .from("ingredients")
      .select("id, name, calories")
      .ilike("name", `%${query}%`)
      .limit(10)

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error searching ingredients:", error)
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

// Function to create a new ingredient
export async function createIngredient({ name, calories }) {
  try {
    const { data, error } = await supabase
      .from("ingredients")
      .insert({
        name,
        calories,
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

// Function to create a new diet
export async function createDiet({ name }) {
  try {
    const { data, error } = await supabase
      .from("diets")
      .insert({
        name,
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error creating diet:", error)
    throw error
  }
}

// Function to create a recipe
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

      console.log("Inserting ingredients:", ingredientsToInsert)

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

// Function to get a recipe by ID
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
        ingredients (id, name, calories)
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

