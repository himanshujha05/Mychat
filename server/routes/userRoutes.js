import express from 'express';
import { checkAuth,login, signup, updateProfile} from "../controllers/usercontrollers.js";
import { protectRoute } from '../middleware/auth.js';

const userRouter = express.Router();

//route to signup new user
userRouter.post("/signup", signup);

//route to login user
userRouter.post("/login", login);

//route to check if user is authenticated
userRouter.put("/update-profile", protectRoute, updateProfile);

//route to update user profile
userRouter.get("/check", protectRoute, checkAuth);

export default userRouter;