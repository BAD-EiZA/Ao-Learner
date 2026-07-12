import "dotenv/config";
import pg from "pg";

const raw = (process.env.DATABASE_URL || "").replace(/['"]/g, "").trim();

async function tryOne(label: string, config: pg.PoolConfig) {
  const pool = new pg.Pool({ max: 1, connectionTimeoutMillis: 20_000, ...config });
  const t0 = Date.now();
  try {
    const r = await pool.query("select 1 as ok");
    console.log(`OK  ${label} ${Date.now() - t0}ms`, r.rows[0]);
  } catch (e) {
    const err = e as Error & { code?: string };
    console.error(`FAIL ${label} ${Date.now() - t0}ms`, err.code, err.message.slice(0, 200));
  } finally {
    await pool.end().catch(() => undefined);
  }
}

async function main() {
  console.log("url len", raw.length);
  console.log("url host", raw.match(/@([^/]+)/)?.[1]);

  await tryOne("A connectionString only", {
    connectionString: raw,
  });

  await tryOne("B connectionString + ssl rejectUnauthorized false", {
    connectionString: raw,
    ssl: { rejectUnauthorized: false },
  });

  await tryOne("C connectionString strip sslmode + ssl object", {
    connectionString: raw.replace(/[?&]sslmode=[^&]*/g, "").replace(/\?$/, ""),
    ssl: { rejectUnauthorized: false },
  });

  // parse manually
  const u = new URL(raw);
  await tryOne("D explicit fields", {
    host: u.hostname,
    port: Number(u.port || 5432),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, "") || "neondb",
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20_000,
  });

  // try neon serverless websocket? skip for now
  // force IPv4
  await tryOne("E force family 4", {
    host: u.hostname,
    port: 5432,
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, "") || "neondb",
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20_000,
    // @ts-expect-error pg supports family
    family: 4,
  });
}

main().catch(console.error);
