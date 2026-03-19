<template>
  <div class="lobby-page">
    <!-- Loading state -->
    <div v-if="loading" class="loading-screen">
      <div class="loading-card">
        <div class="loading-spinner"></div>
        <p>MEMUAT ROOM<span class="loading-dots"></span></p>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-screen">
      <div class="error-card">
        <div class="error-icon">💥</div>
        <h2>ERROR!</h2>
        <p>{{ error }}</p>
        <BrutalButton variant="yellow" size="lg" @click="navigateTo('/')">
          KEMBALI KE HOME
        </BrutalButton>
      </div>
    </div>

    <!-- Lobby content -->
    <template v-else-if="room">
      <!-- Header -->
      <header class="lobby-header">
        <div class="header-brand">
          <span class="brand-text">UNDERCOVER</span>
        </div>
        <div class="header-status">
          <div class="status-dot" :class="sse.state.connected ? 'connected' : 'disconnected'"></div>
          <span>{{ sse.state.connected ? 'LIVE' : 'OFFLINE' }}</span>
        </div>
      </header>

      <!-- Room code panel -->
      <section class="room-code-section">
        <div class="room-code-inner">
          <div class="rc-label">KODE ROOM</div>
          <div class="rc-code" @click="copyCode">{{ room.id }}</div>
          <button class="rc-copy-btn" @click="copyCode">
            {{ copied ? '✓ TERSALIN!' : '📋 SALIN KODE' }}
          </button>
          <div class="rc-hint">Bagikan kode ini ke teman kamu</div>
        </div>
      </section>

      <!-- Main lobby content -->
      <main class="lobby-main">
        <div class="lobby-grid">

          <!-- Players list -->
          <section class="players-section">
            <div class="section-header">
              <h2>PEMAIN ({{ players.length }}/12)</h2>
              <div class="player-min-badge" :class="players.length >= 4 ? 'ready' : 'not-ready'">
                {{ players.length >= 4 ? '✓ SIAP' : `MIN 4 (${4 - players.length} lagi)` }}
              </div>
            </div>

            <div class="players-list">
              <TransitionGroup name="player-list">
                <div
                  v-for="(player, idx) in players"
                  :key="player.id"
                  class="player-item"
                  :class="{ 'is-me': player.id === myPlayerId }"
                >
                  <div class="player-avatar" :style="{ background: getAvatarColor(player.id) }">
                    {{ getInitials(player.name) }}
                  </div>
                  <div class="player-info">
                    <span class="player-name">{{ player.name }}</span>
                    <div class="player-labels">
                      <span v-if="idx === 0" class="plabel host-label">HOST</span>
                      <span v-if="player.id === myPlayerId" class="plabel me-label">KAMU</span>
                    </div>
                  </div>
                  <div v-if="idx === 0" class="host-crown">👑</div>
                </div>
              </TransitionGroup>

              <!-- Empty slots -->
              <div
                v-for="i in Math.max(0, 4 - players.length)"
                :key="`empty-${i}`"
                class="player-item empty-slot"
              >
                <div class="player-avatar empty-avatar">?</div>
                <span class="player-name empty-name">Menunggu pemain...</span>
              </div>
            </div>
          </section>

          <!-- Action panel -->
          <section class="action-section">

            <!-- Host controls -->
            <div v-if="isHost" class="host-controls">
              <div class="host-badge">
                👑 KAMU ADALAH HOST
              </div>

              <div class="role-info">
                <h3 class="role-info-title">
                  PREVIEW PERAN
                  <span v-if="isShuffling" class="shuffle-badge">🔀 ACAK...</span>
                </h3>
                <div class="role-preview-list">
                  <div
                    v-for="(item, i) in shuffledPlayerRoles"
                    :key="item.player.id"
                    class="rp-item"
                    :class="[isShuffling ? `rp-${item.role}` : 'rp-hidden', { 'rp-shuffling': isShuffling }]"
                    :style="{ animationDelay: `${i * 40}ms` }"
                  >
                    <div class="rp-avatar" :style="{ background: getAvatarColor(item.player.id) }">
                      {{ getInitials(item.player.name) }}
                    </div>
                    <span class="rp-name">{{ item.player.name }}</span>
                    <span class="rp-role-badge">
                      {{ isShuffling ? `${item.icon} ${item.label}` : '🎴 ???' }}
                    </span>
                  </div>
                </div>
                <div class="role-dist-summary">
                  <span v-for="role in roleDistribution" :key="role.type" class="rds-chip" :class="`rds-${role.type}`">
                    {{ role.icon }} {{ role.count }}x {{ role.name }}
                  </span>
                </div>
              </div>

              <div v-if="startError" class="error-msg mt-4">
                ⚠️ {{ startError }}
              </div>

              <BrutalButton
                variant="yellow"
                size="xl"
                :disabled="players.length < 4"
                :loading="startLoading"
                loading-text="MEMULAI..."
                class="w-full mt-4"
                @click="startGame"
              >
                🚀 MULAI GAME!
              </BrutalButton>

              <p v-if="players.length < 4" class="start-hint">
                Butuh minimal {{ 4 - players.length }} pemain lagi untuk memulai
              </p>
            </div>

            <!-- Non-host waiting -->
            <div v-else class="waiting-panel">
              <div class="waiting-icon">⏳</div>
              <h3>MENUNGGU HOST</h3>
              <p>Host sedang menyiapkan game...<br>Sabar ya!</p>

              <div class="waiting-dots">
                <span></span><span></span><span></span>
              </div>
            </div>

            <!-- Game rules quick ref -->
            <div class="rules-quick">
              <h4>ATURAN SINGKAT:</h4>
              <ul>
                <li>🟢 <strong>Civilian</strong>: Tahu kata asli, jangan terlalu jelas</li>
                <li>🔵 <strong>Undercover</strong>: Kata berbeda, pura-pura Civilian</li>
                <li>⬜ <strong>Mr. White</strong>: Tidak punya kata, harus bluff!</li>
              </ul>
            </div>
          </section>
        </div>
      </main>
    </template>
  </div>
</template>

<script setup lang="ts">

const route = useRoute()
const router = useRouter()
const roomId = computed(() => String(route.params.id).toUpperCase())

const { getSession, saveSession } = useGameSession()

// State
const room = ref<any>(null)
const players = ref<any[]>([])
const loading = ref(true)
const error = ref('')
const copied = ref(false)
const startLoading = ref(false)
const startError = ref('')
const myPlayerId = ref<number | null>(null)
const mySessionId = ref<string | null>(null)

// SSE
const sse = useSSE(roomId)

sse.on('player_joined', (data: any) => {
  if (data.players) {
    players.value = data.players
    triggerShuffle()
  }
})

sse.on('game_started', (data: any) => {
  // Non-host players redirect via SSE event
  if (!isHost.value) {
    router.push(`/room/${roomId.value}/game`)
  }
})

// Load room data
const loadRoom = async () => {
  try {
    loading.value = true
    const data = await $fetch<any>(`/api/rooms/${roomId.value}`)
    room.value = data.room
    players.value = data.players
    triggerShuffle()

    if (data.room.status === 'playing') {
      router.push(`/room/${roomId.value}/game`)
      return
    }
    if (data.room.status === 'finished') {
      error.value = 'Game ini sudah selesai.'
      return
    }
  } catch (err: any) {
    error.value = err?.data?.message || 'Room tidak ditemukan'
  } finally {
    loading.value = false
  }
}

// Load session
onMounted(() => {
  const session = getSession()
  myPlayerId.value = session.playerId
  mySessionId.value = session.sessionId

  // Check if session matches this room
  if (session.roomId && session.roomId !== roomId.value) {
    // Different room - just view
  }

  loadRoom()
})

// Shuffle state
const isShuffling = ref(false)
const shuffledPlayerRoles = ref<{ player: any; role: string; icon: string; label: string }[]>([])

const ROLE_META = {
  civilian:   { icon: '👤', label: 'CIVILIAN' },
  undercover: { icon: '🕵️', label: 'UNDERCOVER' },
  mrwhite:    { icon: '❓', label: 'MR. WHITE' }
}

function buildRolePool(count: number) {
  let uc = 1, mw = 0
  if (count >= 7 && count <= 8) { uc = 2; mw = count >= 8 ? 1 : 0 }
  else if (count >= 9) { uc = 2; mw = 1 }
  const civ = count - uc - mw
  return [
    ...Array(civ).fill('civilian'),
    ...Array(uc).fill('undercover'),
    ...Array(mw).fill('mrwhite')
  ]
}

function doShuffle() {
  const pool = buildRolePool(players.value.length)
  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]]
  }
  shuffledPlayerRoles.value = players.value.map((p: any, i: number) => ({
    player: p,
    role: pool[i],
    icon: ROLE_META[pool[i] as keyof typeof ROLE_META].icon,
    label: ROLE_META[pool[i] as keyof typeof ROLE_META].label
  }))
}

let shuffleTimer: ReturnType<typeof setInterval> | null = null

function triggerShuffle() {
  if (players.value.length < 1) return
  isShuffling.value = true
  let ticks = 0
  const total = 10
  if (shuffleTimer) clearInterval(shuffleTimer)
  shuffleTimer = setInterval(() => {
    doShuffle()
    ticks++
    if (ticks >= total) {
      clearInterval(shuffleTimer!)
      shuffleTimer = null
      isShuffling.value = false
    }
  }, 80)
}

const isHost = computed(() => {
  if (!players.value.length || !myPlayerId.value) return false
  return players.value[0]?.id === myPlayerId.value
})

const roleDistribution = computed(() => {
  const count = players.value.length
  let undercover = 1
  let mrwhite = 0

  if (count >= 7 && count <= 8) { undercover = 2; mrwhite = count >= 8 ? 1 : 0 }
  else if (count >= 9) { undercover = 2; mrwhite = 1 }

  const civilian = count - undercover - mrwhite

  return [
    { type: 'civilian', name: 'CIVILIAN', icon: '👤', count: civilian },
    { type: 'undercover', name: 'UNDERCOVER', icon: '🕵️', count: undercover },
    { type: 'mrwhite', name: 'MR. WHITE', icon: '❓', count: mrwhite }
  ].filter(r => r.count > 0)
})

const copyCode = async () => {
  if (!room.value) return
  try {
    await navigator.clipboard.writeText(room.value.id)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // Fallback
    const el = document.createElement('input')
    el.value = room.value.id
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
}

const startGame = async () => {
  startError.value = ''
  startLoading.value = true
  try {
    await $fetch('/api/game/start', {
      method: 'POST',
      body: {
        roomId: roomId.value,
        sessionId: mySessionId.value
      }
    })
    // Gunakan router.push (bukan navigateTo) agar tidak throw redirect error ke catch
    router.push(`/room/${roomId.value}/game`)
  } catch (err: any) {
    startError.value = err?.data?.message || 'Gagal memulai game'
    startLoading.value = false
  }
}

const getAvatarColor = (id: number) => {
  const colors = ['#FFE600', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#DDA0DD', '#98D8C8', '#F7DC6F']
  return colors[id % colors.length]
}

const getInitials = (name: string) => {
  const parts = name.split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}
</script>

<style scoped>
.lobby-page {
  min-height: 100vh;
  background: #fff;
}

/* Loading */
.loading-screen, .error-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
}

.loading-card {
  text-align: center;
  border: 4px solid #000;
  padding: 40px;
  box-shadow: 8px 8px 0 #000;
  background: #FFE600;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 6px solid #000;
  border-top-color: transparent;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-card p {
  font-size: 20px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.error-card {
  text-align: center;
  border: 4px solid #000;
  padding: 40px;
  box-shadow: 8px 8px 0 #FF2020;
  max-width: 400px;
  background: #fff;
}

.error-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.error-card h2 {
  font-size: 36px;
  font-weight: 800;
  text-transform: uppercase;
  margin-bottom: 12px;
}

.error-card p {
  margin-bottom: 24px;
  color: #555;
}

/* Header */
.lobby-header {
  background: #000;
  color: #FFE600;
  padding: 14px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 4px solid #FFE600;
}

.brand-text {
  font-size: 24px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.header-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #fff;
}

.status-dot {
  width: 10px;
  height: 10px;
  border: 2px solid #333;
}

.status-dot.connected {
  background: #00C800;
  animation: pulse 2s ease-in-out infinite;
}

.status-dot.disconnected {
  background: #FF2020;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* Room code */
.room-code-section {
  background: #FFE600;
  border-bottom: 6px solid #000;
  padding: 32px 24px;
}

.room-code-inner {
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
}

.rc-label {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #000;
  opacity: 0.6;
  margin-bottom: 8px;
}

.rc-code {
  font-size: clamp(56px, 14vw, 96px);
  font-weight: 800;
  letter-spacing: 0.2em;
  color: #000;
  cursor: pointer;
  line-height: 1;
  margin-bottom: 12px;
  transition: transform 0.1s ease;
  display: inline-block;
}

.rc-code:hover {
  transform: scale(1.02);
}

.rc-copy-btn {
  display: inline-block;
  padding: 10px 24px;
  background: #000;
  color: #FFE600;
  border: 3px solid #000;
  box-shadow: 4px 4px 0 rgba(0,0,0,0.3);
  font-family: 'Space Grotesk', system-ui;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: transform 0.1s ease, box-shadow 0.1s ease;
  margin-bottom: 10px;
}

.rc-copy-btn:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 rgba(0,0,0,0.3);
}

.rc-hint {
  font-size: 13px;
  font-weight: 500;
  color: #555;
  margin-top: 6px;
}

/* Main lobby */
.lobby-main {
  padding: 32px 24px;
}

.lobby-grid {
  max-width: 960px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

@media (max-width: 700px) {
  .lobby-grid {
    grid-template-columns: 1fr;
  }
}

/* Players section */
.players-section {
  border: 4px solid #000;
  box-shadow: 6px 6px 0 #000;
}

.section-header {
  background: #000;
  color: #FFE600;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 4px solid #000;
}

.section-header h2 {
  font-size: 18px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0;
}

.player-min-badge {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 4px 10px;
  border: 2px solid currentColor;
}

.player-min-badge.ready {
  color: #00C800;
  border-color: #00C800;
}

.player-min-badge.not-ready {
  color: #FF2020;
  border-color: #FF2020;
}

.players-list {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.player-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border: 3px solid #000;
  background: #fff;
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}

.player-item:not(.empty-slot) {
  box-shadow: 3px 3px 0 #000;
}

.player-item.is-me {
  background: #fff9cc;
  border-color: #000;
  box-shadow: 4px 4px 0 #FFE600;
}

.player-item.empty-slot {
  border-style: dashed;
  border-color: #ccc;
  background: #fafafa;
}

.player-avatar {
  width: 42px;
  height: 42px;
  border: 3px solid #000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 15px;
  flex-shrink: 0;
}

.empty-avatar {
  background: #eee;
  border-color: #ccc;
  color: #aaa;
  font-size: 20px;
}

.player-info {
  flex: 1;
  min-width: 0;
}

.player-name {
  display: block;
  font-size: 16px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-name {
  font-size: 13px;
  color: #aaa;
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
}

.player-labels {
  display: flex;
  gap: 4px;
  margin-top: 2px;
}

.plabel {
  display: inline-block;
  padding: 1px 6px;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  border: 2px solid #000;
}

.host-label {
  background: #FFE600;
  color: #000;
}

.me-label {
  background: #00C800;
  color: #fff;
}

.host-crown {
  font-size: 22px;
}

/* Action section */
.action-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.host-controls {
  border: 4px solid #000;
  padding: 20px;
  box-shadow: 6px 6px 0 #FFE600;
}

.host-badge {
  background: #FFE600;
  border: 3px solid #000;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 16px;
  text-align: center;
}

.role-info {
  border: 3px solid #000;
  padding: 14px;
  background: #f9f9f9;
  margin-bottom: 8px;
}

.role-info-title {
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #666;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.shuffle-badge {
  font-size: 11px;
  background: #000;
  color: #FFE600;
  padding: 2px 8px;
  font-weight: 800;
  letter-spacing: 0.06em;
  animation: blink 0.4s ease-in-out infinite alternate;
}

@keyframes blink {
  from { opacity: 1; }
  to { opacity: 0.4; }
}

.role-preview-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 10px;
  max-height: 200px;
  overflow-y: auto;
}

.rp-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border: 2px solid #000;
  background: #fff;
  transition: background 0.1s;
}

.rp-shuffling {
  animation: slot-tick 0.08s ease-in-out;
}

@keyframes slot-tick {
  0%   { transform: translateY(-3px); opacity: 0.5; }
  100% { transform: translateY(0);    opacity: 1; }
}

.rp-civilian   { border-left: 4px solid #00C800; }
.rp-undercover { border-left: 4px solid #0000FF; }
.rp-mrwhite    { border-left: 4px solid #888; }
.rp-hidden     { border-left: 4px solid #ccc; }

.rp-avatar {
  width: 26px;
  height: 26px;
  border: 2px solid #000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 800;
  flex-shrink: 0;
}

.rp-name {
  flex: 1;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rp-role-badge {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 2px 6px;
  border: 2px solid #000;
  white-space: nowrap;
  flex-shrink: 0;
}

.rp-civilian   .rp-role-badge { background: #00C800; color: #fff; border-color: #00A000; }
.rp-undercover .rp-role-badge { background: #0000FF; color: #fff; border-color: #00007a; }
.rp-mrwhite    .rp-role-badge { background: #555;    color: #fff; border-color: #333; }
.rp-hidden     .rp-role-badge { background: #222;    color: #FFE600; border-color: #000; }

.role-dist-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-top: 8px;
  border-top: 2px dashed #ccc;
}

.rds-chip {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 3px 8px;
  border: 2px solid #000;
}

.rds-civilian   { background: #e6ffe6; }
.rds-undercover { background: #e6e6ff; }
.rds-mrwhite    { background: #f0f0f0; }

.role-dist-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
  border-bottom: 1px solid #eee;
}

.role-dist-item:last-child {
  border-bottom: none;
}

.role-dist-icon {
  font-size: 20px;
  width: 28px;
  text-align: center;
}

.role-dist-name {
  flex: 1;
  font-weight: 700;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.role-dist-count {
  font-size: 20px;
  font-weight: 800;
  color: #000;
}

.start-hint {
  font-size: 13px;
  color: #666;
  text-align: center;
  margin-top: 8px;
}

.error-msg {
  background: #FF2020;
  color: #fff;
  border: 3px solid #000;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 700;
}

.waiting-panel {
  border: 4px solid #000;
  padding: 32px 20px;
  box-shadow: 6px 6px 0 #000;
  text-align: center;
}

.waiting-icon {
  font-size: 48px;
  margin-bottom: 12px;
  animation: bounce-brutal 1s ease-in-out infinite;
}

.waiting-panel h3 {
  font-size: 22px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 8px;
}

.waiting-panel p {
  font-size: 14px;
  color: #555;
  line-height: 1.6;
  margin-bottom: 20px;
}

.waiting-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.waiting-dots span {
  width: 12px;
  height: 12px;
  background: #000;
  animation: dot-bounce 1.4s ease-in-out infinite;
}

.waiting-dots span:nth-child(2) { animation-delay: 0.2s; }
.waiting-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes dot-bounce {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
  40% { transform: translateY(-12px); opacity: 1; }
}

.rules-quick {
  border: 3px solid #000;
  padding: 16px;
  background: #f9f9f9;
}

.rules-quick h4 {
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 12px;
  color: #555;
}

.rules-quick ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rules-quick li {
  font-size: 13px;
  line-height: 1.5;
}

.rules-quick strong {
  font-weight: 800;
}

/* Player list transition */
.player-list-enter-active {
  transition: all 0.3s ease;
}

.player-list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.player-list-leave-active {
  transition: all 0.2s ease;
}

.player-list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
