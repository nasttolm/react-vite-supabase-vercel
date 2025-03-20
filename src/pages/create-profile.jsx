"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import toast from "react-hot-toast"
import TextField from "@mui/material/TextField"
import Button from "@mui/material/Button"
import FormControlLabel from "@mui/material/FormControlLabel"
import Switch from "@mui/material/Switch"
import Select from "@mui/material/Select"
import MenuItem from "@mui/material/MenuItem"
import FormControl from "@mui/material/FormControl"
import InputLabel from "@mui/material/InputLabel"
import supabase from "../utils/supabase"
import styles from "../styles/user-profile.module.css"

const CreateProfile = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)

  // Profile data
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [nickname, setNickname] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [avatarFile, setAvatarFile] = useState(null)

  // Notification settings
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [notificationDay, setNotificationDay] = useState("sunday")
  const [notificationTime, setNotificationTime] = useState("18:00")

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession()

      if (!data.session) {
        toast.error("You must be logged in to create a profile")
        navigate("/auth/sign-in")
        return
      }

      setUser(data.session.user)

      // Check if user already has a profile
      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", data.session.user.id)
        .single()

      if (profileData) {
        toast.info("You already have a profile")
        navigate("/profile")
      }
    }

    checkAuth()
  }, [navigate])

  // Handle avatar change
  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setAvatarFile(file)
      setAvatarUrl(URL.createObjectURL(file))
    }
  }

  const validateNickname = async (value) => {
    if (!value.trim()) return false

    // Check if nickname is already taken
    const { data, error } = await supabase.from("user_profiles").select("id").eq("nickname", value).maybeSingle()

    if (error) {
      console.error("Error checking nickname:", error)
      return false
    }

    return !data // Return true if nickname is available (data is null)
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!firstName.trim()) {
      toast.error("First name is required")
      return
    }

    if (!nickname.trim()) {
      toast.error("Nickname is required")
      return
    }

    // Check if nickname is available
    const isNicknameAvailable = await validateNickname(nickname)
    if (!isNicknameAvailable) {
      toast.error("This nickname is already taken. Please choose another one.")
      return
    }

    try {
      setLoading(true)

      let uploadedAvatarUrl = null

      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop()
        const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `avatars/${fileName}`

        const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, avatarFile)

        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(filePath)

        uploadedAvatarUrl = publicUrl
      }

      const { error } = await supabase.from("user_profiles").insert({
        id: user.id,
        first_name: firstName,
        last_name: lastName || null,
        nickname: nickname,
        avatar_url: uploadedAvatarUrl,
        notification_settings: {
          enabled: notificationsEnabled,
          day: notificationDay,
          time: notificationTime,
        },
      })

      if (error) throw error

      toast.success("Profile created successfully!")
      navigate("/profile")
    } catch (error) {
      console.error("Error creating profile:", error)
      toast.error("Failed to create profile")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Create Your Profile</h1>

      <form onSubmit={handleSubmit}>
        <div className={styles.formLayout}>
          <div className={styles.formLeft}>
            <div className={styles.inputGroup}>
              <TextField
                fullWidth
                label="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                variant="outlined"
                className={styles.input}
              />
            </div>

            <div className={styles.inputGroup}>
              <TextField
                fullWidth
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                variant="outlined"
                className={styles.input}
              />
            </div>

            <div className={styles.inputGroup}>
              <TextField
                fullWidth
                label="Nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
                variant="outlined"
                className={styles.input}
                helperText="Choose a unique nickname for your profile"
              />
            </div>

            <div className={styles.sectionTitle}>Notification Settings</div>

            <div className={styles.notificationSettings}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationsEnabled}
                    onChange={(e) => setNotificationsEnabled(e.target.checked)}
                    color="primary"
                  />
                }
                label="Enable weekly meal plan notifications"
                className={styles.switchControl}
              />

              {notificationsEnabled && (
                <>
                  <div className={styles.selectWrapper}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel>Day of the week</InputLabel>
                      <Select
                        value={notificationDay}
                        onChange={(e) => setNotificationDay(e.target.value)}
                        label="Day of the week"
                      >
                        <MenuItem value="monday">Monday</MenuItem>
                        <MenuItem value="tuesday">Tuesday</MenuItem>
                        <MenuItem value="wednesday">Wednesday</MenuItem>
                        <MenuItem value="thursday">Thursday</MenuItem>
                        <MenuItem value="friday">Friday</MenuItem>
                        <MenuItem value="saturday">Saturday</MenuItem>
                        <MenuItem value="sunday">Sunday</MenuItem>
                      </Select>
                    </FormControl>
                  </div>

                  
                  <div className={styles.selectWrapper}>
                    <TextField
                      fullWidth
                      label="Notification time"
                      type="time"
                      value={notificationTime}
                      onChange={(e) => setNotificationTime(e.target.value)}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      inputProps={{
                        step: 300, // 5 min
                      }}
                      variant="outlined"
                      className={styles.input}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className={styles.formRight}>
            <input
              type="file"
              id="avatar-upload"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: "none" }}
            />

            <div className={styles.avatarWrapper} onClick={() => document.getElementById("avatar-upload").click()}>
              {avatarUrl ? (
                <img src={avatarUrl || "/placeholder.svg"} alt="Profile" className={styles.avatarImage} />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  <svg width="32" height="32" viewBox="0 0 0 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M12 5V19M5 12H19"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className={styles.uploadText}>Click to upload photo</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.actionButtons}>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            className={styles.button}
            style={{
              backgroundColor: "#ff5722",
              color: "white",
            }}
          >
            {loading ? "Creating..." : "Create Profile"}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default CreateProfile

