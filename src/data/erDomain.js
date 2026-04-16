/**
 * Предметная область: онлайн‑игра, где данные живут в БД между сессиями.
 * Исследователь фиксирует наблюдения → выделяет сущности и связи → ER‑чертёж.
 */

export const DOMAIN_OBSERVATIONS = [
  {
    id: 'n1',
    text: 'Учётная запись входит в игру; прогресс и валюта привязаны к аккаунту, а не к файлу на телефоне.',
  },
  {
    id: 'n2',
    text: 'У игрока может быть один или несколько персонажей; у каждого — свой уровень и набор квестов.',
  },
  {
    id: 'n3',
    text: 'Предметы (скины, ресурсы) лежат в инвентаре; количество и стаки нужно хранить отдельно от описания «что за предмет».',
  },
  {
    id: 'n4',
    text: 'Покупки в магазине и выдача наград должны оставлять след: сумма, время, идентификатор транзакции.',
  },
  {
    id: 'n5',
    text: 'Матч привязан к участникам и результату; без строк в БД нельзя честно восстановить рейтинг и споры.',
  },
]

/** Сущности ER (концептуальный уровень) */
export const ER_ENTITIES = [
  { id: 'player', label: 'Игрок', short: 'Игрок', note: 'аккаунт, аутентификация' },
  { id: 'character', label: 'Персонаж', short: 'Персонаж', note: 'прогресс, квесты' },
  { id: 'inventory', label: 'Инвентарь', short: 'Инвент.', note: 'контейнер предметов' },
  { id: 'item', label: 'Предмет', short: 'Предмет', note: 'каталог / тип' },
  { id: 'purchase', label: 'Покупка', short: 'Покупка', note: 'магазин, чек' },
  { id: 'match', label: 'Матч', short: 'Матч', note: 'раунд, рейтинг' },
]

/**
 * Связи (ребра). Ребро активируемо только если оба конца включены в модель.
 * cardinality — подпись на диаграмме.
 */
export const ER_RELATIONS = [
  {
    id: 'r_pc',
    from: 'player',
    to: 'character',
    cardinality: '1 : N',
    caption: 'у аккаунта — персонажи',
  },
  {
    id: 'r_ci',
    from: 'character',
    to: 'inventory',
    cardinality: '1 : 1',
    caption: 'у персонажа — свой инвентарь',
  },
  {
    id: 'r_iv',
    from: 'inventory',
    to: 'item',
    cardinality: '1 : N',
    caption: 'строки состава / стаки',
  },
  {
    id: 'r_pp',
    from: 'player',
    to: 'purchase',
    cardinality: '1 : N',
    caption: 'история покупок',
  },
  {
    id: 'r_pm',
    from: 'player',
    to: 'match',
    cardinality: 'N : M',
    caption: 'участие в матчах',
  },
]

/**
 * Связь между двумя узлами (порядок кликов при «рисовании» не важен).
 * @returns {typeof ER_RELATIONS[number] | null}
 */
export function findRelationBetween(a, b) {
  return (
    ER_RELATIONS.find(
      (r) => (r.from === a && r.to === b) || (r.from === b && r.to === a),
    ) ?? null
  )
}

/**
 * Можно ли добавить сущность на этом шаге (лестница: связь открывает следующий узел).
 * @param {string} entityId
 * @param {Iterable<string>} entityIds
 * @param {Iterable<string>} relationIds
 */
export function isEntityStageUnlocked(entityId, entityIds, relationIds) {
  const e = entityIds instanceof Set ? entityIds : new Set(entityIds)
  const r = relationIds instanceof Set ? relationIds : new Set(relationIds)
  if (entityId === 'player') return true
  if (entityId === 'character') return e.has('player')
  if (entityId === 'inventory') return r.has('r_pc')
  if (entityId === 'item') return r.has('r_ci')
  if (entityId === 'purchase' || entityId === 'match') return r.has('r_iv')
  return false
}

/**
 * Убрать «висячие» связи и сущности, которые больше не допустимы правилами этапов.
 */
export function reconcileErSelection(entityIds, relationIds) {
  let ent = new Set(entityIds)
  let rel = new Set(relationIds)
  let changed = true
  while (changed) {
    changed = false
    for (const rid of [...rel]) {
      const row = ER_RELATIONS.find((x) => x.id === rid)
      if (!row || !ent.has(row.from) || !ent.has(row.to)) {
        rel.delete(rid)
        changed = true
      }
    }
    for (const id of [...ent]) {
      if (!isEntityStageUnlocked(id, ent, rel)) {
        ent.delete(id)
        changed = true
      }
    }
  }
  const entitiesOrdered = ER_ENTITIES.map((x) => x.id).filter((id) => ent.has(id))
  return { entities: entitiesOrdered, relations: [...rel] }
}

/** Минимально осмысленная «память прогресса и состава» */
const REQUIRED_ENTITIES = new Set(['player', 'character', 'inventory', 'item'])
const REQUIRED_RELATIONS = new Set(['r_pc', 'r_ci', 'r_iv'])

export function evaluateErModel(selectedEntities, selectedRelations) {
  const ent = new Set(selectedEntities)
  const rel = new Set(selectedRelations)

  const missingEnt = [...REQUIRED_ENTITIES].filter((id) => !ent.has(id))
  const missingRel = [...REQUIRED_RELATIONS].filter((id) => !rel.has(id))

  const issues = []
  for (const id of missingEnt) {
    const e = ER_ENTITIES.find((x) => x.id === id)
    issues.push(`Не хватает сущности «${e?.label ?? id}» — по полю заметок она нужна для целостной картины.`)
  }
  for (const id of missingRel) {
    const r = ER_RELATIONS.find((x) => x.id === id)
    issues.push(
      `Не отмечена связь «${r?.caption ?? id}» (${r?.from ?? ''} → ${r?.to ?? ''}) — без неё модель не закрывает хранение прогресса и инвентаря.`,
    )
  }

  const ok = issues.length === 0

  return {
    ok,
    issues,
    okMessage:
      'Базовая ER‑связка замкнута: игрок → персонаж → инвентарь → предметы. Так в БД можно честно хранить прогресс и состав между сессиями. Дополнительные сущности (покупки, матчи) расширяют модель экономики и PvP.',
  }
}

/** Координаты на SVG (viewBox 0 0 420 168) */
export const ER_LAYOUT = {
  player: { x: 16, y: 96, w: 76, h: 46 },
  character: { x: 118, y: 96, w: 82, h: 46 },
  inventory: { x: 228, y: 96, w: 82, h: 46 },
  item: { x: 338, y: 96, w: 70, h: 46 },
  purchase: { x: 16, y: 22, w: 76, h: 42 },
  match: { x: 310, y: 22, w: 94, h: 42 },
}

export function entityCenter(id) {
  const b = ER_LAYOUT[id]
  if (!b) return { x: 0, y: 0 }
  return { x: b.x + b.w / 2, y: b.y + b.h / 2 }
}
