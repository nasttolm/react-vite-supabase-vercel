import styles from "../styles/app-bar.module.css"
import Logo from "../../public/logoName2.svg"




function ResponsiveAppBar() {
  // const { session, loading } = useAuth()

  // const [anchorElNav, setAnchorElNav] = useState(null)

  // const handleOpenNavMenu = (event) => {
  //   setAnchorElNav(event.currentTarget)
  // }

  // const handleCloseNavMenu = () => {
  //   setAnchorElNav(null)
  // }

  // if (loading) {
  //   return null
  // }

  return (
    <div className={styles.appBar}>
      <div className={styles.logo}>
        <img src={Logo} alt="SafeBites Logo" onClick={()=> {
          window.location.href = "/"
        }}/>
      </div>

      <div className={styles.navMenu}>


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

