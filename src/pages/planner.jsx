"use client"

import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import toast from "react-hot-toast"
import styles from "../styles/supabase-planner.module.css"
import sidebarStyles from "../styles/sidebar.module.css"
import supabase from "../utils/supabase"
import { fetchAllRecipes, fetchAllDiets, fetchAllCategories } from "../utils/supabase-dashboard"
import { generateMealPlan, generateShoppingList } from "../utils/supabase-planner"

// Replace the meal types constants
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

  // Generate meal plan
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

      // Debug: Check if recipes have ingredient data
      console.log("Sample recipe:", filteredRecipes[0])

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

      setMealPlan(plan)

      // Generate shopping list based on the plan
      const list = generateShoppingList(plan)

      // Debug: Check if the shopping list is empty
      console.log("Generated shopping list:", list)
      console.log("Shopping list keys:", Object.keys(list))
      console.log(
        "Shopping list categories:",
        Object.keys(list).map((category) => {
          return {
            category,
            itemCount: list[category].length,
            items: list[category].slice(0, 3), // Show first 3 items for debugging
          }
        }),
      )

      setShoppingList(list)

      toast.success("Meal plan successfully created!")
    } catch (error) {
      console.error("Error generating meal plan:", error)
      toast.error("Failed to create meal plan")
    } finally {
      setGenerating(false)
    }
  }

  // Save meal plan
  const handleSavePlan = async () => {
    if (!user || !mealPlan) return

    try {
      const { error } = await supabase.from("meal_plans").insert({
        user_id: user.id,
        plan_data: mealPlan,
        created_at: new Date().toISOString(),
      })

      if (error) throw error
      toast.success("Meal plan saved!")
    } catch (error) {
      console.error("Error saving meal plan:", error)
      toast.error("Failed to save meal plan")
    }
  }

  // Toggle shopping list display
  const toggleShoppingList = () => {
    setShowShoppingList(!showShoppingList)
  }

  // Navigate to recipe
  const navigateToRecipe = (recipeId) => {
    navigate(`/recipes/${recipeId}`)
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
                <button className={styles.actionButton} onClick={handleSavePlan}>
                  Save Plan
                </button>
              </div>
            </div>

            {showShoppingList ? (
              <div className={styles.shoppingList}>
                <h3 className={styles.shoppingListTitle}>Shopping List</h3>
                {shoppingList && shoppingList.Ingredients && (
                  <div className={styles.shoppingCategory}>
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
                                    <div className={styles.recipeCard} onClick={() => navigateToRecipe(meal.id)}>
                                      <div className={styles.recipeImageContainer}>
                                        <img
                                          src={meal.image_url || "/placeholder.svg"}
                                          alt={meal.title}
                                          className={styles.recipeImage}
                                        />
                                      </div>
                                      <div className={styles.recipeInfo}>
                                        <h5 className={styles.recipeTitle}>{meal.title}</h5>
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
              <div className={styles.emptyStateImage}>
                <img src="/placeholder.svg" alt="Meal planning" width={300} height={200} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

