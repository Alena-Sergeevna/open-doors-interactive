<script setup>
import { computed } from 'vue'

const props = defineProps({
  /** Выбранные шаги по порядку кликов */
  picked: { type: Array, default: () => [] },
  /** Корректная последовательность id */
  order: { type: Array, required: true },
  /** Подписи на стрелках (в т.ч. от «Начало» к первому состоянию); по одному на каждый id в order */
  transitions: { type: Array, default: () => [] },
  /** Вся цепочка собрана и верна */
  completeOk: { type: Boolean, default: false },
  /** Вся цепочка собрана и неверна */
  completeBad: { type: Boolean, default: false },
})

const firstWrongIndex = computed(() => {
  for (let i = 0; i < props.picked.length; i++) {
    if (props.picked[i]?.id !== props.order[i]) return i
  }
  return null
})

function edgeLabel(i) {
  const t = props.transitions[i]
  return t && String(t).trim() ? t : `переход ${i + 1}`
}

function nodeBad(i) {
  return firstWrongIndex.value !== null && i >= firstWrongIndex.value
}

/** Переход i ведёт к состоянию picked[i] */
function edgeBad(i) {
  return firstWrongIndex.value !== null && i >= firstWrongIndex.value
}
</script>

<template>
  <div class="life" aria-live="polite">
    <p class="life-caption">Диаграмма состояний сессии (жизненный цикл игрока)</p>

    <div class="life-board">
      <div class="life-board-inner">
        <div class="life-spine" aria-hidden="true" />

        <div class="life-flow">
          <!-- Старт -->
          <div class="life-block life-block-start">
            <div class="life-rail-dot life-rail-dot-start" />
            <div class="life-card life-card-term">Начало</div>
          </div>

          <template v-if="!picked.length">
            <div class="life-bridge life-bridge-muted">
              <div class="life-bridge-shaft" />
              <div class="life-bridge-arrow" />
              <p class="life-bridge-label">ожидает действия</p>
            </div>
            <div class="life-block">
              <div class="life-rail-dot life-rail-dot-muted" />
              <div class="life-card life-card-placeholder">
                Выберите первое состояние слева — узел появится на схеме.
              </div>
            </div>
          </template>

          <template v-else>
            <template v-for="(item, i) in picked" :key="item.id + '-' + i">
              <div class="life-bridge" :class="{ bad: edgeBad(i), ok: !edgeBad(i) }">
                <div class="life-bridge-shaft" />
                <div class="life-bridge-arrow" />
                <p class="life-bridge-label">{{ edgeLabel(i) }}</p>
              </div>

              <div class="life-block" :class="{ 'life-block-alt': i % 2 === 1 }">
                <div
                  class="life-rail-dot"
                  :class="{
                    'life-rail-dot-bad': nodeBad(i),
                    'life-rail-dot-pulse': i === picked.length - 1 && !nodeBad(i),
                  }"
                />
                <div
                  class="life-card life-card-state"
                  :class="{ bad: nodeBad(i), pulse: i === picked.length - 1 }"
                >
                  <span class="life-card-num">{{ i + 1 }}</span>
                  <span class="life-card-text">{{ item.text }}</span>
                </div>
              </div>
            </template>

            <template v-if="completeOk">
              <div class="life-bridge life-bridge-okfin">
                <div class="life-bridge-shaft" />
                <div class="life-bridge-arrow" />
                <p class="life-bridge-label">цель сценария</p>
              </div>
              <div class="life-block life-block-end">
                <div class="life-rail-dot life-rail-dot-end-ok" />
                <div class="life-card life-card-term life-card-end-ok">Конец</div>
              </div>
            </template>

            <template v-else-if="completeBad">
              <div class="life-bridge life-bridge-badfin">
                <div class="life-bridge-shaft" />
                <div class="life-bridge-arrow" />
                <p class="life-bridge-label">сценарий</p>
              </div>
              <div class="life-block life-block-end">
                <div class="life-rail-dot life-rail-dot-end-bad" />
                <div class="life-card life-card-term life-card-end-bad">Сбой цикла</div>
              </div>
            </template>
          </template>
        </div>
      </div>
    </div>

    <p v-if="firstWrongIndex !== null && !completeBad" class="life-hint-bad">
      Начиная с шага {{ firstWrongIndex + 1 }}, порядок не совпадает с типичным жизненным циклом.
    </p>
  </div>
</template>

<style scoped>
.life {
  width: 100%;
}

.life-caption {
  margin: 0 0 0.85rem;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
}

.life-board {
  position: relative;
  border-radius: 16px;
  background:
    radial-gradient(ellipse 120% 80% at 10% 0%, rgba(91, 140, 255, 0.14), transparent 55%),
    radial-gradient(ellipse 100% 60% at 100% 100%, rgba(34, 197, 94, 0.08), transparent 45%),
    linear-gradient(165deg, #f8fafc 0%, #eef2f7 100%);
  border: 1px solid #e2e8f0;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75);
  overflow: hidden;
}

.life-board-inner {
  --life-rail: 52px;
  position: relative;
  padding: 1.1rem 1rem 1.35rem 0.75rem;
  min-height: 140px;
}

/* вертикаль совпадает с центром колонки точек (52px / 2) */
.life-spine {
  position: absolute;
  left: calc(0.75rem + var(--life-rail) / 2 - 1.5px);
  top: 1.35rem;
  bottom: 1.15rem;
  width: 3px;
  border-radius: 3px;
  background: linear-gradient(
    180deg,
    rgba(147, 197, 253, 0.35) 0%,
    rgba(91, 140, 255, 0.55) 18%,
    rgba(100, 116, 139, 0.35) 48%,
    rgba(91, 140, 255, 0.5) 78%,
    rgba(134, 239, 172, 0.4) 100%
  );
  box-shadow: 0 0 12px rgba(91, 140, 255, 0.2);
  pointer-events: none;
}

.life-flow {
  position: relative;
  z-index: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0;
}

.life-block {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr);
  align-items: center;
  gap: 0 0.5rem;
  position: relative;
}

.life-block-start {
  margin-bottom: 0.15rem;
}

.life-block-end {
  margin-top: 0.1rem;
}

.life-rail-dot {
  justify-self: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff;
  border: 3px solid #5b8cff;
  box-shadow: 0 0 0 3px rgba(91, 140, 255, 0.2);
  z-index: 1;
  transition:
    border-color 0.2s,
    box-shadow 0.25s;
}

.life-block-alt .life-rail-dot {
  box-shadow:
    0 0 0 3px rgba(129, 140, 248, 0.22),
    0 2px 8px rgba(79, 70, 229, 0.12);
}

.life-rail-dot-start {
  width: 16px;
  height: 16px;
  border-width: 3px;
  border-color: #3b82f6;
  background: linear-gradient(145deg, #dbeafe, #fff);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
}

.life-rail-dot-muted {
  border-color: #cbd5e1;
  box-shadow: none;
  background: #f1f5f9;
}

.life-rail-dot-bad {
  border-color: #f87171;
  box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.25);
}

.life-rail-dot-pulse {
  animation: dotPulse 1.1s ease-in-out infinite;
}

.life-rail-dot-end-ok {
  border-color: #22c55e;
  background: linear-gradient(145deg, #dcfce7, #fff);
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.22);
}

.life-rail-dot-end-bad {
  border-color: #ef4444;
  background: linear-gradient(145deg, #fee2e2, #fff);
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.22);
}

@keyframes dotPulse {
  0%,
  100% {
    box-shadow: 0 0 0 3px rgba(91, 140, 255, 0.2);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(91, 140, 255, 0.12);
  }
}

.life-card {
  border-radius: 14px;
  font-size: 0.86rem;
  line-height: 1.35;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s;
}

.life-card-term {
  display: inline-block;
  padding: 0.5rem 1rem;
  font-weight: 800;
  text-align: center;
  border: 2px solid #3b82f6;
  background: linear-gradient(180deg, rgba(219, 234, 254, 0.95), rgba(255, 255, 255, 0.92));
  color: #1e3a8a;
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.12);
}

.life-card-placeholder {
  padding: 0.75rem 1rem;
  border: 2px dashed #cbd5e1;
  color: #64748b;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.65);
}

.life-card-state {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  padding: 0.65rem 0.85rem;
  border: 2px solid #cbd5e1;
  background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
  font-weight: 700;
  color: #0f172a;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.06);
  animation: cardIn 0.38s ease-out both;
}

@keyframes cardIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* нечётные шаги — смещение карточки («змейка») и отдельная анимация появления */
.life-block-alt .life-card-state {
  margin-left: 0.35rem;
  border-left-width: 4px;
  border-left-color: #818cf8;
  border-radius: 14px 18px 18px 14px;
  animation: cardInAlt 0.38s ease-out both;
}

@keyframes cardInAlt {
  from {
    opacity: 0;
    transform: translate(4px, 10px);
  }
  to {
    opacity: 1;
    transform: translate(8px, 0);
  }
}

.life-card-state.pulse {
  box-shadow:
    0 6px 22px rgba(59, 130, 246, 0.15),
    0 0 0 3px rgba(91, 140, 255, 0.28);
  border-color: #93c5fd;
}

.life-card-state.bad {
  border-style: dashed;
  border-color: #f87171;
  background: linear-gradient(145deg, #fff5f5, #fef2f2);
  box-shadow: 0 4px 16px rgba(220, 38, 38, 0.08);
}

.life-card-num {
  flex: 0 0 auto;
  min-width: 1.65rem;
  height: 1.65rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: linear-gradient(180deg, #5b8cff, #4f6fe5);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 900;
}

.life-card-state.bad .life-card-num {
  background: linear-gradient(180deg, #f87171, #ef4444);
}

.life-card-text {
  flex: 1;
  min-width: 0;
}

.life-card-end-ok {
  border-color: #22c55e;
  color: #14532d;
  background: linear-gradient(180deg, rgba(220, 252, 231, 0.95), rgba(255, 255, 255, 0.92));
  box-shadow: 0 4px 16px rgba(34, 197, 94, 0.12);
}

.life-card-end-bad {
  border-color: #ef4444;
  color: #7f1d1d;
  background: linear-gradient(180deg, rgba(254, 226, 226, 0.95), rgba(255, 255, 255, 0.92));
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.1);
}

/* вертикальный переход: ствол + наконечник в колонке рельса, подпись справа */
.life-bridge {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr);
  grid-template-rows: auto auto;
  align-items: stretch;
  min-height: 2.35rem;
  margin: 0.15rem 0;
}

.life-bridge-shaft {
  grid-column: 1;
  grid-row: 1;
  justify-self: center;
  width: 3px;
  flex: 1;
  min-height: 1.75rem;
  margin: 0;
  border-radius: 2px;
  background: linear-gradient(180deg, #5b8cff, #93c5fd);
}

.life-bridge-arrow {
  grid-column: 1;
  grid-row: 2;
  justify-self: center;
  width: 0;
  height: 0;
  margin-top: -2px;
  margin-bottom: 0.15rem;
  border-left: 7px solid transparent;
  border-right: 7px solid transparent;
  border-top: 9px solid #5b8cff;
}

.life-bridge-label {
  grid-column: 2;
  grid-row: 1 / span 2;
  align-self: center;
  margin: 0 0 0 0.25rem;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: #3b82f6;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(91, 140, 255, 0.35);
  width: fit-content;
  max-width: 100%;
  line-height: 1.25;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
}

.life-bridge.ok .life-bridge-shaft {
  background: linear-gradient(180deg, #5b8cff, #93c5fd);
}

.life-bridge.ok .life-bridge-arrow {
  border-top-color: #5b8cff;
}

.life-bridge.bad .life-bridge-shaft {
  background: linear-gradient(180deg, #f87171, #fecaca);
}

.life-bridge.bad .life-bridge-arrow {
  border-top-color: #f87171;
}

.life-bridge.bad .life-bridge-label {
  color: #dc2626;
  border-color: rgba(248, 113, 113, 0.55);
  background: rgba(254, 242, 242, 0.95);
}

.life-bridge-muted .life-bridge-shaft {
  background: linear-gradient(180deg, #cbd5e1, #e2e8f0);
}

.life-bridge-muted .life-bridge-arrow {
  border-top-color: #cbd5e1;
}

.life-bridge-muted .life-bridge-label {
  color: #64748b;
  border-color: #e2e8f0;
}

.life-bridge-okfin .life-bridge-shaft {
  background: linear-gradient(180deg, #22c55e, #86efac);
}

.life-bridge-okfin .life-bridge-arrow {
  border-top-color: #22c55e;
}

.life-bridge-okfin .life-bridge-label {
  color: #15803d;
  border-color: rgba(34, 197, 94, 0.45);
  background: rgba(240, 253, 244, 0.95);
}

.life-bridge-badfin .life-bridge-shaft {
  background: linear-gradient(180deg, #ef4444, #fca5a5);
}

.life-bridge-badfin .life-bridge-arrow {
  border-top-color: #ef4444;
}

.life-bridge-badfin .life-bridge-label {
  color: #b91c1c;
  border-color: rgba(248, 113, 113, 0.55);
  background: rgba(254, 242, 242, 0.95);
}

.life-hint-bad {
  margin: 0.5rem 0 0;
  font-size: 0.8rem;
  color: #b45309;
  line-height: 1.4;
}
</style>
