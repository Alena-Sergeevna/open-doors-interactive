<script setup>
import { computed, unref } from 'vue'

const props = defineProps({
  api: { type: Object, required: true },
})

/* Вложенные ref/computed в объекте api во вложенном компоненте не разворачиваются — только через unref */
const scenario = computed(() => unref(props.api.scenario))
const isDone = computed(() => unref(props.api.isDone))
const currentNode = computed(() => unref(props.api.currentNode))
</script>

<template>
  <div v-if="scenario" class="fcp">
    <h3 class="fcp-title">Задание сценария</h3>
    <p class="fcp-task">{{ scenario.task }}</p>

    <template v-if="!isDone && currentNode?.type === 'action'">
      <figure v-if="currentNode.image" class="fcp-fig">
        <img
          class="fcp-img"
          :src="currentNode.image"
          :alt="currentNode.imageAlt || ''"
          width="96"
          height="96"
        />
      </figure>
      <p class="fcp-label">Шаг (процесс)</p>
      <p class="fcp-prompt">{{ currentNode.prompt }}</p>
      <p class="fcp-mini">Неверный вариант не останавливает сценарий — он попадёт в блок ошибок справа внизу.</p>
      <div class="fcp-actions">
        <button
          v-for="(opt, j) in currentNode.options"
          :key="j"
          type="button"
          class="fcp-opt"
          @click="api.chooseAction(opt)"
        >
          {{ opt.text }}
        </button>
      </div>
    </template>

    <template v-else-if="!isDone && currentNode?.type === 'decision'">
      <figure v-if="currentNode.image" class="fcp-fig">
        <img
          class="fcp-img"
          :src="currentNode.image"
          :alt="currentNode.imageAlt || ''"
          width="96"
          height="96"
        />
      </figure>
      <p class="fcp-label">Условие (if / else)</p>
      <p class="fcp-prompt">{{ currentNode.prompt }}</p>
      <p class="fcp-mini">Ветки «да» и «нет» — слева и справа. Результат увидите на схеме справа.</p>
      <div class="fcp-branch-btns">
        <button
          v-for="(br, j) in api.orderedBranches(currentNode.branches)"
          :key="j"
          type="button"
          class="fcp-opt fcp-opt-branch"
          @click="api.chooseBranch(br)"
        >
          <span class="fcp-branch-lab">{{ br.edgeLabel ?? 'Ветка' }}</span>
          <span class="fcp-branch-txt">{{ br.text }}</span>
        </button>
      </div>
    </template>

    <template v-else-if="isDone">
      <p class="fcp-done">Сценарий завершён. Итоговая схема и ошибки — в правой панели.</p>
    </template>

    <button type="button" class="fcp-reset" @click="api.reset">Собрать заново</button>
  </div>
</template>

<style scoped>
.fcp-title {
  margin: 0 0 0.5rem;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--muted, #8b93b8);
}

.fcp-task {
  font-size: 0.92rem;
  line-height: 1.55;
  margin: 0 0 1rem;
}

.fcp-label {
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #ffb84d;
  margin: 0 0 0.35rem;
}

.fcp-prompt {
  font-weight: 700;
  margin: 0 0 0.5rem;
  font-size: 0.98rem;
  line-height: 1.35;
}

.fcp-mini {
  font-size: 0.8rem;
  color: var(--muted, #8b93b8);
  line-height: 1.45;
  margin: 0 0 0.85rem;
}

.fcp-done {
  font-size: 0.9rem;
  color: var(--success, #3dd68c);
  line-height: 1.5;
  margin: 0 0 1rem;
}

.fcp-fig {
  margin: 0 0 0.65rem;
  padding: 0;
}

.fcp-img {
  display: block;
  width: 96px;
  height: 96px;
  object-fit: contain;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.fcp-actions {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.fcp-branch-btns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem;
}

@media (max-width: 520px) {
  .fcp-branch-btns {
    grid-template-columns: 1fr;
  }
}

.fcp-opt {
  width: 100%;
  text-align: left;
  padding: 0.65rem 0.85rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: var(--surface2, #1e2540);
  color: var(--text, #e8ecff);
  font-size: 0.86rem;
  line-height: 1.35;
  cursor: pointer;
  transition:
    border-color 0.15s,
    transform 0.15s;
}

.fcp-opt:hover {
  border-color: rgba(91, 140, 255, 0.55);
  transform: translateY(-1px);
}

.fcp-opt-branch {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.3rem;
  border-color: rgba(255, 184, 77, 0.3);
  min-height: 100%;
}

.fcp-opt-branch:hover {
  border-color: rgba(255, 184, 77, 0.65);
}

.fcp-branch-lab {
  font-size: 0.72rem;
  font-weight: 800;
  color: #ffb84d;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.fcp-branch-txt {
  font-size: 0.84rem;
}

.fcp-reset {
  margin-top: 1rem;
  font-size: 0.85rem;
  padding: 0.45rem 0.9rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: transparent;
  color: var(--muted, #8b93b8);
  cursor: pointer;
}

.fcp-reset:hover {
  color: var(--text, #e8ecff);
  border-color: rgba(255, 255, 255, 0.28);
}
</style>
