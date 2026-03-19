<template>
  <div class="role-reveal-overlay" @click.self="$emit('close')">
    <div class="role-reveal-card" :class="roleClass" ref="cardRef">
      <!-- Top label -->
      <div class="reveal-label">
        {{ isEliminated ? '💀 TERSINGKIR!' : '🎭 PERAN KAMU' }}
      </div>

      <!-- Player name -->
      <div class="reveal-name">{{ playerName }}</div>

      <!-- Role icon -->
      <div class="reveal-icon">{{ roleIcon }}</div>

      <!-- Role name -->
      <div class="reveal-role">{{ roleDisplayName }}</div>

      <!-- Word -->
      <div v-if="word" class="reveal-word-section">
        <div class="reveal-word-label">KATA KAMU:</div>
        <div class="reveal-word">{{ word }}</div>
      </div>

      <div v-else-if="role === 'mrwhite'" class="reveal-word-section">
        <div class="reveal-word-label">KATA KAMU:</div>
        <div class="reveal-word no-word">??? TIDAK PUNYA KATA</div>
      </div>

      <!-- Description -->
      <div class="reveal-desc">{{ roleDescription }}</div>

      <!-- Close button -->
      <button class="reveal-close-btn" @click="$emit('close')">
        {{ closeBtnText || 'MENGERTI!' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  playerName: string
  role: 'civilian' | 'undercover' | 'mrwhite' | string
  word?: string | null
  isEliminated?: boolean
  closeBtnText?: string
}

const props = withDefaults(defineProps<Props>(), {
  isEliminated: false
})

defineEmits(['close'])

const cardRef = ref<HTMLDivElement>()

const roleClass = computed(() => ({
  'civilian': 'role-civilian',
  'undercover': 'role-undercover',
  'mrwhite': 'role-mrwhite'
}[props.role] || 'role-civilian'))

const roleIcon = computed(() => ({
  'civilian': '👤',
  'undercover': '🕵️',
  'mrwhite': '❓'
}[props.role] || '❓'))

const roleDisplayName = computed(() => ({
  'civilian': 'CIVILIAN',
  'undercover': 'UNDERCOVER',
  'mrwhite': 'MR. WHITE'
}[props.role] || props.role?.toUpperCase()))

const roleDescription = computed(() => ({
  'civilian': 'Kamu tahu kata aslinya. Beri clue tanpa terlalu jelas. Eliminasi semua Undercover & Mr. White!',
  'undercover': 'Kamu punya kata berbeda. Pura-pura jadi Civilian! Jangan sampai ketahuan!',
  'mrwhite': 'Kamu tidak punya kata! Bluff dengan berani. Kalau ketahuan, tebak kata Civilian untuk menang!'
}[props.role] || ''))

onMounted(() => {
  nextTick(() => {
    if (cardRef.value) {
      cardRef.value.classList.add('animate-slam-in')
    }
  })
})
</script>

<style scoped>
.role-reveal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}

.role-reveal-card {
  max-width: 380px;
  width: 100%;
  border: 6px solid #000;
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  position: relative;
  text-align: center;
}

.role-civilian {
  background: #00C800;
  color: #fff;
  box-shadow: 12px 12px 0 #004400;
}

.role-undercover {
  background: #0000FF;
  color: #fff;
  box-shadow: 12px 12px 0 #000033;
}

.role-mrwhite {
  background: #111;
  color: #FFE600;
  box-shadow: 12px 12px 0 #FFE600;
}

.reveal-label {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  opacity: 0.85;
}

.reveal-name {
  font-size: 28px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 4px solid currentColor;
  padding-bottom: 12px;
  width: 100%;
}

.reveal-icon {
  font-size: 64px;
  line-height: 1;
}

.reveal-role {
  font-size: 36px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  text-shadow: 4px 4px 0 rgba(0,0,0,0.3);
}

.reveal-word-section {
  width: 100%;
  border: 4px solid currentColor;
  padding: 12px 16px;
  background: rgba(0,0,0,0.2);
}

.reveal-word-label {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.1em;
  opacity: 0.7;
  margin-bottom: 6px;
}

.reveal-word {
  font-size: 28px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.reveal-word.no-word {
  font-size: 18px;
  opacity: 0.7;
}

.reveal-desc {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
  opacity: 0.9;
  max-width: 300px;
}

.reveal-close-btn {
  margin-top: 8px;
  padding: 14px 32px;
  background: #fff;
  border: 4px solid #000;
  box-shadow: 6px 6px 0 rgba(0,0,0,0.5);
  font-family: 'Space Grotesk', system-ui;
  font-size: 18px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #000;
  cursor: pointer;
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}

.reveal-close-btn:hover {
  transform: translate(-2px, -2px);
  box-shadow: 8px 8px 0 rgba(0,0,0,0.5);
}

.reveal-close-btn:active {
  transform: translate(4px, 4px);
  box-shadow: 2px 2px 0 rgba(0,0,0,0.5);
}
</style>
