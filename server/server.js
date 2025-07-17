import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";

let isConnected = false;
let io;
let server;

const getServer = async () => {
  const app = express();

  app.use(express.json({ limit: "4mb" }));
  app.use(cors());

  app.use("/api/status", (req, res) => res.send("Server is on"));
  app.use("/api/auth", userRouter);
  app.use("/api/messages", messageRouter);

  // Connect to MongoDB once
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }

  server = http.createServer(app);

  if (!io) {
    io = new Server(server, {
      cors: { origin: "*" },
    });

    const userSocketMap = {};

    io.on("connection", (socket) => {
      const userId = socket.handshake.query.userId;
      console.log("User Connected", userId);
      if (userId) userSocketMap[userId] = socket.id;

      io.emit("getOnlineUsers", Object.keys(userSocketMap));

      socket.on("disconnect", () => {
        console.log("User Disconnected", userId);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
      });
    });
  }

  return server;
};

export default async (req, res) => {
  const srv = await getServer();
  srv.emit("request", req, res);
};
