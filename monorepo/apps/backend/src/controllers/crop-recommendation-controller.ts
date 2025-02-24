import { Request, Response } from "express";
import { Farmland } from "../models/farmland-model";
import { getRecommendedCrops } from "../services/gpt-crop-recommendation";
import { Crop } from "../models/crop-model";
import Redis from "ioredis";

const redis = new Redis(); // Initialize Redis

const CACHE_EXPIRY = 3600; // 1 hour

const addFarmland = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { name, location, soilProperties, climate, currentCrop, cropHistory } = req.body;

    if (!name || !location || !soilProperties || !climate) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    if (!Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
      return res.status(400).json({ success: false, message: "Invalid location format." });
    }

    const validSoilTypes = ["sandy", "clay", "loamy", "silty", "peaty"];
    if (!validSoilTypes.includes(soilProperties.soilType)) {
      return res.status(400).json({ success: false, message: "Invalid soil type." });
    }

    const newFarmland = new Farmland({
      name,
      location,
      soilProperties,
      climate,
      currentCrop: currentCrop || null,
      cropHistory: cropHistory || [],
    });

    await newFarmland.save();

    // Cache farmland for quick access
    await redis.set(`farmland:${newFarmland._id}`, JSON.stringify(newFarmland), "EX", CACHE_EXPIRY);

    return res.status(201).json({ success: true, message: "Farmland added successfully.", farmland: newFarmland });
  } catch (error) {
    console.error("Error adding farmland:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

const getGptRecommendation = async (req: Request, res: Response): Promise<Response> => {
  try {
    let farmlandData;

    if (req.body.farmlandId) {
      // Try fetching from cache first
      const cachedData = await redis.get(`farmland:${req.body.farmlandId}`);
      if (cachedData) {
        farmlandData = JSON.parse(cachedData);
      } else {
        // Fetch from DB with projections (fetch only needed fields)
        farmlandData = await Farmland.findById(req.body.farmlandId).select("soilProperties climate");
        if (!farmlandData) {
          return res.status(404).json({ success: false, message: "Farmland not found." });
        }
        await redis.set(`farmland:${req.body.farmlandId}`, JSON.stringify(farmlandData), "EX", CACHE_EXPIRY);
      }
    } else if (req.body.soilProperties && req.body.climate) {
      farmlandData = req.body;
    } else {
      return res.status(400).json({ success: false, message: "Provide farmlandId or farmland details." });
    }

    const recommendation = await getRecommendedCrops(farmlandData);

    return res.status(200).json({
      success: true,
      message: "Crop recommendation fetched successfully.",
      farmland: farmlandData,
      recommendedCrops: recommendation.recommendedCrops,
    });
  } catch (error) {
    console.error("Error fetching GPT recommendation:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

const getManualCropRecommendation = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { soilProperties, climate } = req.body;
    if (!soilProperties || !climate) {
      return res.status(400).json({ success: false, message: "Provide soilProperties and climate conditions." });
    }

    const cacheKey = `crop-recommendation:${JSON.stringify(soilProperties)}:${JSON.stringify(climate)}`;
    const cachedRecommendation = await redis.get(cacheKey);

    if (cachedRecommendation) {
      return res.status(200).json({ success: true, message: "Cached crop recommendations.", recommendedCrops: JSON.parse(cachedRecommendation) });
    }

    const crops = await Crop.find().select("name idealSoilType idealpHRange climate nutrientRequirement");

    const scoredCrops = crops.map((crop) => {
      let score = 0;
      if (crop.idealSoilType === soilProperties.soilType) score += 40;
      if (soilProperties.pH >= crop.idealpHRange.min && soilProperties.pH <= crop.idealpHRange.max) score += 20;
      if (
        (crop.climate.idealTemperature.min === null || climate.avgTemperature >= crop.climate.idealTemperature.min) &&
        (crop.climate.idealTemperature.max === null || climate.avgTemperature <= crop.climate.idealTemperature.max)
      ) score += 15;
      if (crop.climate.rainfall === null || climate.rainfall >= crop.climate.rainfall) score += 10;
      if (crop.climate.humidity === null || climate.humidity >= crop.climate.humidity) score += 10;
      if (
        parseInt(crop.nutrientRequirement.nitrogen) <= soilProperties.nutrients.nitrogen &&
        parseInt(crop.nutrientRequirement.phosphorus) <= soilProperties.nutrients.phosphorus &&
        parseInt(crop.nutrientRequirement.potassium) <= soilProperties.nutrients.potassium
      ) score += 5;
      return { crop, score };
    });

    scoredCrops.sort((a, b) => b.score - a.score);

    const recommendedCrops = scoredCrops.map((item) => ({
      name: item.crop.name,
      score: item.score,
      idealSoilType: item.crop.idealSoilType,
      pHRange: item.crop.idealpHRange,
      climate: item.crop.climate,
    }));

    await redis.set(cacheKey, JSON.stringify(recommendedCrops), "EX", CACHE_EXPIRY);

    return res.status(200).json({ success: true, message: "Crops recommended based on manual filtering.", recommendedCrops });
  } catch (error) {
    console.error("Error fetching manual crop recommendations:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

export { getGptRecommendation, getManualCropRecommendation, addFarmland };
