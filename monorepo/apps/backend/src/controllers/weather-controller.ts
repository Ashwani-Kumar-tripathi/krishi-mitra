import { Request, Response } from "express";
import { getWeather } from "../services/weather-service";

export const fetchWeather = async (req: Request, res: Response) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: "Latitude and Longitude are required" });
  }

  try {
    const weatherData = await getWeather(parseFloat(lat as string), parseFloat(lon as string));
    res.json(weatherData);
  } catch (error) {
    res.status(500).json({ error: "Error fetching weather data" });
  }
};
