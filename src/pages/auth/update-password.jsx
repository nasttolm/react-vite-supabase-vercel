import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import toast from "react-hot-toast"

import supabase from "../../utils/supabase"
import Button from "@mui/material/Button"
import TextField from "@mui/material/TextField"
import styles from "../../styles/auth.module.css"

const UpdatePassword = () => {
  const navigate = useNavigate()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        toast.error("Your password reset link has expired or is invalid")
        navigate("/auth/sign-in")
      }
    }

    checkSession()
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 8) {
      setError("Password should be at least 8 characters long")
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        setError(error.message)
      } else {
        toast.success("Password updated successfully")
        navigate("/auth/sign-in")
      }
    } catch (error) {
      setError("An error occurred while updating your password")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.icon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M5.5 12.5L10 17L18.5 7"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className={styles.title}>Update Password</h1>
          <p className={styles.subtitle}>Please enter your new password below.</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <TextField
            fullWidth
            id="password"
            name="password"
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            variant="outlined"
            className={styles.input}
          />
          <TextField
            fullWidth
            id="confirm-password"
            name="confirm-password"
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            variant="outlined"
            className={styles.input}
          />

          {error && <div className={styles.errorMessage}>{error}</div>}

          <Button fullWidth type="submit" variant="contained" disabled={loading} className={styles.submitButton}>
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </form>

        <div className={styles.signupText}>
          Remember your password?{" "}
          <span className={styles.signupLink} onClick={() => navigate("/auth/sign-in")} style={{ cursor: "pointer" }}>
            Sign In
          </span>
        </div>
      </div>
    </div>
  )
}

export default UpdatePassword

