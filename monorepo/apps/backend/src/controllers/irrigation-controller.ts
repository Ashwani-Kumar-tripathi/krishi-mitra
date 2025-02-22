import { Request, Response } from "express";
import { getWeather } from "../services/weather-service";
import IrrigationSchedule from "../models/irrigation-model";

// Create a new irrigation schedule
export const createSchedule = async (req: Request, res: Response) => {
  try {
    const { userId, soilType, irrigationTime, duration } = req.body;

    // Validate request body
    if (!userId || !soilType || !irrigationTime || !duration) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Fetch weather data
    const weatherData = await getWeather("Your_City");
    if (!weatherData || !weatherData.weather || weatherData.weather.length === 0) {
      return res.status(500).json({ error: "Failed to fetch valid weather data" });
    }

    const weatherCondition = weatherData.weather[0].description;

    // Skip irrigation if rain is detected
    if (weatherCondition.toLowerCase().includes("rain")) {
      return res.status(400).json({ error: "Irrigation not needed due to rain" });
    }

    // Create schedule
    const schedule = new IrrigationSchedule({
      userId,
      soilType,
      weatherCondition,
      irrigationTime,
      duration,
    });

    await schedule.save();
    res.status(201).json({ success: true, schedule });

  } catch (error) {
    console.error("Error creating schedule:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// Get all schedules
export const getSchedules = async (req: Request, res: Response) => {
  try {
    const schedules = await IrrigationSchedule.find();
    res.json({ success: true, schedules });
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};
