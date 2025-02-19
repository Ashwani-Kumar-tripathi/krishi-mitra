import express from "express";
import { fetchWeather } from "../controllers/weather-controller";

const router = express.Router();

router.get("/weather", fetchWeather);

export default router;