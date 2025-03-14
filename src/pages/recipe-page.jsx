import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router"
import toast from "react-hot-toast"
import styles from "../styles/recipe-page.module.css"
import globalStyles from "../styles/styles.module.css"
import { getRecipeById, deleteRecipe } from "../utils/supabase-recipe-page"
import supabase from "../utils/supabase"

const RecipePage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isCurrentUser, setIsCurrentUser] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    async function loadRecipe() {
      try {
        setLoading(true)
        const recipeData = await getRecipeById(id)
        console.log("Loaded recipe:", recipeData)
        setRecipe(recipeData)

        // Check if the current user is the owner of the recipe
        const { data } = await supabase.auth.getUser()
        if (data?.user && recipeData.user_id === data.user.id) {
          setIsCurrentUser(true)
        }
      } catch (err) {
        console.error("Failed to load recipe:", err)
        setError("Failed to load recipe. Please try again later.")
        toast.error("Failed to load recipe")
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadRecipe()
    }
  }, [id])

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
  }

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false)
  }

  const handleConfirmDelete = async () => {
    try {
      setDeleteLoading(true)
      await deleteRecipe(id)
      toast.success("Recipe deleted successfully")
      navigate("/")
    } catch (error) {
      console.error("Error deleting recipe:", error)
      toast.error("Failed to delete recipe")
      setDeleteLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  if (loading) {
    return (
      <div className={`${globalStyles.body} ${styles.container}`}>
        <div className={styles.loadingContainer}>
          <p>Loading recipe...</p>
        </div>
      </div>
    )
  }

  if (error || !recipe) {
    return (
      <div className={`${globalStyles.body} ${styles.container}`}>
        <div className={styles.errorContainer}>
          <h2>Error</h2>
          <p>{error || "Recipe not found"}</p>
          <button className={styles.orangeButton} onClick={() => navigate("/")}>
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  // Format ingredients from the recipe data
  const formattedIngredients = recipe.ingredients.map((item) => ({
    name: item.ingredients.name,
    amount: `${item.grams}g`,
    calories: item.ingredients.calories,
    grams: Number.parseFloat(item.grams),
  }))

  // Format dietary tags - using the same approach as ingredients
  const dietaryTags =
    recipe.diets && recipe.diets.length > 0 ? recipe.diets.map((item) => item.diets.name).filter(Boolean) : []

  // Get category name - now directly from the recipe object
  const categoryName = recipe.categoryName || "Uncategorized"

  // Calculate total calories
  const totalCalories = formattedIngredients.reduce((sum, ingredient) => {
    // Calculate calories for this ingredient: (calories per 100g * grams) / 100
    const ingredientCalories = (ingredient.calories * ingredient.grams) / 100
    return sum + ingredientCalories
  }, 0)

  // Calculate calories per serving
  const caloriesPerServing = recipe.servings ? Math.round(totalCalories / recipe.servings) : 0

  // Round total calories to whole number
  const roundedTotalCalories = Math.round(totalCalories)

  return (
    <div className={`${globalStyles.body} ${styles.container}`}>
      {isCurrentUser && (
        <div className={styles.recipeActions}>
          <button className={styles.deleteButton} onClick={handleDeleteClick}>
            Delete Recipe
          </button>
        </div>
      )}

      <div className={styles.recipeHero}>
        <img
          src={recipe.image_url || "/placeholder.svg?height=400&width=800"}
          alt={recipe.title}
          className={styles.recipeHeroImage}
        />
      </div>

      {/* The title wrapper div around the title, meta, and tags */}
      <div className={styles.recipeTitleWrapper}>
        <h1 className={styles.recipeTitle}>{recipe.title}</h1>

        <div className={styles.recipeMeta}>
          <span>Cooking Time: {recipe.cooking_time} minutes</span>
          <span>Serving: {recipe.servings} people</span>
          <span>Category: {categoryName}</span>
        </div>

        {dietaryTags.length > 0 && (
          <div className={styles.dietaryTagsContainer}>
            {dietaryTags.map((tag, index) => (
              <span key={index} className={styles.dietaryTag}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className={styles.recipeContent}>
        <div className={styles.leftColumn}>
          <div className={styles.caloriesSection}>
            <h2>Calories</h2>
            <ul className={styles.caloriesList}>
              <li>
                <span className={styles.calorieLabel}>Total Calories:</span>
                <span className={styles.calorieValue}>{roundedTotalCalories} kcal</span>
              </li>
              <li>
                <span className={styles.calorieLabel}>Per Serving:</span>
                <span className={styles.calorieValue}>{caloriesPerServing} kcal</span>
              </li>
            </ul>
          </div>

          <div className={styles.ingredientsSection}>
            <h2>Ingredients</h2>
            <ul className={styles.ingredientsList}>
              {formattedIngredients.map((ingredient, index) => (
                <li key={index}>
                  {ingredient.amount} {ingredient.name} ({ingredient.calories} kcal/100g)
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={styles.recipeDetails}>
          <div className={styles.descriptionSection}>
            <h2>Description</h2>
            <p>{recipe.description}</p>
          </div>

          <div className={styles.preparationSection}>
            <h2>Preparation</h2>
            <div className={styles.stepsList}>
              {recipe.steps.map((step, index) => (
                <div key={index} className={styles.stepItem}>
                  <span className={styles.stepNumber}>Step {index + 1}: </span>
                  <span className={styles.stepText}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Delete Recipe</h3>
            <p>Are you sure you want to delete this recipe? This action cannot be undone.</p>
            <div className={styles.modalActions}>
              <button className={styles.cancelButton} onClick={handleCancelDelete} disabled={deleteLoading}>
                Cancel
              </button>
              <button className={styles.confirmDelete} onClick={handleConfirmDelete} disabled={deleteLoading}>
                {deleteLoading ? "Deleting..." : "Delete Recipe"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RecipePage

