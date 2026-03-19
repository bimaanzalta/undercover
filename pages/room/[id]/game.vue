<template>
  <div class="game-page">

    <!-- Role Reveal Modal -->
    <RoleReveal
      v-if="showRoleReveal && myPlayer"
      :player-name="myPlayer.name"
      :role="myPlayer.role || 'civilian'"
      :word="myPlayer.word"
      :is-eliminated="false"
      close-btn-text="SIAP BERMAIN!"
      @close="showRoleReveal = false"
    />

    <!-- Mr. White Guess Modal -->
    <div v-if="showMrWhiteGuess" class="modal-overlay" @click.self="() => {}">
      <div class="mrwhite-guess-modal">
        <div class="mw-header">❓ MR. WHITE TERSINGKIR!</div>
        <div class="mw-body">
          <p>Kamu adalah <strong>Mr. White</strong>. Tebak kata Civilian sekarang untuk menang!</p>
          <input
            v-model="mrWhiteGuess"
            type="text"
            class="input-brutal"
            placeholder="Tebak kata Civilian..."
            maxlength="50"
            @keydown.enter="submitMrWhiteGuess"
          />
          <div v-if="mrWhiteGuessError" class="error-msg mt-2">{{ mrWhiteGuessError }}</div>
        </div>
        <BrutalButton variant="yellow" size="lg" :loading="guessLoading" class="w-full" @click="submitMrWhiteGuess">
          TEBAK SEKARANG!
        </BrutalButton>
        <BrutalButton variant="black" size="md" class="w-full mt-2" @click="skipMrWhiteGuess">
          LEWATI (Menyerah)
        </BrutalButton>
      </div>
    </div>

    <!-- Game Over Screen -->
    <div v-if="gameOver" class="game-over-screen">
      <div class="game-over-inner">
        <!-- Winner announcement -->
        <div class="winner-card" :class="winnerCardClass">
          <div class="winner-label">PEMENANG!</div>
          <div class="winner-icon">{{ winnerIcon }}</div>
          <div class="winner-name">{{ winnerName }}</div>
          <div class="winner-reason">{{ gameOverData?.reason }}</div>
        </div>

        <!-- Words reveal -->
        <div class="words-reveal">
          <div class="word-reveal-item">
            <div class="wr-label">KATA CIVILIAN</div>
            <div class="wr-word civilian-word">{{ gameOverData?.civilianWord }}</div>
          </div>
          <div class="vs-divider">VS</div>
          <div class="word-reveal-item">
            <div class="wr-label">KATA UNDERCOVER</div>
            <div class="wr-word undercover-word">{{ gameOverData?.undercoverWord }}</div>
          </div>
        </div>

        <!-- Final player list with roles -->
        <div class="final-players">
          <h3>SEMUA PEMAIN</h3>
          <div class="final-players-list">
            <div
              v-for="p in gameOverData?.players || []"
              :key="p.id"
              class="final-player-item"
              :class="{ 'eliminated': p.is_eliminated }"
            >
              <div class="fp-avatar" :style="{ background: getAvatarColor(p.id) }">
                {{ getInitials(p.name) }}
              </div>
              <span class="fp-name">{{ p.name }}</span>
              <span class="fp-role" :class="`role-${p.role}`">{{ getRoleLabel(p.role) }}</span>
              <span v-if="p.is_eliminated" class="fp-eliminated">💀</span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="game-over-actions">
          <BrutalButton variant="yellow" size="xl" @click="router.push(`/room/${roomId}`)">
            MAIN LAGI
          </BrutalButton>
          <BrutalButton variant="black" size="lg" @click="router.push('/')">
            KEMBALI KE HOME
          </BrutalButton>
        </div>
      </div>
    </div>

    <!-- Main Game UI -->
    <template v-if="!gameOver">
      <!-- Game Header -->
      <GameHeader
        :room-id="roomId"
        :round="currentGame?.round_num || 1"
        :phase="currentGame?.phase || 'clue'"
        :active-count="activePlayers.length"
        :total-count="allPlayers.length"
        :connected="sse.state.connected"
      />

      <!-- My word/role info bar -->
      <div v-if="myPlayer" class="my-info-bar">
        <div class="mib-name">
          <span class="mib-label">KAMU</span>
          <span class="mib-value">{{ myPlayer.name }}</span>
        </div>
        <div class="mib-sep"></div>
        <div class="mib-role" :class="`mib-role-${myPlayer.role}`">
          <span class="mib-label">PERAN</span>
          <span class="mib-value">{{ getRoleLabel(myPlayer.role) }}</span>
        </div>
        <div class="mib-sep"></div>
        <div class="mib-word">
          <span class="mib-label">KATA</span>
          <span class="mib-value">
            {{ myPlayer.role === 'mrwhite' ? '??? (Tidak Ada)' : (showMyWord ? myPlayer.word : '••••••') }}
          </span>
          <button v-if="myPlayer.role !== 'mrwhite'" class="word-toggle" @click="showMyWord = !showMyWord">
            {{ showMyWord ? '🙈' : '👁️' }}
          </button>
        </div>
        <button class="reveal-btn" @click="showRoleReveal = true" title="Lihat peran">
          🎭
        </button>
      </div>

      <!-- Game phases -->
      <main class="game-main">
        <div class="game-layout">

          <!-- Left: Main phase content -->
          <div class="phase-content">

            <!-- CLUE PHASE -->
            <div v-if="currentGame?.phase === 'clue'" class="phase-clue">
              <div class="phase-title">
                <span class="phase-icon">🗣️</span>
                <h2>FASE CLUE — RONDE {{ currentGame.round_num }}</h2>
              </div>
              <p class="phase-desc">
                Berikan <strong>1 kata clue</strong> yang menggambarkan kata kamu.
                Jangan terlalu jelas, jangan terlalu kabur!
              </p>

              <!-- Turn indicator -->
              <div class="turn-indicator" :class="isMyTurn ? 'turn-mine' : 'turn-other'">
                <span class="turn-icon">{{ isMyTurn ? '🎤' : '⏳' }}</span>
                <span class="turn-text">
                  {{ isMyTurn ? 'GILIRAN KAMU!' : `Giliran ${currentTurnPlayerName}...` }}
                </span>
                <div class="turn-order">
                  <span
                    v-for="p in activePlayers"
                    :key="p.id"
                    class="to-dot"
                    :class="{
                      'to-done': clues.some((c: any) => c.player_id === p.id),
                      'to-active': p.id === currentTurnPlayerId,
                      'to-waiting': !clues.some((c: any) => c.player_id === p.id) && p.id !== currentTurnPlayerId
                    }"
                    :title="p.name"
                  >{{ getInitials(p.name) }}</span>
                </div>
                <!-- Countdown -->
                <div class="turn-timer" :class="{ 'timer-urgent': timerUrgent }">
                  {{ timerDisplay }}
                </div>
              </div>
              <!-- Timer bar -->
              <div class="timer-bar-wrap">
                <div
                  class="timer-bar-fill"
                  :class="{ 'timer-bar-urgent': timerUrgent }"
                  :style="{ width: timerPercent + '%' }"
                ></div>
              </div>

              <!-- My clue input -->
              <div v-if="myPlayer && !myPlayer.is_eliminated" class="my-clue-section">
                <div class="mcs-header">CLUE KAMU:</div>
                <ClueInput
                  v-if="!myClueSubmitted && isMyTurn"
                  :disabled="false"
                  placeholder="Ketik 1 kata clue..."
                  @submit="submitClue"
                />
                <div v-else-if="myClueSubmitted" class="clue-submitted-badge">
                  <span>✓</span>
                  <strong>{{ myClueText }}</strong>
                  <span>TERKIRIM</span>
                </div>
                <div v-else class="waiting-turn-notice">
                  ⏳ Tunggu giliran kamu...
                </div>
              </div>

              <div v-else-if="myPlayer?.is_eliminated" class="eliminated-notice">
                💀 Kamu sudah tersingkir. Saksikan saja.
              </div>

              <!-- Progress -->
              <div class="clue-progress">
                <div class="cp-label">
                  CLUE TERKUMPUL: {{ clues.length }} / {{ activePlayers.length }}
                </div>
                <div class="cp-bar">
                  <div
                    class="cp-fill"
                    :style="{ width: `${(clues.length / Math.max(activePlayers.length, 1)) * 100}%` }"
                  ></div>
                </div>
              </div>

              <!-- Submitted clues so far -->
              <div v-if="clues.length > 0" class="clues-list">
                <h3>CLUE YANG SUDAH MASUK:</h3>
                <TransitionGroup name="clue-list">
                  <div v-for="clue in clues" :key="clue.id" class="clue-item">
                    <div class="ci-avatar" :style="{ background: getAvatarColor(clue.player_id) }">
                      {{ getInitials(clue.player_name) }}
                    </div>
                    <div class="ci-info">
                      <span class="ci-name">{{ clue.player_name }}</span>
                      <span class="ci-clue">{{ clue.clue_text }}</span>
                    </div>
                  </div>
                </TransitionGroup>
              </div>

              <!-- Waiting for others -->
              <div v-if="myClueSubmitted && clues.length < activePlayers.length" class="waiting-others">
                <div class="wo-icon">⏳</div>
                <p>Menunggu {{ activePlayers.length - clues.length }} pemain lain...</p>
              </div>
            </div>

            <!-- VOTING PHASE -->
            <div v-else-if="currentGame?.phase === 'voting'" class="phase-voting">
              <div class="phase-title">
                <span class="phase-icon">🗳️</span>
                <h2>FASE VOTING — RONDE {{ currentGame.round_num }}</h2>
              </div>
              <p class="phase-desc">
                Diskusikan, lalu pilih siapa yang paling mencurigakan!
                Pemain dengan suara terbanyak akan tersingkir.
              </p>

              <!-- All clues recap -->
              <div class="clues-recap">
                <h3>SEMUA CLUE RONDE INI:</h3>
                <div class="clues-recap-grid">
                  <div v-for="clue in clues" :key="clue.id" class="cr-item">
                    <div class="cr-name">{{ clue.player_name }}</div>
                    <div class="cr-clue">{{ clue.clue_text }}</div>
                  </div>
                </div>
              </div>

              <!-- Vote targets -->
              <div v-if="myPlayer && !myPlayer.is_eliminated" class="vote-section">
                <h3>{{ myVoteTarget ? `KAMU MEMILIH: ${getPlayerName(myVoteTarget)}` : 'PILIH SIAPA YANG TERSINGKIR:' }}</h3>

                <div class="vote-grid">
                  <VoteCard
                    v-for="player in votableActivePlayers"
                    :key="player.id"
                    :player="player"
                    :is-selected="myVoteTarget === player.id"
                    :has-voted="myVoteSubmitted"
                    :disabled="myVoteSubmitted || votingLoading"
                    @vote="selectVote"
                  />
                </div>

                <div v-if="!myVoteSubmitted" class="vote-confirm">
                  <BrutalButton
                    variant="red"
                    size="lg"
                    :disabled="!myVoteTarget"
                    :loading="votingLoading"
                    loading-text="MEMILIH..."
                    class="w-full"
                    @click="submitVote"
                  >
                    🗳️ KONFIRMASI PILIHAN
                  </BrutalButton>
                </div>

                <div v-else class="vote-submitted-notice">
                  ✓ KAMU SUDAH MEMILIH — Menunggu yang lain...
                </div>
              </div>

              <div v-else-if="myPlayer?.is_eliminated" class="eliminated-notice">
                💀 Kamu sudah tersingkir. Saksikan saja.
              </div>

              <!-- Vote progress -->
              <div class="clue-progress">
                <div class="cp-label">
                  VOTE TERKUMPUL: {{ votesSubmitted }} / {{ activePlayers.length }}
                </div>
                <div class="cp-bar">
                  <div
                    class="cp-fill red-fill"
                    :style="{ width: `${(votesSubmitted / Math.max(activePlayers.length, 1)) * 100}%` }"
                  ></div>
                </div>
              </div>
            </div>

            <!-- RESULT PHASE -->
            <div v-else-if="currentGame?.phase === 'result'" class="phase-result">
              <div class="phase-title">
                <span class="phase-icon">📋</span>
                <h2>HASIL VOTING</h2>
              </div>

              <!-- Eliminated player reveal -->
              <div v-if="eliminatedPlayer" class="elimination-reveal">
                <div class="er-label">DISINGKIRKAN!</div>
                <div class="er-avatar" :style="{ background: getAvatarColor(eliminatedPlayer.id) }">
                  {{ getInitials(eliminatedPlayer.name) }}
                </div>
                <div class="er-name">{{ eliminatedPlayer.name }}</div>
                <div class="er-role" :class="`er-role-${eliminatedPlayer.role}`">
                  {{ getRoleLabel(eliminatedPlayer.role) }}
                </div>
                <div class="er-icon">{{ getRoleIcon(eliminatedPlayer.role) }}</div>
              </div>

              <div v-else-if="voteTied" class="tie-result">
                <div class="tie-icon">🤝</div>
                <div class="tie-text">SERI! Tidak ada yang tersingkir ronde ini.</div>
              </div>

              <!-- Vote tally -->
              <div v-if="voteDetails.length > 0" class="vote-tally">
                <h3>HASIL SUARA:</h3>
                <div v-for="vd in voteDetails" :key="vd.target_id" class="vt-item">
                  <span class="vt-name">{{ vd.target_name }}</span>
                  <div class="vt-bar-wrap">
                    <div
                      class="vt-bar"
                      :style="{ width: `${(vd.vote_count / activePlayers.length) * 100}%` }"
                    ></div>
                  </div>
                  <span class="vt-count">{{ vd.vote_count }} suara</span>
                </div>
              </div>

              <!-- Next round or waiting -->
              <div v-if="isHost" class="host-next-action">
                <BrutalButton variant="yellow" size="xl" class="w-full" @click="nextRound">
                  LANJUT RONDE BERIKUTNYA →
                </BrutalButton>
              </div>
              <div v-else class="waiting-host">
                ⏳ Menunggu host melanjutkan...
              </div>
            </div>
          </div>

          <!-- Right: Players sidebar -->
          <aside class="players-sidebar">
            <div class="sidebar-header">PEMAIN AKTIF</div>
            <div class="sidebar-players">
              <div
                v-for="player in allPlayers"
                :key="player.id"
                class="sp-item"
                :class="{
                  'sp-active': !player.is_eliminated,
                  'sp-eliminated': player.is_eliminated,
                  'sp-me': player.id === myPlayerId
                }"
              >
                <div class="sp-avatar" :style="{ background: getAvatarColor(player.id) }">
                  <span v-if="!player.is_eliminated">{{ getInitials(player.name) }}</span>
                  <span v-else>💀</span>
                </div>
                <div class="sp-info">
                  <span class="sp-name" :class="{ 'line-through opacity-50': player.is_eliminated }">
                    {{ player.name }}
                  </span>
                  <div class="sp-tags">
                    <span v-if="player.id === firstPlayerId" class="sp-tag sp-host">HOST</span>
                    <span v-if="player.id === myPlayerId" class="sp-tag sp-me-tag">KAMU</span>
                    <span v-if="player.is_eliminated" class="sp-tag sp-elim">GUGUR</span>
                  </div>
                </div>
                <!-- Show clue in voting phase -->
                <div v-if="currentGame?.phase === 'voting' || currentGame?.phase === 'result'" class="sp-clue">
                  <span v-if="getPlayerClue(player.id)">{{ getPlayerClue(player.id) }}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </template>
  </div>
</template>

<script setup lang="ts">

const route = useRoute()
const router = useRouter()
const roomId = computed(() => String(route.params.id).toUpperCase())

const { getSession } = useGameSession()
const session = getSession()
const myPlayerId = ref<number | null>(session.playerId)
const mySessionId = ref<string | null>(session.sessionId)

// SSE
const sse = useSSE(roomId)

// Game state
const currentGame = ref<any>(null)
const allPlayers = ref<any[]>([])
const clues = ref<any[]>([])
const voteDetails = ref<any[]>([])
const votesSubmitted = ref(0)
const eliminatedPlayer = ref<any>(null)
const voteTied = ref(false)
const gameOver = ref(false)
const gameOverData = ref<any>(null)
const currentTurnPlayerId = ref<number | null>(null)

// Turn timer
const TURN_DURATION = 90
const turnTimeLeft = ref(TURN_DURATION)
let turnTimerInterval: ReturnType<typeof setInterval> | null = null

const startTurnTimer = () => {
  if (turnTimerInterval) clearInterval(turnTimerInterval)
  turnTimeLeft.value = TURN_DURATION
  if (currentGame.value?.phase !== 'clue') return
  turnTimerInterval = setInterval(() => {
    turnTimeLeft.value--
    if (turnTimeLeft.value <= 0) {
      clearInterval(turnTimerInterval!)
      turnTimerInterval = null
      if (isMyTurn.value && !myClueSubmitted.value) {
        submitClue('')
      }
    }
  }, 1000)
}

const stopTurnTimer = () => {
  if (turnTimerInterval) { clearInterval(turnTimerInterval); turnTimerInterval = null }
}

const timerDisplay = computed(() => {
  const m = Math.floor(turnTimeLeft.value / 60)
  const s = turnTimeLeft.value % 60
  return `${m}:${String(s).padStart(2, '0')}`
})
const timerUrgent = computed(() => turnTimeLeft.value <= 15)
const timerPercent = computed(() => Math.max(0, (turnTimeLeft.value / TURN_DURATION) * 100))

// My state
const myPlayer = ref<any>(null)
const showRoleReveal = ref(false)
const showMyWord = ref(false)
const myClueSubmitted = ref(false)
const myClueText = ref('')
const myVoteTarget = ref<number | null>(null)
const myVoteSubmitted = ref(false)
const votingLoading = ref(false)

// Mr. White guess
const showMrWhiteGuess = ref(false)
const mrWhiteGuess = ref('')
const mrWhiteGuessError = ref('')
const guessLoading = ref(false)

// Computed
const activePlayers = computed(() => allPlayers.value.filter((p: any) => !p.is_eliminated))
const votableActivePlayers = computed(() =>
  activePlayers.value.filter((p: any) => p.id !== myPlayerId.value)
)
const firstPlayerId = computed(() => allPlayers.value[0]?.id)
const isHost = computed(() => firstPlayerId.value === myPlayerId.value)
const isMyTurn = computed(() => currentTurnPlayerId.value === myPlayerId.value)
const currentTurnPlayerName = computed(() =>
  allPlayers.value.find((p: any) => p.id === currentTurnPlayerId.value)?.name ?? ''
)

// Load initial game state
const loadGameState = async () => {
  try {
    const data = await $fetch<any>(`/api/rooms/${roomId.value}`)

    if (!data.game) {
      router.push(`/room/${roomId.value}`)
      return
    }

    currentGame.value = data.game
    allPlayers.value = data.players
    clues.value = data.clues || []
    currentTurnPlayerId.value = data.currentTurnPlayerId ?? null

    if (data.game?.phase === 'clue') startTurnTimer()

    // Load my player info
    await loadMyPlayerInfo()
  } catch (err) {
    console.error('Failed to load game state:', err)
  }
}

const loadMyPlayerInfo = async () => {
  if (!myPlayerId.value || !mySessionId.value) return
  try {
    const data = await $fetch<any>('/api/game/player-info', {
      query: { playerId: myPlayerId.value, sessionId: mySessionId.value }
    })
    myPlayer.value = data

    // Show role reveal on first load
    if (!myPlayer.value.is_eliminated && currentGame.value?.phase === 'clue' && currentGame.value?.round_num === 1) {
      showRoleReveal.value = true
    }
  } catch (err) {
    console.error('Failed to load player info:', err)
  }
}

// SSE event handlers
sse.on('game_started', (data: any) => {
  currentGame.value = data.game
  allPlayers.value = data.players
  currentTurnPlayerId.value = data.currentTurnPlayerId ?? null
  const me = data.players.find((p: any) => p.id === myPlayerId.value)
  if (me) {
    myPlayer.value = me
    showRoleReveal.value = true
  }
})

sse.on('clue_submitted', (data: any) => {
  clues.value = data.clues
  currentTurnPlayerId.value = data.currentTurnPlayerId ?? null
})

sse.on('phase_changed', (data: any) => {
  currentGame.value = { ...currentGame.value, phase: data.phase }
  if (data.activePlayers) {
    allPlayers.value = data.activePlayers
  }
  if (data.clues) {
    clues.value = data.clues
  }
  // Reset voting state for new phase
  if (data.phase === 'voting') {
    myVoteTarget.value = null
    myVoteSubmitted.value = false
    votesSubmitted.value = 0
    voteDetails.value = []
    eliminatedPlayer.value = null
    voteTied.value = false
  }
})

sse.on('vote_submitted', (data: any) => {
  votesSubmitted.value = data.votesSubmitted
})

sse.on('vote_result', (data: any) => {
  currentGame.value = { ...currentGame.value, phase: 'result' }
  eliminatedPlayer.value = data.eliminatedPlayer
  voteTied.value = data.tied
  voteDetails.value = data.voteDetails || []
  if (data.players) allPlayers.value = data.players

  // Check if I am the eliminated Mr. White
  if (data.mrWhiteGuessing && data.eliminatedPlayer?.id === myPlayerId.value) {
    showMrWhiteGuess.value = true
  }
})

sse.on('mr_white_failed', () => {
  showMrWhiteGuess.value = false
})

sse.on('next_round', (data: any) => {
  currentGame.value = { ...currentGame.value, round_num: data.round, phase: 'clue' }
  clues.value = []
  currentTurnPlayerId.value = data.currentTurnPlayerId ?? null
  myClueSubmitted.value = false
  myClueText.value = ''
  myVoteTarget.value = null
  myVoteSubmitted.value = false
  votesSubmitted.value = 0
  voteDetails.value = []
  eliminatedPlayer.value = null
  voteTied.value = false

  if (data.activePlayers) allPlayers.value = data.activePlayers
})

sse.on('game_over', (data: any) => {
  gameOver.value = true
  gameOverData.value = data
  // Update players with final data
  if (data.players) allPlayers.value = data.players
})

// Actions
const submitClue = async (clueText: string) => {
  if (!currentGame.value || !myPlayerId.value || !mySessionId.value) return

  try {
    await $fetch('/api/game/clue', {
      method: 'POST',
      body: {
        gameId: currentGame.value.id,
        playerId: myPlayerId.value,
        sessionId: mySessionId.value,
        clue: clueText
      }
    })
    myClueSubmitted.value = true
    myClueText.value = clueText
  } catch (err: any) {
    console.error('Failed to submit clue:', err?.data?.message)
  }
}

const selectVote = (playerId: number) => {
  if (myVoteSubmitted.value) return
  myVoteTarget.value = myVoteTarget.value === playerId ? null : playerId
}

const submitVote = async () => {
  if (!myVoteTarget.value || !currentGame.value || !myPlayerId.value || !mySessionId.value) return

  votingLoading.value = true
  try {
    await $fetch('/api/game/vote', {
      method: 'POST',
      body: {
        gameId: currentGame.value.id,
        playerId: myPlayerId.value,
        sessionId: mySessionId.value,
        targetId: myVoteTarget.value
      }
    })
    myVoteSubmitted.value = true
  } catch (err: any) {
    console.error('Failed to submit vote:', err?.data?.message)
  } finally {
    votingLoading.value = false
  }
}

const submitMrWhiteGuess = async () => {
  if (!mrWhiteGuess.value.trim() || !currentGame.value || !myPlayerId.value || !mySessionId.value) return

  guessLoading.value = true
  mrWhiteGuessError.value = ''
  try {
    await $fetch<any>('/api/game/guess', {
      method: 'POST',
      body: {
        gameId: currentGame.value.id,
        playerId: myPlayerId.value,
        sessionId: mySessionId.value,
        guess: mrWhiteGuess.value.trim()
      }
    })
    showMrWhiteGuess.value = false
  } catch (err: any) {
    mrWhiteGuessError.value = err?.data?.message || 'Gagal mengirim tebakan'
  } finally {
    guessLoading.value = false
  }
}

const skipMrWhiteGuess = async () => {
  if (!currentGame.value || !myPlayerId.value || !mySessionId.value) return
  // Submit empty guess = automatic fail
  try {
    await $fetch('/api/game/guess', {
      method: 'POST',
      body: {
        gameId: currentGame.value.id,
        playerId: myPlayerId.value,
        sessionId: mySessionId.value,
        guess: '___SKIP___'
      }
    })
    showMrWhiteGuess.value = false
  } catch {
    showMrWhiteGuess.value = false
  }
}

const nextRound = async () => {
  if (!currentGame.value || !mySessionId.value) return
  try {
    await $fetch('/api/game/next-round', {
      method: 'POST',
      body: {
        gameId: currentGame.value.id,
        sessionId: mySessionId.value
      }
    })
  } catch (err: any) {
    console.error('Failed to advance round:', err)
  }
}

// Helpers
const getPlayerName = (id: number) => allPlayers.value.find(p => p.id === id)?.name || '?'
const getPlayerClue = (playerId: number) => clues.value.find(c => c.player_id === playerId)?.clue_text

const getAvatarColor = (id: number) => {
  const colors = ['#FFE600', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#DDA0DD', '#98D8C8', '#F7DC6F']
  return colors[id % colors.length]
}

const getInitials = (name: string) => {
  if (!name) return '?'
  const parts = name.split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

const getRoleLabel = (role: string) => ({
  'civilian': 'CIVILIAN',
  'undercover': 'UNDERCOVER',
  'mrwhite': 'MR. WHITE'
}[role] || role?.toUpperCase() || '???')

const getRoleIcon = (role: string) => ({
  'civilian': '👤',
  'undercover': '🕵️',
  'mrwhite': '❓'
}[role] || '❓')

type WinnerKey = 'civilian' | 'undercover' | 'mrwhite'

// Game over computed
const winnerCardClass = computed(() => {
  const map: Record<WinnerKey, string> = { civilian: 'winner-civilian', undercover: 'winner-undercover', mrwhite: 'winner-mrwhite' }
  return map[gameOverData.value?.winner as WinnerKey] || ''
})

const winnerIcon = computed(() => {
  const map: Record<WinnerKey, string> = { civilian: '👥', undercover: '🕵️', mrwhite: '❓' }
  return map[gameOverData.value?.winner as WinnerKey] || '🏆'
})

const winnerName = computed(() => {
  const map: Record<WinnerKey, string> = { civilian: 'CIVILIAN MENANG!', undercover: 'UNDERCOVER MENANG!', mrwhite: 'MR. WHITE MENANG!' }
  return map[gameOverData.value?.winner as WinnerKey] || 'GAME OVER'
})


// Reset & start timer on each turn change
watch(currentTurnPlayerId, () => {
  if (currentGame.value?.phase === 'clue') startTurnTimer()
})

watch(() => currentGame.value?.phase, (phase) => {
  if (phase === 'clue') startTurnTimer()
  else stopTurnTimer()
})

onUnmounted(() => stopTurnTimer())

onMounted(() => {
  if (!session.playerId || !session.sessionId) {
    router.push('/')
    return
  }
  loadGameState()
})
</script>

<style scoped>
.game-page {
  min-height: 100vh;
  background: #fff;
  display: flex;
  flex-direction: column;
}

/* Modal overlay */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 20px;
}

.mrwhite-guess-modal {
  max-width: 440px;
  width: 100%;
  background: #111;
  border: 6px solid #FFE600;
  box-shadow: 12px 12px 0 #FFE600;
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mw-header {
  font-size: 24px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #FFE600;
  text-align: center;
  border-bottom: 3px solid #FFE600;
  padding-bottom: 12px;
}

.mw-body {
  color: #fff;
}

.mw-body p {
  font-size: 15px;
  margin-bottom: 12px;
  line-height: 1.6;
}

.mw-body strong {
  color: #FFE600;
}

.error-msg {
  background: #FF2020;
  color: #fff;
  border: 3px solid #000;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 700;
}

/* My info bar */
.my-info-bar {
  background: #000;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 0;
  border-bottom: 3px solid #333;
  overflow-x: auto;
}

.my-info-bar > div, .my-info-bar > button {
  flex-shrink: 0;
}

.mib-sep {
  width: 2px;
  background: #333;
  align-self: stretch;
}

.mib-name, .mib-role, .mib-word {
  padding: 10px 16px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mib-label {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  opacity: 0.5;
  color: #fff;
}

.mib-value {
  font-size: 15px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #FFE600;
}

.mib-role-civilian .mib-value { color: #00C800; }
.mib-role-undercover .mib-value { color: #6666ff; }
.mib-role-mrwhite .mib-value { color: #FFE600; }

.mib-word {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.word-toggle {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
  margin-top: 2px;
}

.reveal-btn {
  padding: 10px 16px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 20px;
  border-left: 2px solid #333;
  color: #fff;
  transition: background 0.1s ease;
}

.reveal-btn:hover {
  background: #222;
}

/* Main layout */
.game-main {
  flex: 1;
  padding: 20px;
}

.game-layout {
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 20px;
}

@media (max-width: 800px) {
  .game-layout {
    grid-template-columns: 1fr;
  }
}

/* Phase titles */
.phase-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 4px solid #000;
}

.phase-icon {
  font-size: 32px;
}

.phase-title h2 {
  font-size: clamp(18px, 4vw, 26px);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.phase-desc {
  font-size: 14px;
  color: #555;
  margin-bottom: 20px;
  line-height: 1.6;
}

/* Turn indicator */
.turn-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border: 4px solid #000;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.turn-mine {
  background: #FFE600;
  box-shadow: 6px 6px 0 #000;
  animation: pulse-brutal 1s ease-in-out infinite;
}

.turn-other {
  background: #f0f0f0;
}

@keyframes pulse-brutal {
  0%, 100% { box-shadow: 6px 6px 0 #000; }
  50%       { box-shadow: 8px 8px 0 #000; }
}

.turn-icon { font-size: 22px; flex-shrink: 0; }

.turn-timer {
  font-size: 20px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
  padding: 4px 10px;
  border: 3px solid #000;
  background: #fff;
  min-width: 64px;
  text-align: center;
  flex-shrink: 0;
}

.turn-timer.timer-urgent {
  background: #FF2020;
  color: #fff;
  border-color: #000;
  animation: timer-pulse 0.5s ease-in-out infinite;
}

@keyframes timer-pulse {
  0%, 100% { transform: scale(1); }
  50%       { transform: scale(1.08); }
}

.timer-bar-wrap {
  height: 8px;
  background: #eee;
  border: 3px solid #000;
  border-top: none;
  overflow: hidden;
  margin-bottom: 12px;
}

.timer-bar-fill {
  height: 100%;
  background: #00C800;
  transition: width 1s linear, background 0.3s ease;
}

.timer-bar-fill.timer-bar-urgent {
  background: #FF2020;
}

.turn-text {
  font-size: 16px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  flex: 1;
}

.turn-order {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.to-dot {
  width: 28px;
  height: 28px;
  border: 2px solid #000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 800;
  cursor: default;
}

.to-done    { background: #00C800; color: #fff; border-color: #00A000; }
.to-active  { background: #000; color: #FFE600; animation: bounce-brutal 0.6s ease-in-out infinite alternate; }
.to-waiting { background: #fff; color: #aaa; border-color: #ccc; }

@keyframes bounce-brutal {
  from { transform: translateY(0); }
  to   { transform: translateY(-4px); }
}

.waiting-turn-notice {
  padding: 14px 16px;
  border: 3px dashed #ccc;
  font-size: 15px;
  font-weight: 600;
  color: #888;
  text-align: center;
}

/* Clue phase */
.my-clue-section {
  border: 4px solid #000;
  padding: 16px;
  box-shadow: 6px 6px 0 #FFE600;
  margin-bottom: 20px;
}

.mcs-header {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 12px;
  color: #666;
}

.clue-submitted-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #00C800;
  border: 4px solid #000;
  box-shadow: 4px 4px 0 #000;
}

.clue-submitted-badge span {
  font-size: 20px;
  font-weight: 800;
  color: #fff;
}

.clue-submitted-badge strong {
  flex: 1;
  font-size: 22px;
  font-weight: 800;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.clue-progress {
  margin-bottom: 20px;
}

.cp-label {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-bottom: 8px;
  color: #555;
}

.cp-bar {
  height: 16px;
  background: #eee;
  border: 3px solid #000;
  overflow: hidden;
}

.cp-fill {
  height: 100%;
  background: #00C800;
  transition: width 0.5s ease;
}

.cp-fill.red-fill {
  background: #FF2020;
}

.clues-list {
  margin-top: 16px;
}

.clues-list h3 {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #555;
  margin-bottom: 12px;
}

.clue-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 3px solid #000;
  background: #fff;
  box-shadow: 3px 3px 0 #000;
  margin-bottom: 8px;
}

.ci-avatar {
  width: 36px;
  height: 36px;
  border: 2px solid #000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 13px;
  flex-shrink: 0;
}

.ci-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.ci-name {
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  color: #666;
  min-width: 80px;
}

.ci-clue {
  font-size: 20px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #000;
}

.waiting-others {
  text-align: center;
  padding: 24px;
  border: 3px dashed #ccc;
  margin-top: 16px;
}

.wo-icon {
  font-size: 36px;
  margin-bottom: 10px;
}

.waiting-others p {
  font-size: 15px;
  color: #666;
  font-weight: 500;
}

.eliminated-notice {
  padding: 16px;
  background: #f3f3f3;
  border: 3px solid #999;
  font-size: 16px;
  font-weight: 700;
  text-align: center;
  color: #666;
}

/* Voting phase */
.clues-recap {
  margin-bottom: 24px;
  border: 4px solid #000;
  padding: 16px;
  background: #f9f9f9;
}

.clues-recap h3 {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #555;
  margin-bottom: 12px;
}

.clues-recap-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
}

.cr-item {
  border: 3px solid #000;
  padding: 10px 12px;
  background: #fff;
  box-shadow: 3px 3px 0 #000;
}

.cr-name {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #666;
  margin-bottom: 4px;
}

.cr-clue {
  font-size: 18px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.vote-section h3 {
  font-size: 16px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 16px;
}

.vote-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.vote-confirm {
  margin-top: 8px;
}

.vote-submitted-notice {
  padding: 14px;
  background: #00C800;
  border: 4px solid #000;
  color: #fff;
  font-size: 15px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  text-align: center;
}

/* Result phase */
.elimination-reveal {
  border: 6px solid #000;
  padding: 32px 24px;
  text-align: center;
  background: #FF2020;
  color: #fff;
  box-shadow: 10px 10px 0 #000;
  margin-bottom: 24px;
  animation: slam-in 0.5s ease-out;
}

.er-label {
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  opacity: 0.7;
  margin-bottom: 16px;
}

.er-avatar {
  width: 80px;
  height: 80px;
  border: 4px solid #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 28px;
  margin: 0 auto 12px;
}

.er-name {
  font-size: 36px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 8px;
}

.er-role {
  display: inline-block;
  padding: 8px 20px;
  border: 3px solid #fff;
  font-size: 20px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 12px;
}

.er-role-civilian { background: #00A000; }
.er-role-undercover { background: #0000CC; }
.er-role-mrwhite { background: #111; color: #FFE600; border-color: #FFE600; }

.er-icon {
  font-size: 48px;
}

.tie-result {
  border: 4px solid #000;
  padding: 24px;
  text-align: center;
  background: #FFE600;
  box-shadow: 6px 6px 0 #000;
  margin-bottom: 24px;
}

.tie-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.tie-text {
  font-size: 22px;
  font-weight: 800;
  text-transform: uppercase;
}

.vote-tally {
  border: 4px solid #000;
  padding: 16px;
  background: #f9f9f9;
  margin-bottom: 20px;
}

.vote-tally h3 {
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #555;
  margin-bottom: 14px;
}

.vt-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.vt-name {
  width: 90px;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  flex-shrink: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vt-bar-wrap {
  flex: 1;
  height: 20px;
  background: #eee;
  border: 2px solid #000;
  overflow: hidden;
}

.vt-bar {
  height: 100%;
  background: #FF2020;
  transition: width 0.8s ease;
}

.vt-count {
  width: 70px;
  font-size: 13px;
  font-weight: 700;
  text-align: right;
  flex-shrink: 0;
}

.host-next-action {
  margin-top: 20px;
}

.waiting-host {
  margin-top: 20px;
  padding: 16px;
  border: 3px dashed #ccc;
  text-align: center;
  font-size: 15px;
  color: #666;
  font-weight: 600;
}

/* Players sidebar */
.players-sidebar {
  border: 4px solid #000;
  box-shadow: 6px 6px 0 #000;
  height: fit-content;
  position: sticky;
  top: 20px;
}

.sidebar-header {
  background: #000;
  color: #FFE600;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  border-bottom: 3px solid #FFE600;
}

.sidebar-players {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sp-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 2px solid #000;
  background: #fff;
}

.sp-active {
  box-shadow: 2px 2px 0 #000;
}

.sp-eliminated {
  background: #f3f3f3;
  border-color: #ccc;
  opacity: 0.6;
}

.sp-me {
  background: #fff9cc;
  border-color: #FFE600;
  box-shadow: 2px 2px 0 #FFE600;
}

.sp-avatar {
  width: 32px;
  height: 32px;
  border: 2px solid #000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 11px;
  flex-shrink: 0;
}

.sp-info {
  flex: 1;
  min-width: 0;
}

.sp-name {
  display: block;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sp-tags {
  display: flex;
  gap: 3px;
  margin-top: 2px;
  flex-wrap: wrap;
}

.sp-tag {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 1px 4px;
  border: 1px solid #000;
}

.sp-host { background: #FFE600; color: #000; }
.sp-me-tag { background: #00C800; color: #fff; }
.sp-elim { background: #999; color: #fff; border-color: #999; }

.sp-clue {
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
  color: #555;
  flex-shrink: 0;
  max-width: 70px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Game Over */
.game-over-screen {
  min-height: 100vh;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.game-over-inner {
  max-width: 680px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.winner-card {
  border: 6px solid #FFE600;
  padding: 40px 32px;
  text-align: center;
  box-shadow: 14px 14px 0 #FFE600;
  animation: slam-in 0.6s ease-out;
}

.winner-civilian { background: #00C800; color: #fff; }
.winner-undercover { background: #0000FF; color: #fff; }
.winner-mrwhite { background: #111; color: #FFE600; }

.winner-label {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  opacity: 0.6;
  margin-bottom: 16px;
}

.winner-icon {
  font-size: 80px;
  margin-bottom: 16px;
}

.winner-name {
  font-size: clamp(32px, 8vw, 56px);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 12px;
}

.winner-reason {
  font-size: 16px;
  font-weight: 500;
  opacity: 0.85;
  line-height: 1.5;
}

.words-reveal {
  display: flex;
  align-items: center;
  gap: 16px;
  border: 4px solid #FFE600;
  padding: 20px 24px;
  background: #111;
}

@media (max-width: 500px) {
  .words-reveal { flex-direction: column; }
}

.word-reveal-item {
  flex: 1;
  text-align: center;
}

.wr-label {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #666;
  margin-bottom: 8px;
}

.wr-word {
  font-size: 28px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.civilian-word { color: #00C800; }
.undercover-word { color: #6666ff; }

.vs-divider {
  font-size: 24px;
  font-weight: 800;
  color: #FFE600;
  padding: 0 12px;
}

.final-players {
  border: 4px solid #333;
  padding: 16px;
  background: #111;
}

.final-players h3 {
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #555;
  margin-bottom: 12px;
}

.final-players-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 8px;
}

.final-player-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 2px solid #333;
  background: #1a1a1a;
}

.final-player-item.eliminated {
  opacity: 0.5;
  border-style: dashed;
}

.fp-avatar {
  width: 32px;
  height: 32px;
  border: 2px solid #444;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 11px;
  flex-shrink: 0;
}

.fp-name {
  flex: 1;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  color: #ddd;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fp-role {
  font-size: 10px;
  font-weight: 800;
  padding: 2px 6px;
  border: 1px solid #333;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.fp-role.role-civilian { background: #00A000; color: #fff; }
.fp-role.role-undercover { background: #0000CC; color: #fff; }
.fp-role.role-mrwhite { background: #222; color: #FFE600; }

.fp-eliminated {
  font-size: 14px;
}

.game-over-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* Clue list transition */
.clue-list-enter-active {
  transition: all 0.3s ease;
}

.clue-list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

@keyframes slam-in {
  0% { transform: scale(2) rotate(-8deg); opacity: 0; }
  60% { transform: scale(0.95) rotate(2deg); opacity: 1; }
  80% { transform: scale(1.02) rotate(-1deg); }
  100% { transform: scale(1) rotate(0); }
}
</style>
