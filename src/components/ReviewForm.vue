<template>
  <!-- Modal Overlay -->
  <Transition name="modal">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      @click.self="$emit('close')"
    >
      <!-- Modal Content -->
      <div
        class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700"
      >
        <!-- Header -->
        <div
          class="sticky top-0 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 px-6 py-4 rounded-t-2xl"
        >
          <div class="flex items-center justify-between">
            <h2 class="text-2xl font-bold text-white flex items-center gap-2">
              <span>⭐</span>
              <span>{{ mode === 'edit' ? 'แก้ไขรีวิว' : 'เขียนรีวิว' }}</span>
            </h2>
            <button
              @click="$emit('close')"
              class="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            >
              <span class="text-2xl">×</span>
            </button>
          </div>
        </div>

        <!-- Form Body -->
        <div class="p-6 space-y-6">
          <!-- Rating Section -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              ให้คะแนน <span class="text-red-500">*</span>
            </label>
            <div class="flex items-center gap-4">
              <StarRating v-model="rating" size="lg" />
              <span class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ rating }}.0
              </span>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {{ getRatingText(rating) }}
            </p>
          </div>

          <!-- Review Text Section -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              เขียนรีวิว <span class="text-red-500">*</span>
            </label>
            <textarea
              v-model="reviewText"
              rows="6"
              class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
              placeholder="แบ่งปันประสบการณ์การใช้งานแอปของคุณ..."
              maxlength="1000"
            ></textarea>
            <div class="flex justify-between items-center mt-2">
              <p class="text-sm text-gray-500 dark:text-gray-400">
                กรุณาเขียนรีวิวอย่างน้อย 10 ตัวอักษร
              </p>
              <p
                :class="[
                  'text-sm',
                  reviewText.length > 900
                    ? 'text-red-500'
                    : 'text-gray-500 dark:text-gray-400',
                ]"
              >
                {{ reviewText.length }}/1000
              </p>
            </div>
          </div>

          <!-- Error Message -->
          <div
            v-if="errorMessage"
            class="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-lg"
          >
            <p class="text-red-700 dark:text-red-400 flex items-center gap-2">
              <span>⚠️</span>
              <span>{{ errorMessage }}</span>
            </p>
          </div>
        </div>

        <!-- Footer Actions -->
        <div
          class="sticky bottom-0 bg-gray-50 dark:bg-gray-900 px-6 py-4 rounded-b-2xl flex gap-3"
        >
          <button
            @click="$emit('close')"
            class="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
          >
            ยกเลิก
          </button>
          <button
            @click="handleSubmit"
            :disabled="!isValid || submitting"
            :class="[
              'flex-1 px-6 py-3 rounded-xl font-semibold transition-all',
              isValid && !submitting
                ? 'bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 text-white hover:shadow-lg hover:scale-105'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed',
            ]"
          >
            <span v-if="submitting">กำลังบันทึก...</span>
            <span v-else>{{ mode === 'edit' ? 'บันทึกการแก้ไข' : 'เขียนรีวิว' }}</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  isOpen: boolean
  mode?: 'add' | 'edit'
  initialRating?: number
  initialReview?: string
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'add',
  initialRating: 5,
  initialReview: '',
})

const emit = defineEmits<{
  close: []
  submit: [rating: number, review: string]
}>()

const rating = ref(props.initialRating)
const reviewText = ref(props.initialReview)
const errorMessage = ref('')
const submitting = ref(false)

// Watch for prop changes (when editing)
watch(
  () => [props.initialRating, props.initialReview, props.isOpen],
  () => {
    if (props.isOpen) {
      rating.value = props.initialRating
      reviewText.value = props.initialReview
      errorMessage.value = ''
      submitting.value = false
    }
  }
)

const isValid = computed(() => {
  return rating.value >= 1 && rating.value <= 5 && reviewText.value.trim().length >= 10
})

function getRatingText(rating: number): string {
  const texts = {
    1: '😞 ไม่พอใจมาก',
    2: '😕 ไม่ค่อยพอใจ',
    3: '😐 พอใช้ได้',
    4: '😊 ดีมาก',
    5: '🤩 ยอดเยี่ยม!',
  }
  return texts[rating as keyof typeof texts] || ''
}

async function handleSubmit() {
  if (!isValid.value) {
    errorMessage.value = 'กรุณากรอกข้อมูลให้ครบถ้วน (รีวิวอย่างน้อย 10 ตัวอักษร)'
    return
  }

  submitting.value = true
  errorMessage.value = ''

  try {
    emit('submit', rating.value, reviewText.value.trim())
  } catch (err) {
    errorMessage.value = 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
    submitting.value = false
  }
}
</script>

<style scoped>
/* Modal transition animations */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 0.3s ease;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.9);
}
</style>
