import { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import toast from "react-hot-toast"

import styles from "../styles/dashboard.module.css"
import sidebarStyles from "../styles/sidebar.module.css"
import RecipeCard from "../components/RecipeCard"
import supabase from "../utils/supabase"
import {
  fetchAllRecipes,
  fetchFavoriteRecipes,
  fetchAllDiets,
  fetchRecipesByDiets,
  fetchAllCategories,
  fetchRecipesByCategory,
} from "../utils/supabase-dashboard"

// Cooking time options for filtering
const cookingTimeOptions = [
  { label: "Quick (< 30 min)", value: 30 },
  { label: "Medium (30-60 min)", value: 60 },
  { label: "Long (> 60 min)", value: 61 },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [recipes, setRecipes] = useState([])
  const [filteredRecipes, setFilteredRecipes] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)

  // Category states
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState("All")
  const [activeCategoryId, setActiveCategoryId] = useState(null)

  // Diet states
  const [diets, setDiets] = useState([])
  const [selectedDietIds, setSelectedDietIds] = useState([])

  // Filter states
  const [selectedCookingTime, setSelectedCookingTime] = useState(null)
  const [showFavorites, setShowFavorites] = useState(false)

  // Fetch user session
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        setUser(data.session.user)
      }
    }

    getUser()
  }, [])

  // Fetch categories and diets
  useEffect(() => {
    const fetchFilters = async () => {
      // Fetch categories
      const categoriesData = await fetchAllCategories()
      // Add "All" to categories
      const allCategories = [{ id: null, name: "All" }, ...categoriesData]
      setCategories(allCategories)

      // Fetch diets
      const dietsData = await fetchAllDiets()
      setDiets(dietsData)
    }

    fetchFilters()
  }, [])

  // Fetch recipes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      // Fetch all recipes
      const recipesData = await fetchAllRecipes()
      setRecipes(recipesData)
      setFilteredRecipes(recipesData) // Initialize filtered recipes with all recipes

      setLoading(false)
    }

    fetchData()
  }, [])

  // Apply filters when category, search, or filters change
  useEffect(() => {
    const applyFilters = async () => {
      setLoading(true)

      let filtered = []

      // First, handle favorites filter
      if (showFavorites) {
        if (user) {
          const favorites = await fetchFavoriteRecipes(user.id)
          filtered = favorites
        } else {
          toast.error("Please sign in to view favorites")
          setShowFavorites(false)
          filtered = [...recipes]
        }
      } else {
        filtered = [...recipes]
      }

      // Then, handle category filter
      if (activeCategoryId) {
        // If we're already filtering by favorites, filter within those
        if (showFavorites) {
          filtered = filtered.filter((recipe) => recipe.category_id === activeCategoryId)
        } else {
          // Otherwise, get all recipes in this category
          const categoryRecipes = await fetchRecipesByCategory(activeCategoryId)
          filtered = categoryRecipes
        }
      }

      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        filtered = filtered.filter(
          (recipe) => recipe.title?.toLowerCase().includes(query) || recipe.description?.toLowerCase().includes(query),
        )
      }

      // Apply diet filters - Changed to OR logic
      if (selectedDietIds.length > 0) {
        // Get all recipes that have ANY of the selected diets
        const dietRecipes = await Promise.all(selectedDietIds.map((dietId) => fetchRecipesByDiets([dietId])))

        // Combine all recipes and remove duplicates
        const allDietRecipes = dietRecipes.flat()
        const uniqueDietRecipeIds = new Set(allDietRecipes.map((r) => r.id))

        // Find intersection with current filtered recipes
        filtered = filtered.filter((recipe) => uniqueDietRecipeIds.has(recipe.id))
      }

      // Apply cooking time filter
      if (selectedCookingTime) {
        filtered = filtered.filter((recipe) => {
          const cookingTime = Number.parseInt(recipe.cooking_time || recipe.prep_time || 0)

          if (selectedCookingTime === 30) {
            return cookingTime < 30
          } else if (selectedCookingTime === 60) {
            return cookingTime >= 30 && cookingTime <= 60
          } else {
            return cookingTime > 60
          }
        })
      }

      setFilteredRecipes(filtered)
      setLoading(false)
    }

    if (recipes.length > 0) {
      applyFilters()
    }
  }, [
    activeCategory,
    activeCategoryId,
    searchQuery,
    selectedDietIds,
    selectedCookingTime,
    showFavorites,
    recipes,
    user,
  ])

  // Handle category change
  const handleCategoryChange = (category) => {
    setActiveCategory(category.name)
    setActiveCategoryId(category.id)
  }

  // Handle dietary preference selection
  const handleDietaryChange = (dietId) => {
    setSelectedDietIds((prev) => {
      if (prev.includes(dietId)) {
        return prev.filter((id) => id !== dietId)
      } else {
        return [...prev, dietId]
      }
    })
  }

  // Toggle favorites
  const handleFavoritesToggle = () => {
    if (!user) {
      toast.error("Please sign in to view favorites")
      return
    }
    setShowFavorites(!showFavorites)
  }

  // Reset all filters
  const resetFilters = () => {
    setSelectedDietIds([])
    setSelectedCookingTime(null)
    setShowFavorites(false)
    setActiveCategory("All")
    setActiveCategoryId(null)
  }

  return (
    <div className={styles.container}>
      <div className={sidebarStyles.sidebar}>
        <div className={sidebarStyles.buttonContainer}>
          <button className={sidebarStyles.createButton} onClick={() => navigate("/create-recipe")}>
            Create Recipe
          </button>
        </div>

        <div className={sidebarStyles.filtersContainer}>
          <div className={sidebarStyles.filtersHeader}>
            <h2 className={sidebarStyles.filtersTitle}>FILTERS</h2>
            {(selectedDietIds.length > 0 || selectedCookingTime || showFavorites) && (
              <button className={sidebarStyles.resetButton} onClick={resetFilters}>
                Reset All
              </button>
            )}
          </div>

          {/* Favorites Filter - Custom styled button */}
          <h3 className={sidebarStyles.filterGroupTitle}>View</h3>
          <div className={sidebarStyles.filtersList}>
            <button
              className={`${sidebarStyles.favoriteButton} ${showFavorites ? sidebarStyles.favoriteActive : ""}`}
              onClick={handleFavoritesToggle}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill={showFavorites ? "#ff5722" : "none"}
                stroke={showFavorites ? "#ff5722" : "currentColor"}
                strokeWidth="2"
                className={sidebarStyles.favoriteIcon}
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              Favorites Only
            </button>
          </div>

          {/* Dietary Preferences */}
          <h3 className={sidebarStyles.filterGroupTitle}>Dietary Preferences</h3>
          <div className={sidebarStyles.filtersList}>
            {diets.map((diet) => (
              <div key={diet.id} className={sidebarStyles.filterItem}>
                <input
                  type="checkbox"
                  id={`diet-${diet.id}`}
                  className={sidebarStyles.checkbox}
                  checked={selectedDietIds.includes(diet.id)}
                  onChange={() => handleDietaryChange(diet.id)}
                />
                <label htmlFor={`diet-${diet.id}`} className={sidebarStyles.filterLabel}>
                  {diet.name}
                </label>
              </div>
            ))}
          </div>

          {/* Cooking Time */}
          <h3 className={sidebarStyles.filterGroupTitle}>Cooking Time</h3>
          <div className={sidebarStyles.filtersList}>
            {cookingTimeOptions.map((option) => (
              <div key={option.value} className={sidebarStyles.filterItem}>
                <input
                  type="radio"
                  id={`time-${option.value}`}
                  name="cooking-time"
                  className={sidebarStyles.radio}
                  checked={selectedCookingTime === option.value}
                  onChange={() => setSelectedCookingTime(option.value)}
                />
                <label htmlFor={`time-${option.value}`} className={sidebarStyles.filterLabel}>
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.fixedHeader}>
          <div className={styles.searchContainer}>
            <div className={styles.searchWrapper}>
              <input
                type="text"
                placeholder="Search"
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <svg
                className={styles.searchIcon}
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          <div className={styles.feedHeader}>
            <h1 className={styles.feedTitle}>Feed</h1>

            <div className={styles.categoryTabs}>
              {/* Using categories from database */}
              {categories.map((category) => (
                <button
                  key={category.id || category.name}
                  className={`
                    ${styles.categoryTab} 
                    ${activeCategory === category.name ? styles.activeTab : ""}
                  `}
                  onClick={() => handleCategoryChange(category)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.recipeListContainer}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <p>Loading recipes...</p>
            </div>
          ) : filteredRecipes.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No recipes found. Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <div className={styles.recipeList}>
              {filteredRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

