<script setup>
import { computed } from 'vue'

const props = defineProps({
  palette: { type: Object, required: true },
  fontStack: { type: String, required: true },
  feedback: { type: Object, default: null },
  /** Порядок секций карточки: kicker | title | desc | row */
  blockOrder: {
    type: Array,
    default: () => ['kicker', 'title', 'desc', 'row'],
  },
  /** Показать подпись над рамкой превью */
  showTitle: { type: Boolean, default: true },
})

const frameClass = computed(() => {
  if (!props.feedback) return ''
  return props.feedback.ok ? 'dsp-frame--ok' : 'dsp-frame--bad'
})

const cardStyle = computed(() => ({
  background: props.palette.surface,
  borderColor: props.palette.muted,
  color: props.palette.text,
  boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
}))
</script>

<template>
  <div class="dsp">
    <p v-if="showTitle" class="dsp-label">Собранный интерфейс</p>
    <div class="dsp-frame" :class="frameClass">
      <div
        class="dsp-page"
        :style="{
          background: palette.bg,
          fontFamily: fontStack,
        }"
      >
        <div class="dsp-card" :style="cardStyle">
          <template v-for="key in blockOrder" :key="key">
            <p v-if="key === 'kicker'" class="dsp-kicker" :style="{ color: palette.muted }">Внутриигровой магазин</p>
            <h2 v-else-if="key === 'title'" class="dsp-title">Набор скинов «Сезон 7»</h2>
            <p v-else-if="key === 'desc'" class="dsp-desc" :style="{ color: palette.muted }">
              Содержит облик героя, эмоции и рамку профиля. После покупки предметы появятся в инвентаре.
            </p>
            <div v-else-if="key === 'row'" class="dsp-row">
              <span class="dsp-price" :style="{ color: palette.text }">299 ₽</span>
              <button
                type="button"
                class="dsp-cta"
                :style="{
                  background: palette.primary,
                  color: palette.primaryText,
                }"
              >
                Купить
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>
    <p v-if="feedback" class="dsp-verdict" :class="feedback.ok ? 'ok' : 'bad'">
      {{ feedback.ok ? 'Проверка пройдена' : 'Есть замечания' }}
    </p>
  </div>
</template>

<style scoped>
.dsp {
  width: 100%;
}

.dsp-label {
  margin: 0 0 0.65rem;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: #64748b;
}

.dsp-frame {
  border-radius: 16px;
  padding: 3px;
  background: linear-gradient(135deg, #e2e8f0, #cbd5e1);
  transition: box-shadow 0.25s ease;
}

.dsp-frame--ok {
  background: linear-gradient(135deg, #86efac, #4ade80);
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.25);
}

.dsp-frame--bad {
  background: linear-gradient(135deg, #fca5a5, #f87171);
  box-shadow: 0 0 0 2px rgba(248, 113, 113, 0.3);
}

.dsp-page {
  border-radius: 14px;
  padding: 1.25rem 1rem;
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dsp-card {
  width: 100%;
  max-width: 280px;
  border-radius: 14px;
  border: 1px solid;
  padding: 1rem 1.05rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.dsp-kicker {
  margin: 0;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.dsp-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  line-height: 1.25;
}

.dsp-desc {
  margin: 0;
  font-size: 0.78rem;
  line-height: 1.45;
}

.dsp-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin: 0;
}

.dsp-price {
  font-size: 1.35rem;
  font-weight: 900;
  letter-spacing: -0.02em;
}

.dsp-cta {
  border: none;
  border-radius: 10px;
  padding: 0.5rem 1rem;
  font-size: 0.82rem;
  font-weight: 800;
  cursor: default;
  flex-shrink: 0;
}

.dsp-verdict {
  margin: 0.65rem 0 0;
  text-align: center;
  font-size: 0.82rem;
  font-weight: 700;
}

.dsp-verdict.ok {
  color: #15803d;
}

.dsp-verdict.bad {
  color: #b91c1c;
}
</style>
