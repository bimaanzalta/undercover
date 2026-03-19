<template>
  <div
    class="player-badge"
    :class="[
      isEliminated ? 'eliminated' : 'active',
      isHost ? 'is-host' : ''
    ]"
  >
    <div class="player-badge-inner">
      <!-- Avatar circle -->
      <div class="avatar" :style="{ background: avatarColor }">
        <span>{{ initials }}</span>
      </div>

      <!-- Name + labels -->
      <div class="info">
        <span class="name" :class="{ 'line-through opacity-50': isEliminated }">
          {{ player.name }}
        </span>
        <div class="labels">
          <span v-if="isHost" class="label label-host">HOST</span>
          <span v-if="isEliminated" class="label label-eliminated">GUGUR</span>
          <span v-if="showRole && player.role" class="label" :class="roleLabelClass">
            {{ roleLabel }}
          </span>
        </div>
      </div>

      <!-- Vote indicator -->
      <div v-if="voteCount !== undefined" class="vote-count">
        <span>{{ voteCount }}x</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Player {
  id: number
  name: string
  role?: string | null
  is_eliminated?: number | boolean
}

interface Props {
  player: Player
  isHost?: boolean
  showRole?: boolean
  voteCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  isHost: false,
  showRole: false
})

const isEliminated = computed(() => !!props.player.is_eliminated)

const initials = computed(() => {
  const name = props.player.name
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
})

const COLORS = [
  '#FFE600', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE'
]

const avatarColor = computed(() => {
  const idx = props.player.id % COLORS.length
  return COLORS[idx]
})

const roleLabel = computed(() => ({
  'civilian': 'CIVILIAN',
  'undercover': 'UNDERCOVER',
  'mrwhite': 'MR. WHITE'
}[props.player.role || ''] || props.player.role?.toUpperCase() || ''))

const roleLabelClass = computed(() => ({
  'civilian': 'label-civilian',
  'undercover': 'label-undercover',
  'mrwhite': 'label-mrwhite'
}[props.player.role || ''] || ''))
</script>

<style scoped>
.player-badge {
  border: 3px solid #000;
  background: #fff;
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}

.player-badge.active {
  box-shadow: 4px 4px 0 #000;
}

.player-badge.eliminated {
  background: #f3f3f3;
  border-color: #999;
  box-shadow: 3px 3px 0 #999;
}

.player-badge-inner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
}

.avatar {
  width: 40px;
  height: 40px;
  border: 3px solid #000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 14px;
  flex-shrink: 0;
}

.info {
  flex: 1;
  min-width: 0;
}

.name {
  display: block;
  font-weight: 700;
  font-size: 15px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.labels {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 2px;
}

.label {
  display: inline-block;
  padding: 1px 6px;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  border: 2px solid #000;
}

.label-host {
  background: #FFE600;
  color: #000;
}

.label-eliminated {
  background: #999;
  color: #fff;
}

.label-civilian {
  background: #00C800;
  color: #fff;
}

.label-undercover {
  background: #0000FF;
  color: #fff;
}

.label-mrwhite {
  background: #000;
  color: #FFE600;
}

.vote-count {
  font-size: 18px;
  font-weight: 800;
  color: #FF2020;
  min-width: 32px;
  text-align: right;
}
</style>
