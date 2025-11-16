import { pool } from "../db.js";
import bcrypt from "bcrypt";

/* ---------------- EMPLOYEES ---------------- */

export async function addEmployee(req, res) {
  const { name, email, password, role } = req.body;

  try {
    const hash = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      "INSERT INTO users(name, email, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING id, name, email, role",
      [name, email, hash, role]
    );

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getEmployees(req, res) {
  const { rows } = await pool.query(
    "SELECT id, name, email, role FROM users ORDER BY id ASC"
  );
  res.json(rows);
}

/* ---------------- MENU ---------------- */

export async function addMenuItem(req, res) {
  const { name, price, category } = req.body;

  try {
    const { rows } = await pool.query(
      "INSERT INTO menu_items(name, price, category) VALUES ($1,$2,$3) RETURNING *",
      [name, price, category]
    );

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getMenuItems(req, res) {
  const { rows } = await pool.query("SELECT * FROM menu_items ORDER BY id ASC");
  res.json(rows);
}

/* ---------------- DASHBOARD STATS ---------------- */

export async function getStats(req, res) {
  try {
    const revenueToday = await pool.query(`
      SELECT COALESCE(SUM(total_price), 0) AS revenue
      FROM orders
      WHERE DATE(created_at) = CURRENT_DATE;
    `);

    const ordersToday = await pool.query(`
      SELECT COUNT(*) AS count
      FROM orders
      WHERE DATE(created_at) = CURRENT_DATE;
    `);

    const customersToday = await pool.query(`
      SELECT COALESCE(SUM(guest_count), 0) AS customers
      FROM orders
      WHERE DATE(created_at) = CURRENT_DATE;
    `);

    res.json({
      revenueToday: revenueToday.rows[0].revenue,
      ordersToday: ordersToday.rows[0].count,
      customersToday: customersToday.rows[0].customers,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
