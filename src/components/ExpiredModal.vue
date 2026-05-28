<template>
  <transition name="modal-fade">
    <div
      v-if="show"
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      @click.self="handleClose"
    >
      <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border-4 border-red-500 animate-pulse-border">
        <!-- Header -->
        <div class="bg-gradient-to-r from-red-600 via-orange-600 to-red-600 p-6 text-center relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-r from-red-400/30 to-orange-400/30 animate-pulse"></div>
          <div class="relative">
            <div class="text-6xl mb-3 animate-bounce">🚨</div>
            <h2 class="text-3xl font-black text-white drop-shadow-lg mb-2">
              VIP หมดอายุแล้ว!
            </h2>
            <p class="text-red-100 text-sm font-medium">
              Trial VIP 30 วันของคุณสิ้นสุดแล้ว
            </p>
          </div>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-4">
          <!-- Message -->
          <div class="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4">
            <p class="text-gray-800 dark:text-gray-100 font-bold text-center mb-2">
              ⚠️ FREE 30 วันของคุณหมดอายุแล้ว
            </p>
            <p class="text-gray-600 dark:text-gray-300 text-sm text-center">
              แอด Line และชำระเงิน <span class="font-black text-red-600 dark:text-red-400 text-lg">599 บาท</span>
              เพื่อใช้งาน PRO VIP ต่ออีก 30 วัน
            </p>
          </div>

          <!-- LINE QR Code -->
          <div class="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 border-2 border-green-300 dark:border-green-700">
            <h3 class="font-bold text-gray-800 dark:text-gray-100 mb-3 text-center flex items-center justify-center gap-2">
              <span class="text-2xl">💚</span>
              <span>แอด LINE เพื่อชำระเงิน</span>
            </h3>
            <div class="flex flex-col items-center gap-3">
              <!-- QR Code Image -->
              <div class="bg-white p-3 rounded-xl shadow-lg">
                <img
                  src="/images/line-qr.jpeg"
                  alt="LINE QR Code"
                  class="w-48 h-48 object-contain rounded-lg"
                />
              </div>
              <p class="text-xs text-gray-600 dark:text-gray-300 text-center">
                สแกน QR Code หรือคลิกปุ่มด้านล่างเพื่อแอด LINE
              </p>
            </div>
          </div>

          <!-- Features List -->
          <div class="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-xl p-4">
            <h3 class="font-bold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
              <span class="text-xl">✨</span>
              <span>ฟีเจอร์ VIP ที่คุณจะได้รับ:</span>
            </h3>
            <ul class="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li class="flex items-start gap-2">
                <span class="text-green-500 mt-0.5">✓</span>
                <span>การพยากรณ์ขั้นสูง AI</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-green-500 mt-0.5">✓</span>
                <span>ดูสถิติย้อนหลังไม่จำกัด</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-green-500 mt-0.5">✓</span>
                <span>วิเคราะห์ฝัน & สูตรหวย</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-green-500 mt-0.5">✓</span>
                <span>บันทึกเลขซื้อไม่จำกัด</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-green-500 mt-0.5">✓</span>
                <span>ไม่มีโฆษณา</span>
              </li>
            </ul>
          </div>

          <!-- Price Box -->
          <div class="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-4 text-center shadow-lg">
            <p class="text-white text-sm font-bold mb-1">ราคาเพียง</p>
            <p class="text-white text-5xl font-black drop-shadow-lg">599฿</p>
            <p class="text-yellow-100 text-xs mt-1">/ 30 วัน</p>
          </div>

          <!-- Buttons -->
          <div class="space-y-3 pt-2">
            <!-- Add Line Button (Primary) -->
            <a
              href="https://line.me/R/"
              target="_blank"
              class="w-full py-4 bg-gradient-to-r from-green-500 via-green-600 to-green-500 hover:from-green-600 hover:via-green-700 hover:to-green-600 text-white rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 relative overflow-hidden group"
            >
              <span class="absolute inset-0 bg-gradient-to-r from-green-400/30 to-green-500/30 opacity-0 group-hover:opacity-100 transition-opacity"></span>
              <span class="text-2xl relative z-10">💚</span>
              <span class="relative z-10">แอด LINE เพื่อชำระเงิน</span>
            </a>

            <button
              v-if="canClose"
              @click="handleClose"
              class="w-full py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold rounded-xl transition-all"
            >
              ปิดหน้าต่าง (จะใช้งานฟีเจอร์ VIP ไม่ได้)
            </button>
          </div>

          <!-- Payment Instructions -->
          <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg p-3">
            <p class="text-blue-800 dark:text-blue-200 text-xs text-center font-medium">
              ℹ️ แอด LINE แล้วแจ้งต้องการต่ออายุ PRO VIP 599 บาท<br/>
              ชำระเงินผ่าน QR Code และส่งสลิปยืนยัน
            </p>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
interface Props {
  show: boolean
  canClose?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  canClose: true
})

const emit = defineEmits<{
  (e: 'close'): void
}>()

const handleClose = () => {
  if (props.canClose) {
    emit('close')
  }
}
</script>

<style scoped>
/* Modal Transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active > div,
.modal-fade-leave-active > div {
  transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55), opacity 0.3s ease;
}

.modal-fade-enter-from > div,
.modal-fade-leave-to > div {
  transform: scale(0.8);
  opacity: 0;
}

/* Pulsing Border Animation */
@keyframes pulse-border {
  0%,
  100% {
    border-color: rgb(239, 68, 68);
    box-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
  }
  50% {
    border-color: rgb(251, 146, 60);
    box-shadow: 0 0 40px rgba(251, 146, 60, 0.8);
  }
}

.animate-pulse-border {
  animation: pulse-border 2s ease-in-out infinite;
}
</style>
