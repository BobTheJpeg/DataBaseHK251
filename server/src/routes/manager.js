import express from "express";
import {
  addEmployee,
  getEmployees,
  addMenuItem,
  getMenuItems,
  getStats,
  updateEmployee,
  deleteEmployee,
  deleteMenuItem,
  updateMenuItem,
} from "../controllers/managerController.js";

const router = express.Router();

router.get("/stats", getStats);
router.get("/employees", getEmployees);
router.post("/add-employee", addEmployee);
router.put("/update-employee/:id", updateEmployee);
router.delete("/delete-employee/:id", deleteEmployee);

router.get("/menu", getMenuItems);
router.post("/add-menu-item", addMenuItem);
router.put("/update-menu-item/:id", updateMenuItem);
router.delete("/delete-menu-item/:id", deleteMenuItem);

export default router;
