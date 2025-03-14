import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router"
import toast from "react-hot-toast"
import "../styles/recipe-page-styles.css"
import "../styles/styles.css"
import Logo_big from "../../public/Logo_big.svg"
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
      <div className="recipe-container">
        <div className="logo-container">
          <div className="logo">
            <img src={Logo_big || "/placeholder.svg"} alt="SafeBites" className="logo-image" />
          </div>
        </div>
        <div className="loading-container">
          <p>Loading recipe...</p>
        </div>
      </div>
    )
  }

  if (error || !recipe) {
    return (
      <div className="recipe-container">
        <div className="logo-container">
          <div className="logo">
            <img src={Logo_big || "/placeholder.svg"} alt="SafeBites" />
          </div>
        </div>
        <div className="error-container">
          <h2>Error</h2>
          <p>{error || "Recipe not found"}</p>
          <button className="orange-button" onClick={() => navigate("/")}>
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
  }))

  // Format dietary tags - using the same approach as ingredients
  const dietaryTags =
    recipe.diets && recipe.diets.length > 0 ? recipe.diets.map((item) => item.diets.name).filter(Boolean) : []

  // Get category name - now directly from the recipe object
  const categoryName = recipe.categoryName || "Uncategorized"

  return (
    <div className="recipe-container">
      <div className="logo-container">
        <div className="logo">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault()
              navigate("/")
            }}
          >
            <img src={Logo_big || "/placeholder.svg"} alt="SafeBites" />
          </a>
        </div>

        {isCurrentUser && (
          <div className="recipe-actions">
            <button className="delete-button" onClick={handleDeleteClick}>
              Delete Recipe
            </button>
          </div>
        )}
      </div>

      <div className="recipe-hero">
        <img
          src={recipe.image_url || "/placeholder.svg?height=400&width=800"}
          alt={recipe.title}
          className="recipe-hero-image"
        />
      </div>

      {/* The title wrapper div around the title, meta, and tags */}
      <div className="recipe-title-wrapper">
        <h1 className="recipe-title">{recipe.title}</h1>

        <div className="recipe-meta">
          <span>Cooking Time: {recipe.cooking_time} minutes</span>
          <span>Serving: {recipe.servings} people</span>
          <span>Category: {categoryName}</span>
        </div>

        {dietaryTags.length > 0 && (
          <div className="dietary-tags-container">
            {dietaryTags.map((tag, index) => (
              <span key={index} className="dietary-tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="recipe-content">
        <div className="ingredients-section">
          <h2>Ingredients</h2>
          <ul className="ingredients-list">
            {formattedIngredients.map((ingredient, index) => (
              <li key={index}>
                {ingredient.amount} {ingredient.name} ({ingredient.calories} kcal/100g)
              </li>
            ))}
          </ul>
        </div>

        <div className="recipe-details">
          <div className="description-section">
            <h2>Description</h2>
            <p>{recipe.description}</p>
          </div>

          <div className="preparation-section">
            <h2>Preparation</h2>
            <ol className="steps-list">
              {recipe.steps.map((step, index) => (
                <li key={index}>
                  <span className="step-number">Step {index + 1}:</span> {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Delete Recipe</h3>
            <p>Are you sure you want to delete this recipe? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="cancel-button" onClick={handleCancelDelete} disabled={deleteLoading}>
                Cancel
              </button>
              <button className="delete-button confirm-delete" onClick={handleConfirmDelete} disabled={deleteLoading}>
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

