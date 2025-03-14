import { useNavigate } from "react-router";
import toast from "react-hot-toast";

import AccountForm from "../../containers/AccountForm";
import supabase from "../../utils/supabase";

import "../../styles/auth-styles.css"


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
        toast.error(result.error.message)
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
    } catch (error) {
      toast.error("Failed to sign in with Facebook")
    }
  }

  return (
    <div className="container">
      <AccountForm onSubmit={signIn} onFacebookAuth={signInWithFacebook} />
    </div>
  )
}

export default SignIn

