import { BrowserRouter, Route, Routes } from "react-router";
import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { Toaster } from "react-hot-toast";


import "./index.css";
import App from "./App.jsx";
import AppBar from "./containers/AppBar";
import AuthProvider from "./context/AuthContext.jsx";
import githubLogo from "/github.svg";
import SignIn from "./pages/auth/SignIn.jsx";
import SignUp from "./pages/auth/SignUp.jsx";
import UpdatePassword from "./pages/auth/update-password"
import CreateRecipe from "./pages/create-recipe"
import RecipePage from "./pages/recipe-page"
import UserProfile from "./pages/user-profile";
import CreateProfile from "./pages/create-profile"

createRoot(document.getElementById("root")).render(
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
      margin: "1rem",
    }}
  >
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <StrictMode>
        <AuthProvider>
          <AppBar />
          <BrowserRouter>
            <Routes>
              <Route index path="/" element={<App />} />
              <Route index path="/auth/sign-in" element={<SignIn />} />
              <Route index path="/auth/sign-up" element={<SignUp />} />
              <Route path="/auth/update-password" element={<UpdatePassword />} />
              <Route path="/create-recipe" element={<CreateRecipe />} />
              <Route path="/recipes/:id" element={<RecipePage />} />
              <Route path="/profile/:userId?" element={<UserProfile />} />
              <Route path="/create-profile" element={<CreateProfile />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>

        <Toaster />
      </StrictMode>
    </div>
    <footer
      style={{
        padding: "1rem",
        textAlign: "center",
      }}
    >
      Template Project available on{" "}
      <a
        href="https://github.com/juancarlosjr97/react-vite-supabase-vercel"
        target="_blank"
      >
        <img src={githubLogo} className="logo github" alt="GitHub logo" />
      </a>
    </footer>
  </div>
);
