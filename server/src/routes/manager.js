import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

import {
  addEmployee,
  getEmployees,
  addMenuItem,
  getMenuItems,
  getStats,
} from "../controllers/managerController.js";

const router = express.Router();

// everything requires auth + manager role
router.use(verifyToken);
router.use(allowRoles("manager"));

router.get("/stats", getStats);
router.get("/employees", getEmployees);
router.post("/add-employee", addEmployee);

router.get("/menu", getMenuItems);
router.post("/add-menu-item", addMenuItem);

export default router;
