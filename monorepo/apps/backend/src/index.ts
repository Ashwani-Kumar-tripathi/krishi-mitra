import dotenv from "dotenv";
dotenv.config();
import cookieParser from "cookie-parser";
import cors from "cors";

import express from "express";
import helmet from "helmet";

import authRouter from "./routes/auth-router";
import { authenticate } from "./middlewares/auth-middleware";
import connectDB from "./connections/database";
import { errorHandler } from "./middlewares/error-handler";
import userRouter from "./routes/user-router";
import croprouter from "./routes/crop-recommendation-router"
import weather from "./routes/weather-router"
import irrigation from "./routes/irrigation-routes"
import compression from "compression";
import discussionRouter from "./routes/discussion-router"


const app = express();
const port = process.env.PORT || 8000;

export interface UserBasicInfo {
  _id: string;
  name: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserBasicInfo | null;
    }
  }
}

// NOTE: Use this only if you are deploying
// and if you wanna make this acccessible via frontend.
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);



app.use(compression());
app.use(helmet());
app.use(express.json());
app.use(authRouter);
app.use(cookieParser());
app.use(discussionRouter);
app.use("/users", authenticate, userRouter);
app.use("/crops", croprouter);
app.use("/weather", weather);

app.use("/irrigation", irrigation);
app.use(errorHandler);

connectDB();

export const config = {
  port: process.env.PORT || 8000,
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
};

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
