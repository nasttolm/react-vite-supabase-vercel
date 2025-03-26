"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import toast from "react-hot-toast"
import styles from "../styles/create-recipe.module.css"
import "../styles/styles.module.css"
import {
  uploadRecipeImage,
  createRecipe,
  getCategories,
  searchIngredients,
  createIngredient,
  getAllDiets,
  getIngredientInfo,
} from "../utils/supabase-recipe-form"
import { saveSpoonacularIngredient } from "../utils/spoonacular-api"
import supabase from "../utils/supabase"

const CreateRecipe = () => {
  const navigate = useNavigate()

  // State for form fields
  const [recipeName, setRecipeName] = useState("")
  const [description, setDescription] = useState("")
  const [grams, setGrams] = useState("100")
  const [calories, setCalories] = useState("")
  const [searchIngredientQuery, setSearchIngredientQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [selectedIngredient, setSelectedIngredient] = useState(null)
  const [ingredients, setIngredients] = useState([])
  const [cookingTime, setCookingTime] = useState("")
  const [servings, setServings] = useState("")

  // Diet states
  const [selectedDietId, setSelectedDietId] = useState("")
  const [dietaryTags, setDietaryTags] = useState([])
  const [allDiets, setAllDiets] = useState([])
  const [isCreatingDiet, setIsCreatingDiet] = useState(false)

  const [category, setCategory] = useState("")
  const [categories, setCategories] = useState([])
  const [steps, setSteps] = useState([""])
  const [image, setImage] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCreatingIngredient, setIsCreatingIngredient] = useState(false)
  const [apiLimitReached, setApiLimitReached] = useState(false)

  // Load categories when component mounts
  useEffect(() => {
    async function loadCategories() {
      try {
        const categoriesData = await getCategories()
        console.log("Loaded categories:", categoriesData)
        setCategories(categoriesData || [])
      } catch (error) {
        console.error("Failed to load categories:", error)
        toast.error("Failed to load categories")
      }
    }

    loadCategories()
  }, [])

  // Load all diets when component mounts
  useEffect(() => {
    async function loadDiets() {
      try {
        const dietsData = await getAllDiets()
        console.log("Loaded diets:", dietsData)
        setAllDiets(dietsData || [])
      } catch (error) {
        console.error("Failed to load diets:", error)
        toast.error("Failed to load diets")
      }
    }

    loadDiets()
  }, [])

  // Search ingredients with debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchIngredientQuery.trim().length > 0) {
        try {
          const response = await searchIngredients(searchIngredientQuery)

          // Check if we got an object with results property or just an array
          const results = response.results || response
          setSearchResults(results)

          // Handle API errors
          if (response.apiError) {
            if (response.apiLimitReached) {
              setApiLimitReached(true)
              console.warn("API rate limit reached. Showing local ingredients only.")
            } else {
              console.warn("Failed to get ingredients from external database. Showing local results only.")
            }
          } else {
            setApiLimitReached(false)
          }
        } catch (error) {
          console.error("Error searching ingredients:", error)
          toast.error("Error searching ingredients: " + (error.message || "Unknown error"))
          setSearchResults([])
        }
      } else {
        setSearchResults([])
      }
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [searchIngredientQuery])

  // Update handleSelectIngredient function to show calorie information
  const handleSelectIngredient = async (ingredient) => {
    try {
      // If the ingredient is from Spoonacular, we need to get detailed information
      if (ingredient.source === "spoonacular") {
        setIsLoading(true)
        toast.loading("Getting nutrition information...", { id: "nutrition-info" })

        try {
          // Get detailed information, including calories
          const detailedIngredient = await getIngredientInfo(ingredient.id)

          // Set the selected ingredient with full information
          setSelectedIngredient(detailedIngredient)
          setSearchIngredientQuery(detailedIngredient.name)
          setCalories(detailedIngredient.calories.toString())

          // Update the label for calories
          const caloriesLabel = document.querySelector('label[for="calories"]')
          if (caloriesLabel && detailedIngredient.metric_unit) {
            caloriesLabel.textContent = `kcal per ${detailedIngredient.metric_value}${detailedIngredient.metric_unit}`
          } else if (caloriesLabel) {
            caloriesLabel.textContent = "kcal per 100g"
          }

          toast.success("Nutrition information retrieved", { id: "nutrition-info" })
        } catch (error) {
          console.error("Error getting Spoonacular ingredient details:", error)

          if (error.message.includes("rate limit") || error.message.includes("API rate limit")) {
            toast.error("API rate limit reached. Please try again later or use ingredients from our database.", {
              id: "nutrition-info",
            })
          } else {
            toast.error("Failed to get ingredient information: " + error.message, { id: "nutrition-info" })
          }

          // Still set the ingredient but without detailed info
          setSelectedIngredient(ingredient)
          setSearchIngredientQuery(ingredient.name)
          setCalories("")
        }

        setIsLoading(false)
      } else {
        // For local ingredients, keep as before but update the label
        setSelectedIngredient(ingredient)
        setSearchIngredientQuery(ingredient.name)
        setCalories(ingredient.calories.toString())

        // Update the label for calories
        const caloriesLabel = document.querySelector('label[for="calories"]')
        if (caloriesLabel && ingredient.metric_unit) {
          caloriesLabel.textContent = `kcal per ${ingredient.metric_value || 100}${ingredient.metric_unit}`
        } else if (caloriesLabel) {
          caloriesLabel.textContent = "kcal per 100g"
        }
      }
    } catch (error) {
      console.error("Error getting ingredient details:", error)
      toast.error("Failed to get ingredient information", { id: "nutrition-info" })
      setIsLoading(false)
    }
  }

  // Update handleAddIngredient function to properly save calories
  const handleAddIngredient = async () => {
    if (!searchIngredientQuery.trim()) {
      toast.error("Please enter an ingredient name")
      return
    }

    if (!calories || isNaN(Number.parseFloat(calories))) {
      toast.error("Please enter valid calories")
      return
    }

    let ingredientToAdd = selectedIngredient

    // If an ingredient from Spoonacular is selected, save it to our database
    if (ingredientToAdd && ingredientToAdd.source === "spoonacular") {
      try {
        setIsCreatingIngredient(true)

        // Add calories to the ingredient if they're missing
        const ingredientWithCalories = {
          ...ingredientToAdd,
          calories: Number.parseFloat(calories),
        }

        const savedIngredient = await saveSpoonacularIngredient(ingredientWithCalories, supabase)

        // Update ID to local
        ingredientToAdd = {
          ...ingredientToAdd,
          id: savedIngredient.id,
          source: "spoonacular", // Keep the source as spoonacular
        }

        toast.success(`Ingredient ${ingredientToAdd.name} saved to database`)
      } catch (error) {
        console.error("Error saving Spoonacular ingredient:", error)

        // If error is related to missing calories, show error
        if (error.message.includes("calorie")) {
          toast.error(error.message)
          setIsCreatingIngredient(false)
          return
        }

        // For other errors, show warning and let user decide
        const continueAnyway = window.confirm(
          `There was a problem saving the ingredient: ${error.message}. Do you want to continue with basic information?`,
        )

        if (!continueAnyway) {
          setIsCreatingIngredient(false)
          return
        }

        // If user wants to continue, create a local ingredient instead
        try {
          const newIngredient = await createIngredient({
            name: searchIngredientQuery.trim(),
            calories: Number.parseFloat(calories),
          })
          ingredientToAdd = {
            ...newIngredient,
            source: "user",
          }
          toast.success(`Created new ingredient: ${newIngredient.name}`)
        } catch (createError) {
          console.error("Error creating ingredient:", createError)
          toast.error("Failed to create ingredient")
          setIsCreatingIngredient(false)
          return
        }
      } finally {
        setIsCreatingIngredient(false)
      }
    }

    // If no ingredient is selected, create a new one
    if (!ingredientToAdd) {
      try {
        setIsCreatingIngredient(true)
        const newIngredient = await createIngredient({
          name: searchIngredientQuery.trim(),
          calories: Number.parseFloat(calories),
        })
        ingredientToAdd = {
          ...newIngredient,
          source: "user", // Explicitly set source to user
        }
        toast.success(`Created new ingredient: ${newIngredient.name}`)
      } catch (error) {
        console.error("Error creating ingredient:", error)
        toast.error("Failed to create ingredient")
        setIsCreatingIngredient(false)
        return
      } finally {
        setIsCreatingIngredient(false)
      }
    }

    // Create ingredient object with measurement units
    const newIngredient = {
      id: ingredientToAdd.id,
      name: ingredientToAdd.name,
      grams: grams,
      calories: Number.parseFloat(calories),
      metric_unit: ingredientToAdd.metric_unit || "g",
      metric_value: ingredientToAdd.metric_value || 100,
      us_unit: ingredientToAdd.us_unit || "oz",
      us_value: ingredientToAdd.us_value || 3.5,
      caloriesNote: ingredientToAdd.caloriesNote || `${ingredientToAdd.calories} kcal/100g`,
      source: ingredientToAdd.source || "user", // Ensure source is preserved
    }

    setIngredients([...ingredients, newIngredient])
    setSearchIngredientQuery("")
    setCalories("")
    setSelectedIngredient(null)

    // Reset the label for calories
    const caloriesLabel = document.querySelector('label[for="calories"]')
    if (caloriesLabel) {
      caloriesLabel.textContent = "kcal per 100g"
    }

    toast.success(`Added ${newIngredient.name}`)
  }

  // Handle adding a dietary tag
  const handleAddDietary = () => {
    if (!selectedDietId) {
      toast.error("Please select a dietary restriction")
      return
    }

    // Find the selected diet from the allDiets array
    const selectedDiet = allDiets.find((diet) => diet.id === Number(selectedDietId))

    if (!selectedDiet) {
      toast.error("Selected diet not found")
      return
    }

    // Check if this diet is already added
    if (dietaryTags.some((tag) => tag.id === selectedDiet.id)) {
      toast.error("This diet is already added")
      return
    }

    setDietaryTags([...dietaryTags, selectedDiet])
    setSelectedDietId("") // Reset selection
    toast.success(`Added ${selectedDiet.name}`)
  }

  // Handle removing an ingredient
  const handleRemoveIngredient = (index) => {
    const newIngredients = [...ingredients]
    newIngredients.splice(index, 1)
    setIngredients(newIngredients)
  }

  // Handle removing a dietary tag
  const handleRemoveDietary = (index) => {
    const newTags = [...dietaryTags]
    newTags.splice(index, 1)
    setDietaryTags(newTags)
  }

  // Handle adding a step
  const handleAddStep = () => {
    setSteps([...steps, ""])
  }

  // Handle step change
  const handleStepChange = (index, value) => {
    const newSteps = [...steps]
    newSteps[index] = value
    setSteps(newSteps)
  }

  // Handle image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      setImage(URL.createObjectURL(file))
    }
  }

  // Handle image upload button click
  const handleImageUploadClick = () => {
    document.getElementById("image-upload").click()
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Enhanced form validation
    if (!recipeName.trim()) {
      toast.error("Recipe name is required")
      return
    }

    if (!description.trim()) {
      toast.error("Description is required")
      return
    }

    if (!category) {
      toast.error("Please select a category")
      return
    }

    if (ingredients.length === 0) {
      toast.error("Please add at least one ingredient")
      return
    }

    if (!imageFile) {
      toast.error("Please add a recipe image")
      return
    }

    if (!cookingTime || isNaN(Number(cookingTime)) || Number(cookingTime) < 0) {
      toast.error("Please enter a valid cooking time")
      return
    }

    if (!servings || isNaN(Number(servings)) || Number(servings) < 1) {
      toast.error("Please enter a valid number of servings")
      return
    }

    if (steps.filter((step) => step.trim()).length === 0) {
      toast.error("Please add at least one step")
      return
    }

    setIsLoading(true)

    try {
      console.log("Starting recipe creation process")

      // Upload image if selected
      let imageUrl = null
      if (imageFile) {
        console.log("Uploading image file:", imageFile)
        imageUrl = await uploadRecipeImage(imageFile)
        console.log("Image uploaded successfully:", imageUrl)
      }

      // Create recipe
      const recipeData = {
        name: recipeName,
        description,
        category,
        imageUrl,
        steps: steps.filter((step) => step.trim()),
        ingredients,
        diets: dietaryTags,
        cooking_time: Number(cookingTime),
        servings: Number(servings),
      }

      console.log("Creating recipe with data:", recipeData)
      const recipe = await createRecipe(recipeData)
      console.log("Recipe created successfully:", recipe)
      toast.success("Recipe created successfully!")

      // Navigate to the recipe page
      if (recipe && recipe.id) {
        navigate(`/recipes/${recipe.id}`)
      } else {
        console.error("Recipe created but no ID returned")
        toast.error("Recipe created but could not navigate to it")
      }
    } catch (error) {
      console.error("Error creating recipe:", error)
      toast.error(`Failed to create recipe: ${error.message || "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.pageTitle}>Create Recipe</h2>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formLayout}>
          <div className={styles.formLeft}>
            <input
              type="text"
              id="recipe-name"
              placeholder="Recipe name"
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
              className={styles.input}
              required
            />

            <textarea
              id="description"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className={styles.textarea}
              required
            />

            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Cooking Time (minutes)</label>
                <input
                  type="number"
                  id="cooking-time"
                  value={cookingTime}
                  onChange={(e) => setCookingTime(e.target.value)}
                  className={styles.smallInput}
                  min="0"
                  required
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Servings</label>
                <input
                  type="number"
                  id="servings"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  className={styles.smallInput}
                  min="1"
                  required
                />
              </div>
            </div>

            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Gram</label>
                <input
                  type="number"
                  id="grams"
                  value={grams}
                  onChange={(e) => setGrams(e.target.value)}
                  className={styles.smallInput}
                  min="0"
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label} htmlFor="calories">
                  kcal per 100g
                </label>
                <input
                  type="number"
                  id="calories"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  className={styles.smallInput}
                  min="0"
                  step="0.1"
                  placeholder="Calories"
                />
              </div>
            </div>

            {apiLimitReached && (
              <div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke=" #f44336"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <span>API rate limit reached. Showing local ingredients only. Some features may be limited.</span>
              </div>
            )}

            <div className={`${styles.inputGroup} ${styles.ingredientSearch}`}>
              <label className={styles.label}>Search ingredient</label>
              <div className={styles.searchRow}>
                <input
                  type="text"
                  id="search-ingredient"
                  placeholder="Search or create new"
                  value={searchIngredientQuery}
                  onChange={(e) => setSearchIngredientQuery(e.target.value)}
                  className={styles.input}
                />
                <button
                  type="button"
                  className={styles.searchButton}
                  onClick={handleAddIngredient}
                  disabled={isCreatingIngredient || !searchIngredientQuery.trim() || !calories}
                >
                  {isCreatingIngredient ? "Creating..." : "Add Ingredient"}
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className={styles.searchResults}>
                  {searchResults.map((result) => (
                    <div
                      key={result.id}
                      className={styles.searchResultItem}
                      onClick={() => handleSelectIngredient(result)}
                    >
                      <div className={styles.resultContent}>
                        {result.name}
                        {result.calories ? (
                          result.caloriesNote ? (
                            `(${result.caloriesNote})`
                          ) : (
                            `(${result.calories} kcal/100g)`
                          )
                        ) : result.source === "spoonacular" ? (
                          <span className={styles.caloriesNote}>(calories will be available after selection)</span>
                        ) : (
                          ""
                        )}
                      </div>
                      {result.source === "spoonacular" && <div className={styles.resultSource}>Spoonacular</div>}
                      {result.source === "user" && <div className={styles.resultSource}>User</div>}
                    </div>
                  ))}
                </div>
              )}
              {searchIngredientQuery.trim().length > 0 && searchResults.length === 0 && (
                <div className={styles.searchResults}>
                  <div className={`${styles.searchResultItem} ${styles.noResults}`}>
                    No ingredients found. Enter calories to create a new one.
                  </div>
                </div>
              )}
            </div>

            <div className={styles.ingredientsList}>
              {ingredients.map((ingredient, index) => (
                <div key={index} className={styles.ingredientPill}>
                  {ingredient.name}
                  <br />
                  {ingredient.grams}g, {ingredient.caloriesNote || `${ingredient.calories} kcal/100g`}
                  {ingredient.source && (
                    <span className={styles.ingredientSource}>
                      {ingredient.source === "spoonacular" ? " (Spoonacular)" : " (User)"}
                    </span>
                  )}
                  <button type="button" className={styles.removeButton} onClick={() => handleRemoveIngredient(index)}>
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className={styles.inputRow}>
              <div className={`${styles.inputGroup} ${styles.ingredientSearch}`}>
                <label className={styles.label}>Select dietary restriction</label>
                <div className={styles.searchRow}>
                  <div className={styles.selectContainer} style={{ flex: 1 }}>
                    <select
                      id="diet"
                      value={selectedDietId}
                      onChange={(e) => setSelectedDietId(e.target.value)}
                      className={styles.select}
                    >
                      <option value="" disabled>
                        Select diet
                      </option>
                      {allDiets && allDiets.length > 0 ? (
                        allDiets.map((diet) => (
                          <option key={diet.id} value={diet.id}>
                            {diet.name}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>
                          Loading diets...
                        </option>
                      )}
                    </select>
                    <div className={styles.selectArrow}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M6 9L12 15L18 9"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                  <button type="button" className={styles.button} onClick={handleAddDietary} disabled={!selectedDietId}>
                    Add Dietary
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.dietaryTags}>
              {dietaryTags.map((tag, index) => (
                <div key={index} className={styles.dietaryTag}>
                  {tag.name}
                  <button type="button" className={styles.removeButton} onClick={() => handleRemoveDietary(index)}>
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className={styles.selectContainer}>
              <select
                id="category"
                value={category}
                onChange={(e) => {
                  const selectedCategoryId = e.target.value
                  console.log("Selected category ID:", selectedCategoryId)
                  setCategory(selectedCategoryId)
                }}
                className={styles.select}
                required
              >
                <option value="" disabled>
                  Select Category
                </option>
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="1">Breakfast</option>
                    <option value="2">Lunch</option>
                    <option value="3">Dinner</option>
                    <option value="4">Dessert</option>
                    <option value="5">Snack</option>
                  </>
                )}
              </select>
              <div className={styles.selectArrow}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M6 9L12 15L18 9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            {steps.map((step, index) => (
              <input
                key={index}
                type="text"
                id={`step-${index}`}
                placeholder={`Step ${index + 1}`}
                value={step}
                onChange={(e) => handleStepChange(index, e.target.value)}
                className={styles.input}
                required={index === 0} // At least first step is required
              />
            ))}

            <button type="button" className={styles.addStepButton} onClick={handleAddStep}>
              Add Step
            </button>
          </div>

          <div className={styles.formRight}>
            <input
              type="file"
              id="image-upload"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: "none" }}
            />
            <div className={styles.imagePlaceholder} onClick={handleImageUploadClick}>
              {image ? (
                <img src={image || "/placeholder.svg"} alt="Recipe" className={styles.recipeImage} />
              ) : (
                <button type="button" className={styles.addImageButton}>
                  Add Image
                </button>
              )}
            </div>
          </div>
        </div>

        <button type="submit" className={styles.submitButton} disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Recipe"}
        </button>
      </form>
    </div>
  )
}

export default CreateRecipe

