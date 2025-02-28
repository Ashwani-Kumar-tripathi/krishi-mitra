import mongoose from "mongoose";

const PostSchema = new mongoose.Schema({
    title: String,
    content: String,
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    author: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    comments: [{type: mongoose.Schema.Types.ObjectId, ref: "comments"}],
    createdAt: {type: Date, default: Date.now}
});

export const Post = mongoose.model("post", PostSchema);