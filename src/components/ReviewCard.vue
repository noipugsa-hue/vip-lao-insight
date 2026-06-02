<template>
  <div
    class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-100 dark:border-gray-700 h-full flex flex-col"
  >
    <!-- Header: User info and rating -->
    <div class="flex items-start justify-between mb-4">
      <div class="flex items-center gap-3 flex-1">
        <!-- User Avatar -->
        <div
          class="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl shadow-lg flex-shrink-0"
        >
          {{ getUserInitial(review.userName || review.userEmail) }}
        </div>

        <!-- User info -->
        <div class="flex-1 min-w-0">
          <h3 class="font-bold text-lg text-gray-900 dark:text-white truncate">
            {{ review.userName || getEmailUsername(review.userEmail) }}
          </h3>
          <div class="flex items-center gap-2 mt-1">
            <StarRating :model-value="review.rating" readonly size="sm" />
            <span class="text-xs text-gray-500 dark:text-gray-400">
              {{ formatDate(review.createdAt) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Action buttons (edit/delete) for own review ONLY -->
      <div v-if="isOwnReview" class="flex gap-2 flex-shrink-0 ml-2">
        <button
          @click="$emit('edit')"
          class="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
          title="แก้ไขรีวิว"
        >
          <span class="text-lg">✏️</span>
        </button>
        <button
          @click="$emit('delete')"
          class="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
          title="ลบรีวิว"
        >
          <span class="text-lg">🗑️</span>
        </button>
      </div>
    </div>

    <!-- Review text - flexible height -->
    <div class="flex-1 mb-4">
      <p class="text-gray-700 dark:text-gray-300 leading-relaxed text-base whitespace-pre-wrap break-words">
        {{ review.review }}
      </p>
    </div>

    <!-- Footer: Date and edited badge -->
    <div class="flex items-center justify-end text-xs text-gray-500 dark:text-gray-400 mt-auto pt-3 border-t border-gray-100 dark:border-gray-700">
      <span v-if="review.updatedAt > review.createdAt" class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
        แก้ไขแล้ว
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Review } from '~/composables/useReview'

interface Props {
  review: Review
  isOwnReview?: boolean
}

defineProps<Props>()

defineEmits<{
  edit: []
  delete: []
}>()

function getUserInitial(name: string): string {
  if (!name) return '?'
  const cleanName = name.split('@')[0]
  return cleanName.charAt(0).toUpperCase()
}

function getEmailUsername(email: string): string {
  return email.split('@')[0]
}

function formatDate(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return 'วันนี้'
  } else if (diffDays === 1) {
    return 'เมื่อวาน'
  } else if (diffDays < 7) {
    return `${diffDays} วันที่แล้ว`
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks} สัปดาห์ที่แล้ว`
  } else {
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }
}
</script>
