/**
 * Format ingredients from recipe object into a standard format
 * @param {Object} recipe - Recipe object
 * @returns {Array} Formatted ingredients array
 */
function formatIngredients(recipe) {
  // If the recipe doesn't have any ingredient data, return an empty array
  if (!recipe) return []

  console.log("Formatting ingredients for recipe:", recipe.title)

  // Check if recipe has ingredients array directly
  if (Array.isArray(recipe.ingredients)) {
    console.log("Recipe has ingredients array with length:", recipe.ingredients.length)

    return recipe.ingredients.map((item) => {
      // Handle the structure from recipe-page.jsx where ingredients are stored as:
      // item.ingredients.name and item.grams
      if (item.ingredients && item.ingredients.name) {
        return {
          name: item.ingredients.name,
          amount: Number.parseFloat(item.grams) || 1,
          unit: "g",
          category: "Ingredients",
        }
      } else if (item.name) {
        // Fallback for other structures
        return {
          name: item.name,
          amount: Number.parseFloat(item.amount || item.grams || 1),
          unit: "g",
          category: "Ingredients",
        }
      }

      // Fallback for unknown structure
      console.log("Unknown ingredient structure:", item)
      return {
        name: "Unknown ingredient",
        amount: 1,
        unit: "g",
        category: "Ingredients",
      }
    })
  }

  // If we couldn't find ingredients in the expected format, log and return empty array
  console.log("No ingredients found in expected format for recipe:", recipe.title)
  console.log("Recipe structure:", Object.keys(recipe))
  return []
}

/**
 * Helper function to generate a meal plan
 * @param {Object} options - Options for generating the meal plan
 * @returns {Array} Generated meal plan
 */
export const generateMealPlan = (options) => {
  const { recipesByCategory, daysCount = 7, categorySettings = {}, servingsCount = 2 } = options

  console.log("Generating meal plan with options:", options)
  console.log("Available recipe categories:", Object.keys(recipesByCategory))

  // Create an empty meal plan
  const mealPlan = []

  // For each day
  for (let day = 0; day < daysCount; day++) {
    const dayPlan = {}

    // For each category
    Object.entries(categorySettings).forEach(([categoryId, count]) => {
      if (count <= 0) return

      const categoryRecipes = recipesByCategory[categoryId]
      if (!categoryRecipes || categoryRecipes.length === 0) {
        console.warn(`No recipes found for category ${categoryId}`)
        return
      }

      // Add the specified number of meals for this category
      dayPlan[categoryId] = []

      for (let i = 0; i < count; i++) {
        // Get a random recipe from this category
        const randomIndex = Math.floor(Math.random() * categoryRecipes.length)
        const recipe = categoryRecipes[randomIndex]

        // Add servings information to the recipe
        const recipeWithServings = {
          ...recipe,
          servings: servingsCount,
          default_servings: recipe.servings || 2,
        }

        dayPlan[categoryId].push(recipeWithServings)
      }
    })

    mealPlan.push(dayPlan)
  }

  console.log("Generated meal plan:", mealPlan)
  return mealPlan
}

/**
 * Generates a shopping list based on the meal plan
 * @param {Array} mealPlan - Meal plan
 * @returns {Object} Shopping list grouped by categories
 */
export const generateShoppingList = (mealPlan) => {
  console.log("Generating shopping list from meal plan")

  // Create object to store ingredients
  const ingredients = {}
  let totalIngredientsFound = 0

  // Go through all days and meals
  mealPlan.forEach((day, dayIndex) => {
    // Process each category
    Object.entries(day).forEach(([categoryId, meals]) => {
      // Process each meal in this category
      meals.forEach((meal, mealIndex) => {
        if (!meal) return

        // Format ingredients for this meal
        const mealIngredients = formatIngredients(meal)
        totalIngredientsFound += mealIngredients.length

        // Process each ingredient
        mealIngredients.forEach((ingredient) => {
          if (!ingredient || !ingredient.name) return

          const { name, amount, unit } = ingredient
          const key = name.toLowerCase()

          // If ingredient doesn't exist yet, add it
          if (!ingredients[key]) {
            ingredients[key] = {
              name,
              amount: 0,
              unit: unit || "",
            }
          }

          // Increase ingredient amount considering servings
          const servings = meal.servings || 1
          const multiplier = servings / (meal.default_servings || 1)
          const ingredientAmount = typeof amount === "number" ? amount : Number.parseFloat(amount) || 1
          ingredients[key].amount += ingredientAmount * multiplier
        })
      })
    })
  })

  console.log("Total ingredients found:", totalIngredientsFound)

  // If no ingredients were found, create a default shopping list
  if (Object.keys(ingredients).length === 0) {
    console.warn("No ingredients found in meal plan. Using default shopping list.")
    return {
      Ingredients: [
        {
          name: "No ingredients found in recipes",
          amount: "",
          unit: "",
        },
      ],
    }
  }

  // Transform object into a format convenient for display
  const shoppingList = {
    Ingredients: Object.values(ingredients).map((item) => ({
      ...item,
      amount: Math.ceil(item.amount * 10) / 10, // Round to 1 decimal place
    })),
  }

  console.log("Final shopping list:", shoppingList)
  return shoppingList
}

