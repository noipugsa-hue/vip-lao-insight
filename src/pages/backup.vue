<script setup lang="ts">
import { ref } from 'vue'

const showSuccess = ref(false)

const exportData = () => {
  const data = {
    history: localStorage.getItem('vip_lao_history'),
    result: localStorage.getItem('vip_result'),
    engine: localStorage.getItem('engine_settings'),
    lottery: localStorage.getItem('selected_lottery_type')
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `lottoai-backup-${new Date().toISOString().split('T')[0]}.json`
  a.click()

  showSuccess.value = true
  setTimeout(() => showSuccess.value = false, 2000)
}

const importData = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string)
      if (data.history) localStorage.setItem('vip_lao_history', data.history)
      if (data.result) localStorage.setItem('vip_result', data.result)
      if (data.engine) localStorage.setItem('engine_settings', data.engine)
      if (data.lottery) localStorage.setItem('selected_lottery_type', data.lottery)

      showSuccess.value = true
      setTimeout(() => {
        showSuccess.value = false
        location.reload()
      }, 2000)
    } catch (error) {
      alert('ไฟล์ไม่ถูกต้อง')
    }
  }
  reader.readAsText(file)
}

const clearAll = () => {
  if (!confirm('ต้องการล้างข้อมูลทั้งหมดใช่หรือไม่?')) return
  localStorage.clear()
  location.reload()
}
</script>

<template>
  <NuxtLayout name="main">
    <div class="max-w-2xl mx-auto">
      <Transition name="fade">
        <div v-if="showSuccess" class="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-xl font-bold">
          ✓ สำเร็จ!
        </div>
      </Transition>

      <div class="text-center mb-6">
        <div class="text-5xl mb-3">💾</div>
        <h1 class="text-3xl font-bold text-gray-800 mb-2">สำรองและกลับคืนข้อมูล</h1>
      </div>

      <div class="space-y-4">
        <div class="bg-white/90 backdrop-blur rounded-2xl shadow-lg p-6">
          <h2 class="text-lg font-bold text-gray-800 mb-4">📥 นำเข้าข้อมูล</h2>
          <input type="file" accept=".json" @change="importData" class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl" />
        </div>

        <div class="bg-white/90 backdrop-blur rounded-2xl shadow-lg p-6">
          <h2 class="text-lg font-bold text-gray-800 mb-4">📤 ส่งออกข้อมูล</h2>
          <button @click="exportData" class="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold">
            ดาวน์โหลดไฟล์สำรอง
          </button>
        </div>

        <div class="bg-white/90 backdrop-blur rounded-2xl shadow-lg p-6">
          <h2 class="text-lg font-bold text-gray-800 mb-4">🗑️ ล้างข้อมูล</h2>
          <button @click="clearAll" class="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold">
            ล้างข้อมูลทั้งหมด
          </button>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
