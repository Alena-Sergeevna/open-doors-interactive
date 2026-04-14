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
        bar: 'школа.пример/…',
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
      <div class="nj-modes" role="tablist">
        <button type="button" class="nj-tab" :class="{ on: mode === 'web' }" @click="mode = 'web'">Пример: сайт</button>
        <button type="button" class="nj-tab" :class="{ on: mode === 'game' }" @click="mode = 'game'">Пример: онлайн‑игра</button>
      </div>
      <div class="nj-modes">
        <button type="button" class="nj-tab" :class="{ on: runMode === 'choice' }" @click="runMode = 'choice'">Собрать сами</button>
        <button type="button" class="nj-tab" :class="{ on: runMode === 'auto' }" @click="runMode = 'auto'">Показать целиком</button>
      </div>
      <button v-if="runMode === 'auto'" type="button" class="nj-play" @click="playAuto">▶ Запустить показ</button>
      <button v-else type="button" class="nj-play" @click="resetFlow">↺ Начать заново</button>
    </div>

    <p v-if="runMode === 'choice'" class="nj-lead">
      Ответьте на вопрос — на картинке справа зажжётся следующий шаг цепочки.
    </p>

    <div v-if="runMode === 'choice' && currentStep" class="nj-quiz">
      <p class="nj-step">Шаг {{ phase + 1 }} из {{ steps.length }}</p>
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
      <svg class="nj-svg" viewBox="0 0 440 520" xmlns="http://www.w3.org/2000/svg" role="img">
        <defs>
          <marker id="nj-arr" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <path d="M0,0 L0,6 L9,3 z" fill="#1e293b" />
          </marker>
        </defs>

        <line x1="36" y1="44" x2="36" y2="472" class="nj-time-line" />
        <polygon points="36,478 30,468 42,468" class="nj-time-head" />
        <text x="24" y="260" class="nj-time-label" transform="rotate(-90 24 260)">{{ copy.time }}</text>

        <rect x="72" y="48" width="128" height="72" rx="6" class="nj-sketch-box" :class="{ pulse: phase >= 1 }" />
        <rect x="78" y="54" width="116" height="14" rx="2" class="nj-bar" />
        <text x="86" y="65" class="nj-bar-text">{{ copy.bar }}</text>
        <text x="88" y="100" class="nj-browser-tag">НАЧАЛО — ВЫ</text>
        <text x="88" y="114" class="nj-mini-label">ввод и отправка</text>

        <path d="M 200 92 C 248 92, 288 108, 318 128" class="nj-path nj-path-req-len" :class="{ 'nj-path--draw': phase >= 2 }" marker-end="url(#nj-arr)" />
        <text x="198" y="78" class="nj-path-cap">
          <tspan>{{ copy.reqLine1 }}</tspan>
          <tspan x="198" dy="11" class="nj-path-cap-sub">{{ copy.reqLine2 }}</tspan>
        </text>
        <circle v-show="phase === 2" :key="'rq-' + animKey" r="7" class="nj-packet">
          <animateMotion dur="0.85s" repeatCount="1" fill="freeze" path="M 200 92 C 248 92, 288 108, 318 128" />
        </circle>

        <circle cx="218" cy="208" r="38" class="nj-sketch-box nj-globe" :class="{ pulse: phase >= 3 }" />
        <ellipse cx="218" cy="208" rx="38" ry="14" class="nj-globe-line" fill="none" />
        <path d="M218 170 Q198 208 218 246 Q238 208 218 170" class="nj-globe-line" fill="none" />
        <text x="188" y="268" class="nj-www">{{ copy.www }}</text>
        <text x="171" y="282" class="nj-mini-label">передача данных</text>

        <path d="M302 52 Q318 40 332 48 Q348 38 362 50 Q378 44 388 58 Q398 72 388 84 L308 84 Q298 72 302 52 Z" class="nj-cloud" :class="{ pulse: phase >= 4 }" />
        <rect x="328" y="78" width="44" height="56" rx="4" class="nj-server" :class="{ pulse: phase >= 4 }" />
        <ellipse cx="350" cy="78" rx="22" ry="6" class="nj-server-top" />
        <line x1="336" y1="96" x2="364" y2="96" class="nj-server-line" />
        <line x1="336" y1="108" x2="364" y2="108" class="nj-server-line" />
        <text x="308" y="152" class="nj-server-label">{{ copy.server }}</text>
        <text x="306" y="165" class="nj-mini-label">обработка запроса</text>

        <path d="M 338 148 C 300 220, 220 300, 140 368" class="nj-path nj-path-res-len" :class="{ 'nj-path--draw': phase >= 5 }" marker-end="url(#nj-arr)" />
        <text x="236" y="228" class="nj-path-cap">
          <tspan>{{ copy.resLine1 }}</tspan>
          <tspan x="236" dy="11" class="nj-path-cap-sub">{{ copy.resLine2 }}</tspan>
        </text>
        <circle v-show="phase === 5" :key="'rs-' + animKey" r="7" class="nj-packet nj-packet-amber">
          <animateMotion dur="0.95s" repeatCount="1" fill="freeze" path="M 338 148 C 300 220, 220 300, 140 368" />
        </circle>

        <text x="96" y="364" class="nj-browser-tag">КОНЕЦ — ОТВЕТ</text>
        <rect x="72" y="372" width="148" height="96" rx="6" class="nj-sketch-box" :class="{ pulse: isDone }" />
        <rect x="78" y="378" width="136" height="14" rx="2" class="nj-bar" />
        <text x="86" y="389" class="nj-bar-text">{{ copy.bar }}</text>
        <rect x="84" y="402" width="124" height="56" rx="4" class="nj-result-bg" />
        <text x="92" y="434" class="nj-result-text">{{ isDone ? copy.result : '...' }}</text>
      </svg>

      <p v-if="isDone" class="nj-caption">Готово: просьба ушла по интернету, ответ вернулся на ваш экран.</p>
      <div class="nj-process">
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
      <div v-if="wrongSteps.length" class="nj-errors">
        <p class="nj-errors-title">Не подошло (можно перечитать и попробовать снова)</p>
        <p v-for="(e, i) in wrongSteps" :key="i" class="nj-error-item">✕ {{ e }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.nj { display: flex; flex-direction: column; gap: 0.75rem; min-height: 0; }
.nj-lead { margin: 0; font-size: 0.82rem; color: #475569; line-height: 1.45; }
.nj-step { margin: 0 0 0.35rem; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.06em; color: #64748b; text-transform: uppercase; }
.nj-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 0.65rem; justify-content: space-between; }
.nj-modes { display: flex; gap: 0.35rem; }
.nj-tab { padding: 0.4rem 0.85rem; border-radius: 999px; border: 2px dashed #94a3b8; background: #fff; font-size: 0.78rem; font-weight: 700; color: #64748b; }
.nj-tab.on { border-style: solid; border-color: #5b8cff; color: #1e40af; background: rgba(91, 140, 255, 0.1); }
.nj-play { padding: 0.45rem 1rem; border-radius: 10px; border: 2px solid #1e293b; background: #fef08a; font-weight: 800; font-size: 0.85rem; color: #1e293b; }
.nj-quiz { border: 1px dashed #94a3b8; border-radius: 12px; padding: 0.75rem; background: #ffffffc9; }
.nj-q { margin: 0 0 0.45rem; font-weight: 700; color: #1e293b; }
.nj-opts { display: flex; flex-direction: column; gap: 0.4rem; }
.nj-opt { text-align: left; border: 1px solid #cbd5e1; background: #fff; color: #334155; border-radius: 10px; padding: 0.45rem 0.6rem; }
.nj-ok { margin: 0.45rem 0 0; color: #15803d; font-size: 0.85rem; }
.nj-bad { margin: 0.45rem 0 0; color: #dc2626; font-size: 0.85rem; }
.nj-board { flex: 1; min-height: 320px; background: linear-gradient(180deg, #fffef8 0%, #f5f0e6 100%); border: 3px solid #1e293b; border-radius: 14px; padding: 0.5rem; }
.nj-svg { width: 100%; height: auto; max-height: min(62vh, 520px); display: block; }
.nj-time-line { stroke: #1e293b; stroke-width: 3; stroke-linecap: round; }
.nj-time-head { fill: #1e293b; }
.nj-time-label { font-size: 13px; font-weight: 900; fill: #1e293b; letter-spacing: 0.12em; }
.nj-sketch-box { fill: #fff; stroke: #1e293b; stroke-width: 2.5; }
.nj-bar { fill: #e2e8f0; stroke: #1e293b; stroke-width: 1.5; }
.nj-bar-text { font-size: 8px; font-family: ui-monospace, monospace; fill: #334155; }
.nj-browser-tag { font-size: 10px; font-weight: 800; fill: #475569; }
.nj-mini-label { font-size: 8px; font-weight: 700; fill: #64748b; }
.nj-path { fill: none; stroke: #1e293b; stroke-width: 3.5; stroke-linecap: round; stroke-linejoin: round; }
.nj-path-req-len { stroke-dasharray: 180; stroke-dashoffset: 180; }
.nj-path-res-len { stroke-dasharray: 300; stroke-dashoffset: 300; }
.nj-path--draw { stroke-dashoffset: 0; transition: stroke-dashoffset 0.85s ease; }
.nj-path-cap { font-size: 10px; font-weight: 800; fill: #0f172a; }
.nj-path-cap-sub { font-size: 8px; font-weight: 700; fill: #475569; }
.nj-packet { fill: #5b8cff; stroke: #1e40af; stroke-width: 1.5; }
.nj-packet-amber { fill: #fbbf24; stroke: #b45309; }
.nj-globe { fill: #dbeafe; }
.nj-globe-line { stroke: #1e40af; stroke-width: 1.5; }
.nj-www { font-size: 12px; font-weight: 900; fill: #1e3a8a; letter-spacing: 0.08em; }
.nj-cloud { fill: #bbf7d0; stroke: #166534; stroke-width: 2; }
.nj-server { fill: #e2e8f0; stroke: #1e293b; stroke-width: 2; }
.nj-server-top { fill: #cbd5e1; stroke: #1e293b; stroke-width: 1.5; }
.nj-server-line { stroke: #64748b; stroke-width: 1.5; }
.nj-server-label { font-size: 9px; font-weight: 900; fill: #14532d; letter-spacing: 0.04em; }
.nj-result-bg { fill: #93c5fd; stroke: #1e40af; stroke-width: 1.5; }
.nj-result-text { font-size: 11px; font-weight: 800; fill: #1e3a8a; }
.pulse { animation: nj-pulse 0.6s ease-out; }
@keyframes nj-pulse { 0% { filter: drop-shadow(0 0 0 transparent);} 50% { filter: drop-shadow(0 0 9px rgba(91, 140, 255, 0.6));} 100% { filter: drop-shadow(0 0 0 transparent);} }
.nj-caption { margin: 0.35rem 0 0; font-size: 0.82rem; color: #475569; text-align: center; }
.nj-process { margin-top: 0.5rem; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.35rem; }
.nj-process-item { display: flex; align-items: center; gap: 0.4rem; border: 1px solid #cbd5e1; border-radius: 10px; padding: 0.35rem 0.45rem; background: #fff; }
.nj-process-item.done { border-color: #86efac; background: #f0fdf4; }
.nj-process-item.active { border-color: #93c5fd; background: #eff6ff; box-shadow: 0 0 0 1px #93c5fd inset; }
.nj-process-n { width: 1.2rem; height: 1.2rem; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.72rem; font-weight: 800; color: #1e293b; background: #e2e8f0; }
.nj-process-item.done .nj-process-n { background: #bbf7d0; color: #166534; }
.nj-process-item.active .nj-process-n { background: #bfdbfe; color: #1e40af; }
.nj-process-t { font-size: 0.75rem; color: #334155; line-height: 1.2; }
.nj-errors { margin-top: 0.45rem; border-top: 1px dashed #cbd5e1; padding-top: 0.45rem; }
.nj-errors-title { margin: 0 0 0.25rem; font-size: 0.78rem; font-weight: 800; color: #334155; }
.nj-error-item { margin: 0.1rem 0; font-size: 0.76rem; color: #b91c1c; }
</style>
