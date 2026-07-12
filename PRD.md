Berikut adalah draf **Product Requirements Document (PRD)** untuk **Ao Learner** dalam format Markdown (`.md`). Anda dapat menyalin teks di bawah ini dan menyimpannya sebagai file `.md` (misalnya `PRD-Ao-Learner.md`).

***

# Product Requirements Document (PRD) - Ao Learner

## 1. Ringkasan Produk (Product Overview)
**Ao Learner** adalah sebuah aplikasi web interaktif untuk pembelajaran bahasa Inggris dan Jerman. Aplikasi ini menggunakan teknologi AI dan model 3D (VRM) sebagai tutor virtual. Tutor 3D ini dapat berinteraksi langsung dengan pengguna melalui audio, ekspresi wajah (emosi), dan gerakan tubuh (bone commands). 

Aplikasi ini berfokus pada praktik berbicara (*speaking*) melalui kurikulum singkat. Pengguna akan mendengarkan contoh pelafalan dari model 3D, lalu mencoba menirukannya. Suara pengguna akan dievaluasi oleh **Gemini Flash Lite 3.1**, yang kemudian akan merespons kembali dengan audio dan animasi 3D. Untuk menjaga kualitas dan kedisiplinan belajar, diterapkan sistem batas percobaan (maksimal 3 kali) dengan penalti *cooldown* selama 3 jam jika pengguna gagal.

## 2. Tujuan dan Metrik (Goals & Metrics)
*   **Tujuan:** Memberikan pengalaman belajar bahasa Inggris dan Jerman yang imersif, interaktif, dan tidak membosankan menggunakan avatar 3D dan AI.
*   **Metrik Kesuksesan:** 
    *   Tingkat retensi harian pengguna aktif (DAU).
    *   Persentase penyelesaian kurikulum/tahapan belajar.
    *   Latensi respons AI (waktu dari pengguna selesai bicara hingga model 3D merespons).

## 3. Spesifikasi Teknis (Tech Stack)
*   **Frontend & Backend Framework:** [Next.js](https://nextjs.org/) (App Router disarankan)
*   **Database:** [NeonDB](https://neon.tech/) (Serverless PostgreSQL)
*   **ORM:** [Prisma ORM](https://www.prisma.io/)
*   **Authentication:** [Kinde Auth](https://kinde.com/)
*   **File Storage:** [UploadThing](https://uploadthing.com/) (Untuk menyimpan file model `.vrm`, aset audio, dll)
*   **AI Engine:** Gemini Flash Lite 3.1 (Google) - Digunakan untuk Speech-to-Text, Evaluasi, Text-to-Speech (Audio Generation), dan penentuan *command* animasi/emosi VRM.
*   **3D / VRM Integration:** `three.js`, `@react-three/fiber`, `@react-three/drei`, dan `@pixiv/three-vrm` (Untuk merender dan menggerakkan model VRM di browser).

## 4. Fitur Utama (Core Features)

### 4.1. 3D Homepage (360° View)
*   Halaman utama (Homepage) menampilkan model VRM maskot/tutor Ao Learner.
*   Pengguna dapat memutar (*rotate*) model 360 derajat, melakukan *zoom*, dan melihat animasi *idle* (sebagai *showcase* teknologi).

### 4.2. Kurikulum Belajar Interaktif
*   Terdapat daftar tahapan (stages) belajar bahasa Inggris dan Jerman yang dikemas secara singkat (mikro-learning).
*   Pada setiap tahap, model 3D akan memberikan contoh pelafalan kalimat dengan audio, sinkronisasi gerak bibir (lip-sync), gerakan tubuh, dan emosi yang sesuai konteks kalimat.

### 4.3. Sistem Evaluasi Suara (Voice Evaluation via Gemini)
*   Pengguna menekan tombol rekam dan mengucapkan kalimat bahasa Inggris/Jerman yang sedang dipelajari.
*   Audio pengguna dikirim ke AI (Gemini Flash Lite 3.1) untuk dievaluasi (tingkat akurasi, *pronunciation*, tata bahasa jika relevan).
*   **Respons AI:** Gemini Flash Lite 3.1 akan mengembalikan data berupa:
    1.  Status kelulusan (Lulus / Gagal).
    2.  Feedback tekstual.
    3.  Audio balasan (*generated audio*).
    4.  Command untuk emosi VRM (misal: `joy`, `sad`, `angry`).
    5.  Command gerakan tulang/bone VRM (misal: rotasi tangan, anggukan kepala).

### 4.4. Sistem Penalti (3x Attempts & Cooldown)
*   Pengguna hanya diberikan **maksimal 3 kali percobaan** per tahapan jika pelafalan/jawabannya salah atau tidak memuaskan.
*   Jika percobaan ke-3 masih gagal, sistem akan mengunci (*lock*) tahapan tersebut dan memberikan **delay (cooldown) selama 3 jam** sebelum pengguna dapat mencoba lagi.
*   Waktu *cooldown* disimpan di database dan ditampilkan sebagai *countdown timer* di UI.

### 4.5. Autentikasi & Profil Pengguna
*   Sistem Login/Register tanpa *password* yang mulus menggunakan Kinde Auth.
*   Menyimpan progress belajar pengguna (level, *stage* yang terbuka, dan riwayat *cooldown*).

## 5. Alur Pengguna (User Flow)
1.  **Onboarding:** Pengguna masuk ke website, melihat model 3D di beranda, lalu login dengan Kinde Auth.
2.  **Pilih Pelajaran:** Pengguna memilih bahasa (Inggris/Jerman) dan memilih tahapan kurikulum.
3.  **Demonstrasi Model:** Model 3D Ao Learner mengucapkan kalimat dengan audio + animasi + emosi.
4.  **Sesi Praktik:**
    *   Pengguna merekam suara (mencoba meniru/menjawab).
    *   Sistem menampilkan *loading state*.
5.  **Evaluasi (Gemini Flash Lite 3.1):**
    *   **Jika Benar:** Model 3D merespons dengan emosi bahagia, audio pujian, dan pengguna lanjut ke *stage* berikutnya.
    *   **Jika Salah (< 3 kali):** Model 3D merespons dengan emosi empati/koreksi, audio perbaikan, dan kuota percobaan berkurang 1.
    *   **Jika Salah (3 kali):** Model memberikan respons penutupan, sistem memicu *cooldown* 3 jam. Pengguna kembali ke *dashboard*.

## 6. Arsitektur Data & Struktur Database (Draft Prisma Schema)

Berikut adalah gambaran awal skema database menggunakan Prisma.

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL") // NeonDB Connection String
}

model User {
  id            String         @id @default(uuid())
  kindeId       String         @unique
  email         String         @unique
  name          String?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  progress      UserProgress[]
}

model Stage {
  id              String         @id @default(uuid())
  language        Language       // ENUM: ENGLISH, GERMAN
  title           String
  description     String
  expectedText    String         // Teks ekspektasi jawaban
  referenceAudio  String         // URL dari UploadThing
  order           Int            // Urutan pelajaran
  userProgress    UserProgress[]
}

model UserProgress {
  id              String    @id @default(uuid())
  userId          String
  stageId         String
  isCompleted     Boolean   @default(false)
  attemptsCount   Int       @default(0)
  cooldownUntil   DateTime? // Jika tidak null dan di masa depan, user sedang delay 3 jam
  lastAttemptAt   DateTime  @default(now())
  
  user            User      @relation(fields: [userId], references: [id])
  stage           Stage     @relation(fields: [stageId], references: [id])

  @@unique([userId, stageId])
}

enum Language {
  ENGLISH
  GERMAN
}
```

## 7. Desain Payload AI (Gemini Integration)
Agar Next.js dapat mengatur model VRM di frontend, respons dari sistem Gemini Flash Lite 3.1 di-format dalam bentuk JSON ketat terstruktur (*structured output*):

**Prompt System to Gemini:**
*"Evaluate the user's audio based on expected text. Return a JSON containing: is_correct (boolean), feedback_text (string), emotion (string: neutral, joy, sorrow, angry, fun), bone_commands (array of objects for VRM bones), and generated_audio_base64 (string)."*

**Contoh Payload JSON Respons AI:**
```json
{
  "is_correct": false,
  "feedback_text": "Your pronunciation of 'Guten Morgen' needs a bit more emphasis on the 'r'. Try again!",
  "emotion": "sorrow",
  "bone_commands": [
    { "boneName": "head", "rotation": [0, -0.2, 0] },
    { "boneName": "leftUpperArm", "rotation": [0, 0, 0.5] }
  ],
  "audio_content": "<base64_encoded_audio>"
}
```
*Catatan: Base64 audio akan di-decode di frontend untuk dimainkan, yang sekaligus men-trigger library lip-sync agar bibir VRM bergerak sesuai audio (misal menggunakan pendekatan analisa frekuensi audio di klien).*

## 8. Milestone Pengembangan
*   **Fase 1:** Setup Repository Next.js, Kinde Auth, koneksi Prisma ke NeonDB.
*   **Fase 2:** Integrasi `three.js` dan `@pixiv/three-vrm` untuk menampilkan model di Homepage dengan fitur 360 view.
*   **Fase 3:** Setup UploadThing untuk upload/pengaturan aset model `.vrm` dan file audio pendukung.
*   **Fase 4:** Membuat UI Kurikulum, fungsi *Record Audio*, dan pengiriman data ke backend.
*   **Fase 5:** Integrasi API Gemini Flash Lite 3.1 untuk evaluasi suara, *prompt engineering* JSON output, dan pemutaran respons audio + animasi.
*   **Fase 6:** Implementasi logika *3x attempt* dan sistem *3-hour cooldown* berbasis waktu di Database & UI.
*   **Fase 7:** Testing, Bug Fixing, dan Deployment (Vercel).

---
*End of Document*
