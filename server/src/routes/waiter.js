import * as waiterController from "../controllers/waiterController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import express from "express";
// ...
const router = express.Router();
router.use(verifyToken);
router.get("/orders", waiterController.getActiveOrders);
router.get("/menu", waiterController.getMenu);
router.get("/round/:roundId", waiterController.getRoundDetail);
router.post("/round/start", waiterController.startRound); // Tạo lượt
router.post("/round/add-items", waiterController.addItemsToRound); // Thêm món
router.post("/round/status", waiterController.updateRoundStatus);

export default router;
