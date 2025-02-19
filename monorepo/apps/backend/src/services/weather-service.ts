import axios from "axios";

const API_KEY = process.env.OPENWEATHER_API_KEY; // Store API key in .env

export async function getWeather(lat: number, lon: number) {
  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching weather data:", error);
    throw new Error("Failed to fetch weather data");
  }
}
