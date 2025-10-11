import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Middleware to protect routes
export const protectRoute = async (req, res, next) => {
  try {
    // ✅ Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "jwt must be provided" });
    }

    const token = authHeader.split(" ")[1]; // Get the token after 'Bearer'
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select("-password");
    if (!user)
      return res.json({ success: false, message: "User not available" });

    req.user = user;
    next();
  } catch (e) {
    console.log(e.message);
    return res.json({ success: false, message: e.message });
  }
};
