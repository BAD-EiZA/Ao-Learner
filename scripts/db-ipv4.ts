/**
 * Neon timeout on Windows often = Node prefers IPv6 (AAAA) which hangs.
 * Force IPv4 connect via dns.lookup.
 */
import "dotenv/config";
import dns from "node:dns/promises";
import dnsCb from "node:dns";
import net from "node:net";
import pg from "pg";
import tls from "node:tls";

dnsCb.setDefaultResultOrder("ipv4first");

const raw = (process.env.DATABASE_URL || "").replace(/['"]/g, "").trim();
const u = new URL(raw);

async function main() {
  const host = u.hostname;
  const looked = await dns.lookup(host, { family: 4 });
  const ip = looked.address;
  console.log("host", host, "→ ipv4", ip);

  await new Promise<void>((resolve) => {
    const s = net.connect({ host: ip, port: 5432 }, () => {
      console.log("TCP ipv4 open");
      s.end();
      resolve();
    });
    s.setTimeout(5000, () => {
      console.log("TCP ipv4 timeout");
      s.destroy();
      resolve();
    });
    s.on("error", (e) => {
      console.log("TCP ipv4 error", e.message);
      resolve();
    });
  });

  await new Promise<void>((resolve) => {
    const s = tls.connect(
      { host: ip, port: 5432, servername: host, rejectUnauthorized: false },
      () => {
        console.log("TLS ok", s.getProtocol());
        s.end();
        resolve();
      }
    );
    s.setTimeout(10000, () => {
      console.log("TLS timeout");
      s.destroy();
      resolve();
    });
    s.on("error", (e) => {
      console.log("TLS error", e.message);
      resolve();
    });
  });

  const pool = new pg.Pool({
    host: ip,
    port: 5432,
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, "") || "neondb",
    ssl: { rejectUnauthorized: false, servername: host },
    connectionTimeoutMillis: 20_000,
  });
  const t0 = Date.now();
  try {
    const r = await pool.query("select 1 as ok");
    console.log("PG OK", Date.now() - t0, "ms", r.rows[0]);
  } catch (e) {
    console.error(
      "PG FAIL",
      Date.now() - t0,
      "ms",
      e instanceof Error ? e.message : e
    );
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
