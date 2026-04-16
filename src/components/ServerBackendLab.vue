<script setup>
import { ref, computed, watch } from 'vue'
import { SERVER_SCENARIOS } from '../data/serverBackendLab.js'

const scenarioIndex = ref(0)
const stepIndex = ref(0)
const codeBlocks = ref([])
const logEntries = ref([])
const lastWrong = ref(null)

const scenario = computed(() => SERVER_SCENARIOS[scenarioIndex.value])
const steps = computed(() => scenario.value.steps)
const currentStep = computed(() => steps.value[stepIndex.value] ?? null)
const isDone = computed(() => stepIndex.value >= steps.value.length && steps.value.length > 0)
const progressLabel = computed(() => {
  if (isDone.value) return 'Все шаги пройдены'
  return `Шаг ${stepIndex.value + 1} из ${steps.value.length}`
})

const joinedCode = computed(() => codeBlocks.value.map((b) => b.text).join('\n\n'))

function resetLab() {
  stepIndex.value = 0
  codeBlocks.value = []
  logEntries.value = []
  lastWrong.value = null
}

watch(scenarioIndex, resetLab)

function pickChoice(choice) {
  lastWrong.value = null
  if (!choice.correct) {
    lastWrong.value =
      choice.wrongHint ||
      'Подумайте про цепочку: сначала надёжно узнать игрока, потом обратиться к базе, потом вернуть понятный ответ в игру.'
    return
  }
  codeBlocks.value = [...codeBlocks.value, { text: choice.code }]
  if (choice.log) {
    logEntries.value = [...logEntries.value, choice.log]
  }
  stepIndex.value += 1
}

function logIcon(kind) {
  if (kind === 'auth') return '🔐'
  if (kind === 'db') return '🗄️'
  if (kind === 'http') return '↩️'
  return '•'
}
</script>

<template>
  <div class="srv-root">
    <p class="srv-out-title">Сервер и база</p>
    <p class="srv-lead">
      Три шага — кто запросил, что сделала база, что ушло обратно в игру. Фрагменты кода — как в Python (имена и вызовы
      по-английски, как в реальном проекте); выбирайте верный вариант на каждом шаге — он добавится в листинг.
    </p>

    <div class="srv-tabs" role="tablist">
      <button
        v-for="(sc, i) in SERVER_SCENARIOS"
        :key="sc.id"
        type="button"
        class="srv-tab"
        :class="{ on: scenarioIndex === i }"
        role="tab"
        :aria-selected="scenarioIndex === i"
        @click="scenarioIndex = i"
      >
        <span class="srv-tab-title">{{ sc.title }}</span>
        <span class="srv-tab-tag">{{ sc.tag }}</span>
      </button>
    </div>

    <p class="srv-sc-lead">{{ scenario.lead }}</p>

    <div class="srv-layout">
      <div class="srv-col srv-col--main">
        <div class="srv-progress">{{ progressLabel }}</div>

        <template v-if="!isDone && currentStep">
          <div class="srv-step-card">
            <p class="srv-step-k">{{ currentStep.title }}</p>
            <p class="srv-why">{{ currentStep.why }}</p>
            <div class="srv-choices">
              <button
                v-for="(ch, ci) in currentStep.choices"
                :key="ci"
                type="button"
                class="srv-choice"
                @click="pickChoice(ch)"
              >
                <span class="srv-choice-label">{{ ch.label }}</span>
                <pre class="srv-choice-code">{{ ch.code }}</pre>
              </button>
            </div>
          </div>
          <p v-if="lastWrong" class="srv-wrong" role="alert">{{ lastWrong }}</p>
        </template>

        <div v-else class="srv-done">
          <p class="srv-done-title">Готово</p>
          <p class="srv-done-text">{{ scenario.doneSummary }}</p>
          <button type="button" class="btn ghost srv-reset" @click="resetLab">Пройти сценарий снова</button>
        </div>

        <div class="srv-code-wrap">
          <div class="srv-code-head">Собранный фрагмент (листинг)</div>
          <pre v-if="codeBlocks.length" class="srv-code">{{ joinedCode }}</pre>
          <p v-else class="srv-code-empty">Нажмите верный вариант на шаге 1 — сюда появятся строки кода.</p>
        </div>
      </div>

      <div class="srv-col srv-col--log">
        <div class="srv-log-head">Что произошло по шагам</div>
        <ul class="srv-log-list">
          <li v-for="(entry, li) in logEntries" :key="li" class="srv-log-item" :class="'kind-' + entry.kind">
            <span class="srv-log-icon" aria-hidden="true">{{ logIcon(entry.kind) }}</span>
            <div class="srv-log-body">
              <p class="srv-log-title">{{ entry.title }}</p>
              <p v-for="(ln, j) in entry.lines" :key="j" class="srv-log-line">{{ ln }}</p>
            </div>
          </li>
        </ul>
        <p v-if="!logEntries.length" class="srv-log-empty">
          Пока пусто: после каждого верного выбора здесь появится короткое объяснение (вход, база или ответ в игру).
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.srv-root {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  min-height: 0;
}

.srv-out-title {
  margin: 0 0 0.5rem;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
}

.srv-lead {
  margin: 0;
  font-size: 0.88rem;
  color: #64748b;
  line-height: 1.45;
}

.srv-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.srv-tab {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.1rem;
  padding: 0.45rem 0.65rem;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #fff;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.srv-tab:hover {
  border-color: rgba(91, 140, 255, 0.45);
}

.srv-tab.on {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(91, 140, 255, 0.15);
}

.srv-tab-title {
  font-size: 0.82rem;
  font-weight: 700;
  color: #1a1d2e;
}

.srv-tab-tag {
  font-size: 0.68rem;
  font-family: ui-monospace, 'JetBrains Mono', monospace;
  color: #64748b;
}

.srv-sc-lead {
  margin: 0;
  font-size: 0.84rem;
  color: #475569;
  line-height: 1.45;
}

.srv-layout {
  display: grid;
  gap: 1rem;
  align-items: start;
}

@media (min-width: 720px) {
  .srv-layout {
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
  }
}

.srv-progress {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  margin-bottom: 0.35rem;
}

.srv-step-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.65rem 0.75rem;
  background: #fff;
}

.srv-step-k {
  margin: 0 0 0.35rem;
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
}

.srv-why {
  margin: 0 0 0.65rem;
  font-size: 0.84rem;
  color: #475569;
  line-height: 1.45;
}

.srv-choices {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.srv-choice {
  display: block;
  width: 100%;
  text-align: left;
  padding: 0.45rem 0.55rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  cursor: pointer;
  font-family: inherit;
  transition:
    border-color 0.12s ease,
    background 0.12s ease;
}

.srv-choice:hover {
  border-color: rgba(91, 140, 255, 0.5);
  background: #fff;
}

.srv-choice-label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.srv-choice-code {
  margin: 0;
  font-size: 0.74rem;
  line-height: 1.4;
  color: #334155;
  white-space: pre-wrap;
  font-family: ui-monospace, 'JetBrains Mono', monospace;
}

.srv-wrong {
  margin: 0.35rem 0 0;
  padding: 0.45rem 0.55rem;
  border-radius: 8px;
  background: rgba(220, 38, 38, 0.07);
  border: 1px solid rgba(220, 38, 38, 0.25);
  color: #7f1d1d;
  font-size: 0.82rem;
  line-height: 1.4;
}

.srv-done {
  border: 1px solid rgba(22, 163, 74, 0.35);
  border-radius: 12px;
  padding: 0.65rem 0.75rem;
  background: rgba(22, 163, 74, 0.06);
}

.srv-done-title {
  margin: 0 0 0.35rem;
  font-weight: 700;
  color: #14532d;
}

.srv-done-text {
  margin: 0 0 0.55rem;
  font-size: 0.86rem;
  color: #334155;
  line-height: 1.45;
}

.srv-reset {
  border-radius: 8px;
  padding: 0.4rem 0.75rem;
  font-weight: 600;
  font-size: 0.82rem;
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #64748b;
  cursor: pointer;
}

.srv-reset:hover {
  color: #1a1d2e;
  border-color: #94a3b8;
}

.srv-code-wrap {
  margin-top: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  background: #0f172a;
  min-height: min(320px, 40vh);
  display: flex;
  flex-direction: column;
}

.srv-code-head {
  flex-shrink: 0;
  padding: 0.45rem 0.75rem;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94a3b8;
  background: #1e293b;
  border-bottom: 1px solid #334155;
}

.srv-code {
  margin: 0;
  flex: 1 1 auto;
  padding: 0.85rem 1rem;
  font-size: 0.8rem;
  line-height: 1.5;
  color: #e2e8f0;
  font-family: ui-monospace, 'JetBrains Mono', monospace;
  white-space: pre-wrap;
  word-break: break-word;
  min-height: clamp(220px, 32vh, 400px);
  max-height: min(68vh, 720px);
  overflow: auto;
}

.srv-code-empty {
  margin: 0;
  flex: 1 1 auto;
  padding: 0.85rem 1rem;
  font-size: 0.82rem;
  color: #94a3b8;
  background: #0f172a;
  min-height: clamp(200px, 28vh, 360px);
  display: flex;
  align-items: center;
}

.srv-col--log {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.55rem 0.65rem;
  background: linear-gradient(180deg, #fafbfc, #f1f5f9);
  min-height: 120px;
}

.srv-log-head {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  margin-bottom: 0.45rem;
}

.srv-log-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.srv-log-item {
  display: flex;
  gap: 0.45rem;
  padding: 0.45rem 0.5rem;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #e2e8f0;
  font-size: 0.78rem;
}

.srv-log-icon {
  flex-shrink: 0;
  font-size: 1rem;
  line-height: 1.2;
}

.srv-log-title {
  margin: 0 0 0.2rem;
  font-weight: 700;
  color: #0f172a;
}

.srv-log-line {
  margin: 0;
  font-family: ui-monospace, 'JetBrains Mono', monospace;
  color: #475569;
  line-height: 1.35;
}

.srv-log-empty {
  margin: 0;
  font-size: 0.8rem;
  color: #94a3b8;
  line-height: 1.4;
}
</style>
