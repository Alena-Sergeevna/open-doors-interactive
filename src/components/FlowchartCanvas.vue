<script setup>
import { computed, unref } from 'vue'

const props = defineProps({
  api: { type: Object, required: true },
})

const blocks = computed(() => unref(props.api.blocks))
const orphanSummary = computed(() => unref(props.api.orphanSummary))
const isDone = computed(() => unref(props.api.isDone))
</script>

<template>
  <div class="fcc" aria-live="polite">
    <div class="flowchart">
      <div class="fcc-node fcc-start">Начало</div>

      <div v-for="(b, i) in blocks" :key="i" class="fcc-col">
        <div class="fcc-arrow" :class="{ 'fcc-arrow-bad': b.bad }" aria-hidden="true" />

        <template v-if="b.kind === 'process'">
          <figure v-if="b.image" class="fcc-fig">
            <img class="fcc-img" :src="b.image" :alt="b.alt || ''" width="72" height="72" />
          </figure>
          <div class="fcc-node fcc-step" :class="{ 'fcc-step-bad': b.bad }">
            <span v-if="b.bad" class="fcc-x" aria-hidden="true">✕</span>
            {{ b.text }}
            <span v-if="b.bad" class="fcc-badge-bad">ошибочный шаг</span>
          </div>
        </template>

        <template v-else-if="b.kind === 'decision'">
          <figure v-if="b.image" class="fcc-fig">
            <img class="fcc-img" :src="b.image" :alt="b.alt || ''" width="72" height="72" />
          </figure>
          <div class="fcc-diamond-wrap" :class="{ 'fcc-diamond-wrap-bad': b.bad }" :title="b.condition">
            <span v-if="b.bad" class="fcc-x fcc-x-diamond" aria-hidden="true">✕</span>
            <div class="fcc-diamond" aria-hidden="true" />
            <p class="fcc-diamond-text">{{ b.condition }}</p>
          </div>
          <div
            class="fcc-split"
            :class="{ 'fcc-split-bad': b.bad, [`fcc-split-n${props.api.orderedBranches(b.branches).length}`]: true }"
          >
            <div
              v-for="(br, bi) in props.api.orderedBranches(b.branches)"
              :key="bi"
              class="fcc-split-arm"
              :class="{
                chosen: (br.edgeLabel ?? br.text) === b.chosenKey || br.text === b.branchText,
              }"
            >
              <span class="fcc-split-label">{{ br.edgeLabel ?? '?' }}</span>
              <span class="fcc-split-desc">{{ br.text }}</span>
            </div>
          </div>
        </template>
      </div>

      <template v-if="isDone">
        <div class="fcc-arrow" aria-hidden="true" />
        <div class="fcc-node fcc-end">Конец</div>
      </template>
    </div>

    <div v-if="isDone && orphanSummary.length" class="fcc-orphans">
      <p class="fcc-orphans-title">Несвязанные / ошибочные шаги</p>
      <p class="fcc-orphans-sub">Не согласованы с корректной цепочкой.</p>
      <div class="fcc-orphans-row">
        <div v-for="(o, oi) in orphanSummary" :key="oi" class="fcc-orphan-card">
          <template v-if="o.kind === 'process'">
            <span class="fcc-orphan-tag">лишний процесс</span>
            <p v-if="o.prompt" class="fcc-orphan-ctx">{{ o.prompt }}</p>
            <p class="fcc-orphan-main">«{{ o.text }}»</p>
            <p class="fcc-orphan-hint">{{ o.hint }}</p>
          </template>
          <template v-else>
            <span class="fcc-orphan-tag">недопустимая ветка</span>
            <p class="fcc-orphan-ctx">{{ o.condition }}</p>
            <p class="fcc-orphan-main">{{ o.edgeLabel }}: {{ o.branchText }}</p>
            <p class="fcc-orphan-hint">{{ o.hint }}</p>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fcc {
  min-height: 200px;
}

.flowchart {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.fcc-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.fcc-node {
  text-align: center;
  max-width: 100%;
  padding: 0.55rem 0.95rem;
  font-size: 0.85rem;
  line-height: 1.35;
}

.fcc-start,
.fcc-end {
  border-radius: 999px;
  border: 2px solid #5b8cff;
  background: rgba(91, 140, 255, 0.12);
  font-weight: 700;
  color: #1e3a8a;
}

.fcc-end {
  border-color: #16a34a;
  background: rgba(22, 163, 74, 0.1);
  color: #14532d;
}

.fcc-step {
  position: relative;
  border-radius: 8px;
  border: 2px solid #c5cde0;
  background: #eef1f8;
  font-weight: 600;
  color: #1a1d2e;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: center;
  padding-top: 0.35rem;
}

.fcc-x {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #dc2626;
  color: #fff;
  font-size: 14px;
  font-weight: 900;
  line-height: 26px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.45);
  z-index: 2;
}

.fcc-x-diamond {
  top: -6px;
  right: -6px;
}

.fcc-diamond-wrap-bad .fcc-diamond {
  border-color: #dc2626;
  background: rgba(254, 226, 226, 0.5);
}

.fcc-step-bad {
  border-style: dashed;
  border-color: #f87171;
  background: #fef2f2;
}

.fcc-badge-bad {
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #dc2626;
}

.fcc-fig {
  margin: 0 0 0.5rem;
  padding: 0;
}

.fcc-img {
  display: block;
  width: 72px;
  height: 72px;
  object-fit: contain;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #e2e8f0;
}

.fcc-diamond-wrap {
  position: relative;
  width: 110px;
  height: 110px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0.2rem 0 0.4rem;
}

.fcc-diamond {
  position: absolute;
  width: 72px;
  height: 72px;
  transform: rotate(45deg);
  border: 2px solid #d97706;
  background: rgba(251, 191, 36, 0.15);
  border-radius: 4px;
}

.fcc-diamond-text {
  position: relative;
  z-index: 1;
  margin: 0;
  padding: 0 4px;
  font-size: 0.68rem;
  font-weight: 700;
  line-height: 1.2;
  text-align: center;
  max-width: 92px;
  color: #1a1d2e;
}

.fcc-split {
  display: grid;
  gap: 0.65rem;
  width: 100%;
  max-width: 400px;
  margin-top: 0.15rem;
}

.fcc-split-n2 {
  grid-template-columns: 1fr 1fr;
}

.fcc-split-n1 {
  grid-template-columns: 1fr;
}

.fcc-split-n3,
.fcc-split-n4,
.fcc-split-n5 {
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
}

.fcc-split-bad .fcc-split-arm.chosen {
  border-color: #f87171;
  background: #fef2f2;
}

.fcc-split-arm {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.45rem 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  align-items: center;
  text-align: center;
  opacity: 0.4;
  transition: opacity 0.2s;
  background: #fff;
}

.fcc-split-arm.chosen {
  opacity: 1;
  border-color: #f59e0b;
  background: rgba(251, 191, 36, 0.12);
}

.fcc-split-label {
  font-size: 0.7rem;
  font-weight: 800;
  color: #d97706;
  text-transform: uppercase;
}

.fcc-split-desc {
  font-size: 0.72rem;
  color: #64748b;
  line-height: 1.25;
}

.fcc-arrow {
  width: 2px;
  height: 1rem;
  background: linear-gradient(180deg, #94a3b8, #cbd5e1);
  margin: 0.1rem 0;
}

.fcc-arrow-bad {
  background: linear-gradient(180deg, #f87171, #fecaca);
}

.fcc-orphans {
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px dashed #fca5a5;
}

.fcc-orphans-title {
  margin: 0 0 0.25rem;
  font-size: 0.88rem;
  font-weight: 800;
  color: #dc2626;
}

.fcc-orphans-sub {
  margin: 0 0 0.75rem;
  font-size: 0.78rem;
  color: #64748b;
  line-height: 1.4;
}

.fcc-orphans-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  justify-content: center;
}

.fcc-orphan-card {
  flex: 1;
  min-width: 140px;
  max-width: 220px;
  padding: 0.65rem 0.75rem;
  border-radius: 10px;
  border: 2px dashed #f87171;
  background: #fff7ed;
}

.fcc-orphan-tag {
  font-size: 0.62rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #ea580c;
}

.fcc-orphan-ctx {
  font-size: 0.72rem;
  color: #64748b;
  margin: 0.35rem 0 0.2rem;
  line-height: 1.3;
}

.fcc-orphan-main {
  font-size: 0.82rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.35;
  color: #1a1d2e;
}

.fcc-orphan-hint {
  font-size: 0.72rem;
  color: #64748b;
  margin: 0.35rem 0 0;
  line-height: 1.35;
}
</style>
