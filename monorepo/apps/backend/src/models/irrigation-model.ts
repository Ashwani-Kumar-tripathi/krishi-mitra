import mongoose, { Schema, Document } from "mongoose";

export interface IIrrigationSchedule extends Document {
  userId: string;
  soilType: string;
  weatherCondition: string;
  irrigationTime: Date;
  duration: number; // In minutes
  status: "pending" | "completed";
}

const IrrigationScheduleSchema = new Schema<IIrrigationSchedule>(
  {
    userId: { type: String, required: true },
    soilType: { type: String, required: true },
    weatherCondition: { type: String, required: true },
    irrigationTime: { type: Date, required: true },
    duration: { type: Number, required: true },
    status: { type: String, enum: ["pending", "completed"], default: "pending" },
  },
  { timestamps: true }
);

const IrrigationSchedule = mongoose.model<IIrrigationSchedule>("IrrigationSchedule", IrrigationScheduleSchema);
export default IrrigationSchedule;