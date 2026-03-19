<template>
  <button
    class="vote-card"
    :class="[
      { 'selected': isSelected, 'voted': hasVoted, 'disabled': disabled },
      isSelected ? 'vote-selected' : ''
    ]"
    :disabled="disabled || hasVoted"
    type="button"
    @click="$emit('vote', player.id)"
  >
    <!-- Avatar -->
    <div class="vote-avatar" :style="{ background: avatarColor }">
      <span v-if="!isEliminated">{{ initials }}</span>
      <span v-else class="text-2xl">💀</span>
    </div>

    <!-- Name -->
    <div class="vote-name">{{ player.name }}</div>

    <!-- Selection indicator -->
    <div v-if="isSelected" class="vote-check">✓</div>

    <!-- Current vote count (during result) -->
    <div v-if="voteCount !== undefined && voteCount > 0" class="vote-tally">
      {{ voteCount }}
    </div>
  </button>
</template>

<script setup lang="ts">
interface Player {
  id: number
  name: string
  is_eliminated?: number | boolean
}

interface Props {
  player: Player
  isSelected?: boolean
  hasVoted?: boolean
  disabled?: boolean
  voteCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
  hasVoted: false,
  disabled: false
})

defineEmits<{
  vote: [playerId: number]
}>()

const isEliminated = computed(() => !!props.player.is_eliminated)

const initials = computed(() => {
  const name = props.player.name
  const parts = name.split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
})

const COLORS = [
  '#FFE600', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE'
]

const avatarColor = computed(() => COLORS[props.player.id % COLORS.length])
</script>

<style scoped>
.vote-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  background: #fff;
  border: 4px solid #000;
  box-shadow: 5px 5px 0 #000;
  cursor: pointer;
  font-family: 'Space Grotesk', system-ui;
  transition: transform 0.1s ease, box-shadow 0.1s ease, background 0.1s ease;
  min-width: 100px;
}

.vote-card:not(.disabled):not(.voted):hover {
  transform: translate(-2px, -2px);
  box-shadow: 7px 7px 0 #000;
  background: #fff9cc;
}

.vote-card:not(.disabled):not(.voted):active {
  transform: translate(3px, 3px);
  box-shadow: 2px 2px 0 #000;
}

.vote-card.vote-selected {
  background: #FFE600;
  border-color: #000;
  box-shadow: 5px 5px 0 #000;
  transform: scale(1.05);
}

.vote-card.voted {
  cursor: default;
}

.vote-card.disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.vote-avatar {
  width: 60px;
  height: 60px;
  border: 3px solid #000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 20px;
}

.vote-name {
  font-weight: 700;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  text-align: center;
  max-width: 90px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vote-check {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 28px;
  height: 28px;
  background: #00C800;
  border: 3px solid #000;
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 800;
  color: #fff;
}

.vote-tally {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 28px;
  height: 28px;
  background: #FF2020;
  border: 3px solid #000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 800;
  color: #fff;
}
</style>
