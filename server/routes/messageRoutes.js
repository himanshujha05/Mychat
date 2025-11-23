import express from "express";
import { protectRoute } from "../middleware/auth.js";
import { getMessages, getUsersForSidebar, markMessagesAsSeen, sendMessage } from "../controllers/MessageControllers.js";
const messageRouter = express.Router();

//route to get all users for sidebar
messageRouter.get("/users", protectRoute, getUsersForSidebar);

//route to get all messages from a user
messageRouter.get("/:id", protectRoute, getMessages);

//route to mark messages as seen
messageRouter.put("/mark/:id", protectRoute, markMessagesAsSeen);

messageRouter.post("/send/:id", protectRoute,sendMessage);

export default messageRouter; 