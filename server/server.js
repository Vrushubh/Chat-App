import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import http from 'http';
import { connectDB } from './lib/db.js';
import userRouter from './routes/userRoutes.js';
import messageRouter from './routes/messageRoutes.js';
import { Server } from 'socket.io';

// Create Express app 
const app = express();
const server = http.createServer(app);

// ✅ Use your correct frontend domain here
const allowedOrigins = [
  "https://chat-app-rt69.vercel.app", // correct Vercel domain
  "http://localhost:3000",            // optional: local dev
];

// Middleware setup — must be before routes
app.use(express.json({ limit: "4mb" }));
app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Initialize socket.io server
export const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Store online Users
export const userSocketMap = {}; // {userId : socketId}

// Socket.io Connection Handler
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("User Connected:", userId);
  if (userId) userSocketMap[userId] = socket.id;

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("User Disconnected:", userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// Routes Setup
app.use("/api/status", (req, res) => res.send("Server is on ✅"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// Connect to MongoDB
await connectDB();

app.get("/", (req, res) => {
  res.send("Backend THALA is live ✅");
});

const port = process.env.PORT || 5000;
server.listen(port, () => console.log("Server is Running on PORT:", port));

// Export server for vercel
export default server;
