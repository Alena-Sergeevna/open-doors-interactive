<script setup>
import { ref, computed, watch } from 'vue'
import FlowchartPanel from './components/FlowchartPanel.vue'
import FlowchartCanvas from './components/FlowchartCanvas.vue'
import NetworkJourney from './components/NetworkJourney.vue'
import { useAlgorithmFlowchart } from './composables/useAlgorithmFlowchart.js'

/** Единая тема: как из уровней складывается игровое веб/мобильное приложение */
const FLOW_SCENARIOS = [
  {
    id: 'session',
    title: 'Прохождение уровня',
    task: 'Логика одного раунда в игре: загрузка, проверка условий (жизни, цель), цикл ожидания. То же самое потом кодируют в игровом движке или на сервере.',
    start: 'g1',
    nodes: {
      end: { type: 'end' },
      g1: {
        type: 'action',
        prompt: 'Что делаем в начале уровня?',
        image: '/algo/screen.svg',
        imageAlt: 'Игровой экран',
        options: [
          { text: 'Загрузить карту, коллизии и спавн игрока', correct: true, blockLabel: 'Инициализация уровня', next: 'g_cond' },
          { text: 'Сразу начислить максимальный счёт без игры', correct: false, wrongHint: 'Нарушает правила честной игры.' },
          { text: 'Удалить сохранения всех игроков', correct: false, wrongHint: 'Не относится к запуску уровня.' },
        ],
      },
      g_cond: {
        type: 'decision',
        prompt: 'У игрока есть попытка (жизнь / энергия)?',
        image: '/algo/thermometer.svg',
        imageAlt: 'Ресурс',
        branches: [
          { text: 'Да, можно играть', edgeLabel: 'да', next: 'g2' },
          { text: 'Нет, лимит исчерпан', edgeLabel: 'нет', next: 'g_wait' },
        ],
      },
      g_wait: {
        type: 'action',
        prompt: 'Лимит исчерпан. Что предлагает игра?',
        image: '/algo/clock.svg',
        imageAlt: 'Таймер / кулдаун',
        options: [
          { text: 'Подождать кулдаун или честно предложить продолжение', correct: true, blockLabel: 'Ожидание / монетизация', next: 'g_cond' },
          { text: 'Выдать бесконечные жизни всем подряд', correct: false, wrongHint: 'Ломает экономику и баланс.' },
          { text: 'Закрыть приложение без объяснения', correct: false, wrongHint: 'Плохой UX — игрок не поймёт причину.' },
        ],
      },
      g2: {
        type: 'action',
        prompt: 'Как завершается успешная попытка?',
        image: '/algo/cup.svg',
        imageAlt: 'Цель уровня',
        options: [
          { text: 'Выполнить условие победы и зафиксировать счёт', correct: true, blockLabel: 'Победа и запись результата', next: 'g3' },
          { text: 'Выйти в меню без проверки цели', correct: false, wrongHint: 'Уровень не считается пройденным.' },
          { text: 'Случайно телепортировать в чужой аккаунт', correct: false, wrongHint: 'Недопустимо для безопасности.' },
        ],
      },
      g3: {
        type: 'action',
        prompt: 'Финал раунда для игрока?',
        image: '/algo/screen.svg',
        imageAlt: 'Экран результата',
        options: [
          { text: 'Показать награду, таблицу лидеров или следующий уровень', correct: true, blockLabel: 'Экран результата', next: 'end' },
          { text: 'Ничего не показать и зависнуть', correct: false, wrongHint: 'Игрок не получает обратную связь.' },
          { text: 'Стереть прогресс на устройстве', correct: false, wrongHint: 'Это не стандартное завершение раунда.' },
        ],
      },
    },
  },
  {
    id: 'online',
    title: 'Онлайн‑матч',
    task: 'Сетевая игра: клиент просит комнату, сервер ищет соперника. Условия и циклы — как в реальном матчмейкинге.',
    start: 'o1',
    nodes: {
      end: { type: 'end' },
      o1: {
        type: 'action',
        prompt: 'Первый шаг игрока для онлайн‑режима?',
        image: '/algo/bus.svg',
        imageAlt: 'Подключение',
        options: [
          { text: 'Выбрать режим PvP и отправить запрос на подбор', correct: true, blockLabel: 'Запрос в матчмейкинг', next: 'o2' },
          { text: 'Подключиться к случайному IP из чата', correct: false, wrongHint: 'Небезопасно и ненадёжно.' },
          { text: 'Играть офлайн, но показывать «онлайн»', correct: false, wrongHint: 'Обман игрока.' },
        ],
      },
      o2: {
        type: 'action',
        prompt: 'Что делает клиент после запроса?',
        image: '/algo/screen.svg',
        imageAlt: 'Ожидание',
        options: [
          { text: 'Ждать ответ сервера со статусом очереди', correct: true, blockLabel: 'Ожидание сервера', next: 'o_cond' },
          { text: 'Самому придумать ID комнаты и зайти', correct: false, wrongHint: 'Комната может не существовать на сервере.' },
          { text: 'Закрыть сокет и не слушать ответ', correct: false, wrongHint: 'Матч не состоится.' },
        ],
      },
      o_cond: {
        type: 'decision',
        prompt: 'Сервер выдал комнату и соперника?',
        image: '/algo/clock.svg',
        imageAlt: 'Очередь',
        branches: [
          { text: 'Да, матч готов', edgeLabel: 'да', next: 'o3' },
          { text: 'Нет, ещё в поиске', edgeLabel: 'нет', next: 'o_wait' },
        ],
      },
      o_wait: {
        type: 'action',
        prompt: 'Пока нет пары, что корректно?',
        image: '/algo/clock.svg',
        imageAlt: 'Поиск',
        options: [
          { text: 'Показать таймер / расширить диапазон рейтинга', correct: true, blockLabel: 'Продолжить поиск', next: 'o_cond' },
          { text: 'Подселить бота без пометки', correct: false, wrongHint: 'Игрок должен понимать, с кем играет.' },
          { text: 'Выдать ошибку «навсегда» без повтора', correct: false, wrongHint: 'Обычно дают повторить поиск.' },
        ],
      },
      o3: {
        type: 'action',
        prompt: 'Что происходит перед стартом боя?',
        image: '/algo/screen.svg',
        imageAlt: 'Арена',
        options: [
          { text: 'Загрузить сцену, синхронизировать стартовые состояния', correct: true, blockLabel: 'Старт матча', next: 'end' },
          { text: 'Начать бой без синхронизации', correct: false, wrongHint: 'Риск читов и рассинхрона.' },
          { text: 'Отправить пароль сопернику в чат', correct: false, wrongHint: 'Утечка данных.' },
        ],
      },
    },
  },
  {
    id: 'cloud',
    title: 'Облачное сохранение',
    task: 'Игры хранят прогресс в БД: сервер проверяет версию сохранения и решает — принять, отклонить или запросить разрешение конфликта.',
    start: 'c1',
    nodes: {
      end: { type: 'end' },
      c1: {
        type: 'action',
        prompt: 'Клиент прислал файл сохранения. Первый шаг сервера?',
        image: '/algo/lock.svg',
        imageAlt: 'Проверка',
        options: [
          { text: 'Проверить токен игрока и целостность данных', correct: true, blockLabel: 'Валидация запроса', next: 'c_cond' },
          { text: 'Перезаписать чужой слот без проверки', correct: false, wrongHint: 'Нарушение аккаунтов.' },
          { text: 'Опубликовать сейв в открытом доступе', correct: false, wrongHint: 'Утечка прогресса и приватности.' },
        ],
      },
      c_cond: {
        type: 'decision',
        prompt: 'Версия на сервере новее или совпадает?',
        image: '/algo/lock.svg',
        imageAlt: 'Версии',
        branches: [
          { text: 'Да, конфликта нет', edgeLabel: 'да', next: 'c_ok' },
          { text: 'Нет, есть конфликт версий', edgeLabel: 'нет', next: 'c_merge' },
        ],
      },
      c_ok: {
        type: 'action',
        prompt: 'Конфликта нет. Что сделать?',
        image: '/algo/screen.svg',
        imageAlt: 'OK',
        options: [
          { text: 'Сохранить в БД и вернуть подтверждение клиенту', correct: true, blockLabel: 'Запись в облако', next: 'c_ui' },
          { text: 'Удалить все сохранения игрока', correct: false, wrongHint: 'Потеря прогресса.' },
          { text: 'Игнорировать запрос', correct: false, wrongHint: 'Клиент не узнает результат.' },
        ],
      },
      c_merge: {
        type: 'action',
        prompt: 'При конфликте версий что предложить?',
        image: '/algo/screen.svg',
        imageAlt: 'Выбор',
        options: [
          { text: 'Показать выбор: сервер / локально / объединить', correct: true, blockLabel: 'Разрешение конфликта', next: 'c_ui' },
          { text: 'Молча взять самую старую версию', correct: false, wrongHint: 'Игрок может потерять часы прогресса.' },
          { text: 'Забанить игрока', correct: false, wrongHint: 'Неадекватная реакция на конфликт.' },
        ],
      },
      c_ui: {
        type: 'action',
        prompt: 'Что видит игрок после успешного ответа?',
        image: '/algo/screen.svg',
        imageAlt: 'UI',
        options: [
          { text: 'Иконка «облако синхронизировано» или дата последнего сейва', correct: true, blockLabel: 'Подтверждение в UI', next: 'end' },
          { text: 'Пустой чёрный экран', correct: false, wrongHint: 'Нет обратной связи.' },
        ],
      },
    },
  },
]

const PATH_SCENARIOS = {
  arcade: {
    id: 'arcade',
    title: 'Аркада / раннер',
    labels: [
      { id: 'open', text: 'Открыть игру' },
      { id: 'mode', text: 'Выбрать уровень или режим' },
      { id: 'play', text: 'Играть раунд' },
      { id: 'score', text: 'Сохранить счёт / рекорд' },
    ],
    order: ['open', 'mode', 'play', 'score'],
  },
  pvp: {
    id: 'pvp',
    title: 'Онлайн‑дуэль',
    labels: [
      { id: 'lobby', text: 'Зайти в лобби' },
      { id: 'queue', text: 'Встать в очередь матчмейкинга' },
      { id: 'match', text: 'Сыграть матч' },
      { id: 'reward', text: 'Получить награду и рейтинг' },
    ],
    order: ['lobby', 'queue', 'match', 'reward'],
  },
  rpg: {
    id: 'rpg',
    title: 'RPG / квест',
    labels: [
      { id: 'npc', text: 'Поговорить с NPC' },
      { id: 'quest', text: 'Взять квест' },
      { id: 'fight', text: 'Сражение или испытание' },
      { id: 'loot', text: 'Забрать награду в инвентарь' },
    ],
    order: ['npc', 'quest', 'fight', 'loot'],
  },
}

const STAGES = [
  {
    id: 'intro',
    kind: 'intro',
    title: 'Старт',
    emoji: '👋',
    lead: 'За несколько минут вы пройдёте путь разработки игрового приложения — от логики уровня до сети, данных и выкладки в магазины. Всё можно проходить самостоятельно на экране.',
    bullets: [
      'Игры — это и интерфейс, и сеть, и сервер, который хранит прогресс и честность матчей.',
      'Те же идеи: алгоритмы, клиент‑сервер, БД, проектирование сценариев и релиз.',
      'Ниже — восемь уровней с примерами и мини‑задачами.',
    ],
    cta: 'Начать 8 уровней',
  },
  {
    id: 'l1',
    kind: 'level',
    level: 1,
    emoji: '🧩',
    title: 'Алгоритмы',
    goal: 'Логика по шагам и блок‑схема',
    context: [
      'На схемах ГОСТ прямоугольник — процесс, ромб — условие (if), стрелки — переходы.',
      'В игре так же: инициализация уровня, проверка жизней, цикл матчмейкинга, ветки сохранения.',
    ],
    examples: ['if (жизни > 0) продолжить else экран поражения', 'цикл: ждать соперника в очереди', 'if (версия сейва совпала) записать else конфликт'],
    takeaway: 'Алгоритм — основа геймплея и серверной логики; его проектируют до кода.',
    interactive: 'flowchart',
  },
  {
    id: 'l2',
    kind: 'level',
    level: 2,
    emoji: '🌐',
    title: 'Сети',
    goal: 'Наглядно: запрос уходит, ответ приходит',
    context: [
      'Справа — «эскиз у доски»: ось времени вниз, браузер, стрелки запроса и ответа, интернет, веб‑сервер. Запустите анимацию и переключите «Как в игре» — те же стрелки, но подписи про API и лаунчер.',
      'Это не блок‑схема алгоритма, а картинка потока данных — как на занятии по клиенту и серверу.',
    ],
    examples: [
      'Сначала уходит запрос, потом приходит ответ — порядок важен.',
      'В игре то же самое: клиент, сеть, ваш backend, JSON обратно.',
    ],
    takeaway: 'Сеть в приложении — это движение сообщений во времени; стрелки показывают, кто к кому обращается.',
    interactive: 'network',
  },
  {
    id: 'l3',
    kind: 'level',
    level: 3,
    emoji: '📐',
    title: 'Проектирование',
    goal: 'Путь игрока',
    context: [
      'До кода описывают сценарии: от запуска до цели — уровень пройден, матч сыгран, квест сдан.',
      'Потребности игроков выясняют плейтестами, опросами, метриками воронки.',
    ],
    examples: [
      'Аркада: запуск → выбор режима → раунд → таблица рекордов.',
      'PvP: лобби → очередь → матч → награда и рейтинг.',
      'RPG: NPC → квест → бой → лут в инвентарь.',
    ],
    takeaway: 'Сначала продумывают путь игрока и экраны, потом связывают их с клиентом и сервером.',
    interactive: 'userPath',
  },
  {
    id: 'l4',
    kind: 'level',
    level: 4,
    emoji: '🎨',
    title: 'Дизайн',
    goal: 'UX / UI',
    context: [
      'Один и тот же функционал можно сделать понятным или запутанным.',
      'Хороший интерфейс снижает ошибки и ускоряет задачи.',
    ],
    examples: ['«Купить скин» крупной кнопкой vs мелкая ссылка', 'HUD с понятными иконками vs перегруз', 'Ошибка сети рядом с кнопкой «Повторить» vs тихий сбой'],
    takeaway: 'UX/UI в игре снижает фрустрацию: ясные действия, обратная связь, доступность.',
    interactive: 'uxCompare',
  },
  {
    id: 'l5',
    kind: 'level',
    level: 5,
    emoji: '🗄️',
    title: 'Базы данных',
    goal: 'Хранение данных',
    context: ['Профили, инвентарь, рейтинги и облачные сейвы хранят структурированно в БД, а не «как получится» в файлах.'],
    examples: ['Аккаунты и привязка к платформам', 'Прогресс квестов и достижения', 'История матчей и античит‑флаги'],
    takeaway: 'БД — память игры между сессиями и между устройствами.',
    interactive: 'quiz',
    quiz: [
      {
        q: 'Где надёжнее хранить пароли пользователей?',
        opts: [
          { t: 'В открытом виде в общем конфиге клиента игры', c: false },
          { t: 'В БД в зашифрованном / хешированном виде', c: true },
          { t: 'Только в cookies всех посетителей', c: false },
        ],
        ok: 'Пароли хранят как хеши; открытый текст — огромный риск.',
        bad: 'Пароли нельзя хранить открыто и светить всем подряд.',
      },
      {
        q: 'Зачем хранить в БД историю матчей и покупок внутри игры?',
        opts: [
          { t: 'Для поддержки, аналитики баланса и разборов спорных ситуаций', c: true },
          { t: 'Только чтобы занять место на диске', c: false },
          { t: 'Чтобы случайно стереть прогресс всех игроков', c: false },
        ],
        ok: 'Записи связывают аккаунт с действиями и помогают честной экономике и поддержке.',
        bad: 'История — осмысленные данные для игрока, сервера и команды продукта.',
      },
    ],
  },
  {
    id: 'l6',
    kind: 'level',
    level: 6,
    emoji: '⚙️',
    title: 'Сервер',
    goal: 'Бизнес‑логика и правила',
    context: ['Сервер решает исход боя, выдаёт лут, проверяет покупки и очередь матчмейкинга — то, что нельзя оставить только на клиенте.'],
    examples: ['Матчмейкинг по рейтингу и пингу', 'Валидация валютной транзакции', 'Проверка токена сессии и бана'],
    takeaway: 'Игровой backend — место, где закрепляются правила и честность.',
    interactive: 'quiz',
    quiz: [
      {
        q: 'Почему нельзя доверять только клиенту при покупке премиум‑валюты?',
        opts: [
          { t: 'Запрос можно подделать; итог должен подтвердить сервер и платёжный шлюз', c: true },
          { t: 'Клиент всегда честнее сервера', c: false },
          { t: 'HTTP нельзя отправить из игры', c: false },
        ],
        ok: 'Деньги и награды проверяют на сервере — иначе обойдут экономику.',
        bad: 'Клиентский код виден и изменяем; сервер — контрольная точка.',
      },
      {
        q: 'Что делает сервер при запросе «забрать награду за сезон»?',
        opts: [
          { t: 'Проверяет условия, античит, лимиты и записывает выдачу в БД', c: true },
          { t: 'Только меняет анимацию на экране', c: false },
          { t: 'Удаляет все сохранения', c: false },
        ],
        ok: 'Сервер валидирует право на награду и фиксирует факт выдачи.',
        bad: 'Реальное начисление — на стороне сервера и БД.',
      },
    ],
  },
  {
    id: 'l7',
    kind: 'level',
    level: 7,
    emoji: '🖥️',
    title: 'Клиент',
    goal: 'Интерфейс',
    context: ['Клиент — то, что видит игрок: меню, HUD, лаунчер, анимации, ввод с геймпада или тача.'],
    examples: ['Адаптив UI под разные разрешения', 'Экран логина и привязка аккаунта', 'Предзагрузка ассетов и офлайн‑режим где возможно'],
    takeaway: 'Клиент переводит состояние игры и ответы сервера в картинку и управление.',
    interactive: 'quiz',
    quiz: [
      {
        q: 'Что из этого относится к клиенту игры?',
        opts: [
          { t: 'Отрисовка HUD и экрана «Победа / Поражение»', c: true },
          { t: 'Физический сервер матчмейкинга в дата‑центре', c: false },
          { t: 'Ночной бэкап БД прогресса', c: false },
        ],
        ok: 'Визуал и ввод в приложении или браузере — зона клиента.',
        bad: 'Железо и фоновые задачи сервера — не клиентский UI.',
      },
      {
        q: 'Зачем клиенту валидировать форму, если есть сервер?',
        opts: [
          { t: 'Быстрее подсказать ошибку без лишнего запроса', c: true },
          { t: 'Чтобы обойти сервер полностью', c: false },
          { t: 'Чтобы не показывать кнопку «Отправить»', c: false },
        ],
        ok: 'Клиентский ввод улучшает UX; сервер всё равно проверяет окончательно.',
        bad: 'Двойная проверка: удобство на клиенте, безопасность на сервере.',
      },
    ],
  },
  {
    id: 'l8',
    kind: 'level',
    level: 8,
    emoji: '🚀',
    title: 'Развёртывание',
    goal: 'Доставка игры игрокам',
    context: ['Сборка на машине разработчика ещё не релиз: клиенты качают патчи из стора или CDN, серверы обновляют по конвейеру.'],
    examples: ['Сборка под PC / мобильные / веб', 'Выкладка hotfix без долгого простоя', 'Мониторинг онлайна и откат билда'],
    takeaway: 'Релиз игры — это конвейер, магазины приложений и стабильные сервера.',
    interactive: 'quiz',
    quiz: [
      {
        q: 'Что значит «задеплоить» приложение?',
        opts: [
          { t: 'Выкатить рабочую версию на сервер / в магазин приложений', c: true },
          { t: 'Удалить репозиторий с GitHub', c: false },
          { t: 'Нарисовать только макет в Figma', c: false },
        ],
        ok: 'Деплой — публикация собранной версии для пользователей.',
        bad: 'Деплой связан с выкладкой и запуском, а не с удалением кода.',
      },
      {
        q: 'Зачем staging‑среда (копия продакшена)?',
        opts: [
          { t: 'Проверить сборку и сценарии до боевого запуска', c: true },
          { t: 'Хранить только личные фото разработчика', c: false },
          { t: 'Чтобы пользователи не могли зайти никогда', c: false },
        ],
        ok: 'Промежуточное окружение снижает риск сломать прод.',
        bad: 'Staging — для проверки перед продакшеном.',
      },
    ],
  },
  {
    id: 'finale',
    kind: 'finale',
    emoji: '✨',
    title: 'Финал',
    lines: [
      'Вы прошли цепочку: логика уровня и сейва, сеть и матчмейкинг, путь игрока, интерфейс, БД, сервер и релиз.',
      'Разработчик игры работает с алгоритмами, UX, клиентом, backend и доставкой патчей — всё это связано.',
    ],
    question: 'Если хочется строить игровые и прикладные системы целиком — вам сюда:',
    specialty: '09.02.11',
    specialtyName: 'Разработка и управление программным обеспечением',
  },
]

const stageIndex = ref(0)
const stage = computed(() => STAGES[stageIndex.value])

const flowchartScenario = computed(() =>
  stage.value.interactive === 'flowchart' ? activeFlowScenario.value : null,
)
const fcApi = useAlgorithmFlowchart(flowchartScenario)

const completedLevels = computed(() => {
  const s = stage.value
  if (s.kind === 'level') return s.level
  if (s.kind === 'finale') return 8
  return 0
})

const milestone = computed(() => {
  if (stage.value.kind !== 'level') return null
  if (stage.value.level === 4) return 'Половина уровней — отличный темп!'
  return `Уровень ${stage.value.level} из 8`
})

/* Flowchart scenario tab */
const flowScenarioId = ref(FLOW_SCENARIOS[0].id)
const activeFlowScenario = computed(() => FLOW_SCENARIOS.find((s) => s.id === flowScenarioId.value) ?? FLOW_SCENARIOS[0])

/* L3 paths */
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const pathScenarioKey = ref('arcade')
const pathShuffled = ref([])
const pathPicked = ref([])

const activePathScenario = computed(() => PATH_SCENARIOS[pathScenarioKey.value])

function rebuildPathShuffle() {
  const sc = activePathScenario.value
  if (!sc) return
  pathShuffled.value = shuffle(sc.labels)
  pathPicked.value = []
}

const pathCorrect = computed(() => {
  const sc = activePathScenario.value
  if (!sc || pathPicked.value.length !== sc.order.length) return null
  return pathPicked.value.every((p, i) => p.id === sc.order[i])
})

function pickPath(item) {
  if (pathPicked.value.find((p) => p.id === item.id)) return
  pathPicked.value = [...pathPicked.value, item]
}

/* L4 UX */
const uxPairIndex = ref(0)
const uxChoice = ref(null)

/* Quiz L5–L8 */
const quizPicked = ref({})

function quizKey(qIndex) {
  return `${stage.value.id}-${qIndex}`
}

function pickQuiz(qIndex, opt, item) {
  const k = quizKey(qIndex)
  if (quizPicked.value[k] !== undefined) return
  quizPicked.value = {
    ...quizPicked.value,
    [k]: { correct: opt.c, explain: opt.c ? item.ok : item.bad },
  }
}

watch(stageIndex, (i) => {
  uxChoice.value = null
  uxPairIndex.value = 0
  const id = STAGES[i]?.id
  if (id === 'l3') rebuildPathShuffle()
})

watch(uxPairIndex, () => {
  uxChoice.value = null
})

watch(pathScenarioKey, () => rebuildPathShuffle())

function next() {
  if (stageIndex.value < STAGES.length - 1) stageIndex.value++
}

function prev() {
  if (stageIndex.value > 0) stageIndex.value--
}

const showAppPreview = ref(false)
</script>

<template>
  <div class="app-root">
    <header class="top">
      <div class="brand">
        <span class="code">09.02.11</span>
        <span class="brand-sub">Разработка и управление ПО</span>
      </div>
      <div v-if="stage.kind !== 'intro' && stage.kind !== 'finale'" class="progress-wrap">
        <div class="progress-label">Прогресс</div>
        <div class="progress-bar" role="progressbar" :aria-valuenow="completedLevels" aria-valuemin="0" aria-valuemax="8">
          <div v-for="n in 8" :key="n" class="progress-seg" :class="{ filled: n <= completedLevels }" />
        </div>
      </div>
    </header>

    <main class="main-split">
      <transition name="fade" mode="out-in">
        <section :key="stage.id" class="stage-split">
          <aside class="pane pane-in">
            <div class="pane-in-head">
              <span class="pane-tab">Задание</span>
            </div>
            <div class="pane-in-scroll">
              <p v-if="milestone && stage.kind === 'level'" class="milestone">{{ milestone }}</p>

              <template v-if="stage.kind === 'intro'">
                <div class="hero-emoji">{{ stage.emoji }}</div>
                <h1 class="h1 h1-left">Собери игровое приложение</h1>
                <p class="tag tag-left">8 уровней · слева задание, справа результат</p>
                <p class="lead">{{ stage.lead }}</p>
                <ul class="q-list">
                  <li v-for="(b, i) in stage.bullets" :key="i">{{ b }}</li>
                </ul>
                <p class="cta-line">{{ stage.cta }}</p>
              </template>

              <template v-else-if="stage.kind === 'level'">
                <div class="level-head">
                  <span class="level-badge">Уровень {{ stage.level }} / 8</span>
                  <span class="hero-emoji sm">{{ stage.emoji }}</span>
                  <h1 class="h1 h1-left">{{ stage.title }}</h1>
                  <p class="goal">Цель: {{ stage.goal }}</p>
                </div>

                <div v-if="stage.context?.length" class="context-box">
                  <p v-for="(line, i) in stage.context" :key="i" class="ctx-line">{{ line }}</p>
                </div>

                <div v-if="stage.examples?.length" class="examples-block">
                  <h3 class="examples-title">Примеры</h3>
                  <ul class="examples-list">
                    <li v-for="(ex, i) in stage.examples" :key="i">{{ ex }}</li>
                  </ul>
                </div>

                <div v-if="stage.interactive === 'flowchart'" class="interactive">
                  <h3 class="subh">Блок‑схема</h3>
                  <p class="hint">
                    Неверный процесс не останавливает сценарий. Условия — ветки «да / нет» рядом; схема строится справа.
                  </p>
                  <div class="scenario-tabs" role="tablist">
                    <button
                      v-for="sc in FLOW_SCENARIOS"
                      :key="sc.id"
                      type="button"
                      class="sc-tab"
                      :class="{ on: flowScenarioId === sc.id }"
                      role="tab"
                      :aria-selected="flowScenarioId === sc.id"
                      @click="flowScenarioId = sc.id"
                    >
                      {{ sc.title }}
                    </button>
                  </div>
                  <FlowchartPanel :key="flowScenarioId" :api="fcApi" />
                </div>

                <div v-else-if="stage.interactive === 'network'" class="interactive">
                  <h3 class="subh">Как бегают данные</h3>
                  <p class="hint">
                    Справа — анимированный эскиз: стрелка запроса к серверу, пауза на обработке, стрелка ответа обратно в
                    браузер. Кнопка «Показать путь данных» запускает сцену ещё раз.
                  </p>
                </div>

                <div v-else-if="stage.interactive === 'userPath'" class="interactive">
                  <h3 class="subh">Порядок шагов</h3>
                  <div class="scenario-tabs">
                    <button
                      v-for="key in Object.keys(PATH_SCENARIOS)"
                      :key="key"
                      type="button"
                      class="sc-tab"
                      :class="{ on: pathScenarioKey === key }"
                      @click="pathScenarioKey = key"
                    >
                      {{ PATH_SCENARIOS[key].title }}
                    </button>
                  </div>
                  <p class="hint">Нажимайте карточки по порядку. Цепочка отображается справа.</p>
                  <div class="chips">
                    <button
                      v-for="p in pathShuffled"
                      :key="p.id"
                      type="button"
                      class="chip"
                      :disabled="pathPicked.some((x) => x.id === p.id)"
                      @click="pickPath(p)"
                    >
                      {{ p.text }}
                    </button>
                  </div>
                  <div class="row">
                    <button type="button" class="btn ghost" @click="rebuildPathShuffle">Сбросить карточки</button>
                  </div>
                </div>

                <div v-else-if="stage.interactive === 'uxCompare'" class="interactive">
                  <h3 class="subh">Сравнение интерфейсов</h3>
                  <div class="ux-dots">
                    <button
                      v-for="i in 3"
                      :key="i"
                      type="button"
                      class="ux-dot"
                      :class="{ on: uxPairIndex === i - 1 }"
                      :aria-label="'Пример ' + i"
                      @click="uxPairIndex = i - 1"
                    />
                  </div>
                  <p v-show="uxPairIndex === 0" class="ux-task ux-task-left">Где проще купить скин в магазине?</p>
                  <p v-show="uxPairIndex === 1" class="ux-task ux-task-left">Где удобнее войти в игровой аккаунт?</p>
                  <p v-show="uxPairIndex === 2" class="ux-task ux-task-left">Где понятнее графика и звук?</p>
                  <p class="hint">Макеты справа — нажмите элементы и сравните подсказки.</p>
                </div>

                <div v-else-if="stage.interactive === 'quiz' && stage.quiz" class="interactive quiz-wrap">
                  <h3 class="subh">Проверьте себя</h3>
                  <div v-for="(item, qi) in stage.quiz" :key="qi" class="quiz-card">
                    <p class="quiz-q">{{ item.q }}</p>
                    <div class="quiz-opts">
                      <button
                        v-for="(opt, oi) in item.opts"
                        :key="oi"
                        type="button"
                        class="quiz-opt"
                        :disabled="quizPicked[quizKey(qi)] !== undefined"
                        @click="pickQuiz(qi, opt, item)"
                      >
                        {{ opt.t }}
                      </button>
                    </div>
                    <p
                      v-if="quizPicked[quizKey(qi)]"
                      class="quiz-explain"
                      :class="quizPicked[quizKey(qi)].correct ? 'ok' : 'bad'"
                    >
                      {{ quizPicked[quizKey(qi)].explain }}
                    </p>
                  </div>
                </div>

                <div class="takeaway-box big">
                  <span class="pin">📌</span>
                  <p>{{ stage.takeaway }}</p>
                </div>
              </template>

              <template v-else>
                <div class="hero-emoji">{{ stage.emoji }}</div>
                <h1 class="h1 h1-left">{{ stage.title }}</h1>
                <p v-for="(line, i) in stage.lines" :key="i" class="finale-line">{{ line }}</p>
                <div class="finale-q">
                  <strong>{{ stage.question }}</strong>
                </div>
                <div class="specialty-block">
                  <span class="spec-code">{{ stage.specialty }}</span>
                  <p class="spec-name">{{ stage.specialtyName }}</p>
                </div>
                <button type="button" class="btn secondary" @click="showAppPreview = !showAppPreview">
                  {{ showAppPreview ? 'Скрыть схему справа' : 'Показать схему справа' }}
                </button>
              </template>

              <nav class="nav">
                <button type="button" class="btn ghost" :disabled="stageIndex === 0" @click="prev">Назад</button>
                <button v-if="stageIndex < STAGES.length - 1" type="button" class="btn primary" @click="next">Далее</button>
                <span v-else class="end-label">Можно начать сначала</span>
              </nav>
              <button v-if="stageIndex === STAGES.length - 1" type="button" class="btn ghost restart" @click="stageIndex = 0">
                С начала
              </button>
            </div>
          </aside>

          <div class="split-gutter" aria-hidden="true" />

          <div class="pane pane-out">
            <div class="pane-out-head">
              <span class="pane-tab pane-tab-out">Просмотр</span>
            </div>
            <div class="pane-out-scroll">
              <template v-if="stage.kind === 'intro'">
                <div class="preview-placeholder">
                  <span class="preview-run-icon" aria-hidden="true">▶</span>
                  <p class="preview-placeholder-title">Готово к запуску</p>
                  <p class="preview-placeholder-text">Нажмите «Далее» — в этой панели будет отображаться результат шагов уровня.</p>
                </div>
              </template>

              <template v-else-if="stage.kind === 'level'">
                <FlowchartCanvas
                  v-if="stage.interactive === 'flowchart'"
                  :key="'fc-' + flowScenarioId"
                  :api="fcApi"
                />
                <NetworkJourney v-else-if="stage.interactive === 'network'" />

                <div v-else-if="stage.interactive === 'userPath'" class="preview-path">
                  <p class="preview-section-title">Цепочка сценария</p>
                  <div class="order-track order-track-out">
                    <span v-for="(p, i) in pathPicked" :key="i" class="order-item">{{ i + 1 }}. {{ p.text }}</span>
                    <span v-if="!pathPicked.length" class="out-muted">Пока пусто — выберите шаги слева</span>
                  </div>
                  <p v-if="pathCorrect === true" class="preview-status ok">Верный порядок</p>
                  <p v-else-if="pathCorrect === false" class="preview-status bad">Порядок можно улучшить</p>
                </div>

                <div v-else-if="stage.interactive === 'uxCompare'" class="preview-ux">
                  <div v-show="uxPairIndex === 0" class="ux-slide">
                    <div class="ux-row ux-row-out">
                      <div class="ux-panel bad">
                        <span class="ux-label">Вариант А</span>
                        <div class="fake-ui messy">
                          <span class="tiny-link">скин</span>
                          <button type="button" class="btn-tiny" @click="uxChoice = 'a0'">ок</button>
                        </div>
                        <p v-if="uxChoice === 'a0'" class="ux-feedback">Неясно, что покупаешь и как оплатить.</p>
                      </div>
                      <div class="ux-panel good">
                        <span class="ux-label">Вариант Б</span>
                        <div class="fake-ui clean">
                          <span class="lbl">Набор «Лес» — 299 ₽</span>
                          <button type="button" class="btn-cta" @click="uxChoice = 'b0'">Купить за 299 ₽</button>
                        </div>
                        <p v-if="uxChoice === 'b0'" class="ux-feedback ok">Цена и действие на виду — меньше ошибок.</p>
                      </div>
                    </div>
                  </div>
                  <div v-show="uxPairIndex === 1" class="ux-slide">
                    <div class="ux-row ux-row-out">
                      <div class="ux-panel bad">
                        <span class="ux-label">Вариант А</span>
                        <div class="fake-ui messy login-bad">
                          <span class="micro">игрок</span>
                          <span class="micro">ник?</span>
                          <button type="button" class="btn-micro" @click="uxChoice = 'a1'">?</button>
                        </div>
                        <p v-if="uxChoice === 'a1'" class="ux-feedback">Непонятные подписи, нет явной кнопки «Войти».</p>
                      </div>
                      <div class="ux-panel good">
                        <span class="ux-label">Вариант Б</span>
                        <div class="fake-ui clean login-good">
                          <label class="lbl">Почта</label>
                          <div class="fake-input" />
                          <label class="lbl">Пароль</label>
                          <div class="fake-input" />
                          <button type="button" class="btn-cta sm" @click="uxChoice = 'b1'">Войти</button>
                        </div>
                        <p v-if="uxChoice === 'b1'" class="ux-feedback ok">Колонка, подписи, явное действие.</p>
                      </div>
                    </div>
                  </div>
                  <div v-show="uxPairIndex === 2" class="ux-slide">
                    <div class="ux-row ux-row-out">
                      <div class="ux-panel bad">
                        <span class="ux-label">Вариант А</span>
                        <div class="fake-ui messy settings-bad">
                          <span class="nano">fpsзвукгаммаязыксенситивностьполноэкран</span>
                        </div>
                        <p v-if="uxChoice === 'a2'" class="ux-feedback">Параметры слиплись — не найти громкость или FPS.</p>
                        <button type="button" class="btn-tiny" @click="uxChoice = 'a2'">Открыть</button>
                      </div>
                      <div class="ux-panel good">
                        <span class="ux-label">Вариант Б</span>
                        <div class="fake-ui clean settings-good">
                          <div class="set-row"><span class="set-h">Графика</span><span class="set-d">Качество, FPS‑лимит</span></div>
                          <div class="set-row"><span class="set-h">Звук</span><span class="set-d">Музыка, эффекты, голос</span></div>
                        </div>
                        <p v-if="uxChoice === 'b2'" class="ux-feedback ok">Секции с заголовками — быстрее найти нужный ползунок.</p>
                        <button type="button" class="btn-cta sm" @click="uxChoice = 'b2'">Сохранить</button>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-else-if="stage.interactive === 'quiz' && stage.quiz" class="preview-quiz">
                  <p class="preview-section-title">Статус</p>
                  <ul class="quiz-status-list">
                    <li
                      v-for="(item, qi) in stage.quiz"
                      :key="qi"
                      class="quiz-status-li"
                      :class="{
                        done: quizPicked[quizKey(qi)],
                        ok: quizPicked[quizKey(qi)]?.correct,
                        bad: quizPicked[quizKey(qi)] && !quizPicked[quizKey(qi)].correct,
                      }"
                    >
                      <span class="quiz-status-n">Вопрос {{ qi + 1 }}</span>
                      <span v-if="!quizPicked[quizKey(qi)]" class="quiz-status-w">ожидание</span>
                      <span v-else-if="quizPicked[quizKey(qi)].correct" class="quiz-status-w">верно</span>
                      <span v-else class="quiz-status-w">разбор слева</span>
                    </li>
                  </ul>
                </div>
              </template>

              <template v-else>
                <div v-if="showAppPreview" class="app-scheme app-scheme-out">
                  <div class="scheme-layer client-layer">Клиент игры</div>
                  <div class="scheme-arrows">⇄</div>
                  <div class="scheme-layer server-layer">
                    Игровой backend + БД
                    <span class="scheme-note">матчи · прогресс · экономика</span>
                  </div>
                  <div class="scheme-deploy">Патчи · сторы · мониторинг</div>
                </div>
                <div v-else class="preview-placeholder preview-placeholder--subtle">
                  <p class="preview-placeholder-text">Включите схему кнопкой слева — она появится здесь.</p>
                </div>
              </template>
            </div>
          </div>
        </section>
      </transition>
    </main>

    <footer class="foot">День открытых дверей</footer>
  </div>
</template>

<style scoped>
.app-root {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: radial-gradient(ellipse 120% 80% at 50% -20%, rgba(91, 140, 255, 0.25), transparent), var(--bg);
}

.top {
  flex-shrink: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.brand {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.code {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--accent);
}

.brand-sub {
  font-size: 0.85rem;
  color: var(--muted);
}

.progress-wrap {
  flex: 1;
  min-width: 200px;
  max-width: 420px;
}

.progress-label {
  font-size: 0.75rem;
  color: var(--muted);
  margin-bottom: 0.35rem;
}

.progress-bar {
  display: flex;
  gap: 6px;
  height: 10px;
}

.progress-seg {
  flex: 1;
  border-radius: 6px;
  background: var(--surface2);
  transition: background 0.35s ease;
}

.progress-seg.filled {
  background: linear-gradient(90deg, var(--accent), var(--accent2));
  box-shadow: 0 0 12px rgba(91, 140, 255, 0.5);
}

.main-split {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.stage-split {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 5px minmax(0, 1fr);
  overflow: hidden;
}

@media (max-width: 900px) {
  .stage-split {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(0, 1fr) 1px minmax(0, 1fr);
  }

  .split-gutter {
    height: 1px;
    width: 100% !important;
    background: rgba(255, 255, 255, 0.12) !important;
  }
}

.split-gutter {
  width: 5px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
  border-left: 1px solid rgba(0, 0, 0, 0.35);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
}

.pane {
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.pane-in {
  background: #1e222e;
  color: var(--text);
}

.pane-in-head,
.pane-out-head {
  flex-shrink: 0;
  padding: 0.4rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pane-out-head {
  background: #f1f3f7;
  border-bottom-color: #d8dee9;
}

.pane-tab {
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
}

.pane-tab-out {
  color: #64748b;
}

.pane-in-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: 1.25rem 1.35rem 1.5rem;
}

.pane-out {
  background: #ffffff;
  color: #1a1d2e;
}

.pane-out-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: 1.25rem 1.35rem 1.5rem;
}

.h1-left {
  text-align: left;
}

.tag-left {
  text-align: left;
}

.btn-run {
  width: 100%;
  margin-top: 0.35rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
}

.ux-task-left {
  text-align: left;
  margin: 0.75rem 0 0.5rem;
  font-weight: 700;
}

.preview-placeholder {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem 1rem;
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  background: #f8fafc;
}

.preview-placeholder--subtle {
  min-height: 160px;
  border-style: solid;
  border-color: #e2e8f0;
}

.preview-run-icon {
  font-size: 2rem;
  color: #5b8cff;
  margin-bottom: 0.75rem;
  line-height: 1;
}

.preview-placeholder-title {
  font-weight: 800;
  font-size: 1.05rem;
  margin: 0 0 0.5rem;
  color: #1e293b;
}

.preview-placeholder-text {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.5;
  color: #64748b;
  max-width: 320px;
}

.preview-section-title {
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
  margin: 0 0 0.75rem;
}

.preview-status {
  margin: 0.75rem 0 0;
  font-weight: 700;
  font-size: 0.9rem;
}

.preview-status.ok {
  color: #16a34a;
}

.preview-status.bad {
  color: #dc2626;
}

.out-muted {
  color: #64748b;
}

.order-track-out {
  background: #f1f5f9 !important;
  border: 1px solid #e2e8f0;
  min-height: 120px;
}

.order-track-out .order-item {
  color: #1e293b;
}

.quiz-status-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.quiz-status-li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.55rem 0.75rem;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  font-size: 0.88rem;
}

.quiz-status-li.done.ok {
  border-color: #86efac;
  background: #f0fdf4;
}

.quiz-status-li.done.bad {
  border-color: #fecaca;
  background: #fef2f2;
}

.quiz-status-n {
  font-weight: 700;
  color: #334155;
}

.quiz-status-w {
  font-size: 0.8rem;
  color: #94a3b8;
}

.quiz-status-li.done.ok .quiz-status-w {
  color: #16a34a;
}

.quiz-status-li.done.bad .quiz-status-w {
  color: #dc2626;
}

.app-scheme-out {
  margin-top: 0;
  background: #f8fafc !important;
  border: 1px solid #e2e8f0;
}

.app-scheme-out .scheme-layer {
  color: #1e293b;
}

.app-scheme-out .scheme-note {
  color: #64748b;
}

.app-scheme-out .scheme-arrows {
  color: #94a3b8;
}

.preview-ux .ux-row-out {
  max-width: 100%;
}

.preview-ux .ux-label {
  color: #64748b;
}

.preview-ux .ux-feedback {
  color: #475569;
}

.preview-ux .ux-feedback.ok {
  color: #15803d;
}

.milestone {
  text-align: center;
  font-weight: 700;
  color: var(--warn);
  margin: 0 0 1rem;
  animation: pulse 2s ease infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.75;
  }
}

.hero-emoji {
  font-size: 3rem;
  text-align: center;
  margin-bottom: 0.5rem;
}

.hero-emoji.sm {
  font-size: 2rem;
  display: block;
}

.h1 {
  font-size: clamp(1.5rem, 4vw, 2rem);
  font-weight: 800;
  text-align: center;
  margin: 0 0 0.5rem;
  line-height: 1.2;
}

.tag {
  text-align: center;
  color: var(--muted);
  font-size: 0.9rem;
  margin: 0 0 1.25rem;
}

.lead {
  font-size: 1.1rem;
  line-height: 1.55;
  margin: 0 0 1rem;
}

.q-list {
  margin: 0 0 1rem;
  padding-left: 1.25rem;
  color: var(--text);
  line-height: 1.6;
}

.cta-line {
  font-weight: 700;
  color: var(--accent);
  font-size: 1.05rem;
  margin: 0 0 1.5rem;
}

.level-head {
  text-align: center;
  margin-bottom: 1rem;
}

.level-badge {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
  margin-bottom: 0.5rem;
}

.goal {
  color: var(--muted);
  margin: 0;
}

.context-box {
  background: var(--surface2);
  border-radius: 12px;
  padding: 1rem 1.15rem;
  margin-bottom: 1rem;
  border-left: 4px solid var(--accent);
}

.ctx-line {
  margin: 0 0 0.5rem;
  line-height: 1.55;
  font-size: 0.95rem;
}

.ctx-line:last-child {
  margin-bottom: 0;
}

.examples-block {
  margin-bottom: 1.25rem;
}

.examples-title {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
  margin: 0 0 0.5rem;
}

.examples-list {
  margin: 0;
  padding-left: 1.2rem;
  line-height: 1.55;
  font-size: 0.92rem;
  color: var(--text);
}

.subh {
  margin: 0 0 0.5rem;
  font-size: 0.95rem;
}

.interactive {
  margin-bottom: 1rem;
}

.hint {
  font-size: 0.9rem;
  color: var(--muted);
  margin: 0 0 0.75rem;
  line-height: 1.45;
}

.scenario-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.sc-tab {
  padding: 0.45rem 0.85rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: transparent;
  color: var(--muted);
  font-size: 0.85rem;
  font-weight: 600;
}

.sc-tab.on {
  background: rgba(91, 140, 255, 0.2);
  border-color: var(--accent);
  color: var(--text);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.chip {
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: var(--surface2);
  color: var(--text);
  padding: 0.55rem 0.9rem;
  border-radius: 999px;
  font-size: 0.9rem;
  transition:
    transform 0.15s,
    border-color 0.15s;
}

.chip:hover:not(:disabled) {
  border-color: var(--accent);
  transform: translateY(-1px);
}

.chip:disabled {
  opacity: 0.35;
  cursor: default;
}

.order-track {
  min-height: 3rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 0.75rem;
}

.order-item {
  font-size: 0.95rem;
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.ok {
  color: var(--success);
  margin: 0;
  font-weight: 600;
}

.bad {
  color: #ff8a8a;
  margin: 0;
}

.muted {
  color: var(--muted);
}

.muted.sm {
  font-size: 0.85rem;
}

.ux-dots {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 1rem;
}

.ux-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: none;
  background: var(--surface2);
  cursor: pointer;
  padding: 0;
}

.ux-dot.on {
  background: var(--accent);
  box-shadow: 0 0 10px rgba(91, 140, 255, 0.6);
}

.ux-task {
  font-weight: 700;
  text-align: center;
  margin: 0 0 1rem;
}

.ux-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 600px) {
  .ux-row {
    grid-template-columns: 1fr;
  }
}

.ux-panel {
  border-radius: 12px;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.ux-panel.bad {
  background: #2a1f28;
}

.ux-panel.good {
  background: #1a2830;
}

.ux-label {
  font-size: 0.8rem;
  color: var(--muted);
  display: block;
  margin-bottom: 0.75rem;
}

.fake-ui {
  min-height: 100px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.fake-ui.messy {
  background: #3d3540;
  flex-direction: column;
  gap: 0.5rem;
}

.fake-ui.clean {
  background: #243540;
}

.fake-ui.login-bad {
  flex-wrap: wrap;
  gap: 0.35rem;
  align-items: center;
  justify-content: flex-start;
}

.fake-ui.login-good {
  flex-direction: column;
  align-items: stretch;
  gap: 0.35rem;
}

.micro {
  font-size: 0.65rem;
  color: #888;
}

.btn-micro {
  font-size: 0.6rem;
  padding: 0.15rem 0.35rem;
}

.lbl {
  font-size: 0.7rem;
  color: var(--muted);
}

.fake-input {
  height: 22px;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.settings-bad {
  min-height: 72px;
  align-items: flex-start;
  justify-content: flex-start;
}

.nano {
  font-size: 0.55rem;
  line-height: 1.2;
  color: #777;
  word-break: break-all;
}

.settings-good {
  flex-direction: column;
  align-items: stretch;
  gap: 0.5rem;
}

.set-row {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.8rem;
}

.set-h {
  font-weight: 700;
}

.set-d {
  color: var(--muted);
  font-size: 0.75rem;
}

.tiny-link {
  font-size: 0.65rem;
  color: #888;
  text-decoration: underline;
}

.btn-tiny {
  font-size: 0.7rem;
  padding: 0.2rem 0.4rem;
}

.btn-cta {
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  border: none;
  color: white;
  font-weight: 700;
  padding: 0.65rem 1.25rem;
  border-radius: 10px;
  font-size: 0.95rem;
}

.btn-cta.sm {
  padding: 0.45rem 0.9rem;
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

.ux-feedback {
  margin: 0.75rem 0 0;
  font-size: 0.9rem;
}

.quiz-wrap {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.quiz-card {
  background: var(--surface2);
  border-radius: 12px;
  padding: 1rem 1.1rem;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.quiz-q {
  font-weight: 700;
  margin: 0 0 0.65rem;
  font-size: 0.95rem;
}

.quiz-opts {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.quiz-opt {
  text-align: left;
  padding: 0.55rem 0.75rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.15);
  color: var(--text);
  font-size: 0.88rem;
}

.quiz-opt:hover:not(:disabled) {
  border-color: rgba(91, 140, 255, 0.4);
}

.quiz-opt:disabled {
  opacity: 0.55;
}

.quiz-explain {
  margin: 0.65rem 0 0;
  font-size: 0.88rem;
  line-height: 1.45;
}

.takeaway-box {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
  background: rgba(91, 140, 255, 0.1);
  border: 1px solid rgba(91, 140, 255, 0.25);
  border-radius: 12px;
  padding: 0.85rem 1rem;
  margin-top: 0.5rem;
}

.takeaway-box.big {
  margin-top: 1rem;
}

.takeaway-box p {
  margin: 0;
  line-height: 1.5;
}

.pin {
  flex-shrink: 0;
}

.finale-line {
  font-size: 1.05rem;
  line-height: 1.55;
  margin: 0 0 0.85rem;
}

.finale-q {
  margin: 1.25rem 0;
  font-size: 1.15rem;
}

.specialty-block {
  text-align: center;
  padding: 1.25rem;
  background: var(--surface2);
  border-radius: 12px;
  margin-bottom: 1rem;
}

.spec-code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.75rem;
  font-weight: 700;
  background: linear-gradient(90deg, var(--accent), var(--accent2));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.spec-name {
  margin: 0.5rem 0 0;
  color: var(--muted);
  font-size: 0.95rem;
}

.app-scheme {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--surface2);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
}

.scheme-layer {
  width: 100%;
  text-align: center;
  padding: 0.75rem;
  border-radius: 8px;
}

.client-layer {
  background: rgba(124, 92, 255, 0.2);
  border: 1px solid rgba(124, 92, 255, 0.4);
}

.server-layer {
  background: rgba(61, 214, 140, 0.15);
  border: 1px solid rgba(61, 214, 140, 0.35);
}

.scheme-note {
  display: block;
  font-size: 0.8rem;
  color: var(--muted);
  margin-top: 0.25rem;
}

.scheme-arrows {
  color: var(--muted);
  font-size: 1.25rem;
}

.scheme-deploy {
  font-weight: 700;
  color: var(--warn);
}

.nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.75rem;
  padding-top: 1.25rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.btn {
  border: none;
  border-radius: 10px;
  padding: 0.65rem 1.25rem;
  font-weight: 700;
  font-size: 0.95rem;
  transition:
    opacity 0.15s,
    transform 0.15s;
}

.btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.btn.primary {
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  color: white;
}

.btn.primary:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn.ghost {
  background: transparent;
  color: var(--muted);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.btn.ghost:hover:not(:disabled) {
  color: var(--text);
  border-color: rgba(255, 255, 255, 0.3);
}

.btn.secondary {
  width: 100%;
  margin-top: 0.5rem;
  background: var(--surface2);
  color: var(--text);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.restart {
  width: 100%;
  margin-top: 0.5rem;
}

.end-label {
  font-size: 0.85rem;
  color: var(--muted);
}

.foot {
  flex-shrink: 0;
  text-align: center;
  padding: 0.65rem 1rem;
  font-size: 0.8rem;
  color: var(--muted);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
