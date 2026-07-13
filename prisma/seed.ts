/**
 * CEFR-aligned speaking curriculum (English + German).
 * Levels: A1 → A2 → B1 → B2 → C1.
 */
import "dotenv/config";
import dns from "node:dns";
import { PrismaClient, Prisma } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { dbConnectionString } from "../src/lib/db/prisma";

dns.setDefaultResultOrder("ipv4first");

const pool = new Pool({
  connectionString: dbConnectionString(),
  max: 1,
  connectionTimeoutMillis: 30_000,
  ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

type Cefr = "A1" | "A2" | "B1" | "B2" | "C1";
type Mode = "PHRASE" | "DIALOGUE" | "ROLEPLAY" | "STORY";

type Row = {
  order: number;
  cefrLevel: Cefr;
  title: string;
  description: string;
  expectedText: string;
  meaningId: string;
  tags?: string[];
  mode?: Mode;
  turns?: readonly {
    prompt?: string;
    expectedText: string;
    meaningId: string;
  }[];
};

function autoTags(row: Row): string[] {
  if (row.tags?.length) return row.tags;
  const t = row.expectedText.toLowerCase();
  const tags: string[] = [row.cefrLevel.toLowerCase()];
  if (
    /hello|good morning|guten|tag|bye|wiedersehen|bonjour|bonsoir|au revoir/.test(
      t
    )
  )
    tags.push("greeting");
  if (/thank|danke|welcome|bitte|merci|de rien|s'il vous plaît/.test(t))
    tags.push("courtesy");
  if (/name|heiße|meet|freut|je m'appelle|enchanté/.test(t)) tags.push("intro");
  if (
    /bathroom|toilette|toilettes|where|wo ist|où|much|kostet|combien|coffee|kaffee|café/.test(
      t
    )
  )
    tags.push("everyday");
  if (
    /help|helfen|aider|understand|verstehe|comprends|repeat|wiederholen|répéter/.test(
      t
    )
  )
    tags.push("repair");
  if (row.mode === "DIALOGUE") tags.push("dialogue");
  return tags;
}

/** English — CEFR speaking micro-lessons */
const ENGLISH: Row[] = [
  // —— A1: greetings & courtesy ——
  {
    order: 1,
    cefrLevel: "A1",
    title: "Hello",
    description: "CEFR A1 · Greet someone politely.",
    expectedText: "Hello",
    meaningId: "Halo / Hai",
  },
  {
    order: 2,
    cefrLevel: "A1",
    title: "Good morning",
    description: "CEFR A1 · Morning greeting.",
    expectedText: "Good morning",
    meaningId: "Selamat pagi",
  },
  {
    order: 3,
    cefrLevel: "A1",
    title: "How are you?",
    description: "CEFR A1 · Ask about wellbeing.",
    expectedText: "How are you?",
    meaningId: "Apa kabar?",
  },
  {
    order: 4,
    cefrLevel: "A1",
    title: "I'm fine, thank you",
    description: "CEFR A1 · Reply to a greeting.",
    expectedText: "I'm fine, thank you",
    meaningId: "Saya baik-baik saja, terima kasih",
  },
  {
    order: 5,
    cefrLevel: "A1",
    title: "My name is Alex",
    description: "CEFR A1 · Introduce yourself.",
    expectedText: "My name is Alex",
    meaningId: "Nama saya Alex",
  },
  {
    order: 6,
    cefrLevel: "A1",
    title: "Nice to meet you",
    description: "CEFR A1 · Polite introduction.",
    expectedText: "Nice to meet you",
    meaningId: "Senang bertemu denganmu",
  },
  {
    order: 7,
    cefrLevel: "A1",
    title: "Thank you",
    description: "CEFR A1 · Express gratitude.",
    expectedText: "Thank you",
    meaningId: "Terima kasih",
  },
  {
    order: 8,
    cefrLevel: "A1",
    title: "You're welcome",
    description: "CEFR A1 · Reply to thanks.",
    expectedText: "You're welcome",
    meaningId: "Sama-sama",
  },
  {
    order: 9,
    cefrLevel: "A1",
    title: "Excuse me",
    description: "CEFR A1 · Get attention politely.",
    expectedText: "Excuse me",
    meaningId: "Permisi",
  },
  {
    order: 10,
    cefrLevel: "A1",
    title: "I'm sorry",
    description: "CEFR A1 · Apologize simply.",
    expectedText: "I'm sorry",
    meaningId: "Maaf",
  },
  {
    order: 11,
    cefrLevel: "A1",
    title: "Goodbye",
    description: "CEFR A1 · Say goodbye.",
    expectedText: "Goodbye",
    meaningId: "Selamat tinggal",
  },
  // —— A2: everyday needs ——
  {
    order: 12,
    cefrLevel: "A2",
    title: "Where is the bathroom?",
    description: "CEFR A2 · Ask for a place.",
    expectedText: "Where is the bathroom?",
    meaningId: "Di mana kamar mandi?",
  },
  {
    order: 13,
    cefrLevel: "A2",
    title: "How much is this?",
    description: "CEFR A2 · Ask about price.",
    expectedText: "How much is this?",
    meaningId: "Berapa harganya?",
  },
  {
    order: 14,
    cefrLevel: "A2",
    title: "I don't understand",
    description: "CEFR A2 · Signal difficulty.",
    expectedText: "I don't understand",
    meaningId: "Saya tidak mengerti",
  },
  {
    order: 15,
    cefrLevel: "A2",
    title: "Can you help me?",
    description: "CEFR A2 · Ask for help.",
    expectedText: "Can you help me?",
    meaningId: "Bisakah Anda membantu saya?",
  },
  {
    order: 16,
    cefrLevel: "A2",
    title: "I'd like a coffee, please",
    description: "CEFR A2 · Order food/drink.",
    expectedText: "I'd like a coffee, please",
    meaningId: "Saya mau kopi, tolong",
  },
  {
    order: 17,
    cefrLevel: "A2",
    title: "Could you repeat that?",
    description: "CEFR A2 · Ask for repetition.",
    expectedText: "Could you repeat that?",
    meaningId: "Bisa ulangi lagi?",
  },
  // —— B1: opinions & plans ——
  {
    order: 18,
    cefrLevel: "B1",
    title: "I think we should leave earlier",
    description: "CEFR B1 · Suggest a plan politely.",
    expectedText: "I think we should leave earlier tomorrow",
    meaningId: "Menurut saya kita harus berangkat lebih awal besok",
  },
  {
    order: 19,
    cefrLevel: "B1",
    title: "In my opinion",
    description: "CEFR B1 · Give a simple opinion.",
    expectedText: "In my opinion, this is a good idea",
    meaningId: "Menurut pendapat saya, ini ide bagus",
  },
  {
    order: 20,
    cefrLevel: "B1",
    title: "I'm looking forward to it",
    description: "CEFR B1 · Express anticipation.",
    expectedText: "I'm looking forward to the weekend",
    meaningId: "Saya menantikan akhir pekan",
  },
  {
    order: 21,
    cefrLevel: "B1",
    title: "Meeting someone new",
    description: "CEFR B1 · 3-turn greeting dialogue.",
    expectedText: "Hello",
    meaningId: "Dialog perkenalan singkat",
    mode: "DIALOGUE",
    turns: [
      {
        prompt: "Greet them:",
        expectedText: "Hello",
        meaningId: "Halo",
      },
      {
        prompt: "Ask how they are:",
        expectedText: "How are you?",
        meaningId: "Apa kabar?",
      },
      {
        prompt: "Introduce yourself:",
        expectedText: "My name is Alex",
        meaningId: "Nama saya Alex",
      },
    ],
  },
  // —— B2: explanations ——
  {
    order: 22,
    cefrLevel: "B2",
    title: "Although it was difficult",
    description: "CEFR B2 · Contrast with although.",
    expectedText: "Although it was difficult, I managed to finish on time",
    meaningId: "Meski sulit, saya berhasil selesai tepat waktu",
  },
  {
    order: 23,
    cefrLevel: "B2",
    title: "The main reason is",
    description: "CEFR B2 · Explain a reason clearly.",
    expectedText: "The main reason is that we need more practice",
    meaningId: "Alasan utamanya adalah kita butuh lebih banyak latihan",
  },
  {
    order: 24,
    cefrLevel: "B2",
    title: "On the other hand",
    description: "CEFR B2 · Present a counterpoint.",
    expectedText: "On the other hand, it could save us a lot of time",
    meaningId: "Di sisi lain, ini bisa menghemat banyak waktu",
  },
  {
    order: 25,
    cefrLevel: "B2",
    title: "I'd rather wait",
    description: "CEFR B2 · Soft preference / refusal.",
    expectedText: "I'd rather wait until we have more information",
    meaningId: "Saya lebih baik menunggu sampai ada info lebih",
  },
  // —— C1: nuanced ——
  {
    order: 26,
    cefrLevel: "C1",
    title: "I'd argue that",
    description: "CEFR C1 · Structured argument opener.",
    expectedText:
      "I'd argue that clear communication is essential in any workplace",
    meaningId:
      "Saya berpendapat komunikasi yang jelas penting di tempat kerja",
  },
  {
    order: 27,
    cefrLevel: "C1",
    title: "To put it another way",
    description: "CEFR C1 · Rephrase for precision.",
    expectedText: "To put it another way, we need a more sustainable approach",
    meaningId: "Dengan kata lain, kita butuh pendekatan yang lebih berkelanjutan",
  },
  {
    order: 28,
    cefrLevel: "C1",
    title: "Having said that",
    description: "CEFR C1 · Concession + contrast.",
    expectedText: "Having said that, there are still some risks involved",
    meaningId: "Meski begitu, masih ada beberapa risiko",
  },
  {
    order: 29,
    cefrLevel: "C1",
    title: "It's worth considering",
    description: "CEFR C1 · Soft recommendation.",
    expectedText: "It's worth considering the long-term implications",
    meaningId: "Perlu dipertimbangkan implikasi jangka panjangnya",
  },
];

/** German — CEFR speaking micro-lessons (aligned with GER A1–A2) */
const GERMAN: Row[] = [
  // —— A1 ——
  {
    order: 1,
    cefrLevel: "A1",
    title: "Guten Morgen",
    description: "CEFR A1 · Morgenbegrüßung.",
    expectedText: "Guten Morgen",
    meaningId: "Selamat pagi",
  },
  {
    order: 2,
    cefrLevel: "A1",
    title: "Guten Tag",
    description: "CEFR A1 · Tagesbegrüßung.",
    expectedText: "Guten Tag",
    meaningId: "Selamat siang / Halo (formal)",
  },
  {
    order: 3,
    cefrLevel: "A1",
    title: "Wie geht's?",
    description: "CEFR A1 · Nach dem Befinden fragen.",
    expectedText: "Wie geht's?",
    meaningId: "Apa kabar?",
  },
  {
    order: 4,
    cefrLevel: "A1",
    title: "Mir geht's gut",
    description: "CEFR A1 · Auf eine Begrüßung antworten.",
    expectedText: "Mir geht's gut",
    meaningId: "Saya baik-baik saja",
  },
  {
    order: 5,
    cefrLevel: "A1",
    title: "Ich heiße Anna",
    description: "CEFR A1 · Sich vorstellen.",
    expectedText: "Ich heiße Anna",
    meaningId: "Nama saya Anna",
  },
  {
    order: 6,
    cefrLevel: "A1",
    title: "Freut mich",
    description: "CEFR A1 · Freude beim Kennenlernen.",
    expectedText: "Freut mich",
    meaningId: "Senang berkenalan",
  },
  {
    order: 7,
    cefrLevel: "A1",
    title: "Danke",
    description: "CEFR A1 · Danksagung.",
    expectedText: "Danke",
    meaningId: "Terima kasih",
  },
  {
    order: 8,
    cefrLevel: "A1",
    title: "Bitte",
    description: "CEFR A1 · Bitte / gern geschehen.",
    expectedText: "Bitte",
    meaningId: "Tolong / Sama-sama",
  },
  {
    order: 9,
    cefrLevel: "A1",
    title: "Entschuldigung",
    description: "CEFR A1 · Höflich um Aufmerksamkeit bitten.",
    expectedText: "Entschuldigung",
    meaningId: "Permisi / Maaf",
  },
  {
    order: 10,
    cefrLevel: "A1",
    title: "Es tut mir leid",
    description: "CEFR A1 · Sich entschuldigen.",
    expectedText: "Es tut mir leid",
    meaningId: "Saya minta maaf",
  },
  {
    order: 11,
    cefrLevel: "A1",
    title: "Auf Wiedersehen",
    description: "CEFR A1 · Verabschiedung.",
    expectedText: "Auf Wiedersehen",
    meaningId: "Sampai jumpa",
  },
  // —— A2 ——
  {
    order: 12,
    cefrLevel: "A2",
    title: "Wo ist die Toilette?",
    description: "CEFR A2 · Nach einem Ort fragen.",
    expectedText: "Wo ist die Toilette?",
    meaningId: "Di mana toilet?",
  },
  {
    order: 13,
    cefrLevel: "A2",
    title: "Was kostet das?",
    description: "CEFR A2 · Nach dem Preis fragen.",
    expectedText: "Was kostet das?",
    meaningId: "Berapa harganya?",
  },
  {
    order: 14,
    cefrLevel: "A2",
    title: "Ich verstehe nicht",
    description: "CEFR A2 · Verständnisprobleme signalisieren.",
    expectedText: "Ich verstehe nicht",
    meaningId: "Saya tidak mengerti",
  },
  {
    order: 15,
    cefrLevel: "A2",
    title: "Können Sie mir helfen?",
    description: "CEFR A2 · Um Hilfe bitten (Sie-Form).",
    expectedText: "Können Sie mir helfen?",
    meaningId: "Bisakah Anda membantu saya?",
  },
  {
    order: 16,
    cefrLevel: "A2",
    title: "Einen Kaffee, bitte",
    description: "CEFR A2 · Etwas bestellen.",
    expectedText: "Einen Kaffee, bitte",
    meaningId: "Satu kopi, tolong",
  },
  {
    order: 17,
    cefrLevel: "A2",
    title: "Können Sie das wiederholen?",
    description: "CEFR A2 · Um Wiederholung bitten.",
    expectedText: "Können Sie das wiederholen?",
    meaningId: "Bisa ulangi lagi?",
  },
  // —— B1 ——
  {
    order: 18,
    cefrLevel: "B1",
    title: "Ich denke, wir sollten früher gehen",
    description: "CEFR B1 · Einen Plan vorschlagen.",
    expectedText: "Ich denke, wir sollten morgen früher gehen",
    meaningId: "Menurut saya kita harus berangkat lebih awal besok",
  },
  {
    order: 19,
    cefrLevel: "B1",
    title: "Meiner Meinung nach",
    description: "CEFR B1 · Einfache Meinung äußern.",
    expectedText: "Meiner Meinung nach ist das eine gute Idee",
    meaningId: "Menurut pendapat saya, ini ide bagus",
  },
  {
    order: 20,
    cefrLevel: "B1",
    title: "Ich freue mich darauf",
    description: "CEFR B1 · Vorfreude ausdrücken.",
    expectedText: "Ich freue mich auf das Wochenende",
    meaningId: "Saya menantikan akhir pekan",
  },
  {
    order: 21,
    cefrLevel: "B1",
    title: "Jemanden kennenlernen",
    description: "CEFR B1 · Kurzer Begrüßungsdialog (3 Turns).",
    expectedText: "Guten Tag",
    meaningId: "Dialog perkenalan singkat",
    mode: "DIALOGUE",
    turns: [
      {
        prompt: "Begrüße sie:",
        expectedText: "Guten Tag",
        meaningId: "Selamat siang",
      },
      {
        prompt: "Frag, wie es geht:",
        expectedText: "Wie geht's?",
        meaningId: "Apa kabar?",
      },
      {
        prompt: "Stell dich vor:",
        expectedText: "Ich heiße Anna",
        meaningId: "Nama saya Anna",
      },
    ],
  },
  // —— B2 ——
  {
    order: 22,
    cefrLevel: "B2",
    title: "Obwohl es schwierig war",
    description: "CEFR B2 · Kontrast mit obwohl.",
    expectedText:
      "Obwohl es schwierig war, habe ich es rechtzeitig geschafft",
    meaningId: "Meski sulit, saya berhasil selesai tepat waktu",
  },
  {
    order: 23,
    cefrLevel: "B2",
    title: "Der Hauptgrund ist",
    description: "CEFR B2 · Einen Grund erklären.",
    expectedText: "Der Hauptgrund ist, dass wir mehr Übung brauchen",
    meaningId: "Alasan utamanya adalah kita butuh lebih banyak latihan",
  },
  {
    order: 24,
    cefrLevel: "B2",
    title: "Andererseits",
    description: "CEFR B2 · Gegenargument nennen.",
    expectedText: "Andererseits könnte es uns viel Zeit sparen",
    meaningId: "Di sisi lain, ini bisa menghemat banyak waktu",
  },
  {
    order: 25,
    cefrLevel: "B2",
    title: "Ich würde lieber warten",
    description: "CEFR B2 · Höfliche Präferenz.",
    expectedText: "Ich würde lieber warten, bis wir mehr Informationen haben",
    meaningId: "Saya lebih baik menunggu sampai ada info lebih",
  },
  // —— C1 ——
  {
    order: 26,
    cefrLevel: "C1",
    title: "Ich würde behaupten",
    description: "CEFR C1 · Argument eröffnen.",
    expectedText:
      "Ich würde behaupten, dass klare Kommunikation am Arbeitsplatz entscheidend ist",
    meaningId:
      "Saya berpendapat komunikasi yang jelas penting di tempat kerja",
  },
  {
    order: 27,
    cefrLevel: "C1",
    title: "Anders ausgedrückt",
    description: "CEFR C1 · Präzise umformulieren.",
    expectedText:
      "Anders ausgedrückt brauchen wir einen nachhaltigeren Ansatz",
    meaningId: "Dengan kata lain, kita butuh pendekatan yang lebih berkelanjutan",
  },
  {
    order: 28,
    cefrLevel: "C1",
    title: "Davon abgesehen",
    description: "CEFR C1 · Einräumung + Kontrast.",
    expectedText: "Davon abgesehen gibt es immer noch einige Risiken",
    meaningId: "Meski begitu, masih ada beberapa risiko",
  },
  {
    order: 29,
    cefrLevel: "C1",
    title: "Es lohnt sich zu bedenken",
    description: "CEFR C1 · Sanfte Empfehlung.",
    expectedText: "Es lohnt sich, die langfristigen Folgen zu bedenken",
    meaningId: "Perlu dipertimbangkan implikasi jangka panjangnya",
  },
];

const PLACEHOLDER_AUDIO = "/audio/placeholder.mp3";

async function upsertStages(
  language: "ENGLISH" | "GERMAN" | "FRENCH",
  rows: Row[]
) {
  // Remove obsolete higher-order stages if curriculum shrank/grew inconsistently
  const maxOrder = Math.max(...rows.map((r) => r.order));
  await prisma.stage.deleteMany({
    where: { language, order: { gt: maxOrder } },
  });

  for (const row of rows) {
    const turnsJson = row.turns
      ? (JSON.parse(JSON.stringify(row.turns)) as Prisma.InputJsonValue)
      : undefined;

    await prisma.stage.upsert({
      where: { language_order: { language, order: row.order } },
      create: {
        language,
        order: row.order,
        cefrLevel: row.cefrLevel,
        title: row.title,
        description: row.description,
        expectedText: row.expectedText,
        meaningId: row.meaningId,
        referenceAudio: PLACEHOLDER_AUDIO,
        mode: row.mode ?? "PHRASE",
        tags: autoTags(row),
        ...(turnsJson !== undefined ? { turns: turnsJson } : {}),
      },
      update: {
        cefrLevel: row.cefrLevel,
        title: row.title,
        description: row.description,
        expectedText: row.expectedText,
        meaningId: row.meaningId,
        mode: row.mode ?? "PHRASE",
        tags: autoTags(row),
        ...(turnsJson !== undefined
          ? { turns: turnsJson }
          : { turns: Prisma.DbNull }),
      },
    });
    console.log(`  ok ${language} ${row.cefrLevel} #${row.order} ${row.title}`);
  }
}

const ROLEPLAY_EN: Row[] = [
  {
    order: 100,
    cefrLevel: "A2",
    title: "Café · Order",
    description: "Role-play: order a coffee politely.",
    expectedText: "I'd like a coffee, please",
    meaningId: "Skenario kafe — pesan kopi",
    mode: "ROLEPLAY",
    tags: ["everyday", "roleplay", "cafe"],
    turns: [
      {
        prompt: "Greet the barista:",
        expectedText: "Hello",
        meaningId: "Halo",
      },
      {
        prompt: "Order a coffee:",
        expectedText: "I'd like a coffee, please",
        meaningId: "Saya mau kopi, tolong",
      },
      {
        prompt: "Say thanks:",
        expectedText: "Thank you",
        meaningId: "Terima kasih",
      },
    ],
  },
  {
    order: 101,
    cefrLevel: "A2",
    title: "Berlin · Directions",
    description: "Role-play: ask for the bathroom politely.",
    expectedText: "Where is the bathroom?",
    meaningId: "Skenario Berlin — minta arah",
    mode: "ROLEPLAY",
    tags: ["everyday", "roleplay", "berlin"],
    turns: [
      {
        prompt: "Get attention:",
        expectedText: "Excuse me",
        meaningId: "Permisi",
      },
      {
        prompt: "Ask for the bathroom:",
        expectedText: "Where is the bathroom?",
        meaningId: "Di mana kamar mandi?",
      },
      {
        prompt: "Thank them:",
        expectedText: "Thank you",
        meaningId: "Terima kasih",
      },
    ],
  },
];

const ROLEPLAY_DE: Row[] = [
  {
    order: 100,
    cefrLevel: "A2",
    title: "Café · Bestellen",
    description: "Rollenspiel: Kaffee bestellen.",
    expectedText: "Einen Kaffee, bitte",
    meaningId: "Skenario kafe — pesan kopi",
    mode: "ROLEPLAY",
    tags: ["everyday", "roleplay", "cafe"],
    turns: [
      {
        prompt: "Begrüße:",
        expectedText: "Guten Tag",
        meaningId: "Selamat siang",
      },
      {
        prompt: "Bestelle Kaffee:",
        expectedText: "Einen Kaffee, bitte",
        meaningId: "Satu kopi, tolong",
      },
      {
        prompt: "Danke sagen:",
        expectedText: "Danke",
        meaningId: "Terima kasih",
      },
    ],
  },
  {
    order: 101,
    cefrLevel: "A2",
    title: "Berlin · Weg fragen",
    description: "Rollenspiel: nach der Toilette fragen.",
    expectedText: "Wo ist die Toilette?",
    meaningId: "Skenario Berlin — minta arah",
    mode: "ROLEPLAY",
    tags: ["everyday", "roleplay", "berlin"],
    turns: [
      {
        prompt: "Höflich ansprechen:",
        expectedText: "Entschuldigung",
        meaningId: "Permisi",
      },
      {
        prompt: "Nach der Toilette fragen:",
        expectedText: "Wo ist die Toilette?",
        meaningId: "Di mana toilet?",
      },
      {
        prompt: "Danke sagen:",
        expectedText: "Danke",
        meaningId: "Terima kasih",
      },
    ],
  },
];

async function upsertRoleplay(
  language: "ENGLISH" | "GERMAN" | "FRENCH",
  rows: Row[]
) {
  for (const row of rows) {
    const turnsJson = row.turns
      ? (JSON.parse(JSON.stringify(row.turns)) as Prisma.InputJsonValue)
      : undefined;
    const scenarioId = row.tags?.includes("cafe")
      ? "cafe"
      : row.tags?.includes("berlin")
        ? "berlin"
        : null;

    await prisma.stage.upsert({
      where: { language_order: { language, order: row.order } },
      create: {
        language,
        order: row.order,
        cefrLevel: row.cefrLevel,
        title: row.title,
        description: row.description,
        expectedText: row.expectedText,
        meaningId: row.meaningId,
        referenceAudio: PLACEHOLDER_AUDIO,
        mode: "ROLEPLAY",
        tags: autoTags(row),
        scenarioId,
        ...(turnsJson !== undefined ? { turns: turnsJson } : {}),
      },
      update: {
        title: row.title,
        description: row.description,
        expectedText: row.expectedText,
        meaningId: row.meaningId,
        mode: "ROLEPLAY",
        tags: autoTags(row),
        scenarioId,
        ...(turnsJson !== undefined ? { turns: turnsJson } : {}),
      },
    });
    console.log(`  ok ${language} ROLEPLAY #${row.order} ${row.title}`);
  }
}

/** Short narrative stories — multi-line speak-in-order */
const STORIES_EN: Row[] = [
  {
    order: 200,
    cefrLevel: "A1",
    title: "Morning · Meet a friend",
    description: "Story A1 · Greet, ask how they are, say goodbye.",
    expectedText: "Hello",
    meaningId: "Cerita pagi — sapa teman",
    mode: "STORY",
    tags: ["story", "greeting", "a1"],
    turns: [
      {
        prompt: "You see a friend. Greet them:",
        expectedText: "Hello",
        meaningId: "Halo",
      },
      {
        prompt: "Ask how they are:",
        expectedText: "How are you?",
        meaningId: "Apa kabar?",
      },
      {
        prompt: "Answer about yourself:",
        expectedText: "I'm fine, thank you",
        meaningId: "Saya baik, terima kasih",
      },
      {
        prompt: "Leave politely:",
        expectedText: "Goodbye",
        meaningId: "Selamat tinggal",
      },
    ],
  },
  {
    order: 201,
    cefrLevel: "A2",
    title: "Shop · Buy something",
    description: "Story A2 · Ask price, order, thank.",
    expectedText: "How much is this?",
    meaningId: "Cerita toko — beli sesuatu",
    mode: "STORY",
    tags: ["story", "everyday", "a2"],
    turns: [
      {
        prompt: "Get attention:",
        expectedText: "Excuse me",
        meaningId: "Permisi",
      },
      {
        prompt: "Ask the price:",
        expectedText: "How much is this?",
        meaningId: "Berapa harganya?",
      },
      {
        prompt: "Order politely:",
        expectedText: "I'd like a coffee, please",
        meaningId: "Saya mau kopi, tolong",
      },
      {
        prompt: "Thank them:",
        expectedText: "Thank you",
        meaningId: "Terima kasih",
      },
    ],
  },
];

const STORIES_DE: Row[] = [
  {
    order: 200,
    cefrLevel: "A1",
    title: "Morgen · Freund treffen",
    description: "Geschichte A1 · Begrüßen und verabschieden.",
    expectedText: "Guten Tag",
    meaningId: "Cerita pagi — sapa teman (DE)",
    mode: "STORY",
    tags: ["story", "greeting", "a1"],
    turns: [
      {
        prompt: "Begrüße den Freund:",
        expectedText: "Guten Tag",
        meaningId: "Selamat siang",
      },
      {
        prompt: "Frag, wie es geht:",
        expectedText: "Wie geht's?",
        meaningId: "Apa kabar?",
      },
      {
        prompt: "Antworte:",
        expectedText: "Mir geht's gut",
        meaningId: "Saya baik-baik saja",
      },
      {
        prompt: "Verabschiede dich:",
        expectedText: "Auf Wiedersehen",
        meaningId: "Sampai jumpa",
      },
    ],
  },
  {
    order: 201,
    cefrLevel: "A2",
    title: "Laden · Etwas kaufen",
    description: "Geschichte A2 · Preis fragen und bestellen.",
    expectedText: "Was kostet das?",
    meaningId: "Cerita toko — beli (DE)",
    mode: "STORY",
    tags: ["story", "everyday", "a2"],
    turns: [
      {
        prompt: "Höflich ansprechen:",
        expectedText: "Entschuldigung",
        meaningId: "Permisi",
      },
      {
        prompt: "Nach dem Preis fragen:",
        expectedText: "Was kostet das?",
        meaningId: "Berapa harganya?",
      },
      {
        prompt: "Bestellen:",
        expectedText: "Einen Kaffee, bitte",
        meaningId: "Satu kopi, tolong",
      },
      {
        prompt: "Danke sagen:",
        expectedText: "Danke",
        meaningId: "Terima kasih",
      },
    ],
  },
];

async function upsertStories(
  language: "ENGLISH" | "GERMAN" | "FRENCH",
  rows: Row[]
) {
  for (const row of rows) {
    const turnsJson = row.turns
      ? (JSON.parse(JSON.stringify(row.turns)) as Prisma.InputJsonValue)
      : undefined;

    await prisma.stage.upsert({
      where: { language_order: { language, order: row.order } },
      create: {
        language,
        order: row.order,
        cefrLevel: row.cefrLevel,
        title: row.title,
        description: row.description,
        expectedText: row.expectedText,
        meaningId: row.meaningId,
        referenceAudio: PLACEHOLDER_AUDIO,
        mode: "STORY",
        tags: row.tags ?? ["story"],
        scenarioId: "story",
        ...(turnsJson !== undefined ? { turns: turnsJson } : {}),
      },
      update: {
        title: row.title,
        description: row.description,
        expectedText: row.expectedText,
        meaningId: row.meaningId,
        mode: "STORY",
        tags: row.tags ?? ["story"],
        scenarioId: "story",
        ...(turnsJson !== undefined ? { turns: turnsJson } : {}),
      },
    });
    console.log(`  ok ${language} STORY #${row.order} ${row.title}`);
  }
}

/** French — CEFR speaking micro-lessons (aligned with EN/DE path) */
const FRENCH: Row[] = [
  // —— A1 ——
  {
    order: 1,
    cefrLevel: "A1",
    title: "Bonjour",
    description: "CEFR A1 · Saluer poliment.",
    expectedText: "Bonjour",
    meaningId: "Selamat siang / Halo",
  },
  {
    order: 2,
    cefrLevel: "A1",
    title: "Bonjour (matin)",
    description: "CEFR A1 · Salutation du matin.",
    expectedText: "Bonjour",
    meaningId: "Selamat pagi",
  },
  {
    order: 3,
    cefrLevel: "A1",
    title: "Comment allez-vous ?",
    description: "CEFR A1 · Demander des nouvelles.",
    expectedText: "Comment allez-vous ?",
    meaningId: "Apa kabar?",
  },
  {
    order: 4,
    cefrLevel: "A1",
    title: "Ça va bien, merci",
    description: "CEFR A1 · Répondre à une salutation.",
    expectedText: "Ça va bien, merci",
    meaningId: "Saya baik-baik saja, terima kasih",
  },
  {
    order: 5,
    cefrLevel: "A1",
    title: "Je m'appelle Alex",
    description: "CEFR A1 · Se présenter.",
    expectedText: "Je m'appelle Alex",
    meaningId: "Nama saya Alex",
  },
  {
    order: 6,
    cefrLevel: "A1",
    title: "Enchanté",
    description: "CEFR A1 · Politesse de présentation.",
    expectedText: "Enchanté",
    meaningId: "Senang bertemu denganmu",
  },
  {
    order: 7,
    cefrLevel: "A1",
    title: "Merci",
    description: "CEFR A1 · Remercier.",
    expectedText: "Merci",
    meaningId: "Terima kasih",
  },
  {
    order: 8,
    cefrLevel: "A1",
    title: "De rien",
    description: "CEFR A1 · Répondre à un merci.",
    expectedText: "De rien",
    meaningId: "Sama-sama",
  },
  {
    order: 9,
    cefrLevel: "A1",
    title: "Excusez-moi",
    description: "CEFR A1 · Attirer l'attention poliment.",
    expectedText: "Excusez-moi",
    meaningId: "Permisi",
  },
  {
    order: 10,
    cefrLevel: "A1",
    title: "Je suis désolé",
    description: "CEFR A1 · S'excuser simplement.",
    expectedText: "Je suis désolé",
    meaningId: "Maaf",
  },
  {
    order: 11,
    cefrLevel: "A1",
    title: "Au revoir",
    description: "CEFR A1 · Dire au revoir.",
    expectedText: "Au revoir",
    meaningId: "Selamat tinggal",
  },
  // —— A2 ——
  {
    order: 12,
    cefrLevel: "A2",
    title: "Où sont les toilettes ?",
    description: "CEFR A2 · Demander un lieu.",
    expectedText: "Où sont les toilettes ?",
    meaningId: "Di mana kamar mandi?",
  },
  {
    order: 13,
    cefrLevel: "A2",
    title: "Combien ça coûte ?",
    description: "CEFR A2 · Demander le prix.",
    expectedText: "Combien ça coûte ?",
    meaningId: "Berapa harganya?",
  },
  {
    order: 14,
    cefrLevel: "A2",
    title: "Je ne comprends pas",
    description: "CEFR A2 · Signaler une difficulté.",
    expectedText: "Je ne comprends pas",
    meaningId: "Saya tidak mengerti",
  },
  {
    order: 15,
    cefrLevel: "A2",
    title: "Pouvez-vous m'aider ?",
    description: "CEFR A2 · Demander de l'aide.",
    expectedText: "Pouvez-vous m'aider ?",
    meaningId: "Bisakah Anda membantu saya?",
  },
  {
    order: 16,
    cefrLevel: "A2",
    title: "Un café, s'il vous plaît",
    description: "CEFR A2 · Commander une boisson.",
    expectedText: "Un café, s'il vous plaît",
    meaningId: "Saya mau kopi, tolong",
  },
  {
    order: 17,
    cefrLevel: "A2",
    title: "Pouvez-vous répéter ?",
    description: "CEFR A2 · Demander de répéter.",
    expectedText: "Pouvez-vous répéter ?",
    meaningId: "Bisa ulangi lagi?",
  },
  // —— B1 ——
  {
    order: 18,
    cefrLevel: "B1",
    title: "Je pense que nous devrions partir plus tôt",
    description: "CEFR B1 · Suggérer un plan poliment.",
    expectedText: "Je pense que nous devrions partir plus tôt demain",
    meaningId: "Menurut saya kita harus berangkat lebih awal besok",
  },
  {
    order: 19,
    cefrLevel: "B1",
    title: "À mon avis",
    description: "CEFR B1 · Donner une opinion simple.",
    expectedText: "À mon avis, c'est une bonne idée",
    meaningId: "Menurut pendapat saya, ini ide bagus",
  },
  {
    order: 20,
    cefrLevel: "B1",
    title: "J'ai hâte",
    description: "CEFR B1 · Exprimer l'anticipation.",
    expectedText: "J'ai hâte d'être au week-end",
    meaningId: "Saya menantikan akhir pekan",
  },
  {
    order: 21,
    cefrLevel: "B1",
    title: "Rencontrer quelqu'un",
    description: "CEFR B1 · Dialogue de présentation (3 tours).",
    expectedText: "Bonjour",
    meaningId: "Dialog perkenalan singkat",
    mode: "DIALOGUE",
    turns: [
      {
        prompt: "Saluez-les :",
        expectedText: "Bonjour",
        meaningId: "Halo",
      },
      {
        prompt: "Demandez comment ça va :",
        expectedText: "Comment allez-vous ?",
        meaningId: "Apa kabar?",
      },
      {
        prompt: "Présentez-vous :",
        expectedText: "Je m'appelle Alex",
        meaningId: "Nama saya Alex",
      },
    ],
  },
  // —— B2 ——
  {
    order: 22,
    cefrLevel: "B2",
    title: "Bien que ce fût difficile",
    description: "CEFR B2 · Contraste avec bien que.",
    expectedText: "Bien que ce fût difficile, j'ai réussi à finir à temps",
    meaningId: "Meski sulit, saya berhasil selesai tepat waktu",
  },
  {
    order: 23,
    cefrLevel: "B2",
    title: "La raison principale",
    description: "CEFR B2 · Expliquer une raison.",
    expectedText: "La raison principale est que nous avons besoin de plus de pratique",
    meaningId: "Alasan utamanya adalah kita butuh lebih banyak latihan",
  },
  {
    order: 24,
    cefrLevel: "B2",
    title: "D'un autre côté",
    description: "CEFR B2 · Présenter un contrepoint.",
    expectedText: "D'un autre côté, cela pourrait nous faire gagner du temps",
    meaningId: "Di sisi lain, ini bisa menghemat banyak waktu",
  },
  {
    order: 25,
    cefrLevel: "B2",
    title: "Je préférerais attendre",
    description: "CEFR B2 · Préférence / refus doux.",
    expectedText: "Je préférerais attendre d'avoir plus d'informations",
    meaningId: "Saya lebih baik menunggu sampai ada info lebih",
  },
  // —— C1 ——
  {
    order: 26,
    cefrLevel: "C1",
    title: "Je dirais que",
    description: "CEFR C1 · Ouvrir un argument structuré.",
    expectedText:
      "Je dirais qu'une communication claire est essentielle au travail",
    meaningId:
      "Saya berpendapat komunikasi yang jelas penting di tempat kerja",
  },
  {
    order: 27,
    cefrLevel: "C1",
    title: "Autrement dit",
    description: "CEFR C1 · Reformuler avec précision.",
    expectedText: "Autrement dit, nous avons besoin d'une approche plus durable",
    meaningId: "Dengan kata lain, kita butuh pendekatan yang lebih berkelanjutan",
  },
  {
    order: 28,
    cefrLevel: "C1",
    title: "Cela dit",
    description: "CEFR C1 · Concession + contraste.",
    expectedText: "Cela dit, il y a encore certains risques",
    meaningId: "Meski begitu, masih ada beberapa risiko",
  },
  {
    order: 29,
    cefrLevel: "C1",
    title: "Il convient d'envisager",
    description: "CEFR C1 · Recommandation nuancée.",
    expectedText: "Il convient d'envisager les implications à long terme",
    meaningId: "Perlu dipertimbangkan implikasi jangka panjangnya",
  },
];

const ROLEPLAY_FR: Row[] = [
  {
    order: 100,
    cefrLevel: "A2",
    title: "Café · Commander",
    description: "Jeu de rôle : commander un café poliment.",
    expectedText: "Un café, s'il vous plaît",
    meaningId: "Skenario kafe — pesan kopi",
    mode: "ROLEPLAY",
    tags: ["everyday", "roleplay", "cafe"],
    turns: [
      {
        prompt: "Saluez le serveur :",
        expectedText: "Bonjour",
        meaningId: "Halo",
      },
      {
        prompt: "Commandez un café :",
        expectedText: "Un café, s'il vous plaît",
        meaningId: "Saya mau kopi, tolong",
      },
      {
        prompt: "Remerciez :",
        expectedText: "Merci",
        meaningId: "Terima kasih",
      },
    ],
  },
  {
    order: 101,
    cefrLevel: "A2",
    title: "Paris · Directions",
    description: "Jeu de rôle : demander les toilettes.",
    expectedText: "Où sont les toilettes ?",
    meaningId: "Skenario Paris — minta arah",
    mode: "ROLEPLAY",
    tags: ["everyday", "roleplay", "paris"],
    turns: [
      {
        prompt: "Attirez l'attention :",
        expectedText: "Excusez-moi",
        meaningId: "Permisi",
      },
      {
        prompt: "Demandez les toilettes :",
        expectedText: "Où sont les toilettes ?",
        meaningId: "Di mana kamar mandi?",
      },
      {
        prompt: "Remerciez :",
        expectedText: "Merci",
        meaningId: "Terima kasih",
      },
    ],
  },
];

const STORIES_FR: Row[] = [
  {
    order: 200,
    cefrLevel: "A1",
    title: "Matin · Rencontrer un ami",
    description: "Histoire A1 · Saluer, demander des nouvelles, dire au revoir.",
    expectedText: "Bonjour",
    meaningId: "Cerita pagi — sapa teman",
    tags: ["story", "a1"],
    turns: [
      {
        prompt: "Saluez votre ami :",
        expectedText: "Bonjour",
        meaningId: "Halo",
      },
      {
        prompt: "Demandez comment ça va :",
        expectedText: "Comment allez-vous ?",
        meaningId: "Apa kabar?",
      },
      {
        prompt: "Dites au revoir :",
        expectedText: "Au revoir",
        meaningId: "Selamat tinggal",
      },
    ],
  },
  {
    order: 201,
    cefrLevel: "A2",
    title: "Magasin · Acheter quelque chose",
    description: "Histoire A2 · Prix, commande, remerciement.",
    expectedText: "Combien ça coûte ?",
    meaningId: "Cerita toko — beli sesuatu",
    tags: ["story", "a2"],
    turns: [
      {
        prompt: "Demandez le prix :",
        expectedText: "Combien ça coûte ?",
        meaningId: "Berapa harganya?",
      },
      {
        prompt: "Commandez un café :",
        expectedText: "Un café, s'il vous plaît",
        meaningId: "Saya mau kopi, tolong",
      },
      {
        prompt: "Remerciez :",
        expectedText: "Merci",
        meaningId: "Terima kasih",
      },
    ],
  },
];

async function main() {
  console.log("Seeding CEFR curriculum…");
  await upsertStages("ENGLISH", ENGLISH);
  await upsertStages("GERMAN", GERMAN);
  await upsertStages("FRENCH", FRENCH);
  console.log("Seeding role-play scenarios…");
  await upsertRoleplay("ENGLISH", ROLEPLAY_EN);
  await upsertRoleplay("GERMAN", ROLEPLAY_DE);
  await upsertRoleplay("FRENCH", ROLEPLAY_FR);
  console.log("Seeding stories…");
  await upsertStories("ENGLISH", STORIES_EN);
  await upsertStories("GERMAN", STORIES_DE);
  await upsertStories("FRENCH", STORIES_FR);
  console.log(
    `Done: ${ENGLISH.length} EN + ${GERMAN.length} DE + ${FRENCH.length} FR + role-plays + stories.`
  );
  console.log("Run npm run seed:audio to regenerate reference audio.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
