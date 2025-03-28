import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"

import AccountForm from "../../containers/AccountForm"
import supabase from "../../utils/supabase"
import styles from "../../styles/auth.module.css"

const SignUp = () => {
  const navigate = useNavigate()

  const signUp = async (email, password) => {
    try {
      const result = await supabase.auth.signUp({
        email,
        password,
      })

      if (result.data.user?.identities?.length === 0) {
        toast.error("Account cannot be created. Please, try again later.")
      } else {
        toast.success("Welcome! Please check your inbox to confirm your account.")
        // Redirect to create profile page after signup
        navigate("/create-profile")
      }
    } catch (error) {
      console.error("Sign up error:", error)
      toast.error("An error occurred during sign up")
    }
  }

  const signUpWithFacebook = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "facebook",
      })

      if (error) {
        toast.error(error.message)
      }
    } catch (error) {
      toast.error("Failed to sign up with Facebook")
    }
  }

  return (
    <div className={styles.container}>
      <AccountForm onSubmit={signUp} onFacebookAuth={signUpWithFacebook} isSignUp={true} />
    </div>
  )
}

export default SignUp

