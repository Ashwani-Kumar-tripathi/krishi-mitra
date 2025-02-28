import { Request, Response } from "express";
import { Post } from "../models/post-model";

const getAllPosts = async (req: Request, res: Response) => {
  try {
    const posts = await Post.find()
      .populate("author", "name email")
      .populate("comments")
      .exec();

    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getPost = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId)
      .populate("author", "name email")
      .populate({
        path: "comments",
        populate: {
          path: "reply",
          model: "Reply",
        },
      })
      .exec();

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json(post);
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const createPost = async (req: Request, res: Response) => {
  try {
    const { title, content } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const post = await Post.create({
      title,
      content,
      author: userId,
    });
    res.status(201).json({ message: "Post created successfully", post });
  }
  catch (error) {
    console.error("Error creating post:", error);
    return res.status(500).json({ error: "server error" })
  }
}

export { getAllPosts, getPost, createPost };