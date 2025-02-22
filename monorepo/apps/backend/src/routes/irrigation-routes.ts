import express from "express";
import { createSchedule, getSchedules } from "../controllers/irrigation-controller";

const router = express.Router();

router.post("/createschedule", createSchedule);
router.get("/getschedules", getSchedules);

export default router;
