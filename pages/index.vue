<template>
  <div class="home-page">
    <!-- Noise overlay -->
    <div class="noise-overlay" aria-hidden="true"></div>

    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-inner">
        <!-- Decorative stickers -->
        <div class="sticker-1 sticker sticker-red" aria-hidden="true">PARTY GAME</div>
        <div class="sticker-2 sticker sticker-yellow" aria-hidden="true">🎭</div>

        <div class="hero-title-wrap">
          <h1 class="hero-title">UNDER<br>COVER</h1>
          <div class="hero-title-shadow" aria-hidden="true">UNDER<br>COVER</div>
        </div>

        <p class="hero-subtitle">
          Temukan siapa <strong>mata-mata</strong> di antara kalian.<br>
          Beri clue, diskusi, eliminasi — jangan sampai tertipu!
        </p>

        <!-- Role preview tags -->
        <div class="role-tags">
          <span class="rtag rtag-civilian">👤 CIVILIAN</span>
          <span class="rtag rtag-undercover">🕵️ UNDERCOVER</span>
          <span class="rtag rtag-mrwhite">❓ MR. WHITE</span>
        </div>
      </div>
    </section>

    <!-- Game Forms -->
    <section class="game-forms">
      <div class="forms-grid">

        <!-- Create Room -->
        <div class="form-panel create-panel">
          <div class="panel-header create-header">
            <span class="panel-number">01</span>
            <h2>BUAT ROOM</h2>
          </div>
          <div class="panel-body">
            <p class="panel-desc">Buat room baru dan undang teman kamu. Kamu jadi HOST!</p>

            <form @submit.prevent="createRoom">
              <div class="form-field">
                <label class="field-label">NAMA KAMU</label>
                <input
                  v-model="createForm.name"
                  type="text"
                  class="input-brutal"
                  placeholder="Masukkan nama..."
                  maxlength="20"
                  required
                  :disabled="createLoading"
                />
              </div>

              <div v-if="createError" class="error-msg">
                ⚠️ {{ createError }}
              </div>

              <BrutalButton
                type="submit"
                variant="yellow"
                size="lg"
                :loading="createLoading"
                loading-text="Membuat Room..."
                class="w-full mt-4"
              >
                BUAT ROOM →
              </BrutalButton>
            </form>
          </div>
        </div>

        <!-- Divider -->
        <div class="form-divider">
          <div class="divider-line"></div>
          <span class="divider-text">ATAU</span>
          <div class="divider-line"></div>
        </div>

        <!-- Join Room -->
        <div class="form-panel join-panel">
          <div class="panel-header join-header">
            <span class="panel-number">02</span>
            <h2>GABUNG ROOM</h2>
          </div>
          <div class="panel-body">
            <p class="panel-desc">Punya kode room? Masuk dan bergabung dengan teman kamu!</p>

            <form @submit.prevent="joinRoom">
              <div class="form-field">
                <label class="field-label">KODE ROOM</label>
                <input
                  v-model="joinForm.roomCode"
                  type="text"
                  class="input-brutal text-center tracking-widest"
                  placeholder="XXXXXX"
                  maxlength="6"
                  style="text-transform: uppercase; font-size: 24px; letter-spacing: 0.2em"
                  required
                  :disabled="joinLoading"
                  @input="joinForm.roomCode = joinForm.roomCode.toUpperCase()"
                />
              </div>

              <div class="form-field">
                <label class="field-label">NAMA KAMU</label>
                <input
                  v-model="joinForm.name"
                  type="text"
                  class="input-brutal"
                  placeholder="Masukkan nama..."
                  maxlength="20"
                  required
                  :disabled="joinLoading"
                />
              </div>

              <div v-if="joinError" class="error-msg">
                ⚠️ {{ joinError }}
              </div>

              <BrutalButton
                type="submit"
                variant="black"
                size="lg"
                :loading="joinLoading"
                loading-text="Bergabung..."
                class="w-full mt-4"
              >
                GABUNG SEKARANG →
              </BrutalButton>
            </form>
          </div>
        </div>
      </div>
    </section>

    <!-- How to Play Section -->
    <section class="how-to-play">
      <h2 class="section-title">CARA BERMAIN</h2>
      <div class="steps-grid">
        <div v-for="step in steps" :key="step.num" class="step-card">
          <div class="step-num">{{ step.num }}</div>
          <div class="step-icon">{{ step.icon }}</div>
          <div class="step-title">{{ step.title }}</div>
          <div class="step-desc">{{ step.desc }}</div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="page-footer">
      <span>UNDERCOVER GAME · MADE WITH 🖤</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useGameSession } from '~/composables/useGameSession'

useHead({
  title: 'UNDERCOVER — Party Game',
  bodyAttrs: {
    class: 'bg-white'
  }
})

const { saveSession } = useGameSession()
const router = useRouter()

const createForm = reactive({ name: '' })
const joinForm = reactive({ roomCode: '', name: '' })
const createLoading = ref(false)
const joinLoading = ref(false)
const createError = ref('')
const joinError = ref('')

const steps = [
  {
    num: '01',
    icon: '🏠',
    title: 'BUAT / GABUNG',
    desc: 'Host buat room, bagikan kode ke teman. 4-12 pemain bisa ikut.'
  },
  {
    num: '02',
    icon: '🎭',
    title: 'DAPAT PERAN',
    desc: 'Setiap pemain dapat peran rahasia: Civilian, Undercover, atau Mr. White.'
  },
  {
    num: '03',
    icon: '💬',
    title: 'BERI CLUE',
    desc: 'Satu kata clue dari setiap pemain. Civilian dan Undercover punya kata berbeda!'
  },
  {
    num: '04',
    icon: '🗳️',
    title: 'VOTE & ELIMINASI',
    desc: 'Diskusikan siapa yang mencurigakan. Vote untuk mengeliminasi pemain.'
  },
  {
    num: '05',
    icon: '🏆',
    title: 'MENANG!',
    desc: 'Civilian menang jika eliminasi semua musuh. Undercover menang jika bisa bersembunyi!'
  }
]

const createRoom = async () => {
  if (!createForm.name.trim()) return
  createError.value = ''
  createLoading.value = true

  try {
    const data = await $fetch<{ roomId: string; playerId: number; sessionId: string; hostName: string }>(
      '/api/rooms/create',
      {
        method: 'POST',
        body: { hostName: createForm.name.trim() }
      }
    )

    saveSession({
      sessionId: data.sessionId,
      playerId: data.playerId,
      roomId: data.roomId,
      playerName: data.hostName
    })

    router.push(`/room/${data.roomId}`)
  } catch (err: any) {
    createError.value = err?.data?.message || 'Gagal membuat room. Coba lagi!'
  } finally {
    createLoading.value = false
  }
}

const joinRoom = async () => {
  if (!joinForm.roomCode.trim() || !joinForm.name.trim()) return
  joinError.value = ''
  joinLoading.value = true

  try {
    const data = await $fetch<{ roomId: string; playerId: number; sessionId: string; playerName: string }>(
      '/api/rooms/join',
      {
        method: 'POST',
        body: {
          roomId: joinForm.roomCode.trim().toUpperCase(),
          playerName: joinForm.name.trim()
        }
      }
    )

    saveSession({
      sessionId: data.sessionId,
      playerId: data.playerId,
      roomId: data.roomId,
      playerName: data.playerName
    })

    router.push(`/room/${data.roomId}`)
  } catch (err: any) {
    joinError.value = err?.data?.message || 'Gagal bergabung. Cek kode room dan coba lagi!'
  } finally {
    joinLoading.value = false
  }
}
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: #fff;
  position: relative;
  overflow-x: hidden;
}

.noise-overlay {
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.04'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 0;
}

/* ---- HERO ---- */
.hero {
  background: #FFE600;
  border-bottom: 6px solid #000;
  padding: 60px 24px 48px;
  position: relative;
  overflow: hidden;
}

.hero-inner {
  max-width: 720px;
  margin: 0 auto;
  position: relative;
  text-align: center;
}

.sticker-1 {
  position: absolute;
  top: -10px;
  left: -10px;
  transform: rotate(-5deg);
  font-size: 11px;
  background: #FF2020;
  color: #fff;
  border: 3px solid #000;
  padding: 5px 10px;
  font-weight: 800;
  letter-spacing: 0.1em;
  box-shadow: 3px 3px 0 #000;
}

.sticker-2 {
  position: absolute;
  top: -10px;
  right: 20px;
  transform: rotate(8deg);
  font-size: 32px;
  border: 3px solid #000;
  padding: 4px 8px;
  background: #fff;
  box-shadow: 3px 3px 0 #000;
}

.hero-title-wrap {
  position: relative;
  display: inline-block;
  margin-bottom: 24px;
}

.hero-title {
  font-size: clamp(72px, 16vw, 140px);
  font-weight: 800;
  line-height: 0.9;
  text-transform: uppercase;
  letter-spacing: -0.02em;
  color: #000;
  position: relative;
  z-index: 2;
}

.hero-title-shadow {
  position: absolute;
  inset: 0;
  font-size: clamp(72px, 16vw, 140px);
  font-weight: 800;
  line-height: 0.9;
  text-transform: uppercase;
  letter-spacing: -0.02em;
  color: #000;
  transform: translate(10px, 10px);
  z-index: 1;
  opacity: 0.15;
  pointer-events: none;
}

.hero-subtitle {
  font-size: clamp(16px, 3vw, 20px);
  font-weight: 500;
  line-height: 1.6;
  color: #000;
  max-width: 480px;
  margin: 0 auto 24px;
}

.hero-subtitle strong {
  font-weight: 800;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.role-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.rtag {
  display: inline-block;
  padding: 8px 16px;
  border: 3px solid #000;
  font-weight: 800;
  font-size: 13px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.rtag-civilian {
  background: #00C800;
  color: #fff;
  box-shadow: 4px 4px 0 #000;
}

.rtag-undercover {
  background: #0000FF;
  color: #fff;
  box-shadow: 4px 4px 0 #000;
}

.rtag-mrwhite {
  background: #111;
  color: #FFE600;
  box-shadow: 4px 4px 0 #FFE600;
}

/* ---- FORMS ---- */
.game-forms {
  padding: 48px 24px;
  background: #fff;
  position: relative;
  z-index: 1;
}

.forms-grid {
  max-width: 900px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 0;
  align-items: start;
}

@media (max-width: 700px) {
  .forms-grid {
    grid-template-columns: 1fr;
  }
}

.form-panel {
  border: 4px solid #000;
}

.create-panel {
  box-shadow: 8px 8px 0 #000;
}

.join-panel {
  box-shadow: 8px 8px 0 #000;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 4px solid #000;
}

.create-header {
  background: #FFE600;
}

.join-header {
  background: #000;
  color: #FFE600;
}

.panel-number {
  font-size: 32px;
  font-weight: 800;
  line-height: 1;
  opacity: 0.3;
}

.panel-header h2 {
  font-size: 22px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0;
}

.join-header h2 {
  color: #FFE600;
}

.panel-body {
  padding: 24px 20px;
}

.panel-desc {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
  color: #555;
  margin-bottom: 20px;
}

.form-field {
  margin-bottom: 16px;
}

.field-label {
  display: block;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 6px;
  color: #000;
}

.error-msg {
  background: #FF2020;
  color: #fff;
  border: 3px solid #000;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 700;
  margin-top: 10px;
}

.form-divider {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 24px;
  gap: 16px;
}

@media (max-width: 700px) {
  .form-divider {
    flex-direction: row;
    padding: 24px 0;
  }
}

.divider-line {
  flex: 1;
  width: 3px;
  background: #000;
  min-height: 40px;
}

@media (max-width: 700px) {
  .divider-line {
    width: 100%;
    height: 3px;
    min-height: unset;
  }
}

.divider-text {
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: #000;
  background: #fff;
  padding: 4px 8px;
  border: 2px solid #000;
}

/* ---- HOW TO PLAY ---- */
.how-to-play {
  padding: 48px 24px 60px;
  background: #000;
  color: #fff;
}

.section-title {
  font-size: 42px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #FFE600;
  text-align: center;
  margin-bottom: 40px;
  border-bottom: 4px solid #FFE600;
  padding-bottom: 16px;
  max-width: 720px;
  margin-left: auto;
  margin-right: auto;
}

.steps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.step-card {
  border: 3px solid #333;
  padding: 20px 16px;
  background: #111;
  position: relative;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.step-card:hover {
  border-color: #FFE600;
  box-shadow: 6px 6px 0 #FFE600;
}

.step-num {
  font-size: 48px;
  font-weight: 800;
  color: #333;
  line-height: 1;
  margin-bottom: 8px;
}

.step-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.step-title {
  font-size: 16px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #FFE600;
  margin-bottom: 8px;
}

.step-desc {
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  color: #aaa;
}

/* ---- FOOTER ---- */
.page-footer {
  background: #FFE600;
  border-top: 4px solid #000;
  padding: 16px 24px;
  text-align: center;
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #000;
}
</style>
