import { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import styles from "../styles/recipe-card.module.css"
import supabase from "../utils/supabase"
import { isRecipeFavorited, toggleFavoriteRecipe } from "../utils/supabase-dashboard"

const RecipeCard = ({ recipe }) => {
  const navigate = useNavigate()
  const [isFavorite, setIsFavorite] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        setUser(data.session.user)

        // Check if recipe is favorited
        const favorited = await isRecipeFavorited(data.session.user.id, recipe.id)
        setIsFavorite(favorited)
      }
    }

    checkAuth()
  }, [recipe.id])

  const handleFavoriteClick = async (e) => {
    e.stopPropagation()

    if (!user) {
      navigate("/auth/sign-in")
      return
    }

    const success = await toggleFavoriteRecipe(user.id, recipe.id)
    if (success) {
      setIsFavorite(!isFavorite)
    }
  }

  const handleCardClick = () => {
    navigate(`/recipes/${recipe.id}`)
  }

  // Format author name
  const authorName = recipe.authorNickname || "Unknown"

  return (
    <div className={styles.card} onClick={handleCardClick}>
      <div className={styles.imageContainer}>
        <img
          src={recipe.image_url || recipe.image || "/placeholder.svg"}
          alt={recipe.title}
          className={styles.image}
          width={200}
          height={200}
        />
      </div>
      <div className={styles.content}>
        <div className={styles.header}>
          <h2 className={styles.title}>{recipe.title}</h2>
          <button
            className={`${styles.favoriteButton} ${isFavorite ? styles.favorited : ""}`}
            onClick={handleFavoriteClick}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill={isFavorite ? "#ff5722" : "none"}
              stroke={isFavorite ? "#ff5722" : "currentColor"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
        </div>
        <p className={styles.author}>@{authorName}</p>

        {/* Display diets if available */}
        {recipe.diets && recipe.diets.length > 0 && (
          <div className={styles.dietTags}>
            {recipe.diets.map((diet) => (
              <span key={diet.id} className={styles.dietTag}>
                {diet.name}
              </span>
            ))}
          </div>
        )}

        <p className={styles.description}>{recipe.description}</p>
      </div>
    </div>
  )
}

export default RecipeCard

