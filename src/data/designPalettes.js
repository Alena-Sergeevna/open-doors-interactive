/** WCAG 2 relative luminance + contrast ratio */

function hexToRgb(hex) {
  const h = hex.replace('#', '').trim()
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  return {
    r: parseInt(full.slice(0, 2), 16) / 255,
    g: parseInt(full.slice(2, 4), 16) / 255,
    b: parseInt(full.slice(4, 6), 16) / 255,
  }
}

function lin(c) {
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

function lum(hex) {
  const { r, g, b } = hexToRgb(hex)
  const R = lin(r)
  const G = lin(g)
  const B = lin(b)
  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}

export function contrastRatio(fgHex, bgHex) {
  const L1 = lum(fgHex)
  const L2 = lum(bgHex)
  const hi = Math.max(L1, L2)
  const lo = Math.min(L1, L2)
  return (hi + 0.05) / (lo + 0.05)
}

export function formatRatio(r) {
  return `${r.toFixed(2)}:1`
}

/** Пороги как у WCAG AA: обычный текст 4.5:1, крупный/второстепенный UI 3:1 */
const AA_TEXT = 4.5
const AA_UI = 3

/**
 * @param {object} p
 * @param {{ id: string }} [font]
 */
export function evaluatePalette(p, font) {
  const textOnCard = contrastRatio(p.text, p.surface)
  const mutedOnCard = contrastRatio(p.muted, p.surface)
  const btn = contrastRatio(p.primaryText, p.primary)

  const issues = []
  if (textOnCard < AA_TEXT) {
    issues.push(`Основной текст на карточке: ${formatRatio(textOnCard)} — нужно ≥ ${AA_TEXT}:1 (читаемость).`)
  }
  if (mutedOnCard < AA_UI) {
    issues.push(`Второстепенный текст: ${formatRatio(mutedOnCard)} — нужно ≥ ${AA_UI}:1, иначе подписи «теряются».`)
  }
  if (btn < AA_TEXT) {
    issues.push(`Текст на кнопке: ${formatRatio(btn)} — нужно ≥ ${AA_TEXT}:1, иначе CTA не соответствует AA.`)
  }

  const fontNote =
    font && font.id === 'display'
      ? ' Декоративный шрифт всё же утяжеляет чтение длинных подписей — в продакшене чаще оставляют системный гротеск.'
      : ''

  const ok = issues.length === 0

  return {
    ok,
    ratios: {
      textOnCard,
      mutedOnCard,
      btn,
    },
    issues,
    okMessage:
      'Гамма держит контраст: основной текст, подпись и кнопка читаются на фоне (ориентир WCAG AA). Так меньше ошибок и жалоб на «не вижу цену».' +
      (ok ? fontNote : ''),
  }
}

/** Заранее заданные палитры (id → цвета макета) */
export const DESIGN_PALETTES = [
  {
    id: 'slate',
    name: 'Тёмная нейтральная',
    hint: 'Спокойный фон, светлый текст',
    bg: '#0f172a',
    surface: '#1e293b',
    text: '#f8fafc',
    muted: '#94a3b8',
    primary: '#1d4ed8',
    primaryText: '#ffffff',
  },
  {
    id: 'light-pro',
    name: 'Светлая «профи»',
    hint: 'Белая карточка, тёмный текст',
    bg: '#e2e8f0',
    surface: '#ffffff',
    text: '#0f172a',
    muted: '#64748b',
    primary: '#0f766e',
    primaryText: '#ffffff',
  },
  {
    id: 'candy-fail',
    name: 'Пастель «всё бледное»',
    hint: 'Похоже мягко, но контраст проседает',
    bg: '#fffbeb',
    surface: '#fef3c7',
    text: '#fde68a',
    muted: '#fcd34d',
    primary: '#fcd34d',
    primaryText: '#fef9c3',
  },
  {
    id: 'rage-fail',
    name: 'Агрессивный красный',
    hint: 'Красный фон + кнопка сливаются',
    bg: '#450a0a',
    surface: '#7f1d1d',
    text: '#fecaca',
    muted: '#f87171',
    primary: '#b91c1c',
    primaryText: '#fca5a5',
  },
]

export const DESIGN_FONTS = [
  {
    id: 'system',
    name: 'Системный UI',
    hint: 'Читаемо в интерфейсах',
    stack: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  },
  {
    id: 'readable',
    name: 'Гротеск',
    hint: 'Плотный, хорош для цен',
    stack: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  {
    id: 'display',
    name: 'Display / нарядный',
    hint: 'Часто плох для длинного текста',
    stack: 'Impact, "Arial Narrow", "Franklin Gothic Medium", sans-serif',
  },
]
