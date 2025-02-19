import OpenAI from "openai";
import { FarmlandDocument } from "../models/farmland-model";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const cache = new Map(); // In-memory cache
const USE_MOCK = false; // Set true for local testing

type CropRecommendationResponse = {
  success: boolean;
  message: string;
  recommendedCrops?: string;
  error?: string;
};

// Utility function for delay (Rate Limiting)
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Mock API Response for Local Testing
async function getRecommendedCropsMock(farmland: FarmlandDocument): Promise<CropRecommendationResponse> {
  console.log("Mock API call: returning fake data...");
  return {
    success: true,
    message: "Mocked crop recommendation.",
    recommendedCrops: "Wheat, Rice, Maize",
  };
}

// Main function to fetch recommended crops
export const getRecommendedCrops = async (farmland: FarmlandDocument): Promise<CropRecommendationResponse> => {
  try {
    // Use mock response if enabled
    if (USE_MOCK) return await getRecommendedCropsMock(farmland);

    // Check cache to prevent duplicate API calls
    const cacheKey = JSON.stringify(farmland);
    if (cache.has(cacheKey)) {
      console.log("Serving from cache...");
      return cache.get(cacheKey);
    }

    await delay(3000); // Enforce a 3-second delay before calling API

    // Generate the prompt for OpenAI
    const prompt = `
      **Farmland Conditions:**
      - Soil Type: ${farmland.soilProperties.soilType}
      - pH Level: ${farmland.soilProperties.pH}
      - Organic Matter: ${farmland.soilProperties.organicMatter}
      - NPK: N=${farmland.soilProperties.nutrients.nitrogen}, P=${farmland.soilProperties.nutrients.phosphorus}, K=${farmland.soilProperties.nutrients.potassium}
      - Climate: Temp=${farmland.climate.avgTemperature ?? "Unknown"}, Rainfall=${farmland.climate.rainfall ?? "Unknown"}, Humidity=${farmland.climate.humidity ?? "Unknown"}

      Recommend the 3 best crops for these conditions with reasoning.
    `;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are an expert in agriculture and crop recommendations." },
        { role: "user", content: prompt },
      ],
    });

    // Extract AI Response
    const aiRecommendation = completion.choices[0]?.message?.content || "No recommendation available.";

    // Prepare response object
    const response: CropRecommendationResponse = {
      success: true,
      message: "Crop recommendation fetched successfully.",
      recommendedCrops: aiRecommendation,
    };

    // Store in cache to optimize performance
    cache.set(cacheKey, response);
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
