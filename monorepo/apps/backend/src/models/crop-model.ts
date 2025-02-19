import mongoose, { Document, Schema } from "mongoose";

// 🌱 Crop Schema
export interface Crop extends Document {
  name: string;
  idealSoilType: "sandy" | "clay" | "loamy" | "silty" | "peaty";
  idealpHRange: {
    min: number;
    max: number;
  };
  waterRequirement: string;
  nutrientRequirement: {
    nitrogen: string;
    phosphorus: string;
    potassium: string;
  };
  climate: {
    idealTemperature: {
      min: number | null;
      max: number | null;
    };
    rainfall: number | null;
    humidity: number | null;
  };
}

const CropSchema = new Schema({
  name: { type: String, required: true },
  idealSoilType: { type: String, enum: ["sandy", "clay", "loamy", "silty", "peaty"], required: true },
  idealpHRange: {
    min: { type: Number, required: true },
    max: { type: Number, required: true },
  },
  waterRequirement: { type: String, required: true },
  nutrientRequirement: {
    nitrogen: { type: String, required: true },
    phosphorus: { type: String, required: true },
    potassium: { type: String, required: true },
  },
  climate: {
    idealTemperature: {
      min: { type: Number, default: null },
      max: { type: Number, default: null },
    },
    rainfall: { type: Number, default: null },
    humidity: { type: Number, default: null },
  },
});

export const Crop = mongoose.model<Crop>("Crop", CropSchema);
