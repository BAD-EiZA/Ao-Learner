/**
 * Diagnose Postgres connection (Supabase / Neon).
 * Usage: npm run db:ping
 */
import "dotenv/config";
import dns from "node:dns";
import { Pool } from "pg";
import { dbConnectionString } from "../src/lib/db/prisma";

dns.setDefaultResultOrder("ipv4first");

async function tryConnect(label: string, connectionString: string) {
  // strip sslmode so modern pg does not force verify-full
  let cs = connectionString;
  try {
    const u = new URL(cs);
    u.searchParams.delete("sslmode");
    u.searchParams.delete("channel_binding");
    cs = u.toString();
  } catch {
    /* keep raw */
  }

  const pool = new Pool({
    connectionString: cs,
    max: 1,
    connectionTimeoutMillis: 30_000,
    ssl: { rejectUnauthorized: false },
  });
  const t0 = Date.now();
  try {
    const r = await pool.query("select 1 as ok, now() as ts");
    console.log(`OK  ${label}  ${Date.now() - t0}ms  →`, r.rows[0]);
    return true;
  } catch (e) {
    console.error(
      `FAIL ${label}  ${Date.now() - t0}ms  →`,
      e instanceof Error ? e.message : e
    );
    return false;
  } finally {
    await pool.end().catch(() => undefined);
  }
}

async function main() {
  const raw = (process.env.DATABASE_URL || "").replace(/['"]/g, "").trim();
  const direct = (process.env.DIRECT_URL || "").replace(/['"]/g, "").trim();
  const fixed = dbConnectionString();

  console.log("DATABASE_URL host:", (raw.match(/@([^/]+)/) || [])[1]);
  console.log(
    "DIRECT_URL host:",
    (direct.match(/@([^/]+)/) || [])[1] || "(unset)"
  );
  console.log("normalized host:", (fixed.match(/@([^/]+)/) || [])[1]);
  console.log("");

  if (raw) await tryConnect("DATABASE_URL (raw)", raw);
  if (direct && !direct.includes("://base") && direct.includes("://")) {
    await tryConnect("DIRECT_URL", direct);
  }
  await tryConnect("normalized (app pool)", fixed);

  console.log(`
Supabase tips:
1. DATABASE_URL = Transaction pooler port 6543
2. DIRECT_URL = Session mode port 5432 (for prisma migrate / db push)
3. Password URL-encode special chars
`);
}

main().catch(console.error);
