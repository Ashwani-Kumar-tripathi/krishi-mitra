import { Request, Response } from "express";
import mongoose from "mongoose";
import { Comments } from "../models/comment-model";
import { Post } from "../models/post-model";

export const addComment = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!content) {
      return res.status(400).json({ message: "Comment content is required" });
    }

    // Create new comment
    const newComment = new Comments({
      post: new mongoose.Types.ObjectId(postId),
      content,
      author: new mongoose.Types.ObjectId(userId),
    });

    await newComment.save();

    // Push comment ID to Post's comments array
    await Post.findByIdAndUpdate(postId, { $push: { comments: newComment._id } });

    res.status(201).json({ message: "Comment added", comment: newComment });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  try {
      const { commentId } = req.params;
      const userId = req.user?._id;

      if (!userId) {
          return res.status(401).json({ message: "Unauthorized" });
      }

      if (!mongoose.Types.ObjectId.isValid(commentId)) {
          return res.status(400).json({ message: "Invalid comment ID" });
      }

      // Find the comment
      const comment = await Comments.findById(commentId);
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      // Ensure `author` exists before checking ownership
      if (!comment.author || comment.author.toString() !== userId.toString()) {
        return res.status(403).json({ message: "Not authorized to delete this comment" });
      }

      if (comment.post) {
        await Post.findByIdAndUpdate(comment.post, { $pull: { comments: commentId } });
      }
      
      // Delete all replies associated with the comment
      if (comment.reply && comment.reply.length > 0) {
        await Comments.deleteMany({ _id: { $in: comment.reply } });
      }
      // Delete the comment
      await Comments.findByIdAndDelete(commentId);

      res.status(200).json({ message: "Comment and its replies deleted successfully" });
  } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "Server error" });
  }
};
