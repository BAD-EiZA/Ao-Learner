/** Client-safe XP math — no Prisma */

export function xpForLevel(level: number) {
  return Math.floor(100 * Math.pow(level - 1, 1.5));
}

export function levelFromXp(xp: number) {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}

export function xpProgress(xp: number) {
  const level = levelFromXp(xp);
  const cur = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const into = xp - cur;
  const need = Math.max(1, next - cur);
  return {
    level,
    xp,
    into,
    need,
    pct: Math.min(100, Math.round((into / need) * 100)),
  };
}

export function xpForScore(score: number, passed: boolean) {
  if (!passed) return Math.max(5, Math.floor(score / 10));
  if (score >= 95) return 40;
  if (score >= 85) return 30;
  if (score >= 75) return 22;
  return 15;
}

export const LEVEL_BADGES = [
  { min: 1, name: "Novice", emoji: "🌱" },
  { min: 3, name: "Speaker", emoji: "💬" },
  { min: 5, name: "Fluent-ish", emoji: "✨" },
  { min: 8, name: "Polyglot", emoji: "🌍" },
  { min: 12, name: "Master", emoji: "👑" },
] as const;

export function badgeForLevel(level: number) {
  let badge: (typeof LEVEL_BADGES)[number] = LEVEL_BADGES[0]!;
  for (const b of LEVEL_BADGES) {
    if (level >= b.min) badge = b;
  }
  return badge;
}
