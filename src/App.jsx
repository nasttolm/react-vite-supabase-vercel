import { useState, useEffect } from "react"
import "./App.css"
import styles from "./styles/landing.module.css"
import tagIcon from "../public/forks.png"
import outlineFork from "../public/outline_fork.png"
import star from "../public/star.svg"
import heroImg from "../public/heroImg.svg"
import Selection from "../public/selection.png"
import aymene from "../public/aymene.png"
import anastasia from "../public/anastasia.png"
import shakhzod from "../public/shakhzod.png"
import whiteLogo from "../public/whiteLogo.png"
import supabase from "./utils/supabase" 

function App() {
  const [recipeCount, setRecipeCount] = useState("100+")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchRecipeCount() {
      try {
        const { count, error } = await supabase.from("recipes").select("*", { count: "exact", head: true })

        if (error) {
          console.error("Error fetching recipe count:", error)
          return
        }

        setRecipeCount(count)
      } catch (error) {
        console.error("Failed to fetch recipe count:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecipeCount()
  }, [])

  const handleGetStarted = () => {
    window.location.href = "/auth/sign-up"
  }

  const handleLearnMore = () => {
    const whyChooseSection = document.getElementById("why-choose-section")
    if (whyChooseSection) {
      whyChooseSection.scrollIntoView({ behavior: "smooth" })
    }
  }

  // Function for newsletter subscription - in development
  const handleSubscribe = () => {
    alert("Thank you for subscribing!")
    // TODO: Implement newsletter subscription functionality
  }

  return (
    <>
      <div className={styles.landingContainer}>
        <div className={styles.heroSection}>
          <div className={styles.left}>
            <div className={styles.tag}>
              <div className={styles.tagIcon}>
                <img src={tagIcon || "/placeholder.svg"} alt="tag icon" />
              </div>

              <div className={styles.tagText}>
                <p className={styles.tagFirst}>Radically New</p>
                <p className={styles.tagSecond}>
                  Read Our <span>Success Story</span>
                </p>
              </div>
            </div>

            <div className={styles.heroText}>
              <h1 className={styles.heroMainText}>
                Save Time and <span>Boost Health</span>
              </h1>

              <p className={styles.heroSubText}>Community-Approved Recipes You Can Trust</p>
            </div>

            <div className={styles.heroButtons}>
              <button className={styles.heroMainBtn} onClick={handleGetStarted}>
                Get Started
              </button>
              <button className={styles.heroSecondaryBtn} onClick={handleLearnMore}>
                Learn More
              </button>
            </div>

            <div className={styles.stats}>
              <div className={styles.statsLeft}>
                <div className={styles.leftStatIcon}>
                  <img src={outlineFork || "/placeholder.svg"} alt="fork icon" />
                </div>

                <div className={styles.leftStatText}>
                  <p>
                    Ready to go <span>{isLoading ? "100+" : recipeCount}</span>
                  </p>
                  <p>Recipes</p>
                </div>
              </div>

              <div className={styles.statsLine}></div>

              <div className={styles.statsRight}>
                <div className={styles.rightStatIcon}>
                  <img src={star || "/placeholder.svg"} alt="beta icon" />
                </div>
                <p>Beta</p>
              </div>
            </div>
          </div>
          <div className={styles.right}>
            <img src={heroImg || "/placeholder.svg"} alt="hero" />
          </div>
        </div>

        <h1 className={styles.sectionTitle}>
          One Place For <br></br> <span>Thousands</span> Recipes
        </h1>

        <div className={styles.selectionImg}>
          <img src={Selection || "/placeholder.svg"} alt="selection" />
        </div>
        <p className={styles.sectionTag}>Top 3 Reasons</p>
        <h1 className={styles.sectionTitle} id="why-choose-section">
          Why Choose
        </h1>

        <div className={styles.options}>
          <div className={styles.outlineOption}>
            <h2>Time Saving</h2>
            <p>Student or a worker with hectic schedule, don`t worry we got you</p>
          </div>

          <div className={styles.fillOption}>
            <h2>Healthy Recipes</h2>
            <p>Food that does not harm you, instead makes you better</p>
          </div>

          <div className={styles.outlineOption}>
            <h2>Quick & Easy Cooking</h2>
            <p>Selection of recipes that even 6 year old can follow</p>
          </div>
        </div>

        <p className={styles.sectionTag}>Masterminds behind</p>
        <h1 className={styles.sectionTitle}>
          Meet <span>Our Team</span>
        </h1>

        <div className={styles.team}>
          <img src={aymene || "/placeholder.svg"} alt="aymene" />
          <img src={anastasia || "/placeholder.svg"} alt="anastasia" />
          <img src={shakhzod || "/placeholder.svg"} alt="shakhzod" />
        </div>

        <div className={styles.newsLetterContainer}>
          <div className={styles.newsLetter}>
            <h1>
              Join Our Newsletter to receive great offers and news exclusively from us{" "}
              <span style={{ color: "yellow", fontWeight: "bold" }}>COMING SOON</span>
            </h1>
            <div className={styles.newsLetterBottom}>
              <input type="email" placeholder="your@email.com" disabled />

              <button
                className={styles.newsLetterBtn}
                disabled
                // onClick={handleSubscribe} - Will be enabled when feature is ready
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <div className={styles.footerLogo}>
            <img src={whiteLogo || "/placeholder.svg"} alt="logo" />
          </div>

          <div className={styles.footerText}>
            <p>Developed by Nova</p>
            <p>© 2025 SafeBites, All Rights Reserved</p>
          </div>
        </div>
      </div>
    </>
  )
}

export default App

