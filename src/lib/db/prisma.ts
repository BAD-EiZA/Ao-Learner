import dns from "node:dns";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Prefer IPv4 (Windows often hangs on IPv6 first)
dns.setDefaultResultOrder("ipv4first");

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient;
  pgPool: Pool;
};

/**
 * Normalize Postgres URL for Supabase / Neon / generic hosts.
 * NOTE: newer `pg` treats sslmode=require as verify-full → self-signed fails.
 * We strip sslmode* from the URL and always pass ssl: { rejectUnauthorized: false }.
 */
export function dbConnectionString(raw?: string) {
  const base =
    process.env.DATABASE_URL_POOLED ||
    process.env.DATABASE_URL ||
    raw ||
    "";
  if (!base) throw new Error("DATABASE_URL is not set");

  let cleaned = base.trim().replace(/^["']|["']$/g, "");

  let url: URL;
  try {
    url = new URL(cleaned);
  } catch {
    return cleaned;
  }

  // Neon: auto-switch to pooler host if missing
  if (
    url.hostname.includes("neon.tech") &&
    !url.hostname.includes("-pooler.") &&
    !process.env.DATABASE_URL_DIRECT_ONLY
  ) {
    url.hostname = url.hostname.replace(
      /^([^.]+)\./,
      (_m, ep: string) => `${ep}-pooler.`
    );
  }

  url.searchParams.delete("channel_binding");
  // remove sslmode* so pg does not force cert verification
  url.searchParams.delete("sslmode");
  url.searchParams.delete("ssl");
  url.searchParams.set("connect_timeout", "30");

  const port = url.port || "5432";
  const isSupabasePooler =
    url.hostname.includes("supabase.com") && port === "6543";
  const isNeonPooler = url.hostname.includes("-pooler.");
  if (isSupabasePooler || isNeonPooler) {
    url.searchParams.set("pgbouncer", "true");
  }

  return url.toString();
}

/** @deprecated use dbConnectionString */
export const neonConnectionString = dbConnectionString;

function poolSslOption(connectionString: string) {
  // Local CI / docker Postgres usually has no TLS
  if (
    process.env.DATABASE_SSL === "0" ||
    process.env.PGSSLMODE === "disable" ||
    /sslmode=disable/i.test(connectionString) ||
    /localhost|127\.0\.0\.1/.test(connectionString)
  ) {
    return undefined;
  }
  // Supabase / Neon self-signed chain with modern pg
  return { rejectUnauthorized: false };
}

function createPool() {
  const connectionString = dbConnectionString();
  return new Pool({
    connectionString,
    max: 5,
    connectionTimeoutMillis: 30_000,
    idleTimeoutMillis: 20_000,
    ssl: poolSslOption(connectionString),
  });
}

function createClient(pool: Pool) {
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.PRISMA_LOG === "1" ? ["error", "warn"] : ["error"],
  });
}

// Bump when UserStats schema fields change so HMR doesn't keep a stale client
const PRISMA_CLIENT_REV = 3;

const pool = globalForPrisma.pgPool || createPool();
const cached = globalForPrisma.prisma as
  | (PrismaClient & { __rev?: number })
  | undefined;
export const prisma =
  cached && cached.__rev === PRISMA_CLIENT_REV
    ? cached
    : Object.assign(createClient(pool), { __rev: PRISMA_CLIENT_REV });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pgPool = pool;
}
