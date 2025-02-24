import OpenAI from "openai";
import { FarmlandDocument } from "../models/farmland-model";
import Redis from "ioredis";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const redis = new Redis(); // Connect to Redis for caching

const USE_MOCK = false; // Toggle for local testing

type CropRecommendationResponse = {
  success: boolean;
  message: string;
  recommendedCrops?: string;
  error?: string;
};

// Mock API Response (for testing without OpenAI)
async function getRecommendedCropsMock(farmland: FarmlandDocument): Promise<CropRecommendationResponse> {
  console.log("Mock API call: returning fake data...");
  return {
    success: true,
    message: "Mocked crop recommendation.",
    recommendedCrops: "Wheat, Rice, Maize",
  };
}

// Main function for fetching crop recommendations
export const getRecommendedCrops = async (farmland: FarmlandDocument): Promise<CropRecommendationResponse> => {
  try {
    if (USE_MOCK) return await getRecommendedCropsMock(farmland);

    // Generate unique cache key
    const cacheKey = `crop-recommendation:${JSON.stringify(farmland)}`;

    // Check Redis Cache
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log("Serving from cache...");
      return JSON.parse(cachedData);
    }

    // Optimized Prompt for OpenAI
    const prompt = `
      Based on the following farmland conditions, recommend 3 suitable crops:

      Soil Type: ${farmland.soilProperties.soilType}
      pH: ${farmland.soilProperties.pH}
      Organic Matter: ${farmland.soilProperties.organicMatter}
      NPK Levels: N=${farmland.soilProperties.nutrients.nitrogen}, P=${farmland.soilProperties.nutrients.phosphorus}, K=${farmland.soilProperties.nutrients.potassium}
      Climate: Temp=${farmland.climate.avgTemperature ?? "Unknown"}, Rainfall=${farmland.climate.rainfall ?? "Unknown"}, Humidity=${farmland.climate.humidity ?? "Unknown"}

      Respond with only the crop names, comma-separated (e.g., Wheat, Rice, Maize).
    `;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are an expert in agriculture." },
        { role: "user", content: prompt },
      ],
      max_tokens: 50, // Reduce tokens to save cost
    });

    const aiRecommendation = completion.choices[0]?.message?.content?.trim() || "No recommendation available.";

    // Store response in Redis with a TTL (Time-to-Live) of 6 hours
    const response: CropRecommendationResponse = {
      success: true,
      message: "Crop recommendation fetched successfully.",
      recommendedCrops: aiRecommendation,
    };

    await redis.set(cacheKey, JSON.stringify(response), "EX", 21600); // 6 hours

    return response;
  } catch (error) {
    console.error("Error fetching crop recommendation:", error instanceof Error ? error.message : error);

    return { 
      success: false, 
      message: "Failed to fetch crop recommendation. Please try again later.", 
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
};
