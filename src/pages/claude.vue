<script setup lang="ts">
import { ref } from 'vue'

const messages = ref<{role: string, text: string}[]>([])
const input = ref('')

const send = () => {
  if (!input.value.trim()) return

  messages.value.push({ role: 'user', text: input.value })

  setTimeout(() => {
    messages.value.push({
      role: 'ai',
      text: 'ขออภัย ฟีเจอร์ Claude AI ยังไม่เชื่อมต่อกับ API ค่ะ คุณสามารถใช้ฟีเจอร์อื่นๆ ได้เลย 😊'
    })
  }, 500)

  input.value = ''
}
</script>

<template>
  <NuxtLayout name="main">
    <div class="max-w-3xl mx-auto h-[70vh] flex flex-col">
      <div class="text-center mb-6">
        <div class="text-5xl mb-3">🤖</div>
        <h1 class="text-3xl font-bold text-gray-800 mb-2">Claude AI</h1>
      </div>

      <div class="flex-1 bg-white/90 rounded-2xl shadow-lg p-6 overflow-y-auto mb-4">
        <div v-for="(msg, i) in messages" :key="i" class="mb-4" :class="msg.role === 'user' ? 'text-right' : 'text-left'">
          <div class="inline-block px-4 py-2 rounded-xl" :class="msg.role === 'user' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-800'">
            {{ msg.text }}
          </div>
        </div>
        <div v-if="messages.length === 0" class="text-center text-gray-400 mt-12">
          <p>พิมพ์ข้อความเพื่อเริ่มสนทนา</p>
        </div>
      </div>

      <div class="flex gap-2">
        <input v-model="input" @keyup.enter="send" type="text" placeholder="พิมพ์ข้อความ..." class="flex-1 px-4 py-3 border-2 rounded-xl" />
        <button @click="send" class="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold">ส่ง</button>
      </div>
    </div>
  </NuxtLayout>
</template>
