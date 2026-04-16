<script setup>
import { ref, computed } from 'vue'
import { DEPLOY_PIPELINE_NODES, DEPLOY_SCENARIO } from '../data/deployLab.js'

const stepIndex = ref(0)
const logEntries = ref([])
const codeSnippets = ref([])
const lastWrong = ref(null)

const steps = DEPLOY_SCENARIO.steps
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
      ch.wrongHint || 'Подумайте: сначала «только у себя», потом Git, потом хостинг, потом автовыкладка.'
    return
  }
  if (ch.log) logEntries.value = [...logEntries.value, ch.log]
  if (ch.code) {
    codeSnippets.value = [
      ...codeSnippets.value,
      { caption: ch.codeCaption || '', code: ch.code },
    ]
  }
  stepIndex.value += 1
}

function resetLab() {
  stepIndex.value = 0
  logEntries.value = []
  codeSnippets.value = []
  lastWrong.value = null
}
</script>

<template>
  <div class="dp-root">
    <p class="dp-out-title">{{ steps.length }} {{ ruStepWord(steps.length) }}</p>
    <p class="dp-lead">{{ DEPLOY_SCENARIO.lead }}</p>

    <div class="dp-pipeline" aria-label="Этапы">
      <template v-for="(node, i) in DEPLOY_PIPELINE_NODES" :key="node.id">
        <div class="dp-node-wrap">
          <div class="dp-node" :class="{ on: i < stepIndex, done: isDone }">
            <span class="dp-node-title">{{ node.title }}</span>
            <span class="dp-node-sub">{{ node.sub }}</span>
          </div>
          <span v-if="i < DEPLOY_PIPELINE_NODES.length - 1" class="dp-arrow" aria-hidden="true">→</span>
        </div>
      </template>
    </div>

    <div class="dp-layout">
      <div class="dp-main">
        <div class="dp-progress">{{ progressLabel }}</div>

        <template v-if="!isDone && currentStep">
          <div class="dp-step-card">
            <p class="dp-step-k">{{ currentStep.title }}</p>
            <p class="dp-why">{{ currentStep.why }}</p>
            <div class="dp-choices">
              <button
                v-for="(ch, ci) in currentStep.choices"
                :key="ci"
                type="button"
                class="dp-choice"
                @click="pickChoice(ch)"
              >
                <span class="dp-choice-label">{{ ch.label }}</span>
                <template v-if="ch.code">
                  <span v-if="ch.codeCaption" class="dp-choice-cap">{{ ch.codeCaption }}</span>
                  <pre class="dp-choice-code">{{ ch.code }}</pre>
                </template>
              </button>
            </div>
          </div>
          <p v-if="lastWrong" class="dp-wrong" role="alert">{{ lastWrong }}</p>
        </template>

        <div v-else class="dp-done">
          <p class="dp-done-title">Готово</p>
          <p class="dp-done-text">{{ DEPLOY_SCENARIO.doneSummary }}</p>
          <button type="button" class="dp-reset" @click="resetLab">С начала</button>
        </div>
      </div>

      <div class="dp-aside">
        <div class="dp-aside-block">
          <div class="dp-aside-head">Слова простыми словами</div>
          <dl class="dp-glossary">
            <dt>Git</dt>
            <dd>Одно общее место для кода команды на сайте: видно историю и кто что менял.</dd>
            <dt>Хостинг</dt>
            <dd>Чужой компьютер в интернете, который круглосуточно отдаёт игру или страницу скачивания.</dd>
            <dt>Автовыкладка</dt>
            <dd>
              Программа на хостинге сама собирает и обновляет игру после того, как вы отправили код в Git — без
              ручного копирования каждый раз.
            </dd>
          </dl>
        </div>

        <div v-if="codeSnippets.length" class="dp-aside-block dp-aside-snippets">
          <div class="dp-aside-head">Примеры кода</div>
          <div v-for="(s, si) in codeSnippets" :key="si" class="dp-snip">
            <p v-if="s.caption" class="dp-snip-cap">{{ s.caption }}</p>
            <pre class="dp-snip-pre">{{ s.code }}</pre>
          </div>
        </div>

        <div class="dp-aside-block">
          <div class="dp-aside-head">Запомнили</div>
          <ul class="dp-log">
            <li v-for="(line, li) in logEntries" :key="li" class="dp-log-li">{{ line }}</li>
          </ul>
          <p v-if="!logEntries.length" class="dp-log-empty">
            Выберите верный ответ — сюда добавится короткая фраза. Тот же код показывается в колонке справа.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dp-root {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  min-height: 0;
}

.dp-out-title {
  margin: 0 0 0.5rem;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
}

.dp-lead {
  margin: 0;
  font-size: 0.9rem;
  color: #64748b;
  line-height: 1.45;
}

.dp-pipeline {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: 0.35rem 0.2rem;
  padding: 0.55rem 0.5rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: linear-gradient(180deg, #fafbfc, #f1f5f9);
}

.dp-node-wrap {
  display: flex;
  align-items: center;
  gap: 0.2rem;
}

.dp-node {
  min-width: 0;
  max-width: 128px;
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

.dp-node.on {
  opacity: 1;
  border-color: rgba(91, 140, 255, 0.5);
  box-shadow: 0 0 0 2px rgba(91, 140, 255, 0.1);
}

.dp-node.done {
  border-color: rgba(34, 197, 94, 0.4);
}

.dp-node-title {
  display: block;
  font-size: 0.82rem;
  font-weight: 800;
  color: #0f172a;
}

.dp-node-sub {
  display: block;
  font-size: 0.65rem;
  color: #64748b;
  margin-top: 0.15rem;
  line-height: 1.25;
}

.dp-arrow {
  color: #94a3b8;
  font-size: 0.95rem;
  padding: 0 0.05rem;
}

.dp-layout {
  display: grid;
  gap: 1rem;
  align-items: start;
}

@media (min-width: 640px) {
  .dp-layout {
    grid-template-columns: minmax(0, 1fr) minmax(0, 0.95fr);
  }
}

.dp-progress {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  margin-bottom: 0.35rem;
}

.dp-step-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.7rem 0.8rem;
  background: #fff;
}

.dp-step-k {
  margin: 0 0 0.4rem;
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
}

.dp-why {
  margin: 0 0 0.7rem;
  font-size: 0.88rem;
  color: #475569;
  line-height: 1.45;
}

.dp-choices {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.dp-choice {
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

.dp-choice:hover {
  border-color: rgba(91, 140, 255, 0.45);
  background: #fff;
}

.dp-choice-label {
  display: block;
  font-weight: 600;
}

.dp-choice-cap {
  display: block;
  margin-top: 0.45rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  line-height: 1.35;
}

.dp-choice-code {
  margin: 0.35rem 0 0;
  padding: 0.45rem 0.5rem;
  border-radius: 8px;
  background: #0f172a;
  color: #e2e8f0;
  font-size: 0.68rem;
  line-height: 1.4;
  overflow-x: auto;
  font-family: ui-monospace, 'Cascadia Code', 'Consolas', monospace;
  white-space: pre-wrap;
  word-break: break-word;
}

.dp-wrong {
  margin: 0.4rem 0 0;
  padding: 0.45rem 0.55rem;
  border-radius: 8px;
  background: rgba(220, 38, 38, 0.07);
  border: 1px solid rgba(220, 38, 38, 0.25);
  color: #7f1d1d;
  font-size: 0.85rem;
  line-height: 1.4;
}

.dp-done {
  border: 1px solid rgba(22, 163, 74, 0.35);
  border-radius: 12px;
  padding: 0.7rem 0.8rem;
  background: rgba(22, 163, 74, 0.06);
}

.dp-done-title {
  margin: 0 0 0.35rem;
  font-weight: 700;
  color: #14532d;
}

.dp-done-text {
  margin: 0 0 0.55rem;
  font-size: 0.88rem;
  color: #334155;
  line-height: 1.5;
}

.dp-reset {
  border-radius: 8px;
  padding: 0.45rem 0.85rem;
  font-weight: 600;
  font-size: 0.85rem;
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #64748b;
  cursor: pointer;
}

.dp-reset:hover {
  color: #1a1d2e;
}

.dp-aside {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.dp-aside-block {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.6rem 0.7rem;
  background: #fff;
}

.dp-aside-head {
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  margin-bottom: 0.45rem;
}

.dp-glossary {
  margin: 0;
  font-size: 0.82rem;
  color: #334155;
  line-height: 1.45;
}

.dp-glossary dt {
  font-weight: 800;
  color: #0f172a;
  margin-top: 0.35rem;
}

.dp-glossary dt:first-child {
  margin-top: 0;
}

.dp-glossary dd {
  margin: 0.15rem 0 0;
}

.dp-snip {
  margin-bottom: 0.65rem;
}

.dp-snip:last-child {
  margin-bottom: 0;
}

.dp-snip-cap {
  margin: 0 0 0.3rem;
  font-size: 0.78rem;
  color: #475569;
  line-height: 1.4;
}

.dp-snip-pre {
  margin: 0;
  padding: 0.45rem 0.5rem;
  border-radius: 8px;
  background: #0f172a;
  color: #e2e8f0;
  font-size: 0.68rem;
  line-height: 1.4;
  overflow-x: auto;
  font-family: ui-monospace, 'Cascadia Code', 'Consolas', monospace;
  white-space: pre-wrap;
  word-break: break-word;
}

.dp-log {
  margin: 0;
  padding-left: 1.1rem;
  font-size: 0.88rem;
  color: #334155;
  line-height: 1.45;
}

.dp-log-li {
  margin-bottom: 0.45rem;
}

.dp-log-empty {
  margin: 0;
  font-size: 0.84rem;
  color: #94a3b8;
  line-height: 1.4;
}
</style>
