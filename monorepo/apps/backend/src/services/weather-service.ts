import axios from "axios";

const API_KEY = process.env.OPENWEATHER_API_KEY;

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

export async function getWeather(city: string): Promise<WeatherResponse> {
  if (!city) {
    throw new Error("City name must be provided");
  }

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

