// controllers/usercontrollers.js
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cloudinary from "../lib/cloudinary.js";



// small helper so we don't repeat ourselves
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// ------------------ SIGNUP ------------------
export const signup = async (req, res) => {
  try {
    const { fullName, email, password, bio } = req.body; // use fullName key

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,            // <-- model should have fullName
      email,
      password: hashedPassword,
      bio: bio || "",
    });

    await newUser.save();

    const token = generateToken(newUser._id);

    // Trim password from response
    const { password: _pw, ...userSafe } = newUser.toObject();
    return res.status(201).json({
      success: true,
      userData: userSafe,
      token,
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("[signup]", error?.message || error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ------------------ LOGIN ------------------
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const userData = await User.findOne({ email }); // fixed typo (enail)
    if (!userData) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, userData.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken(userData._id);
    const { password: _pw, ...userSafe } = userData.toObject();

    return res.json({
      success: true,
      userData: userSafe,
      token,
      message: "Login successful",
    });
  } catch (error) {
    console.error("[login]", error?.message || error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ------------------ CHECK AUTH ------------------
export const checkAuth = async (req, res) => {
  try {
    const userId = req.user._id; // set by protectRoute
    const userData = await User.findById(userId).select("-password");
    return res.json({ success: true, userData });
  } catch (error) {
    console.error("[checkAuth]", error?.message || error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ------------------ UPDATE PROFILE ------------------
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { fullName, bio, profilePic } = req.body;

    const update = {};
    if (typeof fullName === "string") update.fullName = fullName;
    if (typeof bio === "string") update.bio = bio;

    if (profilePic) {
      const upload = await cloudinary.uploader.upload(profilePic);
      update.profilePic = upload.secure_url; // field name should match your model
    }

    const updatedUser = await User.findByIdAndUpdate(userId, update, {
      new: true,
      runValidators: true,
      select: "-password",
    });

    return res.json({
      success: true,
      userData: updatedUser,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("[updateProfile]", error?.message || error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
