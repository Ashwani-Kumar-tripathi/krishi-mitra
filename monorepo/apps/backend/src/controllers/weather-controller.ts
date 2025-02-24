import { Request, Response } from "express";
import { getWeatherWithCache } from "../services/weather-service";
export const fetchWeather = async (req: Request, res: Response) => {
  const { city } = req.query;

  if (!city || typeof city !== "string") {
    return res.status(400).json({ error: "City is required" });
  }

  try {
    const weatherData = await getWeatherWithCache(city);
    
    res.json({
      location: weatherData.name,
      temperature: weatherData.main.temp,
      description: weatherData.weather[0].description,
      windSpeed: weatherData.wind.speed,
    });
  } catch (error) {
    console.error("Weather API Error:", error);
    res.status(500).json({ error: "Error fetching weather data" });
  }
};
