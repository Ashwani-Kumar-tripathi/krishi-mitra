import { Request, Response } from "express";
import { Farmland } from "../models/farmland-model";
import { getRecommendedCrops } from "../services/gpt-crop-recommendation";
import { Crop } from "../models/crop-model";


const addFarmland = async (req: Request, res: Response): Promise<Response> => {
  try {
    const {
      name,
      location,
      soilProperties,
      climate,
      currentCrop,
      cropHistory,
    } = req.body;

    // Validate required fields
    if (!name || !location || !soilProperties || !climate) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields: name, location, soilProperties, and climate.",
      });
    }

    // Validate location coordinates
    if (!Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
      return res.status(400).json({
        success: false,
        message: "Invalid location format. Coordinates should be an array [longitude, latitude].",
      });
    }

    // Validate soil type
    const validSoilTypes = ["sandy", "clay", "loamy", "silty", "peaty"];
    if (!validSoilTypes.includes(soilProperties.soilType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid soil type. Choose from: sandy, clay, loamy, silty, peaty.",
      });
    }

    // Create a new farmland document
    const newFarmland = new Farmland({
      name,
      location,
      soilProperties,
      climate,
      currentCrop: currentCrop || null,
      cropHistory: cropHistory || [],
    });

    // Save to database
    await newFarmland.save();

    return res.status(201).json({
      success: true,
      message: "Farmland data added successfully.",
      farmland: newFarmland,
    });

  } catch (error) {
    console.error("Error adding farmland:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};


const getGptRecommendation = async (req: Request, res: Response): Promise<Response> => {
  try {
    let farmlandData;

    if (req.body.farmlandId) {
      // Fetch farmland from DB
      farmlandData = await Farmland.findById(req.body.farmlandId);
      if (!farmlandData) {
        return res.status(404).json({ success: false, message: "Farmland not found." });
      }
    } else if (req.body.soilProperties && req.body.climate) {
      // Use farmland details from the body (one-time request, no saving)
      farmlandData = req.body;
    } else {
      return res.status(400).json({ success: false, message: "Provide a farmlandId or full farmland details." });
    }

    // Get crop recommendations
    const recommendation = await getRecommendedCrops(farmlandData);

    return res.status(200).json({
      success: true,
      message: "Farmland details retrieved successfully.",
      farmland: farmlandData,
      recommendedCrops: recommendation.recommendedCrops,
    });
  } catch (error) {
    console.error("Error fetching farmland details:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

const getManualCropRecommendation = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { soilProperties, climate } = req.body;
  
      if (!soilProperties || !climate) {
        return res.status(400).json({ success: false, message: "Provide soilProperties and climate conditions." });
      }
  
      // Fetch all crops
      const crops = await Crop.find();
  
      // Score each crop based on match percentage
      const scoredCrops = crops.map((crop) => {
        let score = 0;
  
        // Soil Type Match (Most Important)
        if (crop.idealSoilType === soilProperties.soilType) {
          score += 40;
        }
  
        // pH Range Match
        if (soilProperties.pH >= crop.idealpHRange.min && soilProperties.pH <= crop.idealpHRange.max) {
          score += 20;
        }
  
        // Climate Match (Temperature, Rainfall, Humidity)
        if (
          (crop.climate.idealTemperature.min === null || climate.avgTemperature >= crop.climate.idealTemperature.min) &&
          (crop.climate.idealTemperature.max === null || climate.avgTemperature <= crop.climate.idealTemperature.max)
        ) {
          score += 15;
        }
  
        if (crop.climate.rainfall === null || climate.rainfall >= crop.climate.rainfall) {
          score += 10;
        }
  
        if (crop.climate.humidity === null || climate.humidity >= crop.climate.humidity) {
          score += 10;
        }
  
        // Nutrient Match (Basic Check)
        if (
          parseInt(crop.nutrientRequirement.nitrogen) <= soilProperties.nutrients.nitrogen &&
          parseInt(crop.nutrientRequirement.phosphorus) <= soilProperties.nutrients.phosphorus &&
          parseInt(crop.nutrientRequirement.potassium) <= soilProperties.nutrients.potassium
        ) {
          score += 5;
        }
  
        return { crop, score };
      });
  
      // Sort crops from best match to least
      scoredCrops.sort((a, b) => b.score - a.score);
  
      return res.status(200).json({
        success: true,
        message: "Crops recommended based on manual filtering.",
        recommendedCrops: scoredCrops.map((item) => ({
          name: item.crop.name,
          score: item.score,
          idealSoilType: item.crop.idealSoilType,
          pHRange: item.crop.idealpHRange,
          climate: item.crop.climate,
        })),
      });
    } catch (error) {
      console.error("Error fetching manual crop recommendations:", error);
      return res.status(500).json({ success: false, message: "Internal Server Error." });
    }
  };

export {getGptRecommendation, getManualCropRecommendation, addFarmland};