<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="brutal-btn"
    :class="[variantClass, sizeClass, { 'opacity-60 cursor-not-allowed': disabled || loading }]"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="inline-flex items-center gap-2">
      <span class="inline-block w-4 h-4 border-2 border-current border-t-transparent animate-spin" />
      <span>{{ loadingText || 'Loading...' }}</span>
    </span>
    <slot v-else />
  </button>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'yellow' | 'black' | 'red' | 'white' | 'blue' | 'green'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  loadingText?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'yellow',
  size: 'md',
  type: 'button',
  disabled: false,
  loading: false
})

defineEmits(['click'])

const variantClass = computed(() => ({
  'yellow': 'bg-brutal-yellow text-black border-black brutal-shadow hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0_#000]',
  'black': 'bg-black text-white border-black brutal-shadow-yellow hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_#FFE600] active:translate-x-1 active:translate-y-1',
  'red': 'bg-brutal-red text-white border-black brutal-shadow hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0_#000]',
  'white': 'bg-white text-black border-black brutal-shadow hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_#000] active:translate-x-1 active:translate-y-1',
  'blue': 'bg-brutal-blue text-white border-black brutal-shadow hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_#000] active:translate-x-1 active:translate-y-1',
  'green': 'bg-brutal-green text-white border-black brutal-shadow hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_#000] active:translate-x-1 active:translate-y-1'
}[props.variant] || ''))

const sizeClass = computed(() => ({
  'sm': 'px-3 py-1.5 text-sm font-bold uppercase border-3 tracking-wide',
  'md': 'px-5 py-2.5 text-base font-bold uppercase border-4 tracking-wide',
  'lg': 'px-7 py-3.5 text-lg font-bold uppercase border-4 tracking-wider',
  'xl': 'px-10 py-5 text-2xl font-extrabold uppercase border-4 tracking-widest'
}[props.size] || ''))
</script>

<style scoped>
.brutal-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: transform 0.1s ease, box-shadow 0.1s ease;
  cursor: pointer;
  font-family: 'Space Grotesk', system-ui;
  white-space: nowrap;
  user-select: none;
}

.brutal-btn:disabled {
  pointer-events: none;
}
</style>
