"use client"

import { useState } from "react"

import styles from "../styles/dashboard.module.css"
import sidebarStyles from "../styles/sidebar.module.css"
import Logo from "../../public/logoName2.svg"
import RecipeCard from "../components/RecipeCard"


const recipes = [
  {
    id: 1,
    title: "Ceasar Salad",
    author: "@nastya",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut",
    image: "/meal1.png",
    category: "salads",
  },
  {
    id: 2,
    title: "Greek Salad",
    author: "@shvkhzod",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut",
      image: "/meal2.png",
    category: "salads",
  },
  {
    id: 3,
    title: "Greek Salad",
    author: "@aymene",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut",
      image: "/meal3.png",
    category: "salads",
  },

  {
    id: 4,
    title: "Breakfast Salad",
    author: "@aymene",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut",
      image: "/meal3.png",
    category: "breakfast",
  },
]

const categories = ["Salads", "Breakfast", "Lunch", "Dinner", "Favorites"]
const dietaryFilters = ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Low-Carb", "Halal", "Keto", "Pescatarian"]

export default function Dashboard() {
  const [activeCategory, setActiveCategory] = useState("Salads")

  return (
    <div className={styles.container}>

      <div className={sidebarStyles.sidebar}>

        <div className={sidebarStyles.logoContainer}>
          <img src={Logo} alt="SafeBites Logo" className={sidebarStyles.logoIcon} />
        </div>


        <div className={sidebarStyles.buttonContainer}>
          <button className={sidebarStyles.createButton}
          onClick={() => {
            window.location.href = "/create-recipe"
          }}
          >Create Recipe</button>
        </div>


        <div className={sidebarStyles.filtersContainer}>
          <h2 className={sidebarStyles.filtersTitle}>FILTERS</h2>
          <div className={sidebarStyles.filtersList}>
            {dietaryFilters.map((filter) => (
              <div key={filter} className={sidebarStyles.filterItem}>
                <input type="checkbox" id={filter} className={sidebarStyles.checkbox} />
                <label htmlFor={filter} className={sidebarStyles.filterLabel}>
                  {filter}
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
              <input type="text" placeholder="Search" className={styles.searchInput} />
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
              {categories.map((category) => (
                <button
                  key={category}
                  className={`${styles.categoryTab} ${activeCategory === category ? styles.activeTab : ""}`}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

  
        <div className={styles.recipeListContainer}>
          <div className={styles.recipeList}>
          {recipes
              .filter((recipe) => recipe.category.toLowerCase() === activeCategory.toLowerCase())
              .map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}

