import sql from "mssql";

// MSSQL connection settings
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER, // localhost
  database: process.env.DB_NAME, // RestaurantDB
  options: {
    trustServerCertificate: true, // required for local dev
  },
};

export const pool = new sql.ConnectionPool(config);
export const poolConnect = pool.connect();
