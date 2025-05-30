import { BrowserRouter, Route, Routes } from "react-router";
import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { Toaster } from "react-hot-toast";

import "./index.css";
import App from "./App.jsx";
import AppBar from "./containers/AppBar";
import AuthProvider from "./context/AuthContext.jsx";
import SignIn from "./pages/auth/SignIn.jsx";
import SignUp from "./pages/auth/SignUp.jsx";
import UpdatePassword from "./pages/auth/update-password";
import CreateRecipe from "./pages/create-recipe";
import RecipePage from "./pages/recipe-page";
import Dashboard from "./pages/dashboard.jsx";
import UserProfile from "./pages/user-profile";
import CreateProfile from "./pages/create-profile";
import SupabasePlanner from "./pages/planner.jsx";
import ProtectedRoute from "./components/ProtectedRoute";
import '@fontsource/source-serif-pro/200.css';
import '@fontsource/source-serif-pro/300.css';
import '@fontsource/source-serif-pro/400.css';
import '@fontsource/source-serif-pro/600.css';
import '@fontsource/source-serif-pro/700.css';
import '@fontsource/source-serif-pro/900.css';

createRoot(document.getElementById("root")).render(
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
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
          <BrowserRouter>
            <AppBar />
            <Routes>
              {/* Public routes */}
              <Route index path="/" element={<App />} />
              <Route path="/auth/sign-in" element={<SignIn />} />
              <Route path="/auth/sign-up" element={<SignUp />} />
              <Route path="/auth/update-password" element={<UpdatePassword />} />
              
              {/* Protected routes */}
              <Route path="/create-recipe" element={
                <ProtectedRoute>
                  <CreateRecipe />
                </ProtectedRoute>
              } />
              <Route path="/recipes/:id" element={
                <ProtectedRoute>
                  <RecipePage />
                </ProtectedRoute>
              } />
              <Route path="/recipes" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard/>
                </ProtectedRoute>
              } />
              <Route path="/profile/:userId?" element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              } />
              <Route path="/create-profile" element={
                <ProtectedRoute>
                  <CreateProfile />
                </ProtectedRoute>
              } />
              <Route path="/planner" element={
                <ProtectedRoute>
                  <SupabasePlanner />
                </ProtectedRoute>
              } />
            </Routes>
          </BrowserRouter>
        </AuthProvider>

        <Toaster />
      </StrictMode>
    </div>
  </div>
);