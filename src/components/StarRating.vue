<template>
  <div class="flex items-center gap-1">
    <button
      v-for="star in 5"
      :key="star"
      type="button"
      :disabled="readonly"
      :class="[
        'transition-all duration-200',
        readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110',
        size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-3xl' : 'text-2xl',
      ]"
      @click="!readonly && $emit('update:modelValue', star)"
    >
      <span
        :class="[
          star <= Math.floor(modelValue)
            ? 'text-yellow-400'
            : star === Math.ceil(modelValue) && modelValue % 1 !== 0
            ? 'text-yellow-400'
            : 'text-gray-300 dark:text-gray-600',
        ]"
      >
        {{
          star <= Math.floor(modelValue)
            ? '★'
            : star === Math.ceil(modelValue) && modelValue % 1 !== 0
            ? '★'
            : '☆'
        }}
      </span>
    </button>

    <span
      v-if="showValue"
      :class="[
        'ml-2 font-semibold',
        size === 'sm' ? 'text-sm' : 'text-base',
        'text-gray-700 dark:text-gray-300',
      ]"
    >
      {{ modelValue.toFixed(1) }}
    </span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: number
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
}

withDefaults(defineProps<Props>(), {
  readonly: false,
  size: 'md',
  showValue: false,
})

defineEmits<{
  'update:modelValue': [value: number]
}>()
</script>
