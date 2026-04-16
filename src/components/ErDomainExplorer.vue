<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import {
  ER_ENTITIES,
  ER_RELATIONS,
  ER_LAYOUT,
  entityCenter,
  evaluateErModel,
  findRelationBetween,
  isEntityStageUnlocked,
  reconcileErSelection,
} from '../data/erDomain.js'

const selectedEntities = ref([])
const selectedRelations = ref([])
const feedback = ref(null)

/** Первый узел при «рисовании» связи */
const linkFrom = ref(null)
/** Конец «резиновой» линии в координатах SVG */
const ghostEnd = ref(null)
const svgRef = ref(null)

/** Краткие подсказки (ошибка / успех) */
const transient = ref(null)
let transientTimer = 0

function flashTransient(text, kind = 'bad') {
  transient.value = { text, kind }
  clearTimeout(transientTimer)
  transientTimer = window.setTimeout(() => {
    transient.value = null
  }, 2800)
}

const entSet = computed(() => new Set(selectedEntities.value))

function entOn(id) {
  return selectedEntities.value.includes(id)
}

function relOn(id) {
  return selectedRelations.value.includes(id)
}

function syncReconcile() {
  const { entities, relations } = reconcileErSelection(selectedEntities.value, selectedRelations.value)
  selectedEntities.value = entities
  selectedRelations.value = relations
}

function stageUnlocked(id) {
  return isEntityStageUnlocked(id, selectedEntities.value, selectedRelations.value)
}

function chipDisabled(id) {
  if (entOn(id)) return false
  return !stageUnlocked(id)
}

function addEntity(id) {
  if (entOn(id)) return
  if (!stageUnlocked(id)) {
    flashTransient('Этот шаг ещё закрыт: сначала добавьте предыдущие сущности и проведите нужные связи на схеме.', 'bad')
    return
  }
  selectedEntities.value = [...selectedEntities.value, id]
  syncReconcile()
  feedback.value = null
  linkFrom.value = null
}

function toggleEntity(id) {
  feedback.value = null
  linkFrom.value = null
  ghostEnd.value = null
  if (entOn(id)) {
    if (id === 'player') {
      selectedEntities.value = []
      selectedRelations.value = []
      return
    }
    selectedEntities.value = selectedEntities.value.filter((x) => x !== id)
    syncReconcile()
    return
  }
  addEntity(id)
}

function tryDrawEdge(a, b) {
  const r = findRelationBetween(a, b)
  if (!r) {
    flashTransient('Между этими узлами в учебной модели нет такой связи — выберите другую пару.', 'bad')
    return
  }
  if (relOn(r.id)) {
    flashTransient('Эта связь уже нарисована.', 'bad')
    return
  }
  selectedRelations.value = [...selectedRelations.value, r.id]
  syncReconcile()
  flashTransient(`Связь проведена: ${r.caption} (${r.cardinality}).`, 'ok')
}

function onNodePointerDown(id, e) {
  if (e.button !== 0) return
  feedback.value = null
  const unlocked = stageUnlocked(id)

  if (!entOn(id)) {
    if (!unlocked) {
      flashTransient('Узел пока недоступен — пройдите предыдущие шаги цепочки.', 'bad')
      return
    }
    addEntity(id)
    return
  }

  if (linkFrom.value === null) {
    linkFrom.value = id
    updateGhostFromEvent(e)
    return
  }
  if (linkFrom.value === id) {
    linkFrom.value = null
    ghostEnd.value = null
    return
  }
  const from = linkFrom.value
  linkFrom.value = null
  ghostEnd.value = null
  tryDrawEdge(from, id)
}

function updateGhostFromEvent(e) {
  if (!svgRef.value || !linkFrom.value) return
  ghostEnd.value = clientToSvg(e.clientX, e.clientY)
}

function clientToSvg(clientX, clientY) {
  const el = svgRef.value
  if (!el) return { x: 0, y: 0 }
  const vb = el.viewBox.baseVal
  const rect = el.getBoundingClientRect()
  const x = vb.x + ((clientX - rect.left) / rect.width) * vb.width
  const y = vb.y + ((clientY - rect.top) / rect.height) * vb.height
  return { x, y }
}

function onSvgPointerMove(e) {
  if (!linkFrom.value) return
  updateGhostFromEvent(e)
}

function onSvgPointerLeave() {
  if (linkFrom.value) ghostEnd.value = null
}

function onWinPointerMove(e) {
  if (!linkFrom.value) return
  updateGhostFromEvent(e)
}

function onWinKeydown(e) {
  if (e.key === 'Escape' && linkFrom.value) {
    linkFrom.value = null
    ghostEnd.value = null
  }
}

watch(linkFrom, (v) => {
  if (v) {
    window.addEventListener('pointermove', onWinPointerMove)
    window.addEventListener('keydown', onWinKeydown)
  } else {
    window.removeEventListener('pointermove', onWinPointerMove)
    window.removeEventListener('keydown', onWinKeydown)
    ghostEnd.value = null
  }
})

onUnmounted(() => {
  window.removeEventListener('pointermove', onWinPointerMove)
  window.removeEventListener('keydown', onWinKeydown)
  clearTimeout(transientTimer)
})

const activeEdges = computed(() =>
  ER_RELATIONS.filter((r) => relOn(r.id) && entSet.value.has(r.from) && entSet.value.has(r.to)).map((r) => {
    const a = entityCenter(r.from)
    const b = entityCenter(r.to)
    return { ...r, x1: a.x, y1: a.y, x2: b.x, y2: b.y }
  }),
)

const rubberLine = computed(() => {
  if (!linkFrom.value || !ghostEnd.value) return null
  const a = entityCenter(linkFrom.value)
  const g = ghostEnd.value
  return { x1: a.x, y1: a.y, x2: g.x, y2: g.y }
})

const drawnRelationsList = computed(() =>
  ER_RELATIONS.filter((r) => relOn(r.id)).map((r) => ({
    ...r,
    ends: `${ER_ENTITIES.find((e) => e.id === r.from)?.short ?? r.from} — ${ER_ENTITIES.find((e) => e.id === r.to)?.short ?? r.to}`,
  })),
)

function runCheck() {
  feedback.value = evaluateErModel(selectedEntities.value, selectedRelations.value)
}

function resetAll() {
  selectedEntities.value = []
  selectedRelations.value = []
  feedback.value = null
  linkFrom.value = null
  ghostEnd.value = null
  transient.value = null
}

function entityLabel(id) {
  return ER_ENTITIES.find((e) => e.id === id)?.short ?? id
}

function nodeAria(e) {
  if (!entOn(e.id) && !stageUnlocked(e.id)) return `${e.label}: шаг закрыт`
  if (!entOn(e.id)) return `Добавить в модель: ${e.label}`
  if (linkFrom.value === e.id) return `Отменить начало линии: ${e.label}`
  return `Начать или завершить линию от узла: ${e.label}`
}

function onNodeKeydown(e, id) {
  if (e.key !== 'Enter' && e.key !== ' ') return
  e.preventDefault()
  feedback.value = null
  const unlocked = stageUnlocked(id)
  if (!entOn(id)) {
    if (!unlocked) {
      flashTransient('Узел пока недоступен — пройдите предыдущие шаги цепочки.', 'bad')
      return
    }
    addEntity(id)
    return
  }
  if (linkFrom.value === null) {
    linkFrom.value = id
    return
  }
  if (linkFrom.value === id) {
    linkFrom.value = null
    ghostEnd.value = null
    return
  }
  const from = linkFrom.value
  linkFrom.value = null
  ghostEnd.value = null
  tryDrawEdge(from, id)
}
</script>

<template>
  <div class="er-root">
    <p class="er-out-title">ER‑чертёж</p>
    <p class="er-lead">
      Сущности открываются по шагам: следующий узел становится доступен только после нужной связи. Связи не выбираются из
      списка — их <strong>рисуют</strong> двумя кликами по уже добавленным узлам (как линию от первого ко второму).
    </p>

    <div
      v-if="transient"
      class="er-transient"
      :class="transient.kind === 'ok' ? 'ok' : 'bad'"
      role="status"
    >
      {{ transient.text }}
    </div>

    <div class="er-diagram-card" aria-label="Диаграмма сущность—связь">
      <svg
        ref="svgRef"
        class="er-svg"
        viewBox="0 0 420 168"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        @pointermove="onSvgPointerMove"
        @pointerleave="onSvgPointerLeave"
      >
        <title>Концептуальная ER‑схема: клик по узлу добавляет его в модель; по двум узлам в модели — рисование связи</title>
        <g class="er-edges">
          <line
            v-for="edge in activeEdges"
            :key="edge.id"
            class="er-line"
            :x1="edge.x1"
            :y1="edge.y1"
            :x2="edge.x2"
            :y2="edge.y2"
          />
          <line
            v-if="rubberLine"
            class="er-line er-line-rubber"
            :x1="rubberLine.x1"
            :y1="rubberLine.y1"
            :x2="rubberLine.x2"
            :y2="rubberLine.y2"
          />
        </g>
        <g class="er-nodes">
          <g
            v-for="e in ER_ENTITIES"
            :key="e.id"
            class="er-node-hit"
            :class="{
              locked: !entOn(e.id) && !stageUnlocked(e.id),
              avail: !entOn(e.id) && stageUnlocked(e.id),
              linksrc: linkFrom === e.id,
            }"
            role="button"
            :tabindex="0"
            :aria-pressed="entOn(e.id)"
            :aria-label="nodeAria(e)"
            @pointerdown="onNodePointerDown(e.id, $event)"
            @keydown="onNodeKeydown($event, e.id)"
          >
            <rect
              class="er-rect"
              :class="{
                on: entOn(e.id),
                locked: !entOn(e.id) && !stageUnlocked(e.id),
                avail: !entOn(e.id) && stageUnlocked(e.id),
                linksrc: linkFrom === e.id,
              }"
              :x="ER_LAYOUT[e.id].x"
              :y="ER_LAYOUT[e.id].y"
              :width="ER_LAYOUT[e.id].w"
              :height="ER_LAYOUT[e.id].h"
              rx="6"
            />
            <text
              class="er-node-cap"
              :class="{
                on: entOn(e.id),
                locked: !entOn(e.id) && !stageUnlocked(e.id),
              }"
              :x="ER_LAYOUT[e.id].x + ER_LAYOUT[e.id].w / 2"
              :y="ER_LAYOUT[e.id].y + ER_LAYOUT[e.id].h / 2 + 4"
              text-anchor="middle"
            >
              {{ e.short }}
            </text>
          </g>
        </g>
      </svg>
    </div>

    <div v-if="linkFrom" class="er-draw-banner" role="status">
      Линия от «{{ entityLabel(linkFrom) }}» — кликните второй <strong>уже добавленный</strong> узел или снова по первому,
      чтобы отменить. <span class="kbd">Esc</span> — сброс.
    </div>

    <div class="er-panels">
      <div class="er-panel">
        <h4 class="er-subh">Сущности</h4>
        <p class="er-hint">Сначала только игрок; после связи игрок — персонаж открывается инвентарь, и так далее.</p>
        <div class="er-chip-grid">
          <button
            v-for="e in ER_ENTITIES"
            :key="'chip-' + e.id"
            type="button"
            class="er-chip"
            :class="{ on: entOn(e.id), locked: chipDisabled(e.id) }"
            :disabled="chipDisabled(e.id)"
            :title="e.note"
            @click="toggleEntity(e.id)"
          >
            <span class="er-chip-label">{{ e.label }}</span>
            <span class="er-chip-note">{{ e.note }}</span>
          </button>
        </div>
      </div>

      <div class="er-panel">
        <h4 class="er-subh">Связи на схеме</h4>
        <p class="er-hint">
          Два клика по узлам <strong>в модели</strong>: первый фиксирует начало линии (подсветка), второй завершает чертёж,
          если такая пара предусмотрена.
        </p>
        <ul v-if="drawnRelationsList.length" class="er-drawn-list">
          <li v-for="r in drawnRelationsList" :key="r.id">
            <span class="er-drawn-cap">{{ r.caption }}</span>
            <span class="er-drawn-meta">{{ r.ends }} · {{ r.cardinality }}</span>
          </li>
        </ul>
        <p v-else class="er-hint er-hint--solo">Пока ни одной линии — добавьте два узла в модель и соедините их кликами.</p>
      </div>
    </div>

    <div class="er-actions">
      <button type="button" class="btn primary" @click="runCheck">Проверить модель</button>
      <button type="button" class="btn ghost" @click="resetAll">Сбросить</button>
    </div>

    <div v-if="feedback" class="er-feedback" :class="feedback.ok ? 'ok' : 'bad'">
      <template v-if="feedback.ok">
        <p class="er-fb-title">Модель согласована с базовым сценарием</p>
        <p class="er-fb-text">{{ feedback.okMessage }}</p>
      </template>
      <template v-else>
        <p class="er-fb-title">Ещё не хватает звеньев</p>
        <ul class="er-issues">
          <li v-for="(issue, i) in feedback.issues" :key="i">{{ issue }}</li>
        </ul>
      </template>
    </div>
  </div>
</template>

<style scoped>
.er-root {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 0;
}

.er-out-title {
  margin: 0 0 0.75rem;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
}

.er-lead {
  margin: 0;
  font-size: 0.88rem;
  color: #64748b;
  line-height: 1.45;
}

.er-transient {
  margin: 0;
  padding: 0.45rem 0.55rem;
  border-radius: 8px;
  font-size: 0.82rem;
  line-height: 1.4;
}

.er-transient.ok {
  border: 1px solid rgba(22, 163, 74, 0.35);
  background: rgba(22, 163, 74, 0.1);
  color: #14532d;
}

.er-transient.bad {
  border: 1px solid rgba(220, 38, 38, 0.3);
  background: rgba(220, 38, 38, 0.07);
  color: #7f1d1d;
}

.er-hint {
  margin: 0 0 0.4rem;
  font-size: 0.75rem;
  color: #64748b;
  line-height: 1.35;
}

.er-hint--solo {
  margin-bottom: 0;
}

.er-diagram-card {
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: linear-gradient(165deg, #f8fafc, #eef2f7);
  padding: 0.5rem 0.35rem;
  overflow: auto;
}

.er-svg {
  display: block;
  width: 100%;
  max-width: 440px;
  margin: 0 auto;
  height: auto;
  touch-action: none;
}

.er-line {
  stroke: rgba(91, 140, 255, 0.85);
  stroke-width: 2;
  stroke-linecap: round;
}

.er-line-rubber {
  stroke: rgba(91, 140, 255, 0.45);
  stroke-dasharray: 6 5;
  animation: er-dash 0.6s linear infinite;
}

@keyframes er-dash {
  to {
    stroke-dashoffset: -11;
  }
}

.er-draw-banner {
  margin: 0;
  padding: 0.45rem 0.55rem;
  border-radius: 8px;
  background: rgba(91, 140, 255, 0.1);
  border: 1px solid rgba(91, 140, 255, 0.28);
  font-size: 0.82rem;
  color: #334155;
  line-height: 1.45;
}

.kbd {
  display: inline-block;
  padding: 0.08rem 0.35rem;
  border-radius: 4px;
  border: 1px solid #cbd5e1;
  font-size: 0.72rem;
  font-family: ui-monospace, monospace;
  background: #fff;
}

.er-rect {
  fill: #ffffff;
  stroke: #cbd5e1;
  stroke-width: 1.5;
  transition:
    fill 0.2s ease,
    stroke 0.2s ease;
}

.er-rect.on {
  fill: rgba(91, 140, 255, 0.14);
  stroke: var(--accent);
  stroke-width: 2;
}

.er-rect.avail {
  stroke-dasharray: 4 3;
  stroke: #94a3b8;
  fill: #fafbfc;
}

.er-rect.locked {
  fill: #f1f5f9;
  stroke: #e2e8f0;
  opacity: 0.55;
}

.er-rect.linksrc {
  stroke: var(--accent2);
  stroke-width: 2.5;
  filter: drop-shadow(0 0 6px rgba(124, 92, 255, 0.35));
}

.er-node-cap {
  font-size: 11px;
  font-family: system-ui, sans-serif;
  fill: #64748b;
  pointer-events: none;
}

.er-node-cap.on {
  fill: #0f172a;
  font-weight: 600;
}

.er-node-cap.locked {
  fill: #94a3b8;
}

.er-node-hit {
  cursor: pointer;
  outline: none;
}

.er-node-hit.locked {
  cursor: not-allowed;
}

.er-node-hit.avail .er-rect {
  cursor: pointer;
}

.er-node-hit:focus-visible .er-rect {
  stroke: var(--accent2);
  stroke-width: 2.5;
}

.er-panels {
  display: grid;
  gap: 0.75rem;
}

@media (min-width: 520px) {
  .er-panels {
    grid-template-columns: 1fr 1fr;
    align-items: start;
  }
}

.er-panel {
  min-width: 0;
}

.er-subh {
  margin: 0 0 0.4rem;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
}

.er-chip-grid {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.er-chip {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.1rem;
  padding: 0.45rem 0.55rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #1a1d2e;
  font-size: 0.82rem;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
}

.er-chip:hover:not(:disabled) {
  border-color: rgba(91, 140, 255, 0.45);
}

.er-chip.on {
  border-color: var(--accent);
  background: rgba(91, 140, 255, 0.1);
}

.er-chip:disabled,
.er-chip.locked {
  opacity: 0.4;
  cursor: not-allowed;
}

.er-chip-label {
  font-weight: 600;
}

.er-chip-note {
  font-size: 0.72rem;
  color: #64748b;
}

.er-drawn-list {
  margin: 0;
  padding-left: 1rem;
  font-size: 0.82rem;
  color: #334155;
  line-height: 1.45;
}

.er-drawn-list li {
  margin-bottom: 0.35rem;
}

.er-drawn-list li:last-child {
  margin-bottom: 0;
}

.er-drawn-cap {
  font-weight: 600;
  display: block;
}

.er-drawn-meta {
  font-size: 0.74rem;
  color: #64748b;
}

.er-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.15rem;
}

.er-actions .btn {
  border: none;
  border-radius: 10px;
  padding: 0.55rem 1.1rem;
  font-weight: 700;
  font-size: 0.9rem;
  font-family: inherit;
  transition:
    opacity 0.15s,
    transform 0.15s;
}

.er-actions .btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.er-actions .btn.primary {
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  color: #fff;
}

.er-actions .btn.primary:hover:not(:disabled) {
  transform: translateY(-1px);
}

.er-actions .btn.ghost {
  background: transparent;
  color: #64748b;
  border: 1px solid #cbd5e1;
}

.er-actions .btn.ghost:hover:not(:disabled) {
  color: #1a1d2e;
  border-color: #94a3b8;
}

.er-feedback {
  border-radius: 10px;
  padding: 0.65rem 0.75rem;
  font-size: 0.86rem;
  line-height: 1.45;
  color: #1a1d2e;
}

.er-feedback.ok {
  border: 1px solid rgba(22, 163, 74, 0.35);
  background: rgba(22, 163, 74, 0.08);
}

.er-feedback.bad {
  border: 1px solid rgba(220, 38, 38, 0.3);
  background: rgba(220, 38, 38, 0.06);
}

.er-fb-title {
  margin: 0 0 0.35rem;
  font-weight: 600;
}

.er-fb-text {
  margin: 0;
  color: #334155;
}

.er-issues {
  margin: 0;
  padding-left: 1.1rem;
}

.er-issues li {
  margin-bottom: 0.25rem;
}

.er-issues li:last-child {
  margin-bottom: 0;
}
</style>
