# UNDERCOVER — Party Game

Game pesta berbasis web dengan desain **Brutalism**. Temukan siapa mata-mata di antara kalian!

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Framework | Nuxt 3 (SSR + Server Routes) |
| UI | TailwindCSS + Brutalism Design |
| Database | MySQL 8+ via mysql2 |
| Real-time | SSE (Server-Sent Events) |
| Language | TypeScript |
| Font | Space Grotesk |

---

## Cara Main

### Role

| Role | Kata | Tugas | Menang Jika |
|------|------|-------|-------------|
| 👥 **Civilian** | Kata utama | Beri clue, tebak musuh | Semua UC + MW terelim |
| 🕵️ **Undercover** | Kata mirip | Menyamar sebagai Civilian | Jumlah ≥ Civilian / bertahan |
| 🤍 **Mr. White** | — (kosong) | Mengarang clue | Bertahan / tebak kata benar |

### Distribusi Role

| Jumlah Pemain | Undercover | Mr. White | Civilian |
|--------------|-----------|-----------|---------|
| 4–6 orang | 1 | 0 | sisanya |
| 7 orang | 2 | 0 | sisanya |
| 8 orang | 2 | 1 | sisanya |
| 9–12 orang | 2 | 1 | sisanya |

### Alur Game

```
Buat/Join Room → Lobby (tunggu 4+ pemain) → Host Start
       ↓
  Fase CLUE: Pemain giliran berikan 1 kata clue (maks 1:30)
       ↓
  Fase VOTING: Vote siapa yang mencurigakan
       ↓
  ELIMINASI: Role pemain terbuka
       ↓
  Cek kondisi menang → selesai atau lanjut ronde
```

### Contoh Word Pair

| Civilian | Undercover |
|----------|-----------|
| Kucing | Harimau |
| Apel | Pir |
| Nasi Goreng | Nasi Putih |
| Pantai | Kolam Renang |

_(50 pasang kata tersedia, ditambah otomatis ke DB saat pertama run)_

---

## Fitur Utama

### Timer Giliran (1 menit 30 detik)
Setiap pemain punya waktu **1:30** untuk memberikan clue. Timer tampil di turn indicator dengan bar countdown. Jika waktu habis, giliran otomatis di-skip (`(lewati)`) dan berpindah ke pemain berikutnya.

- Bar hijau menyusut dari kiri ke kanan
- Berubah merah + bergetar saat ≤ 15 detik tersisa
- Countdown `MM:SS` tampil di pojok kanan turn indicator

### Giliran Berputar (Anti-bias Host)
Urutan giliran clue **dirotasi** setiap ronde dan game menggunakan formula `(gameId + roundNum) % jumlahPemain`. Host tidak selalu giliran pertama — starting player berganti tiap ronde.

### Autocomplete Bahasa Indonesia
`ClueInput` menyediakan 280+ kata umum bahasa Indonesia dengan prefix matching. Navigasi dengan ↑ ↓ Enter Escape, maksimal 6 saran tampil.

### Preview Peran Acak (Lobby)
Saat pemain baru bergabung, lobby menampilkan animasi slot-machine distribusi peran. Hasil akhir tidak ditampilkan — semua terlihat sebagai `🎴 ???` sehingga host tidak mengetahui siapa Undercover.

---

## Instalasi & Menjalankan

### Prasyarat

- Node.js >= 18
- MySQL 8+
- npm

### 1. Clone & Install

```bash
git clone <repo-url>
cd undercover
npm install
```

### 2. Setup Database

```bash
mysql -u root -p -e "CREATE DATABASE undercover_game CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 3. Konfigurasi Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=undercover_game
```

### 4. Jalankan

```bash
# Development
npm run dev
# → http://localhost:3000

# Production build
npm run build
npm run preview
```

> Tabel database dibuat **otomatis** saat server pertama kali start (via `server/plugins/migrate.ts`). Tidak perlu run SQL manual.

---

## Struktur Project

```
undercover/
├── pages/
│   ├── index.vue                # Halaman home (buat/join room)
│   ├── room/[id].vue            # Wrapper nested route (NuxtPage)
│   ├── room/[id]/index.vue      # Lobby room
│   └── room/[id]/game.vue       # Ruang permainan
│
├── components/
│   ├── BrutalButton.vue         # Tombol brutalism
│   ├── BrutalCard.vue           # Card brutalism
│   ├── ClueInput.vue            # Input clue + autocomplete Indonesia
│   ├── GameHeader.vue           # Header info ronde & fase
│   ├── PlayerBadge.vue          # Badge nama pemain
│   ├── RoleReveal.vue           # Animasi reveal role
│   └── VoteCard.vue             # Kartu vote pemain
│
├── composables/
│   ├── useSSE.ts                # SSE client + auto-reconnect
│   ├── useGameSession.ts        # Manajemen sesi (localStorage)
│   └── useIndonesianWords.ts    # 280+ kata Indonesia + suggest()
│
├── server/
│   ├── api/
│   │   ├── rooms/
│   │   │   ├── create.post.ts   # POST /api/rooms/create
│   │   │   ├── join.post.ts     # POST /api/rooms/join
│   │   │   └── [id].get.ts      # GET  /api/rooms/:id
│   │   ├── game/
│   │   │   ├── start.post.ts    # POST /api/game/start
│   │   │   ├── clue.post.ts     # POST /api/game/clue (accept empty = lewati)
│   │   │   ├── vote.post.ts     # POST /api/game/vote
│   │   │   ├── guess.post.ts    # POST /api/game/guess (Mr. White)
│   │   │   ├── next-round.post  # POST /api/game/next-round
│   │   │   └── player-info.get  # GET  /api/game/player-info
│   │   └── events/
│   │       └── [roomId].get.ts  # GET  /api/events/:roomId (SSE)
│   │
│   ├── utils/
│   │   ├── db.ts                # MySQL2 connection pool
│   │   ├── game.ts              # Game logic (role, vote, turn order, win check)
│   │   └── sse.ts               # SSE broadcast per room
│   │
│   └── plugins/
│       └── migrate.ts           # Auto-migrate DB on startup
│
├── assets/css/main.css          # Brutalism global styles
├── tailwind.config.js           # Konfigurasi TailwindCSS
├── nuxt.config.ts               # Konfigurasi Nuxt 3
└── .env.example                 # Template environment variables
```

---

## API Reference

### Rooms

| Method | Endpoint | Body | Deskripsi |
|--------|----------|------|-----------|
| POST | `/api/rooms/create` | `{ hostName }` | Buat room baru |
| POST | `/api/rooms/join` | `{ roomId, playerName }` | Gabung ke room |
| GET | `/api/rooms/:id` | — | Info room + pemain + giliran aktif |

### Game

| Method | Endpoint | Body | Deskripsi |
|--------|----------|------|-----------|
| POST | `/api/game/start` | `{ roomId, sessionId }` | Host start game |
| POST | `/api/game/clue` | `{ gameId, playerId, sessionId, clue }` | Submit clue (kosong = lewati) |
| POST | `/api/game/vote` | `{ gameId, playerId, sessionId, targetId }` | Vote eliminasi |
| POST | `/api/game/guess` | `{ gameId, playerId, sessionId, guess }` | Tebak kata (Mr. White) |
| POST | `/api/game/next-round` | `{ gameId, sessionId }` | Lanjut ronde (host only) |
| GET | `/api/game/player-info` | query: `playerId, sessionId` | Info role + kata pemain |

### SSE Events

| Endpoint | Deskripsi |
|----------|-----------|
| `GET /api/events/:roomId` | Subscribe event real-time room |

**Event types yang di-broadcast:**

| Event | Data | Keterangan |
|-------|------|-----------|
| `player_joined` | `{ player, players }` | Pemain baru masuk lobby |
| `game_started` | `{ game, players, currentTurnPlayerId }` | Host mulai game |
| `clue_submitted` | `{ clues, progress, currentTurnPlayerId }` | Ada clue baru masuk |
| `phase_changed` | `{ phase, clues, activePlayers }` | Fase berganti (clue → voting) |
| `vote_submitted` | `{ votesSubmitted }` | Ada vote masuk |
| `vote_result` | `{ eliminatedPlayer, tied, voteDetails }` | Hasil voting |
| `mr_white_failed` | — | Mr. White salah tebak |
| `game_over` | `{ winner, reason, players }` | Game selesai |
| `next_round` | `{ round, currentTurnPlayerId, activePlayers }` | Ronde berikutnya |

---

## Database Schema

```sql
rooms       (id, host_name, status, created_at)
players     (id, room_id, name, role, word, is_eliminated, session_id)
games       (id, room_id, round_num, phase, civilian_word, undercover_word, clues_submitted, votes_submitted)
clues       (id, game_id, player_id, round_num, clue_text, created_at)
votes       (id, game_id, round_num, voter_id, target_id, created_at)
word_pairs  (id, civilian_word, undercover_word)
```

---

## Design System (Brutalism)

```css
/* Warna utama */
--brutal-yellow: #FFE600
--brutal-black:  #000000
--brutal-white:  #FFFFFF
--brutal-red:    #FF2020
--brutal-green:  #00C800

/* Shadow offset */
box-shadow: 4px 4px 0 #000  /* brutal-sm */
box-shadow: 6px 6px 0 #000  /* brutal    */
box-shadow: 8px 8px 0 #000  /* brutal-lg */

/* Border */
border: 3px solid #000
border: 4px solid #000

/* Typography */
font-family: 'Space Grotesk', system-ui
font-weight: 700–800
text-transform: uppercase
letter-spacing: 0.04–0.15em
```

---

## License

MIT
