/**
 * Уровень «Сервер»: пояснения по-русски, фрагменты кода — как в Python 3.
 */

export const SERVER_SCENARIOS = [
  {
    id: 'profile',
    title: 'Показать профиль игрока',
    tag: 'как запрос «мой профиль»',
    lead:
      'Игрок открыл экран с ником и уровнем. Эти цифры лежат в базе. Сервер должен отдать именно его данные — не чужие.',
    steps: [
      {
        title: 'Шаг 1. Узнать, кто это',
        why:
          'Телефон нельзя считать «паспортом»: в запрос можно написать что угодно. Поэтому сервер смотрит на вход по учётной записи (например, токен в заголовке), а не на произвольный текст из тела.',
        choices: [
          {
            label: 'Взять ник из тела запроса и по нему искать игрока',
            code: `body = await read_json(request)\n# trusting the client — unsafe\nplayer_id = await db.lookup_player_by_nickname(body["nickname"])`,
            correct: false,
            wrongHint: 'Так можно подставить чужой ник. Номер игрока для базы должен прийти из проверенного входа.',
          },
          {
            label: 'Проверить вход и получить номер игрока из сессии',
            code: `session = await require_session(request.headers)\nplayer_id = session.player_id`,
            correct: true,
            wrongHint: '',
            log: {
              kind: 'auth',
              title: 'Вход проверен',
              lines: ['По заголовку с токеном поняли: это игрок № 42.', 'Дальше можно безопасно лезть в базу за его строкой.'],
            },
          },
          {
            label: 'Взять номер игрока из адреса страницы ?id=…',
            code: `# query string is user-controlled\nplayer_id = int(request.query_params["id"])`,
            correct: false,
            wrongHint: 'Любой может поменять число в адресе. Это не защита.',
          },
        ],
      },
      {
        title: 'Шаг 2. Взять строку из базы',
        why:
          'Ник и уровень хранятся в таблице. Сервер посылает базе запрос «дай одну строку для этого id» — это и есть «забрали данные из БД».',
        choices: [
          {
            label: 'Взять любую первую строку из таблицы игроков',
            code: `row = await db.fetch_one("SELECT nickname, rank FROM players LIMIT 1")`,
            correct: false,
            wrongHint: 'Так можно показать чужой профиль. Нужна выборка именно по id из шага 1.',
          },
          {
            label: 'Запрос по id игрока (одна строка)',
            code: `row = await db.fetch_one(\n    """\n    SELECT nickname, xp, rank\n    FROM players\n    WHERE id = %s\n    """,\n    (player_id,),\n)`,
            correct: true,
            wrongHint: '',
            log: {
              kind: 'db',
              title: 'База ответила',
              lines: [
                'Запрос: дай ник, опыт и ранг для id = 42.',
                'Ответ: одна строка — например ник «Neo», ранг «Gold».',
              ],
            },
          },
          {
            label: 'Спросить у случайного другого игрока в чате',
            code: `row = await gossip.ask_random_peer("profile")`,
            correct: false,
            wrongHint: 'В игре «правда» о прогрессе хранится в базе на сервере, а не у случайного человека.',
          },
        ],
      },
      {
        title: 'Шаг 3. Отправить ответ в игру',
        why:
          'Приложению удобно получить короткий текст в стандартном формате (JSON). Сложные внутренности базы наружу не отдают.',
        choices: [
          {
            label: 'Отправить сырой текст запроса к базе',
            code: `return Response(status_code=200, content=str(row), media_type="text/plain")`,
            correct: false,
            wrongHint: 'Игре не нужен «внутренний язык» базы — нужны простые поля: ник, уровень и т.д.',
          },
          {
            label: 'Отправить JSON с полями для экрана',
            code: `return {\n    "nickname": row.nickname,\n    "xp": row.xp,\n    "rank": row.rank,\n}`,
            correct: true,
            wrongHint: '',
            log: {
              kind: 'http',
              title: 'Ответ в приложение',
              lines: ['Код 200 — всё хорошо.', 'В теле — JSON, который следующий уровень нарисует на экране.'],
            },
          },
          {
            label: 'Только записать в журнал сервера и ничего не вернуть',
            code: `logger.info("profile", extra={"row": row})\nreturn Response(status_code=204)`,
            correct: false,
            wrongHint: 'Игра не получит данные, если сервер ничего не вернёт в ответ на запрос.',
          },
        ],
      },
    ],
    doneSummary:
      'Получилось три звена: узнали игрока по входу → прочитали его строку из базы → вернули JSON. Клиент потом только покажет эти поля на экране.',
  },
  {
    id: 'reward',
    title: 'Выдать награду за сезон',
    tag: 'как кнопка «Забрать»',
    lead:
      'Игрок нажал «Забрать награду». Если не записать это в базу, кнопку можно жать снова и снова. Сервер должен один раз зафиксировать выдачу.',
    steps: [
      {
        title: 'Шаг 1. Снова: кто нажал',
        why: 'Перед монетами и призами важно то же самое: не верить полю в запросе, а взять id из проверенного входа.',
        choices: [
          {
            label: 'Взять id игрока из JSON в теле запроса',
            code: `payload = await read_json(request)\nplayer_id = payload["player_id"]  # client-controlled`,
            correct: false,
            wrongHint: 'Телефон может прислать чужой номер. Для награды это опасно.',
          },
          {
            label: 'Проверить сессию и взять id оттуда',
            code: `session = await require_session(request.headers)\nplayer_id = session.player_id`,
            correct: true,
            wrongHint: '',
            log: {
              kind: 'auth',
              title: 'Кто получает награду',
              lines: ['Снова: это игрок № 42.', 'Только после этого можно проверять условия и писать в базу.'],
            },
          },
          {
            label: 'Угадать игрока по IP-адресу',
            code: `player_id = await guess_player_from_ip(request.client.host)`,
            correct: false,
            wrongHint: 'По одному IP нельзя надёжно понять аккаунт.',
          },
        ],
      },
      {
        title: 'Шаг 2. Проверить и записать в базу',
        why:
          'Нужно сделать два действия подряд без дырки посередине: «уже забирали?» — если нет, записать факт выдачи. Иначе двойной клик даст двойную награду.',
        choices: [
          {
            label: 'Только показать всплывающее «Получено!»',
            code: `await push_toast(player_id, "Reward claimed!")`,
            correct: false,
            wrongHint: 'Картинка без записи в базу не остановит повторный забор.',
          },
          {
            label: 'В одной «сделке» с базой: проверить и записать',
            code: `async with db.transaction() as tx:\n    if await tx.already_claimed(player_id, season_id):\n        raise HTTPException(status_code=409, detail="already claimed")\n    await tx.insert_reward_grant(player_id, season_id, loot)`,
            correct: true,
            wrongHint: '',
            log: {
              kind: 'db',
              title: 'База: запись',
              lines: [
                'Начали сделку.',
                'Проверили: записи ещё нет.',
                'Добавили строку «награда выдана» и зафиксировали.',
              ],
            },
          },
          {
            label: 'Записать только в быструю память (кэш), не в основную базу',
            code: `await redis.set(f"reward:{player_id}", "ok", ex=3600)`,
            correct: false,
            wrongHint: 'Быстрая память может обнулиться. Важная награда должна остаться в основной базе.',
          },
        ],
      },
      {
        title: 'Шаг 3. Ответить игре',
        why: 'Чтобы обновить экран с монетами и текстом, приложению снова удобнее получить JSON с результатом.',
        choices: [
          {
            label: 'Просто перекинуть на главный экран без данных',
            code: `return RedirectResponse(url="/", status_code=301)`,
            correct: false,
            wrongHint: 'Приложению нужны поля ответа, а не только смена экрана.',
          },
          {
            label: 'Вернуть JSON: статус, приз и баланс',
            code: `return {\n    "status": "claimed",\n    "loot": loot,\n    "balance": await db.get_currency_balance(player_id),\n}`,
            correct: true,
            wrongHint: '',
            log: {
              kind: 'http',
              title: 'Ответ в приложение',
              lines: ['Код 200.', 'В JSON — что показать игроку и какие цифры обновить.'],
            },
          },
          {
            label: 'Отправить файл со всей таблицей наград',
            code: `return FileResponse(path=await db.dump_table_to_file("reward_grants"))`,
            correct: false,
            wrongHint: 'Игра ждёт маленький ответ по правилам API, а не огромный файл.',
          },
        ],
      },
    ],
    doneSummary:
      'Сервер проверил вход, записал награду в базу так, чтобы нельзя было забрать дважды, и вернул JSON. Анимации и кнопки — уже зона клиента.',
  },
]
