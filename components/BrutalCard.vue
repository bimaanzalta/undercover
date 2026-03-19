<template>
  <div
    class="brutal-card-wrapper"
    :class="[
      colorClass,
      shadowClass,
      { 'brutal-hover cursor-pointer': clickable }
    ]"
    :style="style"
    @click="clickable ? $emit('click') : undefined"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  color?: 'white' | 'yellow' | 'black' | 'red' | 'blue' | 'green'
  shadow?: 'sm' | 'default' | 'lg' | 'xl' | 'yellow' | 'red' | 'blue' | 'none'
  clickable?: boolean
  padding?: string
  rotate?: number
}

const props = withDefaults(defineProps<Props>(), {
  color: 'white',
  shadow: 'default',
  clickable: false,
  padding: 'p-4'
})

defineEmits(['click'])

const colorClass = computed(() => ({
  'white': 'bg-white',
  'yellow': 'bg-brutal-yellow',
  'black': 'bg-black text-white',
  'red': 'bg-brutal-red text-white',
  'blue': 'bg-brutal-blue text-white',
  'green': 'bg-brutal-green text-white'
}[props.color] || 'bg-white'))

const shadowClass = computed(() => ({
  'sm': 'shadow-brutal-sm',
  'default': 'shadow-brutal',
  'lg': 'shadow-brutal-lg',
  'xl': 'shadow-brutal-xl',
  'yellow': 'shadow-brutal-yellow',
  'red': 'shadow-brutal-red',
  'blue': 'shadow-brutal-blue',
  'none': ''
}[props.shadow] || 'shadow-brutal'))

const style = computed(() => {
  const s: Record<string, string> = {
    border: '4px solid #000000'
  }
  if (props.rotate !== undefined) {
    s.transform = `rotate(${props.rotate}deg)`
  }
  return s
})
</script>
