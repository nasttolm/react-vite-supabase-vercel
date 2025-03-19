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


const Profile = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isEditing, setIsEditing] = useState(false)

  // Profile data
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
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
        toast.error("You must be logged in to view your profile")
        navigate("/auth/sign-in")
        return
      }

      setUser(data.session.user)

      const { data: profileData, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", data.session.user.id)
        .single()

      if (error) {
        toast.info("Please create your profile")
        navigate("/create-profile")
        return
      }

      setProfile(profileData)
      setFirstName(profileData.first_name || "")
      setLastName(profileData.last_name || "")
      setAvatarUrl(profileData.avatar_url || "")

      const notificationSettings = profileData.notification_settings || {
        enabled: false,
        day: "sunday",
        time: "18:00",
      }

      setNotificationsEnabled(notificationSettings.enabled)
      setNotificationDay(notificationSettings.day)
      setNotificationTime(notificationSettings.time)

      setLoading(false)
    }

    checkAuth()
  }, [navigate])

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setAvatarFile(file)
      setAvatarUrl(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!firstName.trim()) {
      toast.error("First name is required")
      return
    }

    try {
      setSaving(true)

      let updatedAvatarUrl = profile.avatar_url

      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop()
        const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `avatars/${fileName}`

        const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, avatarFile)

        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(filePath)

        updatedAvatarUrl = publicUrl
      }

      // Create the updated profile data
      const updatedProfile = {
        first_name: firstName,
        last_name: lastName || null,
        avatar_url: updatedAvatarUrl,
        notification_settings: {
          enabled: notificationsEnabled,
          day: notificationDay,
          time: notificationTime,
        },
      }

      const { data, error } = await supabase
        .from("user_profiles")
        .update(updatedProfile)
        .eq("id", user.id)
        .select()
        .single()

      if (error) throw error

      // Update the local profile state with the new data
      setProfile(data)
      setIsEditing(false)
      toast.success("Profile updated successfully!")
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className={styles.container}>Loading...</div>
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Your Profile</h1>

      <form onSubmit={handleSubmit}>
        <div className={styles.formLayout}>
          <div className={styles.formLeft}>
            {isEditing ? (
              <>
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
              </>
            ) : (
              <>
                <div className={styles.infoSection}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>First Name</label>
                    <p className={styles.value}>{profile.first_name}</p>
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Last Name</label>
                    <p className={styles.value}>{profile.last_name || "-"}</p>
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Email</label>
                    <p className={styles.value}>{user.email}</p>
                  </div>
                </div>

                <div className={styles.sectionTitle}>Notification Settings</div>

                <div className={styles.infoSection}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Weekly Meal Plan Notifications</label>
                    <p className={styles.value}>{profile.notification_settings?.enabled ? "Enabled" : "Disabled"}</p>
                  </div>

                  {profile.notification_settings?.enabled && (
                    <>
                      <div className={styles.inputGroup}>
                        <label className={styles.label}>Day of the Week</label>
                        <p className={styles.value}>
                          {profile.notification_settings.day.charAt(0).toUpperCase() +
                            profile.notification_settings.day.slice(1)}
                        </p>
                      </div>

                      <div className={styles.inputGroup}>
                        <label className={styles.label}>Time</label>
                        <p className={styles.value}>
                          {(() => {
                            const time = profile.notification_settings.time
                            const [hours, minutes] = time.split(":")
                            const hour = Number.parseInt(hours)
                            return `${hour > 12 ? hour - 12 : hour}:${minutes} ${hour >= 12 ? "PM" : "AM"}`
                          })()}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          <div className={styles.formRight}>
            <input
              type="file"
              id="avatar-upload"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: "none" }}
              disabled={!isEditing}
            />

            <div
              className={styles.avatarWrapper}
              onClick={() => isEditing && document.getElementById("avatar-upload").click()}
              style={{ cursor: isEditing ? "pointer" : "default" }}
            >
              {avatarUrl ? (
                <img src={avatarUrl || "/placeholder.svg"} alt="Profile" className={styles.avatarImage} />
              ) : (
                <div className={styles.avatarPlaceholder}>{firstName.charAt(0).toUpperCase()}</div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.actionButtons}>
          {isEditing ? (
            <>
              <Button
                type="button"
                variant="contained"
                onClick={() => setIsEditing(false)}
                className={styles.cancelButton}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={saving}
                className={styles.button}
                style={{
                  backgroundColor: "#ff5722",
                  color: "white",
                }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="contained"
              onClick={() => setIsEditing(true)}
              className={styles.button}
              style={{
                backgroundColor: "#ff5722",
                color: "white",
              }}
            >
              Edit Profile
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}

export default Profile

