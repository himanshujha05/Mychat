// server.js
import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/MessageRoutes.js";

const app = express();
const httpServer = http.createServer(app);

app.use(express.json({ limit: "4mb" }));
app.use(cors());

export const io = new SocketIOServer(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] },
});

export const userSocketMap = {};

io.on("connection", (socket) => {
  const userId = socket.handshake?.query?.userId;
  if (userId) {
    userSocketMap[userId] = socket.id;
    io.emit("getOnlineusers", Object.keys(userSocketMap));
    socket.on("disconnect", () => {
      delete userSocketMap[userId];
      io.emit("getOnlineusers", Object.keys(userSocketMap));
    });
  }
});

app.get("/", (_req, res) => res.send("API OK"));
app.get("/api/status", (_req, res) => res.send("Server is running"));

app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

const PORT = process.env.PORT || 5001;

async function start() {
  console.log("[BOOT] starting server");
  try {
    await connectDB();
    console.log("[DB] connected");
  } catch (err) {
    console.error("[DB] connection failed:", err?.message || err);
  }
  httpServer.listen(PORT, () => {
    console.log(`[LISTEN] http://localhost:${PORT}`);
  });
}

start();
