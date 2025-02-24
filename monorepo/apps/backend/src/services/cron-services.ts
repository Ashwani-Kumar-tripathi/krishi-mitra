import cron from "node-cron";
import twilio from "twilio";
import IrrigationSchedule from "../models/irrigation-model";
import User from "../models/user-model"; // Ensure user model exists
import dotenv from "dotenv";

dotenv.config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// Function to send SMS
const sendSMS = async (phoneNumber: string, message: string) => {
  try {
    await client.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });
    console.log(`SMS sent to ${phoneNumber}`);
  } catch (error) {
    console.error("Error sending SMS:", error);
  }
};

// Function to process schedules
const processIrrigationSchedules = async () => {
  console.log("Checking irrigation schedules...");

  const now = new Date();
  const schedules = await IrrigationSchedule.find({ status: "pending", irrigationTime: { $lte: now } });

  if (schedules.length === 0) return; // No pending schedules

  // Fetch user phone numbers in bulk
  const userIds = schedules.map((s) => s.userId);
  const users = await User.find({ _id: { $in: userIds } }, { _id: 1, phoneNumber: 1 });
  const userMap = new Map(users.map((user) => [user._id as string, user.phoneNumber]));

  // Send SMS notifications
  await Promise.all(
    schedules.map(async (schedule) => {
      const userPhone = userMap.get(schedule.userId.toString());
      if (!userPhone) return;

      const message = `Reminder: It's time for irrigation! Soil Type: ${schedule.soilType}, Duration: ${schedule.duration} mins.`;
      await sendSMS(userPhone, message);
    })
  );

  // Bulk update schedule status
  await IrrigationSchedule.updateMany(
    { _id: { $in: schedules.map((s) => s._id) } },
    { $set: { status: "completed" } }
  );
};

// Cron job runs every minute
cron.schedule("* * * * *", async () => {
  try {
    await processIrrigationSchedules();
  } catch (error) {
    console.error("Cron job failed:", error);
  }
});

console.log("Cron job for irrigation alerts started...");
