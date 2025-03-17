import { Flame } from "lucide-react"
import styles from "./sidebar.module.css"

const dietaryFilters = ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Low-Carb", "Halal", "Keto", "Pescatarian"]

export default function Sidebar() {
  return (
    <div className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logoContainer}>
        <div className={styles.logoIcon}>
          <Flame size={20} />
        </div>
        <h1 className={styles.logoText}>SafeBites</h1>
      </div>

      {/* Create Recipe Button */}
      <div className={styles.buttonContainer}>
        <button className={styles.createButton}>Create Recipe</button>
      </div>

      {/* Filters */}
      <div className={styles.filtersContainer}>
        <h2 className={styles.filtersTitle}>FILTERS</h2>
        <div className={styles.filtersList}>
          {dietaryFilters.map((filter) => (
            <div key={filter} className={styles.filterItem}>
              <input type="checkbox" id={filter} className={styles.checkbox} />
              <label htmlFor={filter} className={styles.filterLabel}>
                {filter}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

