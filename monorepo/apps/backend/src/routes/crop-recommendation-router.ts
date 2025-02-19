import { Request, Response, NextFunction, Router } from "express";
import { getGptRecommendation, getManualCropRecommendation, addFarmland } from "../controllers/crop-recommendation-controller";

const router = Router();

const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
  
router.post("/gpt-recommendation", asyncHandler(getGptRecommendation));
router.post("/manual-recommendation", asyncHandler(getManualCropRecommendation));
router.post("/add-farmland", asyncHandler(addFarmland));

export default router;
