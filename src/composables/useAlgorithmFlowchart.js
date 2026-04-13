import { ref, watch, computed, unref } from 'vue'

/**
 * @param {import('vue').Ref | import('vue').ComputedRef | (() => object | null)} scenarioRef
 */
export function useAlgorithmFlowchart(scenarioRef) {
  const currentId = ref(null)
  const blocks = ref([])
  const orphanSummary = ref([])
  const reachedEnd = ref(false)

  const scenario = computed(() => {
    const s = typeof scenarioRef === 'function' ? scenarioRef() : unref(scenarioRef)
    return s && s.nodes && s.start ? s : null
  })

  function reset() {
    const sc = scenario.value
    if (!sc) {
      currentId.value = null
      blocks.value = []
      orphanSummary.value = []
      reachedEnd.value = false
      return
    }
    currentId.value = sc.start ?? null
    blocks.value = []
    orphanSummary.value = []
    reachedEnd.value = false
  }

  watch(
    () => scenario.value?.id,
    () => reset(),
    { immediate: true },
  )

  const nodes = computed(() => scenario.value?.nodes ?? {})

  const currentNode = computed(() => {
    if (reachedEnd.value || !currentId.value) return null
    return nodes.value[currentId.value] ?? null
  })

  const isDone = computed(() => reachedEnd.value)

  function advanceTo(nextId) {
    const n = nextId ? nodes.value[nextId] : null
    if (!nextId || nextId === 'end' || n?.type === 'end') {
      currentId.value = null
      reachedEnd.value = true
      return
    }
    currentId.value = nextId
  }

  function correctActionNext(node) {
    const ok = node.options?.find((o) => o.correct)
    return ok?.next ?? null
  }

  function chooseAction(opt) {
    if (reachedEnd.value) return
    const node = currentNode.value
    if (!node || node.type !== 'action') return

    if (opt.correct) {
      blocks.value = [
        ...blocks.value,
        {
          kind: 'process',
          text: opt.blockLabel ?? opt.text,
          image: node.image,
          alt: node.imageAlt ?? '',
          bad: false,
        },
      ]
      advanceTo(opt.next)
    } else {
      const nextId = correctActionNext(node)
      const hint = opt.wrongHint ?? 'Шаг не подходит к логике сценария.'
      const orphan = {
        kind: 'process',
        text: opt.text,
        blockLabel: opt.blockLabel ?? opt.text,
        hint,
        image: node.image,
        alt: node.imageAlt ?? '',
        prompt: node.prompt,
      }
      blocks.value = [
        ...blocks.value,
        {
          kind: 'process',
          text: opt.text,
          image: node.image,
          alt: node.imageAlt ?? '',
          bad: true,
          hint,
        },
      ]
      orphanSummary.value = [...orphanSummary.value, orphan]
      if (nextId) advanceTo(nextId)
      else reachedEnd.value = true
    }
  }

  function chooseBranch(br) {
    if (reachedEnd.value) return
    const node = currentNode.value
    if (!node || node.type !== 'decision') return

    if (br.fail) {
      const orphan = {
        kind: 'badBranch',
        condition: node.prompt,
        branchText: br.text,
        edgeLabel: br.edgeLabel ?? br.text,
        hint: br.wrongHint ?? 'Ветка недопустима.',
        image: node.image,
        alt: node.imageAlt ?? '',
      }
      blocks.value = [
        ...blocks.value,
        {
          kind: 'decision',
          condition: node.prompt,
          edgeLabel: br.edgeLabel ?? br.text,
          branchText: br.text,
          image: node.image,
          alt: node.imageAlt ?? '',
          branches: node.branches,
          chosenKey: br.edgeLabel ?? br.text,
          bad: true,
        },
      ]
      orphanSummary.value = [...orphanSummary.value, orphan]
      advanceTo('end')
      return
    }

    blocks.value = [
      ...blocks.value,
      {
        kind: 'decision',
        condition: node.prompt,
        edgeLabel: br.edgeLabel ?? br.text,
        branchText: br.text,
        image: node.image,
        alt: node.imageAlt ?? '',
        branches: node.branches,
        chosenKey: br.edgeLabel ?? br.text,
        bad: false,
      },
    ]
    advanceTo(br.next)
  }

  function orderedBranches(branches) {
    if (!branches?.length) return []
    const lower = (s) => String(s).toLowerCase()
    const score = (b) => {
      const e = lower(b.edgeLabel ?? '')
      const t = lower(b.text)
      if (e === 'да' || e === 'yes' || t.startsWith('да')) return 0
      if (e === 'нет' || e === 'no' || t.startsWith('нет')) return 2
      return 1
    }
    return [...branches].sort((a, b) => score(a) - score(b))
  }

  return {
    scenario,
    currentId,
    blocks,
    orphanSummary,
    reachedEnd,
    nodes,
    currentNode,
    isDone,
    chooseAction,
    chooseBranch,
    orderedBranches,
    reset,
  }
}
