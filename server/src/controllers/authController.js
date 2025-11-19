import sql from "mssql";
import { pool, poolConnect } from "../db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { config } from "../config.js";

export async function login(req, res) {
  const { email, password } = req.body;

  try {
    await poolConnect;
    const result = await pool
      .request()
      .input("email", sql.VarChar, email)
      .query("SELECT * FROM users WHERE email = @email");

    const user = result.recordset[0];
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role },
      config.jwtSecret,
      { expiresIn: "8h" }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
export async function seedUser(req, res) {
  const body = req.body;

  // Ensure input is an array (so both single + multiple work)
  const users = Array.isArray(body) ? body : [body];

  try {
    await poolConnect;

    const results = [];

    for (let u of users) {
      const hash = await bcrypt.hash(u.password, 10);

      const result = await pool
        .request()
        .input("name", sql.VarChar, u.name)
        .input("email", sql.VarChar, u.email)
        .input("password_hash", sql.VarChar, hash)
        .input("role", sql.VarChar, u.role).query(`
          INSERT INTO users (name, email, password_hash, role)
          VALUES (@name, @email, @password_hash, @role)
          SELECT SCOPE_IDENTITY() AS id;
        `);

      results.push({
        id: result.recordset[0].id,
        name: u.name,
        email: u.email,
        role: u.role,
      });
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
