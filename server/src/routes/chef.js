import express from "express";
import {
  getKitchenQueue,
  getChefRequests,
  updateOrderStatus,
  submitMenuRequest,
} from "../controllers/chefController.js";

const router = express.Router();

router.get("/queue", getKitchenQueue);
router.put("/update-order", updateOrderStatus);
router.post("/submit", submitMenuRequest);
router.get("/requests", getChefRequests);

export default router;
