<script setup>
import { ref, computed } from 'vue'
import { TEST_PIPELINE_NODES, TEST_SCENARIO } from '../data/testLab.js'

const stepIndex = ref(0)
const logEntries = ref([])
const lastWrong = ref(null)

const steps = TEST_SCENARIO.steps
const currentStep = computed(() => steps[stepIndex.value] ?? null)
const isDone = computed(() => stepIndex.value >= steps.length && steps.length > 0)

function ruStepWord(n) {
  const dd = n % 100
  const d = n % 10
  if (dd >= 11 && dd <= 14) return 'шагов'
  if (d === 1) return 'шаг'
  if (d >= 2 && d <= 4) return 'шага'
  return 'шагов'
}

const progressLabel = computed(() => {
  const n = steps.length
  if (isDone.value) return `Все ${n} ${ruStepWord(n)} пройдены`
  return `Вопрос ${stepIndex.value + 1} из ${n}`
})

function pickChoice(ch) {
  lastWrong.value = null
  if (!ch.correct) {
    lastWrong.value =
      ch.wrongHint ||
      'Подумайте: проверки по ходу работы, затем функционал, интерфейс и код перед выкладкой.'
    return
  }
  if (ch.log) logEntries.value = [...logEntries.value, ch.log]
  stepIndex.value += 1
}

function resetLab() {
  stepIndex.value = 0
  logEntries.value = []
  lastWrong.value = null
}
</script>

<template>
  <div class="tl-root">
    <p class="tl-out-title">{{ steps.length }} {{ ruStepWord(steps.length) }}</p>
    <p class="tl-lead">{{ TEST_SCENARIO.lead }}</p>

    <div class="tl-pipeline" aria-label="Этапы проверки">
      <template v-for="(node, i) in TEST_PIPELINE_NODES" :key="node.id">
        <div class="tl-node-wrap">
          <div class="tl-node" :class="{ on: i < stepIndex, done: isDone }">
            <span class="tl-node-title">{{ node.title }}</span>
            <span class="tl-node-sub">{{ node.sub }}</span>
          </div>
          <span v-if="i < TEST_PIPELINE_NODES.length - 1" class="tl-arrow" aria-hidden="true">→</span>
        </div>
      </template>
    </div>

    <div class="tl-layout">
      <div class="tl-main">
        <div class="tl-progress">{{ progressLabel }}</div>

        <template v-if="!isDone && currentStep">
          <div class="tl-step-card">
            <p class="tl-step-k">{{ currentStep.title }}</p>
            <p class="tl-why">{{ currentStep.why }}</p>
            <div class="tl-choices">
              <button
                v-for="(ch, ci) in currentStep.choices"
                :key="ci"
                type="button"
                class="tl-choice"
                @click="pickChoice(ch)"
              >
                {{ ch.label }}
              </button>
            </div>
          </div>
          <p v-if="lastWrong" class="tl-wrong" role="alert">{{ lastWrong }}</p>
        </template>

        <div v-else class="tl-done">
          <p class="tl-done-title">Готово</p>
          <p class="tl-done-text">{{ TEST_SCENARIO.doneSummary }}</p>
          <button type="button" class="tl-reset" @click="resetLab">С начала</button>
        </div>
      </div>

      <div class="tl-aside">
        <div class="tl-aside-block">
          <div class="tl-aside-head">Коротко о видах проверок</div>
          <dl class="tl-glossary">
            <dt>Функционал</dt>
            <dd>Соответствует ли поведение игры правилам и сценариям, в том числе в необычных ситуациях.</dd>
            <dt>Интерфейс</dt>
            <dd>Понятны ли экраны, кнопки и сообщения; удобно ли на типичных устройствах игроков.</dd>
            <dt>Код и регрессия</dt>
            <dd>Чужой разбор кода и автоматические прогоны, чтобы новые правки не сломали старое.</dd>
          </dl>
        </div>

        <div class="tl-aside-block">
          <div class="tl-aside-head">Запомнили</div>
          <ul class="tl-log">
            <li v-for="(line, li) in logEntries" :key="li" class="tl-log-li">{{ line }}</li>
          </ul>
          <p v-if="!logEntries.length" class="tl-log-empty">Выберите верный ответ — сюда добавится короткая фраза.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tl-root {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  min-height: 0;
}

.tl-out-title {
  margin: 0 0 0.5rem;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
}

.tl-lead {
  margin: 0;
  font-size: 0.9rem;
  color: #64748b;
  line-height: 1.45;
}

.tl-pipeline {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: 0.35rem 0.2rem;
  padding: 0.55rem 0.5rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: linear-gradient(180deg, #fafbfc, #f1f5f9);
}

.tl-node-wrap {
  display: flex;
  align-items: center;
  gap: 0.2rem;
}

.tl-node {
  min-width: 0;
  max-width: 118px;
  padding: 0.5rem 0.55rem;
  border-radius: 10px;
  border: 2px solid #e2e8f0;
  background: #fff;
  opacity: 0.5;
  transition:
    opacity 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.tl-node.on {
  opacity: 1;
  border-color: rgba(91, 140, 255, 0.5);
  box-shadow: 0 0 0 2px rgba(91, 140, 255, 0.1);
}

.tl-node.done {
  border-color: rgba(34, 197, 94, 0.4);
}

.tl-node-title {
  display: block;
  font-size: 0.8rem;
  font-weight: 800;
  color: #0f172a;
}

.tl-node-sub {
  display: block;
  font-size: 0.64rem;
  color: #64748b;
  margin-top: 0.15rem;
  line-height: 1.25;
}

.tl-arrow {
  color: #94a3b8;
  font-size: 0.95rem;
  padding: 0 0.05rem;
}

.tl-layout {
  display: grid;
  gap: 1rem;
  align-items: start;
}

@media (min-width: 640px) {
  .tl-layout {
    grid-template-columns: minmax(0, 1fr) minmax(0, 0.95fr);
  }
}

.tl-progress {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  margin-bottom: 0.35rem;
}

.tl-step-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.7rem 0.8rem;
  background: #fff;
}

.tl-step-k {
  margin: 0 0 0.4rem;
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
}

.tl-why {
  margin: 0 0 0.7rem;
  font-size: 0.88rem;
  color: #475569;
  line-height: 1.45;
}

.tl-choices {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.tl-choice {
  display: block;
  width: 100%;
  text-align: left;
  padding: 0.55rem 0.65rem;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.88rem;
  line-height: 1.35;
  color: #1e293b;
  font-weight: 600;
  transition:
    border-color 0.12s ease,
    background 0.12s ease;
}

.tl-choice:hover {
  border-color: rgba(91, 140, 255, 0.45);
  background: #fff;
}

.tl-wrong {
  margin: 0.4rem 0 0;
  padding: 0.45rem 0.55rem;
  border-radius: 8px;
  background: rgba(220, 38, 38, 0.07);
  border: 1px solid rgba(220, 38, 38, 0.25);
  color: #7f1d1d;
  font-size: 0.85rem;
  line-height: 1.4;
}

.tl-done {
  border: 1px solid rgba(22, 163, 74, 0.35);
  border-radius: 12px;
  padding: 0.7rem 0.8rem;
  background: rgba(22, 163, 74, 0.06);
}

.tl-done-title {
  margin: 0 0 0.35rem;
  font-weight: 700;
  color: #14532d;
}

.tl-done-text {
  margin: 0 0 0.55rem;
  font-size: 0.88rem;
  color: #334155;
  line-height: 1.5;
}

.tl-reset {
  border-radius: 8px;
  padding: 0.45rem 0.85rem;
  font-weight: 600;
  font-size: 0.85rem;
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #64748b;
  cursor: pointer;
}

.tl-reset:hover {
  color: #1a1d2e;
}

.tl-aside {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.tl-aside-block {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.6rem 0.7rem;
  background: #fff;
}

.tl-aside-head {
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  margin-bottom: 0.45rem;
}

.tl-glossary {
  margin: 0;
  font-size: 0.82rem;
  color: #334155;
  line-height: 1.45;
}

.tl-glossary dt {
  font-weight: 800;
  color: #0f172a;
  margin-top: 0.35rem;
}

.tl-glossary dt:first-child {
  margin-top: 0;
}

.tl-glossary dd {
  margin: 0.15rem 0 0;
}

.tl-log {
  margin: 0;
  padding-left: 1.1rem;
  font-size: 0.88rem;
  color: #334155;
  line-height: 1.45;
}

.tl-log-li {
  margin-bottom: 0.45rem;
}

.tl-log-empty {
  margin: 0;
  font-size: 0.84rem;
  color: #94a3b8;
  line-height: 1.4;
}
</style>
