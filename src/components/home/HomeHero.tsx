"use client";

import { LoginLink, RegisterLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { motion } from "framer-motion";
import {
  NeoBadge,
  NeoButton,
  NeoChip,
  NeoLink,
  NeoPanel,
  fadeUp,
  stagger,
} from "@/components/ui/neo";
import { useAppOptional } from "@/components/providers/AppProviders";
import { HomeAvatar } from "@/components/vrm/HomeAvatar";

const copy = {
  en: {
    badge: "English · German · French · 3D AI tutor",
    hero: ["Speak.", "Get scored.", "Level up."],
    intro: "Short speaking drills with Ao, your virtual tutor. Hear a phrase, say it back, then get clear feedback on your pronunciation.",
    start: "Start learning",
    try: "Try free",
    login: "Log in",
    avatar: "Click Ao · Drag to rotate · Pinch to zoom",
    howBadge: "One focused loop",
    howTitle: "Practice speaking, not scrolling.",
    howBody: "Each stage gives one job at a time. No long lesson before you get to talk.",
    steps: [
      ["01", "Listen", "Hear Ao say phrase at full or slower speed."],
      ["02", "Speak", "Record your answer when you are ready."],
      ["03", "Improve", "See score, feedback, and your next move."],
    ],
    scoreBadge: "Instant feedback",
    scoreTitle: "Know what to fix next.",
    scoreBody: "Scores turn vague practice into one clear next attempt.",
    scoreLabel: "Pronunciation score",
    pass: "Pass at 60",
    feedbackLabel: "Ao says",
    feedback: "Great rhythm. Put more stress on the first sound in “morning”.",
    detail: ["Clarity 82", "Stress 68", "Sounds 74"],
    pathsBadge: "Choose your path",
    pathsTitle: "One path for each language.",
    pathsBody: "Start where you are. Finish active stages to unlock next lesson.",
    pathCta: "View path",
    pathState: ["Start at A1", "Continue A1", "New path"],
    progressBadge: "Visible progress",
    progressTitle: "Small sessions. Real momentum.",
    progressCards: [
      ["CEFR path", "See current level and next unlocked stage."],
      ["Daily goal", "Build habit with one simple XP target."],
      ["Review queue", "Return to phrases before they fade."],
    ],
    modesBadge: "More ways to speak",
    modesTitle: "Practice for real situations.",
    modes: [
      ["Review", "Refresh phrases at right time."],
      ["Role-play", "Reply in guided conversations."],
      ["Stories", "Speak through short scenes."],
      ["Word bank", "Keep useful words close."],
    ],
    rulesBadge: "Built for consistency",
    rulesTitle: "Clear rules. Less guesswork.",
    rules: [
      ["3 tries", "Each stage gives focused attempts."],
      ["3 hour reset", "Cooldown protects practice from rushed repeats."],
      ["Hearts", "Pause, review, then return stronger."],
    ],
    finalTitle: "Your next phrase is waiting.",
    finalBody: "Start with a short speaking drill. Ao handles rest.",
  },
  id: {
    badge: "English · German · French · Tutor AI 3D",
    hero: ["Bicara.", "Dapat skor.", "Naik level."],
    intro: "Latihan bicara singkat bersama Ao, tutor virtualmu. Dengarkan frasa, ucapkan kembali, lalu dapatkan feedback pelafalan yang jelas.",
    start: "Lanjut belajar",
    try: "Coba gratis",
    login: "Masuk",
    avatar: "Klik Ao · Geser untuk putar · Cubit untuk zoom",
    howBadge: "Satu alur fokus",
    howTitle: "Latihan bicara, bukan sekadar scroll.",
    howBody: "Setiap stage memberi satu tugas pada satu waktu. Tidak ada pelajaran panjang sebelum mulai bicara.",
    steps: [
      ["01", "Dengar", "Dengarkan Ao mengucapkan frasa, normal atau lebih pelan."],
      ["02", "Ucapkan", "Rekam jawaban saat kamu siap."],
      ["03", "Perbaiki", "Lihat skor, feedback, dan langkah berikutnya."],
    ],
    scoreBadge: "Feedback instan",
    scoreTitle: "Tahu bagian yang perlu diperbaiki.",
    scoreBody: "Skor mengubah latihan samar menjadi percobaan berikutnya yang jelas.",
    scoreLabel: "Skor pelafalan",
    pass: "Lulus di 60",
    feedbackLabel: "Ao bilang",
    feedback: "Ritmemu sudah bagus. Tekankan suara pertama pada “morning”.",
    detail: ["Kejelasan 82", "Tekanan 68", "Bunyi 74"],
    pathsBadge: "Pilih jalurmu",
    pathsTitle: "Satu jalur untuk tiap bahasa.",
    pathsBody: "Mulai dari kemampuanmu. Selesaikan stage aktif untuk membuka pelajaran berikutnya.",
    pathCta: "Lihat jalur",
    pathState: ["Mulai dari A1", "Lanjut A1", "Jalur baru"],
    progressBadge: "Progres terlihat",
    progressTitle: "Sesi kecil. Kemajuan nyata.",
    progressCards: [
      ["Jalur CEFR", "Lihat level saat ini dan stage berikutnya."],
      ["Target harian", "Bangun kebiasaan dengan satu target XP."],
      ["Antrean ulasan", "Kembali ke frasa sebelum terlupa."],
    ],
    modesBadge: "Cara bicara lain",
    modesTitle: "Latihan untuk situasi nyata.",
    modes: [
      ["Ulasan", "Segarkan frasa di waktu tepat."],
      ["Role-play", "Jawab dalam percakapan terpandu."],
      ["Cerita", "Bicara melalui adegan singkat."],
      ["Bank kata", "Simpan kata berguna dekatmu."],
    ],
    rulesBadge: "Dibuat untuk konsisten",
    rulesTitle: "Aturan jelas. Tidak perlu menebak.",
    rules: [
      ["3 kesempatan", "Setiap stage memberi percobaan fokus."],
      ["Reset 3 jam", "Cooldown mencegah pengulangan terburu-buru."],
      ["Heart", "Jeda, ulangi, lalu kembali lebih siap."],
    ],
    finalTitle: "Frasa berikutnya sudah menunggu.",
    finalBody: "Mulai dari latihan bicara singkat. Ao mengurus sisanya.",
  },
} as const;

type HomeCopy = (typeof copy)[keyof typeof copy];

function Cta({ authed, text }: { authed: boolean; text: HomeCopy }) {
  if (authed) return <NeoLink href="/dashboard" className="w-full sm:w-auto">{text.start}</NeoLink>;
  return (
    <>
      <RegisterLink postLoginRedirectURL="/dashboard">
        <NeoButton className="w-full sm:w-auto">{text.try}</NeoButton>
      </RegisterLink>
      <LoginLink postLoginRedirectURL="/dashboard">
        <NeoButton tone="surface" className="w-full sm:w-auto">{text.login}</NeoButton>
      </LoginLink>
    </>
  );
}

export function HomeHero({ authed }: { authed: boolean }) {
  const app = useAppOptional();
  const text = copy[app?.locale ?? "en"];
  const languages = [
    ["EN", "English", "en"],
    ["DE", "German", "de"],
    ["FR", "French", "fr"],
  ] as const;

  return (
    <motion.div variants={stagger} initial="initial" animate="animate">
      <section className="mx-auto grid w-full max-w-6xl gap-6 px-3 py-6 sm:px-6 sm:py-10 lg:grid-cols-2 lg:items-center lg:gap-10">
        <motion.div className="order-2 space-y-5 lg:order-1" variants={fadeUp}>
          <NeoBadge tone="info">{text.badge}</NeoBadge>
          <h1 className="text-4xl font-black leading-[1.15] tracking-tight text-neo-ink sm:text-5xl lg:text-6xl">
            <span className="block py-1">{text.hero[0]}</span>
            <span className="my-1 inline-block rounded-xl bg-neo-primary px-3 py-2 neo-border text-neo-white">{text.hero[1]}</span>
            <span className="block py-1">{text.hero[2]}</span>
          </h1>
          <p className="max-w-xl text-sm font-medium leading-relaxed text-neo-muted sm:text-base">{text.intro}</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center"><Cta authed={authed} text={text} /></div>
          <div className="flex flex-wrap gap-2">
            <NeoChip tone="info">CEFR path</NeoChip>
            <NeoChip tone="success">Pass ≥ 60</NeoChip>
            <NeoChip tone="warning">3 tries · 3h</NeoChip>
          </div>
        </motion.div>

        <motion.div className="order-1 min-w-0 max-w-full lg:order-2" variants={fadeUp}>
          <NeoPanel tone="surface" className="max-w-full">
            <div className="h-[36vh] min-h-[240px] w-full max-w-full overflow-hidden sm:h-[48vh] sm:min-h-[330px] lg:h-[min(70vh,640px)]"><HomeAvatar /></div>
            <p className="border-t-4 border-neo-ink bg-neo-primary px-4 py-2 text-center text-xs font-black uppercase tracking-wide text-neo-white">{text.avatar}</p>
          </NeoPanel>
        </motion.div>
      </section>

      <section className="border-y-4 border-neo-ink bg-neo-white py-12 sm:py-16">
        <div className="mx-auto max-w-6xl space-y-7 px-3 sm:px-6">
          <div className="max-w-2xl space-y-3">
            <NeoBadge tone="warning">{text.howBadge}</NeoBadge>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">{text.howTitle}</h2>
            <p className="text-sm font-medium text-neo-muted sm:text-base">{text.howBody}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {text.steps.map(([number, title, body]) => (
              <NeoPanel key={number} tone="surface" className="p-5">
                <p className="text-4xl font-black text-neo-primary/30">{number}</p>
                <h3 className="mt-4 text-xl font-black">{title}</h3>
                <p className="mt-2 text-sm font-medium text-neo-muted">{body}</p>
              </NeoPanel>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-3 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div className="space-y-3">
          <NeoBadge tone="danger">{text.scoreBadge}</NeoBadge>
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">{text.scoreTitle}</h2>
          <p className="max-w-lg text-sm font-medium text-neo-muted sm:text-base">{text.scoreBody}</p>
        </div>
        <NeoPanel tone="surface" className="p-4 sm:p-6">
          <div className="flex items-end justify-between gap-4 border-b-2 border-neo-ink pb-4">
            <div><p className="text-xs font-black uppercase text-neo-muted">{text.scoreLabel}</p><p className="text-6xl font-black text-neo-primary">78</p></div>
            <NeoBadge tone="success">{text.pass}</NeoBadge>
          </div>
          <div className="mt-4 rounded-xl border-2 border-neo-ink bg-neo-info p-3">
            <p className="text-xs font-black uppercase text-neo-muted">{text.feedbackLabel}</p>
            <p className="mt-1 text-sm font-bold">“{text.feedback}”</p>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {text.detail.map((item) => <NeoChip key={item} tone="surface">{item}</NeoChip>)}
          </div>
        </NeoPanel>
      </section>

      <section className="border-y-4 border-neo-ink bg-neo-purple py-12 sm:py-16">
        <div className="mx-auto max-w-6xl space-y-7 px-3 sm:px-6">
          <div className="max-w-2xl space-y-3"><NeoBadge tone="surface">{text.pathsBadge}</NeoBadge><h2 className="text-3xl font-black tracking-tight sm:text-4xl">{text.pathsTitle}</h2><p className="text-sm font-medium text-neo-muted sm:text-base">{text.pathsBody}</p></div>
          <div className="grid gap-4 md:grid-cols-3">
            {languages.map(([code, label, lang], index) => (
              <NeoPanel key={code} tone="surface" className="flex min-h-56 flex-col p-5">
                <p className="text-5xl font-black text-neo-primary">{code}</p>
                <h3 className="mt-5 text-2xl font-black">{label}</h3>
                <p className="mt-1 text-sm font-bold text-neo-muted">{text.pathState[index]}</p>
                <NeoLink href={authed ? `/path?lang=${lang}` : "/dashboard"} className="mt-auto w-full text-xs">{text.pathCta}</NeoLink>
              </NeoPanel>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-3 py-12 sm:px-6 sm:py-16 lg:grid-cols-2">
        <div className="space-y-4"><NeoBadge tone="success">{text.progressBadge}</NeoBadge><h2 className="text-3xl font-black tracking-tight sm:text-4xl">{text.progressTitle}</h2></div>
        <div className="space-y-3">
          {text.progressCards.map(([title, body], index) => <div key={title} className="flex gap-4 border-b-2 border-neo-ink pb-3 last:border-0"><span className="text-2xl font-black text-neo-primary">0{index + 1}</span><div><h3 className="font-black">{title}</h3><p className="text-sm font-medium text-neo-muted">{body}</p></div></div>)}
        </div>
      </section>

      <section className="border-y-4 border-neo-ink bg-neo-white py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-3 sm:px-6">
          <NeoBadge tone="info">{text.modesBadge}</NeoBadge><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{text.modesTitle}</h2>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{text.modes.map(([title, body]) => <div key={title} className="rounded-2xl border-2 border-neo-ink bg-neo-white p-4 shadow-[3px_3px_0_#1B4EF5]"><h3 className="font-black">{title}</h3><p className="mt-1 text-sm font-medium text-neo-muted">{body}</p></div>)}</div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-3 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr] lg:items-center"><div className="space-y-3"><NeoBadge tone="warning">{text.rulesBadge}</NeoBadge><h2 className="text-3xl font-black tracking-tight sm:text-4xl">{text.rulesTitle}</h2></div><div className="grid gap-3 sm:grid-cols-3">{text.rules.map(([title, body]) => <NeoPanel key={title} tone="surface" className="p-4"><h3 className="font-black">{title}</h3><p className="mt-1 text-sm font-medium text-neo-muted">{body}</p></NeoPanel>)}</div></div>
      </section>

      <section className="border-t-4 border-neo-ink bg-neo-primary px-3 py-14 text-neo-white sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl text-center"><h2 className="text-3xl font-black tracking-tight sm:text-5xl">{text.finalTitle}</h2><p className="mx-auto mt-3 max-w-xl text-sm font-medium text-white/85 sm:text-base">{text.finalBody}</p><div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><Cta authed={authed} text={text} /></div></div>
      </section>
    </motion.div>
  );
}
