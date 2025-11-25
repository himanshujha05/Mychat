// context/AuthContext.jsx
import { createContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001"; // ✅ fallback
axios.defaults.baseURL = backendURL;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);

  const checkAuth = async () => {
    try {
      const { data } = await axios.get("/api/auth/check");
      if (data?.success) {
        setAuthUser(data.userData);
        connectSocket(data.userData);
      } else {
        // Token invalid, clear it
        localStorage.removeItem("token");
        setToken(null);
        setAuthUser(null);
        delete axios.defaults.headers.common["Authorization"];
      }
    } catch (error) {
      // If 401 or token expired, clear auth state
      if (error?.response?.status === 401) {
        localStorage.removeItem("token");
        setToken(null);
        setAuthUser(null);
        delete axios.defaults.headers.common["Authorization"];
      }
    }
  };

  const login = async (state, credentials) => {
    try {
      const { data } = await axios.post(`/api/auth/${state}`, credentials);
      if (data?.success) {
        const user = data.user ?? data.userData;
        setAuthUser(user);
        axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
        setToken(data.token);
        localStorage.setItem("token", data.token);
        connectSocket(user);
        toast.success("Login successful");
        return true;
      }
      toast.error(data?.message || "Login failed.");
      return false;
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error?.response?.data?.message || "Login failed. Please try again.");
      return false;
    }
  };

  const logout = async () => {
    localStorage.removeItem("token");
    setToken(null);
    setAuthUser(null);
    setOnlineUsers([]);
    delete axios.defaults.headers.common["Authorization"];
    socket?.disconnect();
    setSocket(null);
    // toast.success("Logout successful"); // optional on auto-logout
  };

  const updateProfile = async (body) => {
    try {
      const { data } = await axios.put("/api/auth/update-profile", body);
      if (data?.success) {
        setAuthUser(data.userData ?? data.user);
        toast.success("Profile updated successfully");
        return true;
      }
      toast.error(data?.message || "Update failed.");
      return false;
    } catch {
      toast.error("Profile update failed. Please try again.");
      return false;
    }
  };

  const connectSocket = (userData) => {
    if (!userData || socket?.connected) return;
    const s = io(backendURL, {
      query: { userId: userData._id },
      transports: ["websocket"], // ✅ optional: cleaner dev
    });
    setSocket(s);

    // ✅ match your server emit: "getOnlineusers" (lowercase 'u')
    s.on("getOnlineusers", (ids) => setOnlineUsers(ids));
  };

  useEffect(() => {
    const saved = localStorage.getItem("token");
    if (saved) {
      setToken(saved);
      axios.defaults.headers.common["Authorization"] = `Bearer ${saved}`;
      checkAuth();                 // ✅ only run when token exists
    }
    // else: do nothing; avoids 401 on first load
  }, []);

  const value = {
    axios,
    token,
    authUser,
    onlineUser: onlineUsers,
    onlineUsers,
    socket,
    login,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
