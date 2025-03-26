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
  fetchRecipesByAuthorNickname,
  fetchMyRecipes,
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
  const [showMyRecipes, setShowMyRecipes] = useState(false)

  const [authorNickname, setAuthorNickname] = useState("")

  // Debug state to help troubleshoot
  const [debugInfo, setDebugInfo] = useState({
    userId: null,
    myRecipesCount: 0,
    favoritesCount: 0,
  })

  // Fetch user session
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        setUser(data.session.user)
        setDebugInfo((prev) => ({ ...prev, userId: data.session.user.id }))

        // Log user info for debugging
        console.log("User session:", data.session.user)
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

  useEffect(() => {
    const applyFilters = async () => {
      setLoading(true)

      let filtered = [...recipes] // Start with all recipes
      let appliedFilters = false

      // Author nickname filter
      if (authorNickname.trim()) {
        const authorRecipes = await fetchRecipesByAuthorNickname(authorNickname)
        filtered = authorRecipes
        appliedFilters = true
      }

      // My Recipes filter
      let myRecipes = []
      if (showMyRecipes && user) {
        myRecipes = await fetchMyRecipes(user.id)
        console.log("My recipes:", myRecipes) // Debug log
        setDebugInfo((prev) => ({ ...prev, myRecipesCount: myRecipes.length }))

        if (!appliedFilters) {
          filtered = myRecipes
        } else {
          // If we already applied filters, find intersection
          const myRecipeIds = new Set(myRecipes.map((r) => r.id))
          filtered = filtered.filter((recipe) => myRecipeIds.has(recipe.id))
        }
        appliedFilters = true
      }

      // Favorites filter
      let favorites = []
      if (showFavorites && user) {
        favorites = await fetchFavoriteRecipes(user.id)
        console.log("Favorites:", favorites) // Debug log
        setDebugInfo((prev) => ({ ...prev, favoritesCount: favorites.length }))

        if (!appliedFilters) {
          filtered = favorites
        } else {
          // If we already applied filters, find union with current filtered recipes
          const filteredIds = new Set(filtered.map((r) => r.id))
          const uniqueFavorites = favorites.filter((recipe) => !filteredIds.has(recipe.id))
          filtered = [...filtered, ...uniqueFavorites]
        }
        appliedFilters = true
      }

      // Category filter
      if (activeCategoryId) {
        if (appliedFilters) {
          // Filter within current results
          filtered = filtered.filter((recipe) => recipe.category_id === activeCategoryId)
        } else {
          // Get all recipes in this category
          const categoryRecipes = await fetchRecipesByCategory(activeCategoryId)
          filtered = categoryRecipes
          appliedFilters = true
        }
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        filtered = filtered.filter(
          (recipe) => recipe.title?.toLowerCase().includes(query) || recipe.description?.toLowerCase().includes(query),
        )
      }

      // Diet filters
      if (selectedDietIds.length > 0) {
        // Get all recipes that have ANY of the selected diets
        const dietRecipes = await Promise.all(selectedDietIds.map((dietId) => fetchRecipesByDiets([dietId])))

        // Combine all recipes and remove duplicates
        const allDietRecipes = dietRecipes.flat()
        const uniqueDietRecipeIds = new Set(allDietRecipes.map((r) => r.id))

        // Find intersection with current filtered recipes
        filtered = filtered.filter((recipe) => uniqueDietRecipeIds.has(recipe.id))
      }

      // Cooking time filter
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

    // Only apply recipe filters if we're searching for recipes
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
    showMyRecipes,
    recipes,
    user,
    authorNickname,
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

  // Toggle favorites - now doesn't affect My Recipes
  const handleFavoritesToggle = () => {
    if (!user) {
      toast.error("Please sign in to view favorites")
      return
    }
    setShowFavorites(!showFavorites)
  }

  // Toggle my recipes - now doesn't affect Favorites
  const handleMyRecipesToggle = () => {
    if (!user) {
      toast.error("Please sign in to view your recipes")
      return
    }
    setShowMyRecipes(!showMyRecipes)
  }

  const handleAuthorNicknameChange = (e) => {
    setAuthorNickname(e.target.value)
  }

  const clearAuthorFilter = () => {
    setAuthorNickname("")
  }

  // Update the resetFilters function
  const resetFilters = () => {
    setSelectedDietIds([])
    setSelectedCookingTime(null)
    setShowFavorites(false)
    setShowMyRecipes(false)
    setActiveCategory("All")
    setActiveCategoryId(null)
    setAuthorNickname("")
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
            {(selectedDietIds.length > 0 || selectedCookingTime || showFavorites || showMyRecipes) && (
              <button className={sidebarStyles.resetButton} onClick={resetFilters}>
                Reset All
              </button>
            )}
          </div>

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

            <button
              className={`${sidebarStyles.favoriteButton} ${showMyRecipes ? sidebarStyles.favoriteActive : ""}`}
              onClick={handleMyRecipesToggle}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill={showMyRecipes ? "#ff5722" : "none"}
                stroke={showMyRecipes ? "#ff5722" : "currentColor"}
                strokeWidth="2"
                className={sidebarStyles.favoriteIcon}
              >
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z"></path>
              </svg>
              My Recipes
            </button>
          </div>

          {}
          <h3 className={sidebarStyles.filterGroupTitle}>Author</h3>
          <div className={sidebarStyles.filtersList}>
            <div className={sidebarStyles.authorSearchContainer}>
              <input
                type="text"
                placeholder="Search by nickname..."
                value={authorNickname}
                onChange={handleAuthorNicknameChange}
                className={sidebarStyles.servingsInput}
              />
              {authorNickname && (
                <button
                  onClick={clearAuthorFilter}
                  className={sidebarStyles.clearAuthorButton}
                  aria-label="Clear author filter"
                >
                  ×
                </button>
              )}
            </div>
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
                placeholder="Search recipes..."
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
              {/* Debug info */}
              {process.env.NODE_ENV === "development" && (
                <div style={{ marginTop: "20px", fontSize: "12px", color: "#666", textAlign: "left" }}>
                  <p>Debug Info:</p>
                  <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
                </div>
              )}
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

