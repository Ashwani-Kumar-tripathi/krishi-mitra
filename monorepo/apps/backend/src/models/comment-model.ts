import mongoose from "mongoose";

export interface IComment extends Document {
    post?: mongoose.Types.ObjectId;
    content?: string;
    author?: mongoose.Types.ObjectId;
    reply: mongoose.Types.ObjectId[];
    likes: mongoose.Types.ObjectId[];
    createdAt: Date;
}
  
const CommentSchema = new mongoose.Schema({
    post: {type: mongoose.Schema.Types.ObjectId, ref:"post"},
    content: String,
    author: {type: mongoose.Schema.Types.ObjectId, ref:"User"},
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    reply: [{type: mongoose.Schema.Types.ObjectId, ref:"reply"}],
    createdAt: {type: Date, default: Date.now}
});

export const Comments = mongoose.model("Comments", CommentSchema);