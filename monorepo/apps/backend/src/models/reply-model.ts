import mongoose from "mongoose";

const ReplySchema = new mongoose.Schema({
    post:{type: mongoose.Schema.Types.ObjectId, ref: "post"},
    comment: { type: mongoose.Schema.Types.ObjectId, ref: "Comment" },
    content: String,
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    author: {type: mongoose.Schema.Types.ObjectId, ref:"User"},
    createdAt: {type: Date, default: Date.now}
});

export const Reply = mongoose.model("Reply", ReplySchema);