import axios from "axios";
import Redis from "ioredis";

const API_KEY = process.env.OPENWEATHER_API_KEY;
if (!API_KEY) throw new Error("Missing OpenWeather API Key");

const redis = new Redis();

interface WeatherResponse {
  weather: { id: number; main: string; description: string; icon: string }[];
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  wind: { speed: number; deg: number };
  name: string;
}

// Function to fetch live weather data
async function getWeather(city: string): Promise<WeatherResponse> {
  if (!city) throw new Error("City name must be provided");

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
      city
    )}&units=metric&appid=${API_KEY}`;

    const response = await axios.get<WeatherResponse>(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching weather data:", error);
    throw new Error("Failed to fetch weather data");
  }
}

// Function to check cache first before calling API
export async function getWeatherWithCache(city: string): Promise<WeatherResponse> {
  if (!city) throw new Error("City is required");

  const cachedWeather = await redis.get(city);
  if (cachedWeather) return JSON.parse(cachedWeather); // Return cached data if exists

  // Fetch new data if not in cache
  const weatherData = await getWeather(city);
  await redis.set(city, JSON.stringify(weatherData), "EX", 3600); // Cache for 1 hour

  return weatherData;
}
