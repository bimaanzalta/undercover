<template>
  <header class="game-header">
    <div class="header-left">
      <div class="room-code">
        <span class="room-label">ROOM</span>
        <span class="room-id">{{ roomId }}</span>
      </div>
      <div class="round-info">
        <span>RONDE {{ round }}</span>
      </div>
    </div>

    <div class="phase-badge" :class="phaseClass">
      {{ phaseLabel }}
    </div>

    <div class="header-right">
      <div class="player-count">
        <span class="pc-icon">👥</span>
        <span class="pc-num">{{ activeCount }}/{{ totalCount }}</span>
      </div>
      <div class="connection-dot" :class="{ 'connected': connected, 'disconnected': !connected }" :title="connected ? 'Terhubung' : 'Terputus'">
        <span />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
interface Props {
  roomId: string
  round: number
  phase: string
  activeCount: number
  totalCount: number
  connected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  connected: true
})

const phaseLabel = computed(() => ({
  'clue': '🗣️ FASE CLUE',
  'voting': '🗳️ FASE VOTING',
  'result': '📋 HASIL',
  'finished': '🏁 SELESAI'
}[props.phase] || props.phase?.toUpperCase()))

const phaseClass = computed(() => ({
  'clue': 'phase-clue-style',
  'voting': 'phase-voting-style',
  'result': 'phase-result-style',
  'finished': 'phase-finish-style'
}[props.phase] || ''))
</script>

<style scoped>
.game-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #000;
  color: #FFE600;
  border-bottom: 4px solid #FFE600;
  gap: 12px;
  flex-wrap: wrap;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.room-code {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.room-label {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.15em;
  opacity: 0.6;
  color: #FFE600;
}

.room-id {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: #FFE600;
}

.round-info {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #fff;
  border: 2px solid #444;
  padding: 4px 10px;
}

.phase-badge {
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 8px 14px;
  border: 3px solid #000;
}

.phase-clue-style {
  background: #FFE600;
  color: #000;
  border-color: #000;
}

.phase-voting-style {
  background: #FF2020;
  color: #fff;
  border-color: #000;
}

.phase-result-style {
  background: #fff;
  color: #000;
  border-color: #FFE600;
}

.phase-finish-style {
  background: #00C800;
  color: #fff;
  border-color: #000;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.player-count {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 700;
  color: #fff;
}

.pc-icon {
  font-size: 18px;
}

.pc-num {
  color: #FFE600;
  font-weight: 800;
}

.connection-dot {
  width: 12px;
  height: 12px;
  border: 2px solid #333;
  position: relative;
}

.connection-dot span {
  display: block;
  width: 100%;
  height: 100%;
}

.connection-dot.connected span {
  background: #00C800;
  animation: pulse 2s ease-in-out infinite;
}

.connection-dot.disconnected span {
  background: #FF2020;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
