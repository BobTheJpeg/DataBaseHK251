import sql from "mssql";
import bcrypt from "bcrypt";
import { pool, poolConnect } from "../db.js";

/* ---------------- EMPLOYEES ---------------- */

export async function addEmployee(req, res) {
  const { name, email, password, role } = req.body;

  try {
    await poolConnect;
    const hash = await bcrypt.hash(password, 10);

    const result = await pool
      .request()
      .input("name", sql.VarChar, name)
      .input("email", sql.VarChar, email)
      .input("password_hash", sql.VarChar, hash)
      .input("role", sql.VarChar, role).query(`
        INSERT INTO users (name, email, password_hash, role)
        VALUES (@name, @email, @password_hash, @role);
        SELECT SCOPE_IDENTITY() AS id, @name AS name, @email AS email, @role AS role;
      `);

    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getEmployees(req, res) {
  try {
    await poolConnect;

    const result = await pool
      .request()
      .query("SELECT id, name, email, role FROM users ORDER BY id ASC");

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/* ---------------- MENU ---------------- */

export async function addMenuItem(req, res) {
  const { name, price, category } = req.body;

  try {
    await poolConnect;

    const result = await pool
      .request()
      .input("name", sql.VarChar, name)
      .input("price", sql.Decimal(10, 2), price)
      .input("category", sql.VarChar, category).query(`
        INSERT INTO menu_items (name, price, category)
        VALUES (@name, @price, @category);
        SELECT SCOPE_IDENTITY() AS id, @name AS name, @price AS price, @category AS category;
      `);

    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getMenuItems(req, res) {
  try {
    await poolConnect;

    const result = await pool
      .request()
      .query("SELECT * FROM menu_items ORDER BY id ASC");

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/* ---------------- DASHBOARD STATS ---------------- */

export async function getStats(req, res) {
  try {
    await poolConnect;

    const revenueToday = await pool.request().query(`
      SELECT COALESCE(SUM(total_price), 0) AS revenue
      FROM orders
      WHERE CAST(created_at AS DATE) = CAST(GETDATE() AS DATE);
    `);

    const ordersToday = await pool.request().query(`
      SELECT COUNT(*) AS count
      FROM orders
      WHERE CAST(created_at AS DATE) = CAST(GETDATE() AS DATE);
    `);

    const customersToday = await pool.request().query(`
      SELECT COALESCE(SUM(guest_count), 0) AS customers
      FROM orders
      WHERE CAST(created_at AS DATE) = CAST(GETDATE() AS DATE);
    `);

    res.json({
      revenueToday: revenueToday.recordset[0].revenue,
      ordersToday: ordersToday.recordset[0].count,
      customersToday: customersToday.recordset[0].customers,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
