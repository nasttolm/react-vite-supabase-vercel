import { useFormik } from "formik";
import * as yup from "yup";
import Button from "@mui/material/Button";
import PropTypes from "prop-types";
import TextField from "@mui/material/TextField";
import styles from "../styles/auth.module.css";
import Logo from "../../public/Logo.svg";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import supabase from "../utils/supabase";
import toast from "react-hot-toast";

const validationSchema = yup.object({
  email: yup.string("Enter your email").email("Enter a valid email").required("Email is required"),
  password: yup
    .string("Enter your password")
    .min(8, "Password should be of minimum 8 characters length")
    .required("Password is required"),
});

const AccountForm = ({ onSubmit, onFacebookAuth = () => {}, isSignUp = false }) => {
  const navigate = useNavigate();
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [showResetForm, setShowResetForm] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      await onSubmit(values.email, values.password);
    },
  });

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      toast.error("Please enter your email address");
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: window.location.origin + "/auth/update-password",
      });

      if (error) {
        toast.error(error.message);
      } else {
        setResetEmailSent(true);
        toast.success("Password reset email sent. Please check your inbox.");
      }
    } catch (error) {
      console.error("Password reset error:", error);
      toast.error("An error occurred while sending the reset email");
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.icon}>
          <div className={styles.logo}>
            <img src={Logo || "/placeholder.svg"} alt="logo" />
          </div>
        </div>
        <h1 className={styles.title}>{isSignUp ? "Create Account" : "Welcome Back"}</h1>
        <p className={styles.subtitle}>
          {isSignUp ? "Please enter your details to sign up." : "Please enter your details to sign in."}
        </p>
      </div>

      {showResetForm ? (
        <div className={styles.resetPasswordForm}>
          <p className={styles.resetText}>Enter your email address and we`ll send you a link to reset your password.</p>
          <TextField
            fullWidth
            id="reset-email"
            name="reset-email"
            placeholder="Enter your email"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            variant="outlined"
            className={styles.input}
          />
          <Button
            fullWidth
            onClick={handleForgotPassword}
            variant="contained"
            className={styles.submitButton}
            disabled={resetEmailSent}
          >
            {resetEmailSent ? "Email Sent" : "Send Reset Link"}
          </Button>
          <div className={styles.backToLogin}>
            <span className={styles.signupLink} onClick={() => setShowResetForm(false)} style={{ cursor: "pointer" }}>
              Back to Login
            </span>
          </div>
        </div>
      ) : (
        <>
          <button
            type="button"
            className={styles.facebookButton}
            onClick={onFacebookAuth}
            disabled={formik.isSubmitting}
          >
            <span className={styles.facebookIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M9.19795 21.5H13.198V13.4901H16.8021L17.198 9.50977H13.198V7.5C13.198 6.94772 13.6457 6.5 14.198 6.5H17.198V2.5H14.198C11.4365 2.5 9.19795 4.73858 9.19795 7.5V9.50977H7.19795L6.80206 13.4901H9.19795V21.5Z"
                  fill="#1877f2"
                />
              </svg>
            </span>
            <span>Continue with Facebook</span>
          </button>

          <div className={styles.divider}>
            <div className={styles.dividerLine}></div>
            <span className={styles.dividerText}>OR</span>
            <div className={styles.dividerLine}></div>
          </div>

          <form onSubmit={formik.handleSubmit} className={styles.form}>
            <div>
              <label htmlFor="email">Email</label>
              <TextField
                fullWidth
                id="email"
                name="email"
                placeholder="Enter your email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                variant="outlined"
                className={styles.input}
              />
            </div>
            <div>
              <label htmlFor="password">Password</label>
              <TextField
                fullWidth
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
                variant="outlined"
                className={styles.input}
              />
            </div>

            {!isSignUp && (
              <div className={styles.forgotPassword}>
                <span
                  className={styles.forgotPasswordLink}
                  onClick={() => {
                    setResetEmail(formik.values.email);
                    setShowResetForm(true);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  Forgot password?
                </span>
              </div>
            )}

            <Button
              fullWidth
              type="submit"
              variant="contained"
              disabled={formik.isSubmitting}
              className={styles.submitButton}
            >
              {isSignUp ? "Sign Up" : "Sign In"}
            </Button>
          </form>

          <div className={styles.signupText}>
            {isSignUp ? (
              <>
                Do you have an account already?{" "}
                <span
                  className={styles.signupLink}
                  onClick={() => navigate("/auth/sign-in")}
                  style={{ cursor: "pointer" }}
                >
                  Sign In
                </span>
              </>
            ) : (
              <>
                Don`t have an account yet?{" "}
                <span
                  className={styles.signupLink}
                  onClick={() => navigate("/auth/sign-up")}
                  style={{ cursor: "pointer" }}
                >
                  Sign Up
                </span>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

AccountForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onFacebookAuth: PropTypes.func,
  isSignUp: PropTypes.bool,
};

export default AccountForm;