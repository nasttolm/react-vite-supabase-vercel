import styles from "../styles/app-bar.module.css"
import Logo from "../../public/logoName2.svg"

function ResponsiveAppBar() {
  return (
    <div className={styles.appBar}>
      <div className={styles.logo}>
        <img src={Logo || "/placeholder.svg"} alt="SafeBites Logo" onClick={()=> {
          window.location.href = "/"
        }}/>
      </div>

      <div className={styles.navMenu}>
        <div className={styles.navLinks}>
          <button className={styles.navLink} onClick={()=> {
            window.location.href = "/recipes"
          }}>Recipes</button>
          <button className={styles.navLink} onClick={()=> {
            window.location.href = "/planner"
          }}>Meal Planner</button>
          <button className={styles.navLink} onClick={()=> {
            window.location.href = "/create-recipe"
          }}>Create Recipe</button>
          <button className={styles.navLink} onClick={()=> {
            window.location.href = "/profile"
          }}>Profile</button>
        </div>

        <div className={styles.signBtns}>
          <button className={styles.signInBtn} onClick={()=> {
            window.location.href = "/auth/sign-in"
          }}>Sign In</button>
          <button className={styles.signUpBtn} onClick={()=> {
            window.location.href = "/auth/sign-up"
          }}>Sign Up</button>
        </div>
      </div>
    </div>
  )
}

export default ResponsiveAppBar