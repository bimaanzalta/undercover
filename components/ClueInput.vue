<template>
  <div class="clue-input-wrapper" ref="wrapperRef">
    <div class="input-container">
      <input
        ref="inputRef"
        v-model="inputValue"
        type="text"
        :placeholder="placeholder"
        :disabled="disabled || submitted"
        class="clue-text-input"
        :class="{ 'submitted': submitted }"
        maxlength="50"
        autocomplete="off"
        autocorrect="off"
        spellcheck="false"
        @input="onInput"
        @keydown.enter.prevent="handleEnter"
        @keydown.escape="closeSuggestions"
        @keydown.arrow-down.prevent="navigateDown"
        @keydown.arrow-up.prevent="navigateUp"
        @focus="onFocus"
        @blur="onBlur"
      />
      <button
        v-if="inputValue && !submitted && !disabled"
        class="clear-btn"
        type="button"
        @mousedown.prevent="clearInput"
      >
        ✕
      </button>
    </div>

    <!-- Suggestions Dropdown -->
    <Transition name="dropdown">
      <div
        v-if="showSuggestions && suggestions.length > 0"
        class="suggestions-dropdown"
        @mousedown.prevent
      >
        <div class="suggestions-header">SARAN KATA</div>
        <button
          v-for="(word, idx) in suggestions"
          :key="word"
          class="suggestion-item"
          :class="{ 'highlighted': idx === highlightedIdx }"
          type="button"
          @click="selectSuggestion(word)"
        >
          <span class="suggestion-word">{{ word }}</span>
          <span class="suggestion-icon">↵</span>
        </button>
      </div>
    </Transition>

    <!-- Submit button -->
    <button
      v-if="!submitted"
      class="submit-btn"
      type="button"
      :disabled="!inputValue.trim() || disabled"
      @click="submitClue"
    >
      {{ submitLabel || 'KIRIM CLUE' }}
    </button>

    <div v-if="submitted" class="submitted-badge">
      <span>✓ CLUE TERKIRIM</span>
      <strong>{{ submittedValue }}</strong>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useIndonesianWords } from '~/composables/useIndonesianWords'

interface Props {
  disabled?: boolean
  placeholder?: string
  submitLabel?: string
  modelValue?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  placeholder: 'Ketik clue kamu...',
})

const emit = defineEmits<{
  'submit': [value: string]
  'update:modelValue': [value: string]
}>()

const { suggest } = useIndonesianWords()

const inputRef = ref<HTMLInputElement>()
const wrapperRef = ref<HTMLDivElement>()
const inputValue = ref(props.modelValue || '')
const suggestions = ref<string[]>([])
const showSuggestions = ref(false)
const highlightedIdx = ref(-1)
const submitted = ref(false)
const submittedValue = ref('')

watch(() => props.modelValue, (val) => {
  if (val !== undefined) inputValue.value = val
})

watch(inputValue, (val) => {
  emit('update:modelValue', val)
})

const onInput = () => {
  const val = inputValue.value.trim()
  highlightedIdx.value = -1

  if (val.length >= 1) {
    suggestions.value = suggest(val, 7)
    showSuggestions.value = suggestions.value.length > 0
  } else {
    suggestions.value = []
    showSuggestions.value = false
  }
}

const onFocus = () => {
  if (inputValue.value.trim()) {
    suggestions.value = suggest(inputValue.value.trim(), 7)
    showSuggestions.value = suggestions.value.length > 0
  }
}

const onBlur = () => {
  setTimeout(() => {
    showSuggestions.value = false
    highlightedIdx.value = -1
  }, 200)
}

const closeSuggestions = () => {
  showSuggestions.value = false
  highlightedIdx.value = -1
}

const navigateDown = () => {
  if (!showSuggestions.value) return
  highlightedIdx.value = Math.min(highlightedIdx.value + 1, suggestions.value.length - 1)
}

const navigateUp = () => {
  if (!showSuggestions.value) return
  highlightedIdx.value = Math.max(highlightedIdx.value - 1, -1)
}

const handleEnter = () => {
  if (highlightedIdx.value >= 0 && suggestions.value[highlightedIdx.value]) {
    selectSuggestion(suggestions.value[highlightedIdx.value])
  } else {
    submitClue()
  }
}

const selectSuggestion = (word: string) => {
  inputValue.value = word
  showSuggestions.value = false
  highlightedIdx.value = -1
  nextTick(() => inputRef.value?.focus())
}

const clearInput = () => {
  inputValue.value = ''
  suggestions.value = []
  showSuggestions.value = false
  nextTick(() => inputRef.value?.focus())
}

const submitClue = () => {
  const val = inputValue.value.trim()
  if (!val || props.disabled) return

  submitted.value = true
  submittedValue.value = val
  showSuggestions.value = false
  emit('submit', val)
}
</script>

<style scoped>
.clue-input-wrapper {
  position: relative;
  width: 100%;
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.clue-text-input {
  width: 100%;
  padding: 14px 50px 14px 16px;
  border: 4px solid #000;
  background: #fff;
  font-family: 'Space Grotesk', system-ui;
  font-size: 18px;
  font-weight: 700;
  color: #000;
  outline: none;
  box-shadow: 4px 4px 0 #000;
  transition: box-shadow 0.1s ease;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.clue-text-input:focus {
  box-shadow: 6px 6px 0 #FFE600;
}

.clue-text-input:disabled {
  background: #f3f3f3;
  cursor: not-allowed;
}

.clue-text-input.submitted {
  background: #e8f5e9;
  border-color: #00C800;
  box-shadow: 4px 4px 0 #00C800;
}

.clue-text-input::placeholder {
  text-transform: none;
  font-weight: 400;
  color: #aaa;
  letter-spacing: normal;
}

.clear-btn {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  font-weight: 700;
  color: #999;
  padding: 4px;
  line-height: 1;
}

.clear-btn:hover {
  color: #FF2020;
}

.suggestions-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: #fff;
  border: 4px solid #000;
  box-shadow: 6px 6px 0 #000;
  z-index: 50;
  overflow: hidden;
}

.suggestions-header {
  padding: 6px 12px;
  background: #FFE600;
  border-bottom: 3px solid #000;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: #000;
}

.suggestion-item {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border: none;
  border-bottom: 2px solid #eee;
  background: #fff;
  cursor: pointer;
  font-family: 'Space Grotesk', system-ui;
  text-align: left;
  transition: background 0.08s ease;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover,
.suggestion-item.highlighted {
  background: #FFE600;
  border-bottom-color: #000;
}

.suggestion-word {
  font-weight: 700;
  font-size: 16px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.suggestion-icon {
  font-size: 14px;
  color: #666;
  font-weight: 400;
}

.submit-btn {
  margin-top: 10px;
  width: 100%;
  padding: 14px;
  background: #FFE600;
  border: 4px solid #000;
  box-shadow: 6px 6px 0 #000;
  font-family: 'Space Grotesk', system-ui;
  font-size: 16px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}

.submit-btn:hover:not(:disabled) {
  transform: translate(-2px, -2px);
  box-shadow: 8px 8px 0 #000;
}

.submit-btn:active:not(:disabled) {
  transform: translate(4px, 4px);
  box-shadow: 2px 2px 0 #000;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.submitted-badge {
  margin-top: 10px;
  padding: 14px 16px;
  background: #00C800;
  border: 4px solid #000;
  box-shadow: 4px 4px 0 #000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.submitted-badge span {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: #fff;
}

.submitted-badge strong {
  font-size: 18px;
  font-weight: 800;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* Transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
