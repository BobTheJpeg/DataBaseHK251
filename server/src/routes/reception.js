import express from "express";
import {
  getTables,
  getBookings,
  createBooking,
  updateTableStatus,
} from "../controllers/receptionController.js";

const router = express.Router();

router.get("/tables", getTables);
router.get("/bookings", getBookings);
router.post("/book", createBooking);
router.post("/table-status", updateTableStatus);

export default router;
