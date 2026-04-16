/**
 * Уровень «Клиент» — короткие формулировки; код на простом JavaScript.
 */

export const CLIENT_SCENARIOS = [
  {
    id: 'profile',
    title: 'Профиль игрока',
    tag: 'ответ сервера уже пришёл',
    lead: 'Сервер прислал JSON с ником и опытом. Нужно не торопиться и не перепутать имена полей.',
    serverPayload: {
      nickname: 'Neo',
      xp: 42000,
      rank: 'Gold',
    },
    steps: [
      {
        title: '1. Пока данных нет',
        why: 'Пока переменная пустая, на экране лучше показать «загрузка», а не пустые поля.',
        choices: [
          {
            label: 'Сразу показать ник из profile',
            code: `// profile ещё null\nshowName(profile.nickname);`,
            correct: false,
            wrongHint: 'Получится undefined или пусто. Сначала ждём ответ.',
          },
          {
            label: 'Если profile ещё null — показать загрузку',
            code: `if (profile === null) {\n  showLoading();\n  return;\n}`,
            correct: true,
            wrongHint: '',
            effects: { waitUi: true },
          },
          {
            label: 'Показать выдуманного «Гостя»',
            code: `profile = { nickname: "Гость", xp: 0 };`,
            correct: false,
            wrongHint: 'Это не ответ сервера — игрок увидит неправду.',
          },
        ],
      },
      {
        title: '2. Откуда брать ник',
        why: 'В JSON ник лежит в поле nickname — нужно обращаться именно к нему.',
        choices: [
          {
            label: 'Взять profile.user.name',
            code: `const nick = profile.user.name;`,
            correct: false,
            wrongHint: 'В нашем ответе нет user — ник не найдётся.',
          },
          {
            label: 'Взять profile.nickname',
            code: `const nick = profile.nickname;`,
            correct: true,
            wrongHint: '',
            effects: { keysOk: true },
          },
          {
            label: 'Взять players[0].name',
            code: `const nick = players[0].name;`,
            correct: false,
            wrongHint: 'Сервер прислал один объект, а не список players.',
          },
        ],
      },
      {
        title: '3. Как показать опыт',
        why: 'Опыт — число. Не склеивайте его со строкой через + — получится каша.',
        choices: [
          {
            label: 'Склеить опыт и ранг через +',
            code: `const text = profile.xp + profile.rank;`,
            correct: false,
            wrongHint: 'В JavaScript число + строка склеится вроде «42000Gold».',
          },
          {
            label: 'Число с разделителями тысяч и запас по рангу',
            code: `const xpText = profile.xp.toLocaleString("ru-RU");\nconst rankText = profile.rank ?? "—";`,
            correct: true,
            wrongHint: '',
            effects: { formatOk: true },
          },
          {
            label: 'Вставить весь JSON текстом в блок',
            code: `card.textContent = JSON.stringify(profile);`,
            correct: false,
            wrongHint: 'Игрок увидит «сырую» строку, а не карточку.',
          },
        ],
      },
    ],
    doneSummary:
      'Сначала ждём данные, потом читаем те же поля, что в JSON, потом аккуратно выводим число. Так экран совпадает с сервером.',
  },
  {
    id: 'reward',
    title: 'Награда',
    tag: 'после нажатия «Забрать»',
    lead: 'В ответе есть статус, приз и баланс. Сначала смотрим статус — потом остальное.',
    serverPayload: {
      status: 'claimed',
      loot: { coins: 100, title: 'Сезонный сундук' },
      balance: 1500,
    },
    steps: [
      {
        title: '1. Статус в ответе',
        why: 'В теле ответа есть поле status. По нему понятно, выдали приз или нет.',
        choices: [
          {
            label: 'Сразу написать «Успех!»',
            code: `showSuccess("Награда твоя!");`,
            correct: false,
            wrongHint: 'А если сервер отказал? Сначала читают status.',
          },
          {
            label: 'Если не claimed — показать ошибку',
            code: `if (data.status !== "claimed") {\n  showError(data.status);\n  return;\n}`,
            correct: true,
            wrongHint: '',
            effects: { statusChecked: true },
          },
          {
            label: 'Смотреть только «ответ пришёл», без разбора',
            code: `if (ok) confetti();`,
            correct: false,
            wrongHint: 'Нужно заглянуть внутрь ответа и прочитать status.',
          },
        ],
      },
      {
        title: '2. Где баланс',
        why: 'Баланс в этом примере лежит прямо в data.balance.',
        choices: [
          {
            label: 'Взять data.wallet.money',
            code: `const b = data.wallet.money;`,
            correct: false,
            wrongHint: 'В JSON нет wallet — будет пусто.',
          },
          {
            label: 'Взять data.balance',
            code: `const b = data.balance;`,
            correct: true,
            wrongHint: '',
            effects: { balanceOk: true },
          },
          {
            label: 'Взять из localStorage',
            code: `const b = localStorage.getItem("balance");`,
            correct: false,
            wrongHint: 'После награды верят свежему ответу сервера, а не старой записи.',
          },
        ],
      },
      {
        title: '3. Приз внутри loot',
        why: 'Название и монеты лежат внутри объекта loot.',
        choices: [
          {
            label: 'Взять data.title',
            code: `const t = data.title;`,
            correct: false,
            wrongHint: 'У корня нет title — он внутри loot.',
          },
          {
            label: 'Взять data.loot.title и data.loot.coins',
            code: `const t = data.loot.title;\nconst c = data.loot.coins;`,
            correct: true,
            wrongHint: '',
            effects: { lootOk: true },
          },
          {
            label: 'Показать loot одной строкой',
            code: `text.textContent = String(data.loot);`,
            correct: false,
            wrongHint: 'Получится [object Object], а не название и число.',
          },
        ],
      },
    ],
    doneSummary:
      'Проверили status, взяли balance с корня и приз из loot — экран говорит то же, что и сервер.',
  },
]
