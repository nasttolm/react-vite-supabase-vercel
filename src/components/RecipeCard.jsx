
import styles from "../styles/recipe-card.module.css"
import PropTypes from 'prop-types';

RecipeCard.propTypes = {
    recipe: PropTypes.shape({
        title: PropTypes.string.isRequired,
        image: PropTypes.string,
        description: PropTypes.string.isRequired,
        author: PropTypes.string.isRequired
    }).isRequired

}

export default function RecipeCard({ recipe }) {
  return (
    <div className={styles.card}>
      <div className={styles.imageContainer}>
        <img
          src={recipe.image || "/placeholder.svg"}
          alt={recipe.title}
          width={100}
          height={100}
          className={styles.image}
        />
      </div>
      <div className={styles.content}>
        <h2 className={styles.title}>{recipe.title}</h2>
        <p className={styles.author}>by {recipe.author}</p>
        <p className={styles.description}>{recipe.description}</p>
      </div>
    </div>
  )
}

