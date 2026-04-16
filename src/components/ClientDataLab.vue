<script setup>
import { ref, computed, watch } from 'vue'
import { CLIENT_SCENARIOS } from '../data/clientLab.js'

const scenarioIndex = ref(0)
const stepIndex = ref(0)
const effects = ref({})
const codeBlocks = ref([])
const lastWrong = ref(null)

const scenario = computed(() => CLIENT_SCENARIOS[scenarioIndex.value])
const steps = computed(() => scenario.value.steps)
const currentStep = computed(() => steps.value[stepIndex.value] ?? null)
const isDone = computed(() => stepIndex.value >= steps.value.length && steps.value.length > 0)
const progressLabel = computed(() => {
  if (isDone.value) return 'Все шаги пройдены'
  return `Шаг ${stepIndex.value + 1} из ${steps.value.length}`
})

const joinedCode = computed(() => codeBlocks.value.map((b) => b.text).join('\n\n'))

const jsonPretty = computed(() => JSON.stringify(scenario.value.serverPayload, null, 2))

const profileCard = computed(() => {
  if (scenario.value.id !== 'profile') return null
  const p = scenario.value.serverPayload
  const e = effects.value
  if (!e.waitUi) {
    return {
      state: 'bad',
      hint: 'Данных ещё нет — рано рисовать поля.',
      nickname: '—',
      xp: '—',
      rank: '—',
    }
  }
  if (!e.keysOk) {
    return {
      state: 'warn',
      hint: 'Данные есть, но имя поля не то.',
      nickname: 'undefined',
      xp: String(p.xp),
      rank: p.rank,
    }
  }
  const xpLabel = e.formatOk ? p.xp.toLocaleString('ru-RU') : String(p.xp)
  return {
    state: 'ok',
    hint: e.formatOk ? 'Всё совпадает с JSON.' : 'Ник уже верный; опыт можно красиво оформить.',
    nickname: p.nickname,
    xp: xpLabel,
    rank: p.rank,
  }
})

const rewardCard = computed(() => {
  if (scenario.value.id !== 'reward') return null
  const p = scenario.value.serverPayload
  const e = effects.value
  if (!e.statusChecked) {
    return {
      state: 'bad',
      hint: 'Сначала нужно прочитать status.',
      banner: 'Праздник без проверки',
      balance: '???',
      lootTitle: '—',
      coins: '—',
    }
  }
  if (!e.balanceOk) {
    return {
      state: 'warn',
      hint: 'Баланс взяли не из того места.',
      banner: 'Награда',
      balance: 'undefined',
      lootTitle: p.loot.title,
      coins: String(p.loot.coins),
    }
  }
  if (!e.lootOk) {
    return {
      state: 'warn',
      hint: 'Приз нужно брать из loot.',
      banner: 'Награда',
      balance: String(p.balance),
      lootTitle: 'undefined',
      coins: '—',
    }
  }
  return {
    state: 'ok',
    hint: 'Как в JSON: статус, баланс, приз.',
    banner: 'Награда получена',
    balance: p.balance.toLocaleString('ru-RU'),
    lootTitle: p.loot.title,
    coins: String(p.loot.coins),
  }
})

function resetLab() {
  stepIndex.value = 0
  effects.value = {}
  codeBlocks.value = []
  lastWrong.value = null
}

watch(scenarioIndex, resetLab)

function pickChoice(ch) {
  lastWrong.value = null
  if (!ch.correct) {
    lastWrong.value = ch.wrongHint || 'Посмотрите на JSON сверху и подумайте, что игрок должен увидеть на шаге.'
    return
  }
  codeBlocks.value = [...codeBlocks.value, { text: ch.code }]
  if (ch.effects) {
    effects.value = { ...effects.value, ...ch.effects }
  }
  stepIndex.value += 1
}
</script>

<template>
  <div class="cl-root">
    <p class="cl-out-title">Данные сервера → экран</p>
    <p class="cl-lead">
      Дизайн — про красоту. Здесь — про простую цепочку: подождать ответ → взять поля с теми же именами, что в JSON →
      показать их без ошибок.
    </p>

    <div class="cl-tabs" role="tablist">
      <button
        v-for="(sc, i) in CLIENT_SCENARIOS"
        :key="sc.id"
        type="button"
        class="cl-tab"
        :class="{ on: scenarioIndex === i }"
        role="tab"
        :aria-selected="scenarioIndex === i"
        @click="scenarioIndex = i"
      >
        <span class="cl-tab-title">{{ sc.title }}</span>
        <span class="cl-tab-tag">{{ sc.tag }}</span>
      </button>
    </div>

    <p class="cl-sc-lead">{{ scenario.lead }}</p>

    <div class="cl-json-wrap">
      <div class="cl-json-head">Пример ответа сервера (JSON)</div>
      <pre class="cl-json">{{ jsonPretty }}</pre>
    </div>

    <div class="cl-layout">
      <div class="cl-col cl-main">
        <div class="cl-progress">{{ progressLabel }}</div>

        <template v-if="!isDone && currentStep">
          <div class="cl-step-card">
            <p class="cl-step-k">{{ currentStep.title }}</p>
            <p class="cl-why">{{ currentStep.why }}</p>
            <div class="cl-choices">
              <button v-for="(ch, ci) in currentStep.choices" :key="ci" type="button" class="cl-choice" @click="pickChoice(ch)">
                <span class="cl-choice-label">{{ ch.label }}</span>
                <pre class="cl-choice-code">{{ ch.code }}</pre>
              </button>
            </div>
          </div>
          <p v-if="lastWrong" class="cl-wrong" role="alert">{{ lastWrong }}</p>
        </template>

        <div v-else class="cl-done">
          <p class="cl-done-title">Готово</p>
          <p class="cl-done-text">{{ scenario.doneSummary }}</p>
          <button type="button" class="cl-reset" @click="resetLab">Сбросить сценарий</button>
        </div>

        <div class="cl-code-wrap">
          <div class="cl-code-head">Код на JavaScript (фрагменты)</div>
          <pre v-if="codeBlocks.length" class="cl-code">{{ joinedCode }}</pre>
          <p v-else class="cl-code-empty">Выберите верный вариант на шаге 1 — код появится здесь.</p>
        </div>
      </div>

      <div class="cl-col cl-aside">
        <div class="cl-aside-head">Мини-экран</div>
        <p class="cl-aside-hint">Становится зелёным, когда шаги выбраны верно.</p>

        <div v-if="profileCard" class="cl-card" :class="'cl-card--' + profileCard.state">
          <div class="cl-card-badge">{{ profileCard.hint }}</div>
          <div class="cl-card-title">Профиль</div>
          <div class="cl-card-row"><span class="cl-k">Ник</span><span class="cl-v">{{ profileCard.nickname }}</span></div>
          <div class="cl-card-row"><span class="cl-k">Опыт</span><span class="cl-v">{{ profileCard.xp }}</span></div>
          <div class="cl-card-row"><span class="cl-k">Ранг</span><span class="cl-v">{{ profileCard.rank }}</span></div>
        </div>

        <div v-if="rewardCard" class="cl-card cl-card-reward" :class="'cl-card--' + rewardCard.state">
          <div class="cl-card-badge">{{ rewardCard.hint }}</div>
          <div class="cl-card-title">{{ rewardCard.banner }}</div>
          <div class="cl-card-row"><span class="cl-k">Баланс</span><span class="cl-v">{{ rewardCard.balance }}</span></div>
          <div class="cl-card-row"><span class="cl-k">Приз</span><span class="cl-v">{{ rewardCard.lootTitle }}</span></div>
          <div class="cl-card-row"><span class="cl-k">Монеты в призе</span><span class="cl-v">{{ rewardCard.coins }}</span></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cl-root {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  min-height: 0;
}

.cl-out-title {
  margin: 0 0 0.5rem;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
}

.cl-lead {
  margin: 0;
  font-size: 0.88rem;
  color: #64748b;
  line-height: 1.45;
}

.cl-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.cl-tab {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.1rem;
  padding: 0.45rem 0.65rem;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #fff;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.cl-tab.on {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(91, 140, 255, 0.15);
}

.cl-tab-title {
  font-size: 0.82rem;
  font-weight: 700;
  color: #1a1d2e;
}

.cl-tab-tag {
  font-size: 0.68rem;
  color: #64748b;
}

.cl-sc-lead {
  margin: 0;
  font-size: 0.84rem;
  color: #475569;
  line-height: 1.45;
}

.cl-json-wrap {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  background: #f8fafc;
}

.cl-json-head {
  padding: 0.35rem 0.6rem;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  background: #eef2f7;
  border-bottom: 1px solid #e2e8f0;
}

.cl-json {
  margin: 0;
  padding: 0.55rem 0.65rem;
  font-size: 0.72rem;
  line-height: 1.4;
  font-family: ui-monospace, 'JetBrains Mono', monospace;
  color: #334155;
  overflow: auto;
  max-height: min(28vh, 220px);
}

.cl-layout {
  display: grid;
  gap: 1rem;
  align-items: start;
}

@media (min-width: 720px) {
  .cl-layout {
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
  }
}

.cl-progress {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  margin-bottom: 0.35rem;
}

.cl-step-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.65rem 0.75rem;
  background: #fff;
}

.cl-step-k {
  margin: 0 0 0.35rem;
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
}

.cl-why {
  margin: 0 0 0.65rem;
  font-size: 0.84rem;
  color: #475569;
  line-height: 1.45;
}

.cl-choices {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.cl-choice {
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

.cl-choice:hover {
  border-color: rgba(91, 140, 255, 0.5);
  background: #fff;
}

.cl-choice-label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.cl-choice-code {
  margin: 0;
  font-size: 0.72rem;
  line-height: 1.35;
  color: #334155;
  white-space: pre-wrap;
  font-family: ui-monospace, 'JetBrains Mono', monospace;
}

.cl-wrong {
  margin: 0.35rem 0 0;
  padding: 0.45rem 0.55rem;
  border-radius: 8px;
  background: rgba(220, 38, 38, 0.07);
  border: 1px solid rgba(220, 38, 38, 0.25);
  color: #7f1d1d;
  font-size: 0.82rem;
  line-height: 1.4;
}

.cl-done {
  border: 1px solid rgba(22, 163, 74, 0.35);
  border-radius: 12px;
  padding: 0.65rem 0.75rem;
  background: rgba(22, 163, 74, 0.06);
}

.cl-done-title {
  margin: 0 0 0.35rem;
  font-weight: 700;
  color: #14532d;
}

.cl-done-text {
  margin: 0 0 0.55rem;
  font-size: 0.86rem;
  color: #334155;
  line-height: 1.45;
}

.cl-reset {
  border-radius: 8px;
  padding: 0.4rem 0.75rem;
  font-weight: 600;
  font-size: 0.82rem;
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #64748b;
  cursor: pointer;
}

.cl-reset:hover {
  color: #1a1d2e;
}

.cl-code-wrap {
  margin-top: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  background: #0f172a;
  min-height: min(200px, 28vh);
  display: flex;
  flex-direction: column;
}

.cl-code-head {
  flex-shrink: 0;
  padding: 0.4rem 0.65rem;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94a3b8;
  background: #1e293b;
  border-bottom: 1px solid #334155;
}

.cl-code {
  margin: 0;
  flex: 1 1 auto;
  padding: 0.75rem 0.85rem;
  font-size: 0.78rem;
  line-height: 1.45;
  color: #e2e8f0;
  font-family: ui-monospace, 'JetBrains Mono', monospace;
  white-space: pre-wrap;
  word-break: break-word;
  min-height: clamp(160px, 22vh, 320px);
  max-height: min(55vh, 520px);
  overflow: auto;
}

.cl-code-empty {
  margin: 0;
  flex: 1 1 auto;
  padding: 0.75rem;
  font-size: 0.82rem;
  color: #94a3b8;
  min-height: 140px;
  display: flex;
  align-items: center;
}

.cl-aside-head {
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  margin-bottom: 0.25rem;
}

.cl-aside-hint {
  margin: 0 0 0.6rem;
  font-size: 0.78rem;
  color: #94a3b8;
  line-height: 1.35;
}

.cl-card {
  border-radius: 14px;
  padding: 0.75rem 0.85rem;
  border: 2px solid #e2e8f0;
  background: #fff;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.cl-card--bad {
  border-color: #fecaca;
  background: #fff7ed;
}

.cl-card--warn {
  border-color: #fde68a;
  background: #fffbeb;
}

.cl-card--ok {
  border-color: rgba(91, 140, 255, 0.45);
  background: linear-gradient(165deg, #fff, #f0f4ff);
}

.cl-card-reward {
  margin-top: 0;
}

.cl-card-badge {
  font-size: 0.72rem;
  color: #64748b;
  margin-bottom: 0.5rem;
  line-height: 1.35;
}

.cl-card--bad .cl-card-badge {
  color: #b45309;
}

.cl-card--warn .cl-card-badge {
  color: #b45309;
}

.cl-card-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.65rem;
}

.cl-card-row {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.35rem 0;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.88rem;
}

.cl-card-row:last-child {
  border-bottom: none;
}

.cl-k {
  color: #64748b;
  font-weight: 600;
}

.cl-v {
  font-weight: 700;
  color: #1e293b;
  font-family: ui-monospace, 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  text-align: right;
}

.cl-card--bad .cl-v {
  color: #b91c1c;
}
</style>
