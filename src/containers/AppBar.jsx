import { useState, useEffect } from "react"
import styles from "../styles/app-bar.module.css"
import Logo from "../../public/logoName2.svg"
import supabase from "../utils/supabase"

function ResponsiveAppBar() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check user authentication when component loads
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        if (data.session) {
          setUser(data.session.user)
        }
      } catch (error) {
        console.error("Error checking auth status:", error)
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    // Subscribe to authentication state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          setUser(session.user)
        } else {
          setUser(null)
        }
      }
    )

    // Unsubscribe when component unmounts
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe()
      }
    }
  }, [])

  return (
    <div className={styles.appBar}>
      <div className={styles.logo}>
        <img 
          src={Logo || "/placeholder.svg"} 
          alt="SafeBites Logo" 
          onClick={() => {
            window.location.href = "/"
          }}
        />
      </div>

      <div className={styles.navMenu}>
        {/* Navigation links only for authenticated users */}
        {user && (
          <div className={styles.navLinks}>
            <button 
              className={styles.navLink} 
              onClick={() => {
                window.location.href = "/recipes"
              }}
            >
              Recipes
            </button>
            <button 
              className={styles.navLink} 
              onClick={() => {
                window.location.href = "/planner"
              }}
            >
              Meal Planner
            </button>
            <button 
              className={styles.navLink} 
              onClick={() => {
                window.location.href = "/create-recipe"
              }}
            >
              Create Recipe
            </button>
            <button 
              className={styles.navLink} 
              onClick={() => {
                window.location.href = "/profile"
              }}
            >
              Profile
            </button>
          </div>
        )}

        {/* Authentication buttons */}
        <div className={styles.signBtns}>
          {user ? (
            // If user is authenticated, show sign out button
            <button 
              className={styles.signInBtn} 
              onClick={async () => {
                await supabase.auth.signOut()
                window.location.href = "/"
              }}
            >
              Sign Out
            </button>
          ) : (
            // If user is not authenticated, show sign in and sign up buttons
            <>
              <button 
                className={styles.signInBtn} 
                onClick={() => {
                  window.location.href = "/auth/sign-in"
                }}
              >
                Sign In
              </button>
              <button 
                className={styles.signUpBtn} 
                onClick={() => {
                  window.location.href = "/auth/sign-up"
                }}
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ResponsiveAppBar