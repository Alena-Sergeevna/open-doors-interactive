<script setup>
import { ref, computed, watch } from 'vue'

const mode = ref('web')
const runMode = ref('choice')
const phase = ref(0)
const animKey = ref(0)
const pickResult = ref(null)
const wrongSteps = ref([])

const flowByMode = {
  web: [
    {
      id: 's1',
      prompt: 'Шаг 1. Что делает человек на своём устройстве?',
      options: [
        {
          text: 'Вводит адрес сайта или нажимает ссылку',
          correct: true,
        },
        {
          text: 'Ждёт, что страница появится сама без действий',
          correct: false,
          hint: 'Сначала нужен явный запрос со стороны пользователя.',
        },
      ],
    },
    {
      id: 's2',
      prompt: 'Шаг 2. Что происходит после нажатия Enter?',
      options: [
        {
          text: 'Браузер формирует и отправляет запрос',
          correct: true,
        },
        {
          text: 'Браузер ничего не отправляет и просто ждёт',
          correct: false,
          hint: 'Без отправки запроса сайт не узнает, что нужно показать.',
        },
      ],
    },
    {
      id: 's3',
      prompt: 'Шаг 3. Как запрос попадает к сайту?',
      options: [
        {
          text: 'Он идёт по интернету к нужному компьютеру',
          correct: true,
        },
        {
          text: 'Остаётся внутри вашего устройства',
          correct: false,
          hint: 'Тогда до сайта запрос не дойдёт.',
        },
      ],
    },
    {
      id: 's4',
      prompt: 'Шаг 4. Что делает компьютер с сайтом?',
      options: [
        {
          text: 'Обрабатывает запрос: ищет нужные данные/страницу',
          correct: true,
        },
        {
          text: 'Игнорирует запрос пользователя',
          correct: false,
          hint: 'Если запрос игнорировать, ответ не вернётся.',
        },
      ],
    },
    {
      id: 's5',
      prompt: 'Шаг 5. Что происходит после обработки?',
      options: [
        {
          text: 'Компьютер с сайтом отправляет ответ обратно',
          correct: true,
        },
        {
          text: 'Ничего не отправляет, процесс завершён',
          correct: false,
          hint: 'Нужен обратный путь: без ответа страница не откроется.',
        },
      ],
    },
    {
      id: 's6',
      prompt: 'Шаг 6. Что видит человек в конце?',
      options: [
        {
          text: 'Браузер получает ответ и показывает страницу',
          correct: true,
        },
        {
          text: 'Экран остаётся пустым, хотя всё прошло успешно',
          correct: false,
          hint: 'Цель обмена — показать результат на экране.',
        },
      ],
    },
  ],
  game: [
    {
      id: 's1',
      prompt: 'Шаг 1. Что делает игрок?',
      options: [
        {
          text: 'Нажимает кнопку «Обновить список комнат»',
          correct: true,
        },
        {
          text: 'Ждёт, что список обновится сам',
          correct: false,
          hint: 'Сначала нужно действие игрока.',
        },
      ],
    },
    {
      id: 's2',
      prompt: 'Шаг 2. Что делает игра после нажатия?',
      options: [
        {
          text: 'Формирует и отправляет запрос на список комнат',
          correct: true,
        },
        {
          text: 'Не отправляет ничего',
          correct: false,
          hint: 'Без запроса сервер не сможет прислать свежий список.',
        },
      ],
    },
    {
      id: 's3',
      prompt: 'Шаг 3. Куда идёт этот запрос?',
      options: [
        {
          text: 'Через интернет к компьютеру с игрой',
          correct: true,
        },
        {
          text: 'Остаётся только на телефоне игрока',
          correct: false,
          hint: 'Тогда удалённый компьютер ничего не узнает.',
        },
      ],
    },
    {
      id: 's4',
      prompt: 'Шаг 4. Что делает компьютер с игрой?',
      options: [
        {
          text: 'Проверяет и подготавливает ответ',
          correct: true,
        },
        {
          text: 'Случайно отправляет игроку пустые данные',
          correct: false,
          hint: 'Сначала нужно корректно обработать запрос.',
        },
      ],
    },
    {
      id: 's5',
      prompt: 'Шаг 5. Что происходит дальше?',
      options: [
        {
          text: 'Компьютер с игрой отправляет ответ обратно',
          correct: true,
        },
        {
          text: 'Ничего не отправляет',
          correct: false,
          hint: 'Игрок ждёт ответ, значит его нужно вернуть.',
        },
      ],
    },
    {
      id: 's6',
      prompt: 'Шаг 6. Что увидит игрок в конце?',
      options: [
        {
          text: 'На экране появится обновлённый список комнат',
          correct: true,
        },
        {
          text: 'Экран никак не изменится',
          correct: false,
          hint: 'Если ответ пришёл, интерфейс должен обновиться.',
        },
      ],
    },
  ],
}

const copy = computed(() =>
  mode.value === 'web'
    ? {
        reqLine1: 'ЗАПРОС',
        reqLine2: '«Покажи страницу»',
        resLine1: 'ОТВЕТ',
        resLine2: '«Вот страница»',
        bar: 'game.example.com/…',
        www: 'ИНТЕРНЕТ',
        server: 'КОМПЬЮТЕР С САЙТОМ',
        result: 'Страница готова!',
        time: 'ВРЕМЯ',
      }
    : {
        reqLine1: 'ЗАПРОС',
        reqLine2: '«Дай список комнат»',
        resLine1: 'ОТВЕТ',
        resLine2: '«Вот список»',
        bar: 'игра/матчи',
        www: 'ИНТЕРНЕТ',
        server: 'КОМПЬЮТЕР С ИГРОЙ',
        result: 'Список обновлён!',
        time: 'ВРЕМЯ',
      },
)

const steps = computed(() => flowByMode[mode.value])
const currentStep = computed(() => steps.value[phase.value] ?? null)
const isDone = computed(() => phase.value >= steps.value.length)

/** Блок схемы с «картинкой» и подписями — только после соответствующего шага (phase поднимается после ответа). */
function diagramStage(minPhase) {
  return phase.value >= minPhase
}
const processLabels = computed(() =>
  mode.value === 'web'
    ? ['Ввод адреса', 'Отправка запроса', 'Передача по интернету', 'Обработка на сайте', 'Отправка ответа', 'Показ страницы']
    : [
        'Действие игрока',
        'Отправка запроса',
        'Передача по интернету',
        'Обработка в игре',
        'Отправка ответа',
        'Обновление экрана',
      ],
)

function resetFlow() {
  phase.value = 0
  pickResult.value = null
  wrongSteps.value = []
  animKey.value += 1
}

function playAuto() {
  resetFlow()
  const tick = () => {
    if (phase.value >= steps.value.length) return
    phase.value += 1
    animKey.value += 1
    setTimeout(tick, 900)
  }
  setTimeout(tick, 250)
}

function pickOption(opt) {
  if (!currentStep.value || pickResult.value) return
  pickResult.value = { correct: opt.correct, hint: opt.hint ?? '' }
  if (!opt.correct) {
    wrongSteps.value = [...wrongSteps.value, `${currentStep.value.prompt} — ${opt.text}`]
  }
  setTimeout(() => {
    phase.value += 1
    animKey.value += 1
    pickResult.value = null
  }, 550)
}

watch(mode, resetFlow)
watch(runMode, resetFlow)
</script>

<template>
  <div class="nj">
    <div class="nj-toolbar">
      <div class="nj-toolbar-row">
        <span class="nj-toolbar-hint">Сценарий</span>
        <div class="nj-modes" role="tablist">
          <button type="button" class="nj-tab" :class="{ on: mode === 'web' }" @click="mode = 'web'">Сайт</button>
          <button type="button" class="nj-tab" :class="{ on: mode === 'game' }" @click="mode = 'game'">Онлайн‑игра</button>
        </div>
      </div>
      <div class="nj-toolbar-row">
        <span class="nj-toolbar-hint">Режим</span>
        <div class="nj-modes">
          <button type="button" class="nj-tab" :class="{ on: runMode === 'choice' }" @click="runMode = 'choice'">Собрать сами</button>
          <button type="button" class="nj-tab" :class="{ on: runMode === 'auto' }" @click="runMode = 'auto'">Показать целиком</button>
        </div>
      </div>
      <button v-if="runMode === 'auto'" type="button" class="nj-play" @click="playAuto">▶ Запустить показ</button>
      <button v-else type="button" class="nj-play nj-play-ghost" @click="resetFlow">↺ Сбросить шаги</button>
    </div>

    <p v-if="runMode === 'choice'" class="nj-lead">
      Ответьте на вопрос — на схеме ниже подсветится следующий этап обмена данными.
    </p>

    <div v-if="runMode === 'choice' && currentStep" class="nj-quiz">
      <div class="nj-quiz-head">
        <span class="nj-quiz-badge">Вопрос</span>
        <span class="nj-step">Шаг {{ phase + 1 }} / {{ steps.length }}</span>
      </div>
      <p class="nj-q">{{ currentStep.prompt }}</p>
      <div class="nj-opts">
        <button v-for="(opt, idx) in currentStep.options" :key="idx" type="button" class="nj-opt" @click="pickOption(opt)">
          {{ opt.text }}
        </button>
      </div>
      <p v-if="pickResult && !pickResult.correct" class="nj-bad">✕ {{ pickResult.hint }}</p>
      <p v-else-if="pickResult && pickResult.correct" class="nj-ok">✓ Верно — смотрите обновление на схеме.</p>
    </div>

    <div class="nj-board">
      <div class="nj-board-head">
        <span class="nj-board-badge">Схема</span>
        <span class="nj-board-title">Клиент → сеть → сервер → ответ</span>
      </div>

      <div class="nj-svg-wrap">
        <svg class="nj-svg" viewBox="0 0 440 520" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Схема сетевого обмена">
          <defs>
            <linearGradient id="nj-sky" x1="0" y1="0" x2="440" y2="520" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#f0f9ff" />
              <stop offset="45%" stop-color="#f8fafc" />
              <stop offset="100%" stop-color="#eff6ff" />
            </linearGradient>
            <linearGradient id="nj-time-grad" x1="36" y1="44" x2="36" y2="472" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#64748b" />
              <stop offset="50%" stop-color="#3b82f6" />
              <stop offset="100%" stop-color="#22c55e" />
            </linearGradient>
            <linearGradient id="nj-req-grad" x1="200" y1="88" x2="320" y2="132" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#2563eb" />
              <stop offset="100%" stop-color="#38bdf8" />
            </linearGradient>
            <linearGradient id="nj-res-grad" x1="330" y1="150" x2="150" y2="360" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#ea580c" />
              <stop offset="100%" stop-color="#fbbf24" />
            </linearGradient>
            <linearGradient id="nj-globe-fill" x1="180" y1="175" x2="255" y2="240" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#dbeafe" />
              <stop offset="100%" stop-color="#bfdbfe" />
            </linearGradient>
            <filter id="nj-card-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#1e293b" flood-opacity="0.12" />
            </filter>
            <marker id="nj-arr-req" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <path d="M0,0 L0,6 L9,3 z" fill="#0284c7" />
            </marker>
            <marker id="nj-arr-res" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <path d="M0,0 L0,6 L9,3 z" fill="#c2410c" />
            </marker>
          </defs>

          <rect width="440" height="520" fill="url(#nj-sky)" rx="12" />

          <line x1="36" y1="44" x2="36" y2="472" class="nj-time-line" />
          <polygon points="36,478 30,468 42,468" class="nj-time-head" />
          <text x="24" y="260" class="nj-time-label" transform="rotate(-90 24 260)">{{ copy.time }}</text>

          <g v-if="runMode === 'choice' && phase === 0" class="nj-svg-hint">
            <rect x="96" y="200" width="248" height="72" rx="12" class="nj-svg-hint-box" />
            <text x="220" y="232" class="nj-svg-hint-text" text-anchor="middle">Схема откроется по шагам</text>
            <text x="220" y="252" class="nj-svg-hint-sub" text-anchor="middle">сначала ответьте на вопрос сверху</text>
          </g>
          <g v-else-if="runMode === 'auto' && phase === 0" class="nj-svg-hint">
            <rect x="96" y="200" width="248" height="56" rx="12" class="nj-svg-hint-box" />
            <text x="220" y="234" class="nj-svg-hint-text" text-anchor="middle">Нажмите «Запустить показ»</text>
          </g>

          <g v-show="diagramStage(1)" class="nj-diagram-piece">
            <rect x="72" y="48" width="128" height="72" rx="10" class="nj-sketch-box" filter="url(#nj-card-glow)" :class="{ pulse: phase >= 1 }" />
            <rect x="78" y="54" width="116" height="14" rx="3" class="nj-bar" />
            <text x="86" y="65" class="nj-bar-text">{{ copy.bar }}</text>
            <text x="88" y="100" class="nj-browser-tag">НАЧАЛО — ВЫ</text>
            <text x="88" y="114" class="nj-mini-label">ввод и отправка</text>
          </g>

          <g v-show="diagramStage(2)" class="nj-diagram-piece">
            <path
              d="M 200 92 C 248 92, 288 108, 318 128"
              class="nj-path nj-path-req-len nj-path-req"
              :class="{ 'nj-path--draw': phase >= 2 }"
              marker-end="url(#nj-arr-req)"
            />
            <text x="198" y="78" class="nj-path-cap">
              <tspan>{{ copy.reqLine1 }}</tspan>
              <tspan x="198" dy="11" class="nj-path-cap-sub">{{ copy.reqLine2 }}</tspan>
            </text>
            <circle v-show="phase === 2" :key="'rq-' + animKey" r="7" class="nj-packet">
              <animateMotion dur="0.85s" repeatCount="1" fill="freeze" path="M 200 92 C 248 92, 288 108, 318 128" />
            </circle>
          </g>

          <g v-show="diagramStage(3)" class="nj-diagram-piece">
            <circle cx="218" cy="208" r="38" class="nj-globe" :class="{ pulse: phase >= 3 }" />
            <ellipse cx="218" cy="208" rx="38" ry="14" class="nj-globe-line" fill="none" />
            <path d="M218 170 Q198 208 218 246 Q238 208 218 170" class="nj-globe-line" fill="none" />
            <text x="188" y="268" class="nj-www">{{ copy.www }}</text>
            <text x="171" y="282" class="nj-mini-label">передача данных</text>
          </g>

          <g v-show="diagramStage(4)" class="nj-diagram-piece">
            <path d="M302 52 Q318 40 332 48 Q348 38 362 50 Q378 44 388 58 Q398 72 388 84 L308 84 Q298 72 302 52 Z" class="nj-cloud" :class="{ pulse: phase >= 4 }" />
            <rect x="328" y="78" width="44" height="56" rx="5" class="nj-server" :class="{ pulse: phase >= 4 }" />
            <ellipse cx="350" cy="78" rx="22" ry="6" class="nj-server-top" />
            <line x1="336" y1="96" x2="364" y2="96" class="nj-server-line" />
            <line x1="336" y1="108" x2="364" y2="108" class="nj-server-line" />
            <text x="308" y="152" class="nj-server-label">{{ copy.server }}</text>
            <text x="306" y="165" class="nj-mini-label">обработка запроса</text>
          </g>

          <g v-show="diagramStage(5)" class="nj-diagram-piece">
            <path
              d="M 338 148 C 300 220, 220 300, 140 368"
              class="nj-path nj-path-res-len nj-path-res"
              :class="{ 'nj-path--draw': phase >= 5 }"
              marker-end="url(#nj-arr-res)"
            />
            <text x="236" y="228" class="nj-path-cap nj-path-cap-res">
              <tspan>{{ copy.resLine1 }}</tspan>
              <tspan x="236" dy="11" class="nj-path-cap-sub">{{ copy.resLine2 }}</tspan>
            </text>
            <circle v-show="phase === 5" :key="'rs-' + animKey" r="7" class="nj-packet nj-packet-amber">
              <animateMotion dur="0.95s" repeatCount="1" fill="freeze" path="M 338 148 C 300 220, 220 300, 140 368" />
            </circle>
          </g>

          <g v-show="isDone" class="nj-diagram-piece">
            <text x="96" y="364" class="nj-browser-tag">КОНЕЦ — ОТВЕТ</text>
            <rect x="72" y="372" width="148" height="96" rx="10" class="nj-sketch-box" filter="url(#nj-card-glow)" :class="{ pulse: isDone }" />
            <rect x="78" y="378" width="136" height="14" rx="3" class="nj-bar" />
            <text x="86" y="389" class="nj-bar-text">{{ copy.bar }}</text>
            <rect x="84" y="402" width="124" height="56" rx="6" class="nj-result-bg" />
            <text x="92" y="434" class="nj-result-text">{{ copy.result }}</text>
          </g>
        </svg>
      </div>

      <p v-if="isDone" class="nj-caption">Готово: запрос прошёл через сеть, ответ вернулся на ваш экран.</p>

      <div class="nj-process">
        <div class="nj-process-track">
          <div
            v-for="(label, idx) in processLabels"
            :key="label"
            class="nj-process-item"
            :class="{ done: phase > idx, active: phase === idx }"
          >
            <span class="nj-process-n">{{ idx + 1 }}</span>
            <span class="nj-process-t">{{ label }}</span>
          </div>
        </div>
      </div>

      <div v-if="wrongSteps.length" class="nj-errors">
        <p class="nj-errors-title">Пока не сходится</p>
        <p v-for="(e, i) in wrongSteps" :key="i" class="nj-error-item">{{ e }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.nj {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  min-height: 0;
}

.nj-lead {
  margin: 0;
  font-size: 0.86rem;
  color: #64748b;
  line-height: 1.5;
}

.nj-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.75rem 1rem;
  padding: 0.65rem 0.75rem;
  border-radius: 14px;
  background: linear-gradient(155deg, rgba(248, 250, 252, 0.95), rgba(239, 246, 255, 0.9));
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 18px rgba(15, 23, 42, 0.04);
}

.nj-toolbar-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem 0.65rem;
}

.nj-toolbar-hint {
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #94a3b8;
  min-width: 4.2rem;
}

.nj-modes {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.nj-tab {
  padding: 0.42rem 0.88rem;
  border-radius: 999px;
  border: 1px solid #cbd5e1;
  background: #fff;
  font-size: 0.8rem;
  font-weight: 700;
  color: #64748b;
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s,
    color 0.15s,
    box-shadow 0.15s;
}

.nj-tab:hover {
  border-color: #93c5fd;
  color: #334155;
}

.nj-tab.on {
  border-color: #5b8cff;
  color: #1e40af;
  background: rgba(91, 140, 255, 0.12);
  box-shadow: 0 0 0 2px rgba(91, 140, 255, 0.12);
}

.nj-play {
  margin-left: auto;
  padding: 0.48rem 1.05rem;
  border-radius: 11px;
  border: none;
  background: linear-gradient(180deg, #5b8cff, #4f6fe5);
  color: #fff;
  font-weight: 800;
  font-size: 0.82rem;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(79, 111, 229, 0.35);
  transition:
    transform 0.12s ease,
    box-shadow 0.15s ease;
}

.nj-play:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(79, 111, 229, 0.4);
}

.nj-play-ghost {
  background: #fff;
  color: #334155;
  border: 1px solid #cbd5e1;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
}

.nj-play-ghost:hover {
  border-color: #94a3b8;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.07);
}

.nj-quiz {
  border-radius: 16px;
  padding: 0.85rem 1rem 1rem;
  background:
    radial-gradient(ellipse 90% 60% at 0% 0%, rgba(91, 140, 255, 0.1), transparent 55%),
    linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e2e8f0;
  box-shadow: 0 6px 24px rgba(15, 23, 42, 0.05);
}

.nj-quiz-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.nj-quiz-badge {
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: #5b8cff;
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
  background: rgba(91, 140, 255, 0.12);
}

.nj-step {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: #64748b;
}

.nj-q {
  margin: 0 0 0.55rem;
  font-weight: 700;
  font-size: 0.92rem;
  color: #0f172a;
  line-height: 1.4;
}

.nj-opts {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.nj-opt {
  text-align: left;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #334155;
  border-radius: 12px;
  padding: 0.55rem 0.75rem;
  font-size: 0.86rem;
  line-height: 1.35;
  cursor: pointer;
  transition:
    border-color 0.15s,
    box-shadow 0.15s,
    transform 0.12s;
}

.nj-opt:hover {
  border-color: #93c5fd;
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.1);
  transform: translateY(-1px);
}

.nj-ok {
  margin: 0.55rem 0 0;
  color: #15803d;
  font-size: 0.85rem;
  font-weight: 600;
}

.nj-bad {
  margin: 0.55rem 0 0;
  color: #dc2626;
  font-size: 0.85rem;
  font-weight: 600;
}

.nj-board {
  flex: 1;
  min-height: 280px;
  border-radius: 18px;
  padding: 0.85rem 0.85rem 1rem;
  background:
    radial-gradient(ellipse 85% 55% at 12% 8%, rgba(91, 140, 255, 0.14), transparent 52%),
    radial-gradient(ellipse 70% 45% at 92% 88%, rgba(34, 197, 94, 0.1), transparent 48%),
    linear-gradient(168deg, #f8fafc 0%, #eef2f7 45%, #e8f0fe 100%);
  border: 1px solid #e2e8f0;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.85),
    0 12px 36px rgba(15, 23, 42, 0.06);
}

.nj-board-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.75rem;
  margin-bottom: 0.65rem;
}

.nj-board-badge {
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
  padding: 0.22rem 0.55rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid #e2e8f0;
}

.nj-board-title {
  font-size: 0.82rem;
  font-weight: 700;
  color: #334155;
}

.nj-svg-wrap {
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  background: #fff;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.06);
}

.nj-svg {
  width: 100%;
  height: auto;
  max-height: min(62vh, 520px);
  display: block;
  vertical-align: top;
}

.nj-svg-hint-box {
  fill: rgba(255, 255, 255, 0.82);
  stroke: #cbd5e1;
  stroke-width: 1.5;
  stroke-dasharray: 6 4;
}

.nj-svg-hint-text {
  font-size: 13px;
  font-weight: 800;
  fill: #475569;
}

.nj-svg-hint-sub {
  font-size: 10px;
  font-weight: 600;
  fill: #94a3b8;
}

.nj-diagram-piece {
  animation: nj-piece-in 0.4s ease-out both;
}

@keyframes nj-piece-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.nj-time-line {
  stroke: url(#nj-time-grad);
  stroke-width: 3.5;
  stroke-linecap: round;
}

.nj-time-head {
  fill: #3b82f6;
}

.nj-time-label {
  font-size: 12px;
  font-weight: 900;
  fill: #475569;
  letter-spacing: 0.14em;
}

.nj-sketch-box {
  fill: #fff;
  stroke: #94a3b8;
  stroke-width: 2;
}

.nj-bar {
  fill: #f1f5f9;
  stroke: #cbd5e1;
  stroke-width: 1.25;
}

.nj-bar-text {
  font-size: 8px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  fill: #475569;
}

.nj-browser-tag {
  font-size: 10px;
  font-weight: 800;
  fill: #475569;
}

.nj-mini-label {
  font-size: 8px;
  font-weight: 700;
  fill: #64748b;
}

.nj-path {
  fill: none;
  stroke-width: 3.75;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: drop-shadow(0 1px 2px rgba(15, 23, 42, 0.08));
}

.nj-path-req {
  stroke: url(#nj-req-grad);
}

.nj-path-res {
  stroke: url(#nj-res-grad);
}

.nj-path-req-len {
  stroke-dasharray: 180;
  stroke-dashoffset: 180;
}

.nj-path-res-len {
  stroke-dasharray: 300;
  stroke-dashoffset: 300;
}

.nj-path--draw {
  stroke-dashoffset: 0;
  transition: stroke-dashoffset 0.88s cubic-bezier(0.33, 1, 0.68, 1);
}

.nj-path-cap {
  font-size: 10px;
  font-weight: 800;
  fill: #1e40af;
}

.nj-path-cap-res {
  fill: #c2410c;
}

.nj-path-cap-sub {
  font-size: 8px;
  font-weight: 700;
  fill: #64748b;
}

.nj-packet {
  fill: #3b82f6;
  stroke: #1e3a8a;
  stroke-width: 1.5;
  filter: drop-shadow(0 2px 4px rgba(37, 99, 235, 0.35));
}

.nj-packet-amber {
  fill: #fb923c;
  stroke: #9a3412;
  filter: drop-shadow(0 2px 4px rgba(234, 88, 12, 0.35));
}

.nj-globe {
  fill: url(#nj-globe-fill);
  stroke: #3b82f6;
  stroke-width: 2.25;
}

.nj-globe-line {
  stroke: #2563eb;
  stroke-width: 1.5;
  opacity: 0.85;
}

.nj-www {
  font-size: 12px;
  font-weight: 900;
  fill: #1e3a8a;
  letter-spacing: 0.08em;
}

.nj-cloud {
  fill: #bbf7d0;
  stroke: #15803d;
  stroke-width: 2;
  filter: drop-shadow(0 2px 4px rgba(22, 101, 52, 0.12));
}

.nj-server {
  fill: #f1f5f9;
  stroke: #64748b;
  stroke-width: 2;
}

.nj-server-top {
  fill: #e2e8f0;
  stroke: #64748b;
  stroke-width: 1.5;
}

.nj-server-line {
  stroke: #94a3b8;
  stroke-width: 1.5;
}

.nj-server-label {
  font-size: 9px;
  font-weight: 900;
  fill: #14532d;
  letter-spacing: 0.04em;
}

.nj-result-bg {
  fill: #bfdbfe;
  stroke: #3b82f6;
  stroke-width: 1.5;
}

.nj-result-text {
  font-size: 11px;
  font-weight: 800;
  fill: #1e3a8a;
}

.pulse {
  animation: nj-pulse 0.65s ease-out;
}

@keyframes nj-pulse {
  0% {
    filter: drop-shadow(0 0 0 transparent);
  }
  45% {
    filter: drop-shadow(0 0 12px rgba(59, 130, 246, 0.55));
  }
  100% {
    filter: drop-shadow(0 0 0 transparent);
  }
}

.nj-caption {
  margin: 0.65rem 0 0;
  font-size: 0.84rem;
  color: #475569;
  text-align: center;
  line-height: 1.45;
  font-weight: 600;
}

.nj-process {
  margin-top: 0.75rem;
}

.nj-process-track {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: stretch;
}

.nj-process-item {
  flex: 1 1 calc(50% - 0.25rem);
  min-width: 140px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 12px;
  padding: 0.45rem 0.55rem;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
  transition:
    border-color 0.2s,
    background 0.2s,
    box-shadow 0.2s;
  position: relative;
}

.nj-process-item.done {
  border-color: #86efac;
  background: linear-gradient(135deg, #f0fdf4, #ffffff);
  box-shadow: 0 2px 10px rgba(34, 197, 94, 0.08);
}

.nj-process-item.active {
  border-color: #5b8cff;
  background: linear-gradient(135deg, #eff6ff, #ffffff);
  box-shadow:
    0 0 0 2px rgba(91, 140, 255, 0.15),
    0 4px 14px rgba(59, 130, 246, 0.1);
}

.nj-process-n {
  width: 1.35rem;
  height: 1.35rem;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 900;
  color: #475569;
  background: #e2e8f0;
  flex-shrink: 0;
}

.nj-process-item.done .nj-process-n {
  background: linear-gradient(180deg, #86efac, #4ade80);
  color: #14532d;
}

.nj-process-item.active .nj-process-n {
  background: linear-gradient(180deg, #60a5fa, #3b82f6);
  color: #fff;
}

.nj-process-t {
  font-size: 0.78rem;
  color: #334155;
  line-height: 1.25;
  font-weight: 600;
}

.nj-errors {
  margin-top: 0.65rem;
  padding: 0.65rem 0.75rem;
  border-radius: 12px;
  background: rgba(254, 242, 242, 0.75);
  border: 1px solid #fecaca;
}

.nj-errors-title {
  margin: 0 0 0.35rem;
  font-size: 0.78rem;
  font-weight: 800;
  color: #991b1b;
}

.nj-error-item {
  margin: 0.2rem 0 0;
  font-size: 0.78rem;
  color: #b91c1c;
  line-height: 1.35;
  padding-left: 0.35rem;
  border-left: 3px solid #fca5a5;
}
</style>
