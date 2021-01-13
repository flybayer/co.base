const DEFAULT_DB_URL = "postgresql://user:pw@localhost:5992/db";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = DEFAULT_DB_URL;
}

export const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) throw new Error("Error in db config.");
