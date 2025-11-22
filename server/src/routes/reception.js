import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

import {
  getTables,
  getBookings,
  createBooking,
  updateTableStatus,
} from "../controllers/receptionController.js";

const router = express.Router();
// router.use(verifyToken);
// router.use(allowRoles("receptionist"));

router.get("/tables", getTables);
router.get("/bookings", getBookings);
router.post("/book", createBooking);
router.post("/table-status", updateTableStatus);

export default router;
