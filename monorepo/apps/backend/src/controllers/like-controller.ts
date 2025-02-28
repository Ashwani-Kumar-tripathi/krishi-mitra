import { Request, Response } from "express";
import mongoose from "mongoose";
import { Comments } from "../models/comment-model";
import { Post } from "../models/post-model";
import { Reply } from "../models/reply-model";

const toggleLike = async (
  model: mongoose.Model<any>,
  id: string,
  userId: string,
  res: Response
) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const document = await model.findById(id);
    if (!document) {
      return res.status(404).json({ message: "Not found" });
    }

    if (!document.likes) document.likes = [];

    const userIdStr = userId.toString();
    const index = document.likes.findIndex((likeId: mongoose.Types.ObjectId) => likeId.toString() === userIdStr);

    if (index === -1) {
      document.likes.push(userId);
    } else {
      document.likes.splice(index, 1);
    }

    await document.save();
    return res.status(200).json({ message: "Like updated", likes: document.likes.length });
  } catch (error) {
    console.error("Error updating like:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const likeComment = async (req: Request, res: Response) => {
  const { commentId } = req.params;
  const userId = req.user?._id;
  
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  return toggleLike(Comments, commentId, userId, res);
};

export const likePost = async (req: Request, res: Response) => {
  const { postId } = req.params;
  const userId = req.user?._id;
  
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  return toggleLike(Post, postId, userId, res);
};

export const likeReply = async (req: Request, res: Response) => {
  const { replyId } = req.params;
  const userId = req.user?._id;
  
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  return toggleLike(Reply, replyId, userId, res);
};
