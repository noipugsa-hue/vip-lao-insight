<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(() => {
  router.push('/home')
})
</script>

<template>
  <div class="min-h-screen bg-green-900 text-yellow-400 flex items-center justify-center text-3xl font-bold">
    VIP Lao Insight พร้อมใช้งาน 🚀
  </div>
</template>