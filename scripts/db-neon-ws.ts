/**
 * Test Neon via serverless WebSocket driver (bypasses flaky direct TCP SSL).
 */
import "dotenv/config";
import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const url = (process.env.DATABASE_URL || "").replace(/['"]/g, "").trim();

async function main() {
  console.log("host", url.match(/@([^/]+)/)?.[1]);
  const pool = new Pool({ connectionString: url });
  const t0 = Date.now();
  try {
    const r = await pool.query("select 1 as ok, now() as ts");
    console.log("OK", Date.now() - t0, "ms", r.rows[0]);
  } catch (e) {
    console.error("FAIL", Date.now() - t0, "ms", e);
  } finally {
    await pool.end();
  }
}

main();
