import mongoose, { Document, Schema } from "mongoose";

// 🌾 Farmland Schema
export interface FarmlandDocument extends Document {
  name: string;
  location: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  soilProperties: {
    soilType: "sandy" | "clay" | "loamy" | "silty" | "peaty";
    pH: number;
    organicMatter: number;
    nutrients: {
      nitrogen: number;
      phosphorus: number;
      potassium: number;
    };
  };
  climate: {
    avgTemperature: number | null;
    rainfall: number | null;
    humidity: number | null;
  };
  currentCrop: mongoose.Types.ObjectId | null;
  cropHistory: mongoose.Types.ObjectId[];
}

const FarmlandSchema = new Schema({
  name: { type: String, required: true },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true },
  },
  soilProperties: {
    soilType: { type: String, enum: ["sandy", "clay", "loamy", "silty", "peaty"], required: true },
    pH: { type: Number, required: true },
    organicMatter: { type: Number, default: 0 },
    nutrients: {
      nitrogen: { type: Number, default: 0 },
      phosphorus: { type: Number, default: 0 },
      potassium: { type: Number, default: 0 },
    },
  },
  climate: {
    avgTemperature: { type: Number, default: null },
    rainfall: { type: Number, default: null },
    humidity: { type: Number, default: null },
  },
  currentCrop: { type: mongoose.Schema.Types.ObjectId, ref: "Crop", default: null },
  cropHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: "Crop" }],
});

FarmlandSchema.index({ location: "2dsphere" });

export const Farmland = mongoose.model<FarmlandDocument>("Farmland", FarmlandSchema);
