<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click="handleBackdropClick"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

        <!-- Modal Content -->
        <div
          class="relative w-full max-w-md max-h-[80vh] bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl shadow-2xl overflow-hidden"
          @click.stop
        >
          <!-- Header -->
          <div class="sticky top-0 bg-gray-800/95 backdrop-blur-sm px-6 py-4 border-b border-gray-700">
            <h2 class="text-xl font-bold text-center text-white">
              -- เลือกประเภทหวย --
            </h2>
          </div>

          <!-- Lottery Type List -->
          <div class="overflow-y-auto max-h-[calc(80vh-80px)] px-4 py-3">
            <button
              v-for="type in lotteryTypes"
              :key="type.id"
              class="w-full text-left px-6 py-4 mb-2 rounded-xl transition-all duration-200"
              :class="[
                selectedLotteryType.id === type.id
                  ? 'bg-gradient-to-r from-green-700 to-green-800 text-white shadow-lg'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-white'
              ]"
              @click="selectType(type)"
            >
              <div class="flex items-center justify-between">
                <span class="text-lg font-medium">{{ type.displayName }}</span>
                <span
                  v-if="selectedLotteryType.id === type.id"
                  class="text-2xl"
                >
                  ✓
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useLotteryType, type LotteryType } from '~/composables/useLotteryType'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  close: []
  select: [type: LotteryType]
}>()

const { lotteryTypes, selectedLotteryType, setLotteryType } = useLotteryType()

const selectType = (type: LotteryType) => {
  setLotteryType(type)
  emit('select', type)
  emit('close')
}

const handleBackdropClick = () => {
  emit('close')
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.3s ease;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.9);
}
</style>
