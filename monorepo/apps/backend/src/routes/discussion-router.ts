//deletecomment and addcomment
//likecomment, likepost, likereply
//getAllPost, createPost, getPost
//addreply, deletereply

import express from "express";
import { addComment, deleteComment } from "../controllers/comment-controller";
import { likeComment, likePost, likeReply } from "../controllers/like-controller";
import { getAllPosts, createPost, getPost } from "../controllers/post-controller";
import { addReply, deletereply } from "../controllers/reply-controller";

const router = express.Router();

router.post("/comments/:postId", addComment); // Add comment to a post
router.delete("/comments/:commentId", deleteComment); // Delete a comment

router.post("/comments/:commentId/like", likeComment); // Like/unlike a comment
router.post("/posts/:postId/like", likePost); // Like/unlike a post
router.post("/replies/:replyId/like", likeReply); // Like/unlike a reply

router.get("/posts", getAllPosts); // Get all posts
router.get("/posts/:postId", getPost); // Get a single post
router.post("/posts", createPost); // Create a post

router.post("/replies/:commentId", addReply); // Add a reply to a comment
router.delete("/replies/:commentId/:replyId", deletereply); // Delete a reply

export default router;
