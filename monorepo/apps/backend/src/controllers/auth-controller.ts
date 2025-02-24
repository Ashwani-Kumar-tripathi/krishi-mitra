import { Request, Response } from "express";
import { generateToken, clearToken } from "../utils/auth";
import User from "../models/user-model";
import bcrypt from "bcryptjs";
import Redis from "ioredis";

const redis = new Redis(); // Initialize Redis for session & rate-limiting

const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email }).select("_id");

    if (userExists) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    if (user) {
      generateToken(res, user._id as string);

      return res.status(201).json({
        success: true,
        id: user._id,
        name: user.name,
        email: user.email,
      });
    } else {
      return res.status(500).json({ success: false, message: "Error creating user" });
    }
  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const authenticateUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Implement rate limiting (max 5 attempts per 15 min)
    const failedAttemptsKey = `login_attempts:${email}`;
    const attempts = (await redis.get(failedAttemptsKey)) || "0";

    if (parseInt(attempts) >= 5) {
      return res.status(429).json({ success: false, message: "Too many failed login attempts. Try again later." });
    }

    const user = await User.findOne({ email }).select("+password"); // Ensure password is selected

    if (user && (await bcrypt.compare(password, user.password))) {
      await redis.del(failedAttemptsKey); // Reset failed attempts on successful login
      generateToken(res, user._id as string);

      return res.status(200).json({
        success: true,
        id: user._id,
        name: user.name,
        email: user.email,
      });
    } else {
      await redis.incr(failedAttemptsKey);
      await redis.expire(failedAttemptsKey, 900); // 15 minutes expiry

      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Auth Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const logoutUser = (req: Request, res: Response) => {
  try {
    clearToken(res);
    return res.status(200).json({ success: true, message: "User logged out successfully" });
  } catch (error) {
    console.error("Logout Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export { registerUser, authenticateUser, logoutUser };
