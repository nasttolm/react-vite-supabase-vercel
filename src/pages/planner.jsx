"use client"

import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import toast from "react-hot-toast"
import styles from "../styles/planner.module.css"
import sidebarStyles from "../styles/sidebar.module.css"
import supabase from "../utils/supabase"
import { fetchAllRecipes, fetchAllDiets, fetchAllCategories, isRecipeFavorited } from "../utils/supabase-dashboard"
import { generateMealPlan, generateShoppingList } from "../utils/supabase-planner"
import { getRecipeById } from "../utils/supabase-recipe-page"
import { fetchSavedMealPlans, deleteMealPlan } from "../utils/supabase-meal-plans"

// Days of week constants
const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

export default function SupabasePlanner() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [mealPlan, setMealPlan] = useState(null)
  const [shoppingList, setShoppingList] = useState(null)
  const [showShoppingList, setShowShoppingList] = useState(false)
  const [favoriteRecipes, setFavoriteRecipes] = useState({}) // Add state to store favorite recipes

  // Add state for plan name
  const [planName, setPlanName] = useState("My Meal Plan")
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saving, setSaving] = useState(false)

  // Saved plans states
  const [showSavedPlans, setShowSavedPlans] = useState(false)
  const [savedPlans, setSavedPlans] = useState([])
  const [loadingSavedPlans, setLoadingSavedPlans] = useState(false)

  // Filters for generation
  const [diets, setDiets] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedDietIds, setSelectedDietIds] = useState([])
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [maxCookingTime, setMaxCookingTime] = useState(null)
  const [servingsCount, setServingsCount] = useState(2)
  const [mealsPerDay, setMealsPerDay] = useState(3)

  // Update the plan settings state to handle category counts instead of fixed meal types
  const [planSettings, setPlanSettings] = useState({
    selectedCategories: {},
    daysToGenerate: 7,
  })

  // Get user data
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        setUser(data.session.user)
      }
    }

    getUser()
  }, [])

  // Load recipes, diets and categories
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [recipesData, dietsData, categoriesData] = await Promise.all([
          fetchAllRecipes(),
          fetchAllDiets(),
          fetchAllCategories(),
        ])

        setRecipes(recipesData)
        setDiets(dietsData)
        setCategories([{ id: null, name: "All categories" }, ...categoriesData])
      } catch (error) {
        console.error("Error loading data:", error)
        toast.error("Failed to load data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Check if a recipe is in favorites
  const checkIfFavorite = async (recipeId) => {
    if (!user) return false

    // If we already have information about this recipe in state, use it
    if (favoriteRecipes[recipeId] !== undefined) {
      return favoriteRecipes[recipeId]
    }

    try {
      const isFavorite = await isRecipeFavorited(user.id, recipeId)

      // Update state
      setFavoriteRecipes((prev) => ({
        ...prev,
        [recipeId]: isFavorite,
      }))

      return isFavorite
    } catch (error) {
      console.error("Error checking if recipe is favorited:", error)
      return false
    }
  }

  // Filter change handlers
  const handleDietToggle = (dietId) => {
    setSelectedDietIds((prev) => {
      if (prev.includes(dietId)) {
        return prev.filter((id) => id !== dietId)
      } else {
        return [...prev, dietId]
      }
    })
  }

  const handleCategoryChange = (categoryId) => {
    setSelectedCategoryId(categoryId)
  }

  const handleCookingTimeChange = (time) => {
    setMaxCookingTime(time)
  }

  const handleServingsChange = (e) => {
    const value = Number.parseInt(e.target.value)
    if (!isNaN(value) && value > 0) {
      setServingsCount(value)
    }
  }

  const handleMealsPerDayChange = (value) => {
    setMealsPerDay(value)

    // Update plan settings based on meals per day
    if (value === 1) {
      setPlanSettings({
        ...planSettings,
        includeBreakfast: false,
        includeLunch: false,
        includeDinner: true,
      })
    } else if (value === 2) {
      setPlanSettings({
        ...planSettings,
        includeBreakfast: true,
        includeLunch: false,
        includeDinner: true,
      })
    } else {
      setPlanSettings({
        ...planSettings,
        includeBreakfast: true,
        includeLunch: true,
        includeDinner: true,
      })
    }
  }

  const handlePlanSettingChange = (setting, value) => {
    setPlanSettings((prev) => ({
      ...prev,
      [setting]: value,
    }))

    // Update meals per day based on selected settings
    if (setting.startsWith("include")) {
      const newIncludeCount = Object.entries({
        ...planSettings,
        [setting]: value,
      }).filter(([key, val]) => key.startsWith("include") && val).length

      setMealsPerDay(newIncludeCount)
    }
  }

  // Add this function to fetch complete recipe data with ingredients
  const fetchRecipeWithIngredients = async (recipeId, servings, defaultServings) => {
    try {
      const recipeData = await getRecipeById(recipeId)
      if (recipeData) {
        return {
          ...recipeData,
          servings: servings,
          default_servings: defaultServings || recipeData.servings || 2,
        }
      }
      return null
    } catch (error) {
      console.error("Error fetching recipe with ingredients:", error)
      return null
    }
  }

  // Update the handleGeneratePlan function to fetch complete recipe data
  const handleGeneratePlan = async () => {
    if (!user) {
      toast.error("Please sign in to create a meal plan")
      return
    }

    setGenerating(true)
    setShowShoppingList(false)

    try {
      // Filter recipes by selected criteria
      let filteredRecipes = [...recipes]

      // Apply diet filter
      if (selectedDietIds.length > 0) {
        filteredRecipes = filteredRecipes.filter((recipe) => {
          const recipeDietIds = recipe.diets?.map((diet) => diet.id) || []
          return selectedDietIds.every((dietId) => recipeDietIds.includes(dietId))
        })
      }

      // Apply cooking time filter
      if (maxCookingTime) {
        filteredRecipes = filteredRecipes.filter((recipe) => {
          const cookingTime = Number.parseInt(recipe.cooking_time || recipe.prep_time || 0)
          return cookingTime <= maxCookingTime
        })
      }

      if (filteredRecipes.length === 0) {
        toast.error("No recipes match your selected criteria")
        setGenerating(false)
        return
      }

      // Group recipes by category
      const recipesByCategory = {}

      // Check if any categories are selected
      const selectedCategoryIds = Object.keys(planSettings.selectedCategories)
        .filter((id) => planSettings.selectedCategories[id] > 0)
        .map((id) => Number.parseInt(id))

      if (selectedCategoryIds.length === 0) {
        toast.error("Please select at least one category")
        setGenerating(false)
        return
      }

      // Create recipe pools for each selected category
      selectedCategoryIds.forEach((categoryId) => {
        const categoryRecipes = filteredRecipes.filter((recipe) => recipe.category_id === categoryId)
        if (categoryRecipes.length > 0) {
          recipesByCategory[categoryId] = categoryRecipes
        }
      })

      // If some categories have no recipes, use all recipes for those categories
      selectedCategoryIds.forEach((categoryId) => {
        if (!recipesByCategory[categoryId] || recipesByCategory[categoryId].length === 0) {
          recipesByCategory[categoryId] = filteredRecipes
        }
      })

      // Generate meal plan with the new category-based approach
      const plan = generateMealPlan({
        recipesByCategory,
        daysCount: planSettings.daysToGenerate,
        categorySettings: planSettings.selectedCategories,
        servingsCount,
      })

      // Fetch complete recipe data with ingredients for each recipe in the plan
      const planWithIngredients = [...plan]

      // For each day in the plan
      for (let dayIndex = 0; dayIndex < planWithIngredients.length; dayIndex++) {
        const day = planWithIngredients[dayIndex]

        // For each category in the day
        for (const [categoryId, meals] of Object.entries(day)) {
          // For each meal in the category
          for (let mealIndex = 0; mealIndex < meals.length; mealIndex++) {
            if (meals[mealIndex]) {
              // Fetch complete recipe data with ingredients
              const completeRecipe = await fetchRecipeWithIngredients(
                meals[mealIndex].id,
                meals[mealIndex].servings,
                meals[mealIndex].default_servings,
              )
              if (completeRecipe) {
                // Replace the recipe with the complete data
                planWithIngredients[dayIndex][categoryId][mealIndex] = {
                  ...completeRecipe,
                  servings: meals[mealIndex].servings,
                  default_servings: meals[mealIndex].default_servings,
                }
              }
            }
          }
        }
      }

      setMealPlan(planWithIngredients)

      // Generate shopping list based on the plan with complete recipe data
      const list = generateShoppingList(planWithIngredients)
      setShoppingList(list)

      toast.success("Meal plan successfully created!")
    } catch (error) {
      console.error("Error generating meal plan:", error)
      toast.error("Failed to create meal plan")
    } finally {
      setGenerating(false)
    }
  }

  // Show save dialog
  const openSaveDialog = () => {
    if (!user || !mealPlan) {
      toast.error("Please generate a meal plan first")
      return
    }

    setPlanName("My Meal Plan")
    setShowSaveDialog(true)
  }

  // Save meal plan
  const handleSavePlan = async () => {
    if (!user || !mealPlan) {
      toast.error("Please generate a meal plan first")
      return
    }

    setSaving(true)

    try {
      const { error } = await supabase.from("meal_plans").insert({
        user_id: user.id,
        plan_data: mealPlan,
        shopping_list: shoppingList,
        created_at: new Date().toISOString(),
      })

      if (error) throw error

      setShowSaveDialog(false)
      toast.success("Meal plan saved!")
    } catch (error) {
      console.error("Error saving meal plan:", error)
      toast.error("Failed to save meal plan")
    } finally {
      setSaving(false)
    }
  }

  // Load saved plans
  const loadSavedPlans = async () => {
    if (!user) {
      toast.error("Please sign in to view saved plans")
      return
    }

    setLoadingSavedPlans(true)
    try {
      const plans = await fetchSavedMealPlans(user.id)
      setSavedPlans(plans)
      setShowSavedPlans(true)
    } catch (error) {
      console.error("Error loading saved plans:", error)
      toast.error("Failed to load saved plans")
    } finally {
      setLoadingSavedPlans(false)
    }
  }

  // Load a specific saved plan
  const loadSavedPlan = async (plan) => {
    try {
      setLoading(true)
      setShowSavedPlans(false)

      // Set the plan data
      setMealPlan(plan.plan_data)
      setShoppingList(plan.shopping_list)
      setPlanName(plan.name)

      // Reset the shopping list view to show the plan first
      setShowShoppingList(false)

      // Update plan settings based on the loaded plan
      if (plan.plan_data && plan.plan_data.length > 0) {
        // Set days to generate
        setPlanSettings((prev) => ({
          ...prev,
          daysToGenerate: plan.plan_data.length,
        }))

        // Set selected categories
        const selectedCategories = {}
        const firstDay = plan.plan_data[0]

        if (firstDay) {
          Object.entries(firstDay).forEach(([categoryId, meals]) => {
            selectedCategories[categoryId] = meals.length
          })

          setPlanSettings((prev) => ({
            ...prev,
            selectedCategories,
          }))
        }
      }

      toast.success("Plan loaded successfully!")
    } catch (error) {
      console.error("Error loading saved plan:", error)
      toast.error("Failed to load saved plan")
    } finally {
      setLoading(false)
    }
  }

  // Delete a saved plan
  const handleDeletePlan = async (planId) => {
    if (!confirm("Are you sure you want to delete this plan?")) {
      return
    }

    try {
      await deleteMealPlan(planId)
      setSavedPlans(savedPlans.filter((plan) => plan.id !== planId))
      toast.success("Plan deleted successfully!")
    } catch (error) {
      console.error("Error deleting plan:", error)
      toast.error("Failed to delete plan")
    } finally {
      setLoading(false)
    }
  }

  // Toggle shopping list display
  const toggleShoppingList = () => {
    setShowShoppingList(!showShoppingList)
  }

  // Navigate to recipe with servings information
  const navigateToRecipe = (recipeId, servings) => {
    // Pass servings count as a query parameter
    navigate(`/recipes/${recipeId}?servings=${servings}`)
  }

  // Loading state
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={sidebarStyles.sidebar}>
          <div className={sidebarStyles.buttonContainer}>
            <h2 className={sidebarStyles.plannerTitle}>Meal Planner</h2>
          </div>
        </div>
        <div className={styles.mainContent}>
          <div className={styles.loadingContainer}>
            <p>Loading data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* Sidebar with filters */}
      <div className={sidebarStyles.sidebar}>
        <div className={sidebarStyles.buttonContainer}>
          <h2 className={sidebarStyles.plannerTitle}>Meal Planner</h2>
          <div className={styles.savedPlansButtonContainer} style={{ marginTop: "12px" }}>
            <button className={styles.savedPlansButton} onClick={loadSavedPlans} disabled={!user}>
              View Saved Plans
            </button>
          </div>
        </div>

        <div className={sidebarStyles.filtersContainer}>
          <div className={sidebarStyles.filtersHeader}>
            <h2 className={sidebarStyles.filtersTitle}>PLAN SETTINGS</h2>
          </div>

          {/* Categories */}
          <h3 className={sidebarStyles.filterGroupTitle}>Categories</h3>
          <div className={sidebarStyles.filtersList}>
            {categories.map((category) => (
              <div key={category.id || "all"} className={sidebarStyles.filterItem}>
                {category.id && (
                  <>
                    <input
                      type="checkbox"
                      id={`meal-category-${category.id}`}
                      className={sidebarStyles.checkbox}
                      checked={!!planSettings.selectedCategories[category.id]}
                      onChange={(e) => {
                        setPlanSettings((prev) => ({
                          ...prev,
                          selectedCategories: {
                            ...prev.selectedCategories,
                            [category.id]: e.target.checked ? 1 : 0,
                          },
                        }))
                      }}
                    />
                    <label htmlFor={`meal-category-${category.id}`} className={sidebarStyles.filterLabel}>
                      {category.name}
                    </label>

                    {planSettings.selectedCategories[category.id] && (
                      <div className={styles.categoryCountContainer}>
                        <label className={styles.categoryCountLabel}>Per day:</label>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          value={planSettings.selectedCategories[category.id] || 1}
                          onChange={(e) => {
                            const value = Number.parseInt(e.target.value) || 1
                            setPlanSettings((prev) => ({
                              ...prev,
                              selectedCategories: {
                                ...prev.selectedCategories,
                                [category.id]: value,
                              },
                            }))
                          }}
                          className={styles.categoryCountInput}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          <h3 className={sidebarStyles.filterGroupTitle}>Number of Days</h3>
          <div className={sidebarStyles.filtersList}>
            <div className={sidebarStyles.filterItem}>
              <input
                type="radio"
                id="days-3"
                name="days-count"
                className={sidebarStyles.radio}
                checked={planSettings.daysToGenerate === 3}
                onChange={() => handlePlanSettingChange("daysToGenerate", 3)}
              />
              <label htmlFor="days-3" className={sidebarStyles.filterLabel}>
                3 days
              </label>
            </div>
            <div className={sidebarStyles.filterItem}>
              <input
                type="radio"
                id="days-5"
                name="days-count"
                className={sidebarStyles.radio}
                checked={planSettings.daysToGenerate === 5}
                onChange={() => handlePlanSettingChange("daysToGenerate", 5)}
              />
              <label htmlFor="days-5" className={sidebarStyles.filterLabel}>
                5 days
              </label>
            </div>
            <div className={sidebarStyles.filterItem}>
              <input
                type="radio"
                id="days-7"
                name="days-count"
                className={sidebarStyles.radio}
                checked={planSettings.daysToGenerate === 7}
                onChange={() => handlePlanSettingChange("daysToGenerate", 7)}
              />
              <label htmlFor="days-7" className={sidebarStyles.filterLabel}>
                7 days
              </label>
            </div>
          </div>

          <h3 className={sidebarStyles.filterGroupTitle}>Servings</h3>
          <div className={sidebarStyles.servingsFilter}>
            <input
              type="number"
              min="1"
              max="10"
              value={servingsCount}
              onChange={handleServingsChange}
              className={sidebarStyles.servingsInput}
            />
          </div>

          {/* Dietary preferences */}
          <h3 className={sidebarStyles.filterGroupTitle}>Dietary Preferences</h3>
          <div className={styles.dietTags}>
            {diets.map((diet) => (
              <div
                key={diet.id}
                className={`${styles.dietTag} ${selectedDietIds.includes(diet.id) ? styles.selected : ""}`}
                onClick={() => handleDietToggle(diet.id)}
              >
                {diet.name}
              </div>
            ))}
          </div>

          {/* Cooking time */}
          <h3 className={sidebarStyles.filterGroupTitle}>Cooking Time</h3>
          <div className={sidebarStyles.filtersList}>
            <div className={sidebarStyles.filterItem}>
              <input
                type="radio"
                id="time-any"
                name="cooking-time"
                className={sidebarStyles.radio}
                checked={maxCookingTime === null}
                onChange={() => handleCookingTimeChange(null)}
              />
              <label htmlFor="time-any" className={sidebarStyles.filterLabel}>
                Any time
              </label>
            </div>
            <div className={sidebarStyles.filterItem}>
              <input
                type="radio"
                id="time-30"
                name="cooking-time"
                className={sidebarStyles.radio}
                checked={maxCookingTime === 30}
                onChange={() => handleCookingTimeChange(30)}
              />
              <label htmlFor="time-30" className={sidebarStyles.filterLabel}>
                Under 30 minutes
              </label>
            </div>
            <div className={sidebarStyles.filterItem}>
              <input
                type="radio"
                id="time-60"
                name="cooking-time"
                className={sidebarStyles.radio}
                checked={maxCookingTime === 60}
                onChange={() => handleCookingTimeChange(60)}
              />
              <label htmlFor="time-60" className={sidebarStyles.filterLabel}>
                Under 60 minutes
              </label>
            </div>
          </div>

          {/* Generate button */}
          <div className={styles.generateButtonContainer}>
            <button className={styles.generateButton} onClick={handleGeneratePlan} disabled={generating}>
              {generating ? "Generating..." : "Create Meal Plan"}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={styles.mainContent}>
        <div className={styles.header}>
          <h1 className={styles.title}>Meal Planner</h1>
          <p className={styles.subtitle}>Create a personalized meal plan based on your preferences</p>
        </div>

        {mealPlan ? (
          <div className={styles.planContainer}>
            <div className={styles.planHeader}>
              <h2 className={styles.planTitle}>Your {planSettings.daysToGenerate}-day Meal Plan</h2>
              <div className={styles.planActions}>
                <button className={styles.actionButton} onClick={toggleShoppingList}>
                  {showShoppingList ? "Show Plan" : "Shopping List"}
                </button>
                <button className={styles.actionButton} onClick={openSaveDialog}>
                  Save Plan
                </button>
              </div>
            </div>

            {showShoppingList ? (
              <div className={styles.shoppingList}>
                <h3 className={styles.shoppingListTitle}>Shopping List</h3>
                {shoppingList && shoppingList.Ingredients && (
                  <div className={styles.shoppingCategory}>
                    <h4 className={styles.categoryTitle}>Ingredients</h4>
                    <ul className={styles.ingredientsList}>
                      {shoppingList.Ingredients.map((item, index) => (
                        <li key={index} className={styles.ingredientItem}>
                          <span className={styles.ingredientName}>{item.name}</span>
                          <span className={styles.ingredientAmount}>
                            {item.amount} {item.unit}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.weekPlan}>
                {DAYS_OF_WEEK.slice(0, planSettings.daysToGenerate).map((day, dayIndex) => (
                  <div key={day} className={styles.dayPlan}>
                    <h3 className={styles.dayTitle}>{day}</h3>
                    <div className={styles.meals}>
                      {mealPlan[dayIndex] &&
                        Object.entries(mealPlan[dayIndex]).map(([categoryId, meals]) => (
                          <React.Fragment key={categoryId}>
                            {meals.map((meal, mealIndex) => {
                              const category = categories.find((c) => c.id === Number.parseInt(categoryId))
                              return (
                                <div key={`${categoryId}-${mealIndex}`} className={styles.meal}>
                                  <h4 className={styles.mealTitle}>
                                    {category ? category.name : "Meal"} {meals.length > 1 ? mealIndex + 1 : ""}
                                  </h4>
                                  {meal ? (
                                    <div
                                      className={styles.recipeCard}
                                      onClick={() => navigateToRecipe(meal.id, meal.servings)}
                                    >
                                      <div className={styles.recipeImageContainer}>
                                        <img
                                          src={meal.image_url || "/placeholder.svg"}
                                          alt={meal.title}
                                          className={styles.recipeImage}
                                        />
                                        {/* Debug information */}
                                        {console.log("Meal favorited status:", meal.id, meal.isFavorited)}
                                      </div>
                                      <div className={styles.recipeInfo}>
                                        <h5 className={styles.recipeTitle}>
                                          {meal.title}
                                          {meal.isFavorited && (
                                            <svg
                                              width="16"
                                              height="16"
                                              viewBox="0 0 24 24"
                                              fill="#ff5722"
                                              stroke="#ff5722"
                                              strokeWidth="2"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              className={styles.titleFavoriteIcon}
                                            >
                                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                            </svg>
                                          )}
                                        </h5>
                                        <p className={styles.recipeTime}>{meal.cooking_time || "30"} min</p>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className={styles.noMeal}>No recipe</p>
                                  )}
                                </div>
                              )
                            })}
                          </React.Fragment>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateContent}>
              <h2 className={styles.emptyStateTitle}>Create Your Meal Plan</h2>
              <p className={styles.emptyStateDescription}>
                Configure parameters in the sidebar and click "Create Meal Plan"
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Simple Save Dialog */}
      {showSaveDialog && (
        <div className={styles.saveDialog}>
          <div className={styles.saveDialogContent}>
            <h3 className={styles.saveDialogTitle}>Save Meal Plan</h3>
            <div className={styles.saveDialogForm}>
              <label htmlFor="planName" className={styles.saveDialogLabel}>
                Plan Name:
              </label>
              <input
                type="text"
                id="planName"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                className={styles.saveDialogInput}
              />
            </div>
            <div className={styles.saveDialogActions}>
              <button className={styles.saveDialogCancel} onClick={() => setShowSaveDialog(false)}>
                Cancel
              </button>
              <button className={styles.saveDialogSave} onClick={handleSavePlan} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saved Plans Modal */}
      {showSavedPlans && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Saved Meal Plans</h3>

            {loadingSavedPlans ? (
              <div className={styles.loadingContainer}>
                <p>Loading saved plans...</p>
              </div>
            ) : savedPlans.length === 0 ? (
              <div className={styles.noSavedPlans}>
                <p>You don't have any saved meal plans yet.</p>
              </div>
            ) : (
              <div className={styles.savedPlansList}>
                {savedPlans.map((plan) => (
                  <div key={plan.id} className={styles.savedPlanItem} onClick={() => loadSavedPlan(plan)}>
                    <div className={styles.savedPlanInfo}>
                      <h4 className={styles.savedPlanName}>{plan.name}</h4>
                      <div className={styles.savedPlanMeta}>
                        <span className={styles.savedPlanDate}>{new Date(plan.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className={styles.savedPlanActions} onClick={(e) => e.stopPropagation()}>
                      <button
                        className={styles.savedPlanActionButton}
                        onClick={() => handleDeletePlan(plan.id)}
                        title="Delete Plan"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.modalActions}>
              <button className={styles.closeButton} onClick={() => setShowSavedPlans(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

