// middleware/auth.js
import jwt from "jsonwebtoken";
import User from "../models/User.js"; // <-- make sure this matches your actual file name/case

export const protectRoute = async (req, res, next) => {
  try {
    // Read header in a case-insensitive way
    const authHeader = req.get("authorization"); // e.g. "Bearer <jwt>"
    const tokenHeader = req.headers.token;       // e.g. "<jwt>"

    // Pick whichever was provided
    let token = null;
    if (typeof authHeader === "string" && authHeader.toLowerCase().startsWith("bearer ")) {
      token = authHeader.slice(7).trim();
    } else if (typeof tokenHeader === "string") {
      token = tokenHeader.trim();
    }

    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    if (!process.env.JWT_SECRET) {
      // Misconfiguration safeguard
      return res.status(500).json({ success: false, message: "Server misconfigured (missing JWT_SECRET)" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      // Distinguish common JWT errors for clearer messages
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ success: false, message: "Token expired" });
      }
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    // Fetch user (omit password)
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    // Attach for downstream handlers
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error("[protectRoute]", error?.message || error);
    return res.status(401).json({ success: false, message: "Unauthorized access" });
  }
};
