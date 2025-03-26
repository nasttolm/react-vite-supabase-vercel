// Utility for working with Spoonacular API
const SPOONACULAR_API_KEY = import.meta.env.VITE_SPOONACULAR_API_KEY
const SPOONACULAR_BASE_URL = "https://api.spoonacular.com"

/**
 * Search for ingredients in Spoonacular API
 * @param {string} query - Search query
 * @param {number} number - Number of results (default 10)
 * @returns {Promise<Array>} Array of found ingredients
 */
export async function searchSpoonacularIngredients(query, number = 10) {
  try {
    if (!query || query.trim().length < 2) return []

    const url = `${SPOONACULAR_BASE_URL}/food/ingredients/search?apiKey=${SPOONACULAR_API_KEY}&query=${encodeURIComponent(query)}&number=${number}&metaInformation=true`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Spoonacular API error: ${response.status}`)
    }

    const data = await response.json()

    // Transform results to a format compatible with our application
    return data.results.map((item) => ({
      id: `spoonacular_${item.id}`, // Prefix to distinguish from our IDs
      name: item.name,
      calories: 0, // Calories need to be fetched with a separate request
      image: `https://spoonacular.com/cdn/ingredients_100x100/${item.image}`,
      source: "spoonacular",
    }))
  } catch (error) {
    console.error("Error searching Spoonacular ingredients:", error)
    return []
  }
}

// Update getSpoonacularIngredientInfo function to get nutrition information
export async function getSpoonacularIngredientInfo(id) {
  try {
    // Extract numeric ID if an ID with prefix is passed
    const numericId = id.toString().replace("spoonacular_", "")

    const url = `${SPOONACULAR_BASE_URL}/food/ingredients/${numericId}/information?apiKey=${SPOONACULAR_API_KEY}&amount=100&unit=grams`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Spoonacular API error: ${response.status}`)
    }

    const data = await response.json()

    // Find calories information
    const caloriesInfo = data.nutrition?.nutrients?.find((n) => n.name === "Calories")
    const calories = caloriesInfo ? caloriesInfo.amount : 0

    return {
      id: `spoonacular_${data.id}`,
      name: data.name,
      calories: calories,
      image: `https://spoonacular.com/cdn/ingredients_100x100/${data.image}`,
      nutrition: data.nutrition,
      source: "spoonacular",
      metric_unit: "g",
      metric_value: 100,
      us_unit: "oz",
      us_value: 3.5,
      caloriesNote: `${calories} kcal per 100g`,
    }
  } catch (error) {
    console.error("Error fetching Spoonacular ingredient info:", error)
    throw error
  }
}

// Update saveSpoonacularIngredient function to save measurement units
export async function saveSpoonacularIngredient(ingredientData, supabase) {
  try {
    // Check if this ingredient already exists in our database
    const spoonacularId = ingredientData.id.replace("spoonacular_", "")

    const { data: existingIngredient } = await supabase
      .from("ingredients")
      .select("id")
      .eq("spoonacular_id", spoonacularId)
      .single()

    if (existingIngredient) {
      // If the ingredient already exists, return its ID
      return { id: existingIngredient.id }
    }

    // Prepare data for saving
    const ingredientToSave = {
      name: ingredientData.name,
      calories: ingredientData.calories,
      spoonacular_id: spoonacularId,
      source: "spoonacular",
      metric_unit: ingredientData.metric_unit || "g",
      metric_value: ingredientData.metric_value || 100,
      us_unit: ingredientData.us_unit || "oz",
      us_value: ingredientData.us_value || 3.5,
      image_url: ingredientData.image,
    }

    console.log("Saving ingredient with data:", ingredientToSave)

    // Save to our database
    const { data, error } = await supabase.from("ingredients").insert(ingredientToSave).select().single()

    if (error) throw error

    return data
  } catch (error) {
    console.error("Error saving Spoonacular ingredient:", error)
    throw error
  }
}

