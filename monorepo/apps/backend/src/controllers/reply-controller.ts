import { Request, Response } from "express";
import mongoose from "mongoose";
import { Reply } from "../models/reply-model";
import { Comments } from "../models/comment-model";

const addReply = async (req: Request, res: Response) => {
    try {
        const { content } = req.body;
        const userId = req.user?._id;
        const { commentId, postId } = req.params;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!commentId) {
            return res.status(400).json({ message: "Comment ID is required" });
        }

        if (!content) {
            return res.status(400).json({ message: "Reply content is required" });
        }

        // Create new reply
        const newReply = new Reply({
            post: new mongoose.Types.ObjectId(postId),
            comment: new mongoose.Types.ObjectId(commentId),
            content,
            author: new mongoose.Types.ObjectId(userId),
        });

        await newReply.save();

        // Push Reply ID to comment's `replies` array
        await Comments.findByIdAndUpdate(commentId, { $push: { replies: newReply._id } });

        res.status(201).json({ message: "Reply added successfully", reply: newReply });
    } catch (error) {
        console.error("Error adding reply:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const deletereply = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;
        const { commentId, replyId } = req.params;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!mongoose.Types.ObjectId.isValid(replyId)) {
            return res.status(400).json({ message: "Invalid reply ID" });
        }

        const reply = await Reply.findById(replyId);
        if (!reply) {
            return res.status(404).json({ message: "Reply not found" });
        }

        // Ensure only the author can delete the reply
        if (!reply.author || reply.author.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Not authorized to delete this reply" });
        }

        // Remove reply ID from the comment's `replies` array
        await Comments.findByIdAndUpdate(commentId, { $pull: { replies: replyId } });

        // Delete the reply itself
        await Reply.findByIdAndDelete(replyId);

        res.status(200).json({ message: "Reply deleted successfully" });
    } catch (error) {
        console.error("Error deleting reply:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export { addReply, deletereply };