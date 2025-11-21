import React, { useContext, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Homepage from "./pages/Homepage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import { AuthContext } from "../context/AuthContext";
import { Toaster } from "react-hot-toast";

const App = () => {
  const { authUser } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-[url('/src/assets/bgImage.svg')] bg-contain">
      <Toaster position="top-center" />
      <Suspense fallback={<div className="p-6 text-white">Loading…</div>}>
        <Routes>
          {/* Home (protected) */}
          <Route
            path="/"
            element={authUser ? <Homepage /> : <Navigate to="/login" replace />}
          />

          {/* Login (public) */}
          <Route
            path="/login"
            element={!authUser ? <LoginPage /> : <Navigate to="/" replace />}
          />

          {/* Profile (protected) */}
          <Route
            path="/profile"
            element={authUser ? <ProfilePage /> : <Navigate to="/login" replace />}
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to={authUser ? "/" : "/login"} replace />} />
        </Routes>
      </Suspense>
    </div>
  );
};

export default App;
