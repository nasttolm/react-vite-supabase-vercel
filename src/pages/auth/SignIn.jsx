import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"

import AccountForm from "../../containers/AccountForm"
import supabase from "../../utils/supabase"
import styles from "../../styles/auth.module.css"

const SignIn = () => {
  const navigate = useNavigate()

  const signIn = async (email, password) => {
    try {
      const result = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (!result.error) {
        navigate("/")
        toast.success("Welcome!")
      } else if (result.error?.message) {
        toast.error('Invalid credentials')
      }
    } catch (error) {
      console.error("Sign in error:", error)
      toast.error("An error occurred during sign in")
    }
  }

  const signInWithFacebook = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "facebook",
      })

      if (error) {
        toast.error(error.message)
      }
    } catch {
      toast.error("Failed to sign in with Facebook")
    }
  }

  return (
    <div className={styles.container}>
      <AccountForm onSubmit={signIn} onFacebookAuth={signInWithFacebook} />
    </div>
  )
}

export default SignIn

