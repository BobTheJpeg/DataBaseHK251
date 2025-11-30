import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

import {
  getTables,
  getBookings,
  createBooking,
  updateTableStatus,
  updateBooking,
  deleteBooking,
  checkInBooking,
  cancelBooking,
} from "../controllers/receptionController.js";

const router = express.Router();

router.get("/tables", getTables);
router.get("/bookings", getBookings);
// router.put("/book/:id", updateBooking);
// router.delete("/book/:id", deleteBooking);
router.post("/book", createBooking);
router.post("/check-in/:id", checkInBooking);
router.post("/cancel/:id", cancelBooking);
// router.post("/table-status", updateTableStatus);

export default router;
