<script setup>
import { ref, computed, watch } from 'vue'
import FlowchartPanel from './components/FlowchartPanel.vue'
import FlowchartCanvas from './components/FlowchartCanvas.vue'
import NetworkJourney from './components/NetworkJourney.vue'
import UserPathLifecycle from './components/UserPathLifecycle.vue'
import DesignStudioPreview from './components/DesignStudioPreview.vue'
import ErDomainExplorer from './components/ErDomainExplorer.vue'
import ServerBackendLab from './components/ServerBackendLab.vue'
import ClientDataLab from './components/ClientDataLab.vue'
import DeployLab from './components/DeployLab.vue'
import TestingLab from './components/TestingLab.vue'
import { DESIGN_PALETTES, DESIGN_FONTS, evaluatePalette, formatRatio } from './data/designPalettes.js'
import { DOMAIN_OBSERVATIONS } from './data/erDomain.js'
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
    transitions: ['вход в приложение', 'навигация к контенту', 'игровая сессия', 'фиксация результата'],
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
    transitions: ['вход в лобби', 'построение пары', 'раунд PvP', 'рейтинг и награда'],
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
    transitions: ['инициация сюжета', 'принятие задачи', 'исполнение', 'награда в инвентарь'],
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
      'Те же идеи: алгоритмы, клиент‑сервер, БД, проектирование сценариев, проверки перед релизом и выкладка.',
      'Ниже — 9 уровней с примерами и мини‑задачами.',
    ],
    cta: 'Начать 9 уровней',
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
    goal: 'Понять, как «спрашивают» сайт и получают ответ',
    context: [
      'Справа — наглядная цепочка: вы на своём устройстве → интернет → компьютер, где лежит сайт или данные игры, → снова ваш экран.',
      'Можно собрать цепочку по шагам вопросами или посмотреть целиком как короткий «ролик».',
    ],
    examples: [
      'Сначала уходит просьба «покажи страницу», потом приходит готовый ответ — так работает обычный сайт.',
      'В онлайн‑игре то же самое: игра просит список комнат, сервер присылает актуальный список.',
    ],
    takeaway: 'Интернет здесь — «дорога» между вашим экраном и удалённым компьютером, где хранится нужная информация.',
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
    goal: 'Контраст и токены UI',
    context: [
      'Цвета и шрифты — не «украшение», а читаемость: контраст текста и кнопок к фону, иерархия подписей.',
      'Для магазина и настроек важны измеримые критерии (в т.ч. WCAG), а не только вкус.',
    ],
    examples: [
      'Палитра с низким контрастом: цена и CTA «теряются» на фоне.',
      'Системный гротеск для форм; display‑шрифты — осторожно в длинном тексте.',
      'Проверка пары «текст / фон» перед релизом — часть UI‑процесса.',
    ],
    takeaway: 'Хороший UI в игре измеряется доступностью и ясностью действий, а не «самой модной» палитрой.',
    interactive: 'uxStudio',
  },
  {
    id: 'l5',
    kind: 'level',
    level: 5,
    emoji: '🗄️',
    title: 'Базы данных',
    goal: 'ER‑модель по предметной области',
    context: [
      'Данные игры между сессиями живут в таблицах со связями: сначала описывают предметную область, потом проектируют сущности и кардинальности.',
      'Вы — исследователи домена: читаете заметки с поля и решаете, какие объекты и связи нужны, чтобы честно хранить прогресс, инвентарь и экономику.',
    ],
    examples: [
      'Заметка «прогресс привязан к аккаунту» → сущность игрока и отдельные сущности для персонажей и вещей.',
      '«Предметы в инвентаре со стаками» → связь инвентаря с каталогом предметов и строки состава.',
      '«Покупки и матчи оставляют след» → расширение модели транзакциями и историей матчей.',
    ],
    takeaway:
      'БД — не «ящик для файлов», а явная модель: сущности и связи отражают договорённости предметной области и то, что реально нужно хранить.',
    interactive: 'erDomain',
  },
  {
    id: 'l6',
    kind: 'level',
    level: 6,
    emoji: '⚙️',
    title: 'Сервер',
    goal: 'Код, база и ответ игре',
    context: [
      'Сервер — программа на удалённой машине: она решает, можно ли выдать награду, и лезет в базу за фактами. То, что написано в приложении на телефоне, игрок может попытаться обойти — поэтому важные проверки делают здесь.',
      'Экран и кнопки — на следующем уровне («Клиент»). Здесь только цепочка: кто запросил → что ответила база → что отправить обратно.',
    ],
    examples: [
      'Профиль: узнать игрока по входу, прочитать одну строку из таблицы, вернуть короткий JSON.',
      'Награда: снова узнать игрока, записать в базу «уже выдали», вернуть JSON с призом и балансом.',
      'Так же проверяют покупки и матчи — иначе читеры и ошибки ломают игру.',
    ],
    takeaway:
      'Сервер — «умный посредник» между игрой и базой: он не верит телефону на слово и возвращает только проверенный результат.',
    interactive: 'serverLab',
  },
  {
    id: 'l7',
    kind: 'level',
    level: 7,
    emoji: '🖥️',
    title: 'Клиент',
    goal: 'Показать на экране то, что прислал сервер',
    context: [
      'Дизайн — про внешний вид. Но если не дождаться ответа или перепутать имя поля в данных, игрок увидит пустоту или неправду.',
      'Сервер уже прислал JSON (прошлый уровень). Задача клиента — честно прочитать этот текст и вывести цифры и слова как есть.',
    ],
    examples: [
      'Профиль: сначала «загрузка», потом ник из поля nickname, опыт из xp.',
      'Награда: сначала проверить status, потом баланс из balance, название приза из loot.',
      'Проверка в форме на телефоне удобна, но главное решение всё равно на сервере.',
    ],
    takeaway:
      'Сначала правильно принять данные от сервера, потом можно красиво их обернуть в интерфейс.',
    interactive: 'clientLab',
  },
  {
    id: 'l8',
    kind: 'level',
    level: 8,
    emoji: '🧪',
    title: 'Тестирование',
    goal: 'Что проверяют перед развёртыванием',
    context: [
      'Развёртывание публикует ту версию, которая уже собрана. Без проверок в сеть уезжают ошибки в логике, интерфейсе и данных — их потом видят реальные игроки.',
      'Обычно смотрят по отдельности: ведёт ли себя функционал по правилам, понятен ли интерфейс, выдерживает ли код правки и не сломалось ли старое после изменений.',
    ],
    examples: [
      'Функционал: ключевые сценарии и нестандартные ситуации, не только «счастливый путь».',
      'Интерфейс: кнопки, тексты ошибок, удобство на разных размерах экрана.',
      'Код: ревью и автоматические прогоны, повторный прогон критичных сценариев перед выкладкой.',
    ],
    takeaway:
      'Тестирование — обязательный этап перед релизом: так меньше сюрпризов у игроков после публикации.',
    interactive: 'testLab',
  },
  {
    id: 'l9',
    kind: 'level',
    level: 9,
    emoji: '🚀',
    title: 'Развёртывание',
    goal: 'Как игра доходит до людей в интернете',
    context: [
      'После проверок имеет смысл выкладывать сборку: иначе исправления придётся делать уже «в бою» у тысяч установок.',
      'У себя на компьютере можно собрать и поиграть — но друзья сами не увидят ваш файл, пока вы не выложите игру в сеть.',
      'Хостинг — это когда сборку держат на чужом компьютере в датацентре, который всегда в интернете и отдаёт файлы игрокам.',
      'Обычно код хранят вместе в Git (например на GitHub), а после отправки туда программа-«робот» на хостинге сама собирает и выкладывает версию — без ручного копирования каждый раз.',
    ],
    examples: [
      'Флешка и папка на рабочем столе — не то же самое, что «игра в интернете».',
      'Git — одно общее место для кода команды; в блоке «Релиз» показаны примеры команд в консоли.',
      'Хостинг + автовыкладка: игроки качают с постоянного адреса, а обновление подставляется само после git push.',
    ],
    takeaway:
      'Коротко: у себя пробуете → общий Git → хостинг (где лежит игра в сети) → автовыкладка (робот обновляет после Git).',
    interactive: 'deployLab',
  },
  {
    id: 'finale',
    kind: 'finale',
    emoji: '✨',
    title: 'Финал',
    lines: [
      'Вы прошли цепочку: логика уровня и сейва, сеть и матчмейкинг, путь игрока, дизайн, БД, сервер, клиент, проверки перед релизом и выкладка игры в интернет.',
      'Разработчик игры работает с алгоритмами, UX, клиентом, backend, тестами и доставкой патчей — всё это связано.',
    ],
    question: 'Если хочется строить игровые и прикладные системы целиком — вам сюда:',
    specialty: '09.02.11',
    specialtyName: 'Разработка и управление программным обеспечением',
  },
]

/** Всего игровых уровней (без вступления и финала) */
const TOTAL_LEVELS = 9

const stageIndex = ref(0)
const stage = computed(() => STAGES[stageIndex.value])

const flowchartScenario = computed(() =>
  stage.value.interactive === 'flowchart' ? activeFlowScenario.value : null,
)
const fcApi = useAlgorithmFlowchart(flowchartScenario)

const completedLevels = computed(() => {
  const s = stage.value
  if (s.kind === 'level') return s.level
  if (s.kind === 'finale') return TOTAL_LEVELS
  return 0
})

const milestone = computed(() => {
  if (stage.value.kind !== 'level') return null
  if (stage.value.level === 5) return 'Половина уровней — отличный темп!'
  return `Уровень ${stage.value.level} из ${TOTAL_LEVELS}`
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

/* L4 дизайн: расстановка блоков слева; палитра + шрифт + проверка справа */
const DESIGN_BLOCKS_CANON = ['kicker', 'title', 'desc', 'row']
const DESIGN_BLOCK_LABELS = {
  kicker: 'Контекст магазина',
  title: 'Название набора',
  desc: 'Описание состава',
  row: 'Цена и кнопка',
}

const designPaletteId = ref(DESIGN_PALETTES[0].id)
const designFontId = ref(DESIGN_FONTS[0].id)
const designFeedback = ref(null)
const designBlockOrder = ref([...DESIGN_BLOCKS_CANON])

function designOrderScrambled() {
  let o = shuffle([...DESIGN_BLOCKS_CANON])
  while (o.join() === DESIGN_BLOCKS_CANON.join()) {
    o = shuffle([...DESIGN_BLOCKS_CANON])
  }
  return o
}

const activeDesignPalette = computed(
  () => DESIGN_PALETTES.find((p) => p.id === designPaletteId.value) ?? DESIGN_PALETTES[0],
)
const activeDesignFont = computed(
  () => DESIGN_FONTS.find((f) => f.id === designFontId.value) ?? DESIGN_FONTS[0],
)

function runDesignCheck() {
  const pal = evaluatePalette(activeDesignPalette.value, activeDesignFont.value)
  const layoutOk = designBlockOrder.value.join() === DESIGN_BLOCKS_CANON.join()
  const issues = [...pal.issues]
  if (!layoutOk) {
    issues.push(
      'Расстановка: логичная цепочка — контекст магазина → название → описание → в конце цена и действие. Иначе игрок видит цену до того, что покупает.',
    )
  }
  const ok = pal.ok && layoutOk
  designFeedback.value = {
    ok,
    ratios: pal.ratios,
    issues,
    okMessage: pal.okMessage,
    layoutOk,
    paletteOk: pal.ok,
  }
}

function resetDesignStudio() {
  designPaletteId.value = DESIGN_PALETTES[0].id
  designFontId.value = DESIGN_FONTS[0].id
  designFeedback.value = null
  designBlockOrder.value = designOrderScrambled()
}

function moveDesignBlock(index, delta) {
  const j = index + delta
  if (j < 0 || j >= designBlockOrder.value.length) return
  const next = [...designBlockOrder.value]
  ;[next[index], next[j]] = [next[j], next[index]]
  designBlockOrder.value = next
  designFeedback.value = null
}

function selectDesignPalette(p) {
  designPaletteId.value = p.id
  designFeedback.value = null
}

function selectDesignFont(f) {
  designFontId.value = f.id
  designFeedback.value = null
}

/* Квиз на уровнях не используется (оставлен шаблон на будущее) */
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
  const id = STAGES[i]?.id
  if (id === 'l3') rebuildPathShuffle()
  if (id === 'l4') resetDesignStudio()
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
        <div
          class="progress-bar"
          role="progressbar"
          :aria-valuenow="completedLevels"
          aria-valuemin="0"
          :aria-valuemax="TOTAL_LEVELS"
        >
          <div
            v-for="n in TOTAL_LEVELS"
            :key="n"
            class="progress-seg"
            :class="{ filled: n <= completedLevels }"
          />
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
                <p class="tag tag-left">{{ TOTAL_LEVELS }} уровней · слева задание, справа результат</p>
                <p class="lead">{{ stage.lead }}</p>
                <ul class="q-list">
                  <li v-for="(b, i) in stage.bullets" :key="i">{{ b }}</li>
                </ul>
                <p class="cta-line">{{ stage.cta }}</p>
              </template>

              <template v-else-if="stage.kind === 'level'">
                <div class="level-head">
                  <span class="level-badge">Уровень {{ stage.level }} / {{ TOTAL_LEVELS }}</span>
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
                  <h3 class="subh">Как устроен обмен</h3>
                  <p class="hint">
                    Справа — картинка «от вас к сайту и обратно». Режим «Собрать сами»: ответьте на 4 коротких вопроса —
                    на схеме по очереди зажгутся стрелки. Режим «Показать целиком» — один просмотр без вопросов.
                  </p>
                </div>

                <div v-else-if="stage.interactive === 'userPath'" class="interactive">
                  <h3 class="subh">Диаграмма жизненного цикла</h3>
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
                  <p class="hint">
                    Соберите типичный цикл игрока: каждое нажатие добавляет состояние на схему справа — узлы и переходы, как
                    в нотации жизненного цикла сессии.
                  </p>
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

                <div v-else-if="stage.interactive === 'uxStudio'" class="interactive design-studio-task">
                  <h3 class="subh">Соберите интерфейс</h3>
                  <p class="hint">
                    Всю работу с макетом выполняйте в <strong>правой панели</strong>: порядок блоков карточки, цветовая
                    гамма, шрифт и кнопка «Проверить». Учитываются и <strong>контраст</strong> (ориентир WCAG&nbsp;AA), и
                    <strong>расстановка</strong> секций (от контекста магазина к цене и действию).
                  </p>
                  <p class="hint muted sm">Мини‑макет обновляется там же сразу при любых изменениях.</p>
                </div>

                <div v-else-if="stage.interactive === 'erDomain'" class="interactive">
                  <h3 class="subh">Заметки с поля</h3>
                  <p class="hint">
                    Прочитайте формулировки как у команды продукта: из них следуют сущности (таблицы) и связи
                    (внешние ключи). Справа соберите чертёж и проверьте, хватает ли базовой цепочки для прогресса и
                    инвентаря.
                  </p>
                  <ul class="examples-list er-obs-list">
                    <li v-for="n in DOMAIN_OBSERVATIONS" :key="n.id">{{ n.text }}</li>
                  </ul>
                  <p class="hint muted sm">
                    Узлы на схеме открываются по шагам; связи «рисуются» двумя кликами по уже добавленным сущностям — без
                    готового списка всех рёбер сразу.
                  </p>
                </div>

                <div v-else-if="stage.interactive === 'serverLab'" class="interactive">
                  <h3 class="subh">Зачем отдельный сервер</h3>
                  <p class="hint">
                    Приложение на телефоне в основном показывает картинку. А вот «кто это и что ему можно» и «что лежит в
                    базе» — решает программа на сервере: она не видна игроку, но именно она ходит в базу и шлёт ответ.
                  </p>
                  <p class="hint muted sm">
                    Справа два коротких примера. На каждом шаге выберите вариант, который логично продолжает цепочку; сбоку
                    появится простыми словами, что сделали с базой и что вернули в игру.
                  </p>
                </div>

                <div v-else-if="stage.interactive === 'clientLab'" class="interactive">
                  <h3 class="subh">Не только дизайн</h3>
                  <p class="hint">
                    Картинка без правильных данных бесполезна: нужно взять из ответа сервера те поля, которые там реально
                    есть, и не показывать экран раньше времени.
                  </p>
                  <p class="hint muted sm">
                    Справа — пример JSON и простые шаги на JavaScript. Выберите верные варианты: мини-экран станет зелёным
                    и покажет те же значения, что в примере.
                  </p>
                </div>

                <div v-else-if="stage.interactive === 'testLab'" class="interactive">
                  <h3 class="subh">Перед развёртыванием</h3>
                  <p class="hint">
                    Выкладка в интернет не исправляет логику и не дописывает интерфейс: она только публикует то, что уже
                    в сборке. Поэтому сначала прогоняют сценарии, экраны и код.
                  </p>
                  <p class="hint muted sm">
                    Справа — четыре вопроса и цепочка этапов проверки. Верный ответ добавляет фразу в «Запомнили» и
                    подсвечивает следующий шаг на схеме.
                  </p>
                </div>

                <div v-else-if="stage.interactive === 'deployLab'" class="interactive">
                  <h3 class="subh">Не только «у меня на ПК»</h3>
                  <p class="hint">
                    Чтобы другие люди скачали игру, одной сборки на своём компьютере мало: нужен общий проект (часто Git) и
                    способ выложить обновление в интернет без ручной возни каждый день.
                  </p>
                  <p class="hint muted sm">
                    Справа — вопросы по этапам и цепочка наверху. Ответили верно — загорается следующий этап и короткая
                    фраза в «Запомнили».
                  </p>
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
              <span class="pane-tab pane-tab-out">{{
                stage.kind === 'level' && stage.interactive === 'uxStudio'
                  ? 'Макет'
                  : stage.kind === 'level' && stage.interactive === 'erDomain'
                    ? 'ER‑чертёж'
                    : stage.kind === 'level' && stage.interactive === 'serverLab'
                      ? 'Сервер'
                      : stage.kind === 'level' && stage.interactive === 'clientLab'
                        ? 'Экран'
                        : stage.kind === 'level' && stage.interactive === 'testLab'
                          ? 'Проверки'
                          : stage.kind === 'level' && stage.interactive === 'deployLab'
                            ? 'Релиз'
                            : 'Просмотр'
              }}</span>
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
                  <p class="preview-section-title">Просмотр схемы</p>
                  <UserPathLifecycle
                    :picked="pathPicked"
                    :order="activePathScenario.order"
                    :transitions="activePathScenario.transitions ?? []"
                    :complete-ok="pathCorrect === true"
                    :complete-bad="pathCorrect === false"
                  />
                  <p v-if="pathCorrect === true" class="preview-status ok">Совпадает с ожидаемым жизненным циклом</p>
                  <p v-else-if="pathCorrect === false" class="preview-status bad">Цикл не совпадает с эталоном</p>
                </div>

                <ErDomainExplorer v-else-if="stage.interactive === 'erDomain'" :key="'er-' + stage.id" />

                <ServerBackendLab v-else-if="stage.interactive === 'serverLab'" :key="'srv-' + stage.id" />

                <ClientDataLab v-else-if="stage.interactive === 'clientLab'" :key="'cl-' + stage.id" />

                <TestingLab v-else-if="stage.interactive === 'testLab'" :key="'tl-' + stage.id" />

                <DeployLab v-else-if="stage.interactive === 'deployLab'" :key="'dp-' + stage.id" />

                <div v-else-if="stage.interactive === 'uxStudio'" class="preview-design-tools">
                  <p class="preview-section-title">Сборка карточки</p>
                  <p class="design-out-lead">
                    Ниже — живой макет и все настройки. Порядок блоков, палитра и шрифт сразу отражаются на превью.
                  </p>

                  <div class="design-preview-panel">
                    <DesignStudioPreview
                      :palette="activeDesignPalette"
                      :font-stack="activeDesignFont.stack"
                      :feedback="designFeedback"
                      :block-order="designBlockOrder"
                    />
                  </div>

                  <h4 class="design-subh design-subh-out">Порядок блоков</h4>
                  <p class="design-micro-hint">↑ ↓ — поменять местами соседние секции.</p>
                  <ol class="design-stack-list">
                    <li v-for="(bid, bi) in designBlockOrder" :key="bid" class="design-stack-row">
                      <span class="design-stack-n">{{ bi + 1 }}</span>
                      <span class="design-stack-label">{{ DESIGN_BLOCK_LABELS[bid] }}</span>
                      <span class="design-stack-actions">
                        <button
                          type="button"
                          class="btn ghost design-stack-btn"
                          :disabled="bi === 0"
                          aria-label="Выше"
                          @click="moveDesignBlock(bi, -1)"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          class="btn ghost design-stack-btn"
                          :disabled="bi === designBlockOrder.length - 1"
                          aria-label="Ниже"
                          @click="moveDesignBlock(bi, 1)"
                        >
                          ↓
                        </button>
                      </span>
                    </li>
                  </ol>

                  <h4 class="design-subh design-subh-out">Цветовая гамма</h4>
                  <div class="design-palettes design-palettes-out design-palettes-compact">
                    <button
                      v-for="p in DESIGN_PALETTES"
                      :key="p.id"
                      type="button"
                      class="design-palette-btn design-palette-btn-out design-palette-btn-compact"
                      :class="{ on: designPaletteId === p.id }"
                      @click="selectDesignPalette(p)"
                    >
                      <span class="design-palette-row">
                        <span class="design-swatches" aria-hidden="true">
                          <span class="design-swatch design-swatch-sm" :style="{ background: p.bg }" />
                          <span class="design-swatch design-swatch-sm" :style="{ background: p.surface }" />
                          <span class="design-swatch design-swatch-sm" :style="{ background: p.text }" />
                          <span class="design-swatch design-swatch-sm" :style="{ background: p.primary }" />
                        </span>
                        <span class="design-palette-text">
                          <span class="design-palette-name">{{ p.name }}</span>
                          <span class="design-palette-hint">{{ p.hint }}</span>
                        </span>
                      </span>
                    </button>
                  </div>

                  <h4 class="design-subh design-subh-out">Шрифт</h4>
                  <div class="design-fonts design-fonts-out design-fonts-compact">
                    <button
                      v-for="f in DESIGN_FONTS"
                      :key="f.id"
                      type="button"
                      class="design-font-btn design-font-btn-out design-font-btn-compact"
                      :class="{ on: designFontId === f.id }"
                      @click="selectDesignFont(f)"
                    >
                      <span class="design-font-name">{{ f.name }}</span>
                      <span class="design-font-hint">{{ f.hint }}</span>
                    </button>
                  </div>

                  <div class="row design-tools-actions">
                    <button type="button" class="btn primary" @click="runDesignCheck">Проверить</button>
                    <button type="button" class="btn ghost" @click="resetDesignStudio">Сбросить всё</button>
                  </div>

                  <div v-if="designFeedback" class="design-feedback design-feedback-out" :class="designFeedback.ok ? 'ok' : 'bad'">
                    <template v-if="designFeedback.ok">
                      <p class="design-fb-title">Интерфейс собран корректно</p>
                      <p class="design-fb-text">
                        Порядок блоков — как у типичной карточки товара. {{ designFeedback.okMessage }}
                      </p>
                      <ul class="design-ratios">
                        <li>Текст на карточке: {{ formatRatio(designFeedback.ratios.textOnCard) }}</li>
                        <li>Второстепенный текст: {{ formatRatio(designFeedback.ratios.mutedOnCard) }}</li>
                        <li>Текст на кнопке: {{ formatRatio(designFeedback.ratios.btn) }}</li>
                      </ul>
                    </template>
                    <template v-else>
                      <p class="design-fb-title">Нужны правки</p>
                      <ul class="design-issues">
                        <li v-for="(issue, di) in designFeedback.issues" :key="di">{{ issue }}</li>
                      </ul>
                      <p v-if="!designFeedback.paletteOk" class="design-fb-text muted sm">
                        Для контраста попробуйте «Тёмная нейтральная» или «Светлая „профи“».
                      </p>
                      <p v-if="designFeedback.paletteOk && !designFeedback.layoutOk" class="design-fb-text muted sm">
                        Цвета в порядке — осталось расставить блоки: контекст → название → описание → цена и кнопка.
                      </p>
                    </template>
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

.er-obs-list li {
  margin-bottom: 0.45rem;
}

.er-obs-list li:last-child {
  margin-bottom: 0;
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

.design-subh {
  margin: 1rem 0 0.45rem;
  font-size: 0.78rem;
  font-weight: 800;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.design-palettes {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.design-palette-btn {
  text-align: left;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: var(--surface2);
  color: var(--text);
  padding: 0.55rem 0.65rem;
  cursor: pointer;
  transition:
    border-color 0.15s,
    box-shadow 0.15s,
    transform 0.12s;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.design-palette-btn:hover {
  border-color: rgba(91, 140, 255, 0.45);
}

.design-palette-btn.on {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(91, 140, 255, 0.18);
}

.design-palette-name {
  font-weight: 800;
  font-size: 0.88rem;
}

.design-palette-hint {
  font-size: 0.78rem;
  color: var(--muted);
  line-height: 1.35;
}

.design-swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 0.3rem;
}

.design-swatch {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.15);
}

.design-fonts {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.design-font-btn {
  text-align: left;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: var(--surface2);
  color: var(--text);
  padding: 0.5rem 0.65rem;
  cursor: pointer;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.design-font-btn.on {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(91, 140, 255, 0.18);
}

.design-font-name {
  font-weight: 800;
  font-size: 0.85rem;
}

.design-font-hint {
  font-size: 0.76rem;
  color: var(--muted);
}

.design-feedback {
  margin-top: 1rem;
  padding: 0.75rem 0.9rem;
  border-radius: 12px;
  border: 1px solid transparent;
}

.design-feedback.ok {
  border-color: #86efac;
  background: rgba(22, 163, 74, 0.1);
}

.design-feedback.bad {
  border-color: #fecaca;
  background: rgba(254, 226, 226, 0.35);
}

.design-fb-title {
  margin: 0 0 0.45rem;
  font-weight: 800;
  font-size: 0.88rem;
  color: #0f172a;
}

.design-feedback.bad .design-fb-title {
  color: #991b1b;
}

.design-feedback.ok .design-fb-title {
  color: #14532d;
}

.design-fb-text {
  margin: 0;
  line-height: 1.45;
  font-size: 0.86rem;
}

.design-ratios,
.design-issues {
  margin: 0.45rem 0 0;
  padding-left: 1.15rem;
  font-size: 0.82rem;
  line-height: 1.45;
}

.design-preview-panel {
  margin-bottom: 1rem;
  padding: 0.75rem;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
}

.design-micro-hint {
  margin: 0 0 0.3rem;
  font-size: 0.68rem;
  color: #94a3b8;
  line-height: 1.3;
}

.design-stack-list {
  list-style: none;
  margin: 0 0 0.55rem;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.22rem;
}

.design-stack-row {
  display: grid;
  grid-template-columns: 1.25rem 1fr auto;
  align-items: center;
  gap: 0.3rem;
  padding: 0.22rem 0.38rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #fff;
}

.design-stack-n {
  font-size: 0.6rem;
  font-weight: 900;
  color: #94a3b8;
  text-align: center;
}

.design-stack-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.25;
}

.design-stack-actions {
  display: flex;
  gap: 0.08rem;
}

.design-stack-btn {
  padding: 0.08rem 0.22rem !important;
  min-width: 1.45rem;
  font-size: 0.65rem;
  line-height: 1.2;
}

.preview-design-tools {
  min-height: 220px;
}

.design-out-lead {
  margin: 0 0 1rem;
  font-size: 0.86rem;
  color: #64748b;
  line-height: 1.5;
}

.design-subh-out {
  margin-top: 0.55rem;
  margin-bottom: 0.22rem;
  font-size: 0.68rem;
  letter-spacing: 0.06em;
  color: #64748b;
}

.design-palettes-out,
.design-fonts-out {
  margin-bottom: 0.2rem;
}

.design-palette-btn-out,
.design-font-btn-out {
  border-color: #e2e8f0 !important;
  background: #f8fafc !important;
  color: #1e293b !important;
}

.design-palette-btn-out.on,
.design-font-btn-out.on {
  border-color: #5b8cff !important;
  background: #eff6ff !important;
}

.design-palette-btn-out .design-palette-hint,
.design-font-btn-out .design-font-hint {
  color: #64748b !important;
}

.design-palettes-compact {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.4rem;
}

@media (max-width: 520px) {
  .design-palettes-compact {
    grid-template-columns: 1fr;
  }
}

.design-palette-btn-compact {
  display: block;
  padding: 0.32rem 0.45rem !important;
  text-align: left;
}

.design-palette-row {
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
}

.design-palette-btn-compact .design-swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.design-swatch-sm {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  border: 1px solid rgba(0, 0, 0, 0.12);
}

.design-palette-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.08rem;
}

.design-palette-btn-compact .design-palette-name {
  font-size: 0.74rem !important;
  font-weight: 800;
  line-height: 1.2;
}

.design-palette-btn-compact .design-palette-hint {
  font-size: 0.62rem !important;
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.design-fonts-compact {
  display: flex;
  flex-wrap: wrap;
  gap: 0.22rem;
}

.design-font-btn-compact {
  flex: 1 1 calc(33.333% - 0.18rem);
  min-width: 4.6rem;
  padding: 0.22rem 0.32rem !important;
  border-radius: 8px !important;
  gap: 0.06rem !important;
}

.design-font-btn-compact .design-font-name {
  font-size: 0.66rem !important;
  line-height: 1.2;
}

.design-font-btn-compact .design-font-hint {
  font-size: 0.56rem !important;
  line-height: 1.2;
}

@media (max-width: 420px) {
  .design-font-btn-compact {
    flex: 1 1 100%;
  }
}

.design-tools-actions {
  margin-top: 1rem;
}

.design-feedback-out {
  margin-top: 1.1rem;
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
