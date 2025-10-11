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

// Initialize socket.io server
export const io = new Server(server,{
    cors : {origin: "*"}
})

// Store online Users
export const userSocketMap = {}; //{userId : socketId}

// Socket.io Connection Handler

io.on("connection" , (socket)=>{
    const userId = socket.handshake.query.userId;
    console.log("User Connected" , userId);
    if(userId) userSocketMap[userId] = socket.id;
    
    //Emit online users to all connected clients
    io.emit("getOnlineUsers",Object.keys(userSocketMap));

    socket.on("disconnect" , ()=>{
        console.log("User Disconnected" , userId);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers" , Object.keys(userSocketMap))
        
    })
})

//Middleware setup
app.use(express.json({limit : "4mb"}))
app.use(cors({
  origin: ["https://chat-app-ryd8.vercel.app"], // your Vercel URL
  credentials: true
}));

// Routes Setup
app.use("/api/status" , (req,res)=> res.send("Server is on"));
app.use("/api/auth" , userRouter);
app.use("/api/messages" , messageRouter);

// Connect to MongoDB
await connectDB();


const port = process.env.PORT || 5000;
server.listen(port , ()=> console.log("Server is Running on PORT : " + port));


//Export sever for vercel
export default server;
