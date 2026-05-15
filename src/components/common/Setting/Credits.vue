<script lang="ts" setup>
import { computed, ref } from 'vue'
import { NButton, NInputNumber, NStatistic, NSpace, useMessage, NDivider, NProgress } from 'naive-ui'
import { useSettingStore } from '@/store'
import { SvgIcon } from '@/components/common'

const settingStore = useSettingStore()
const ms = useMessage()

// Daily Quota logic
const dailyMessageLimit = ref(settingStore.dailyMessageLimit)
const costPerMessage = ref(settingStore.costPerMessage)

const quotaPercentage = computed(() => {
  const percentage = (settingStore.usedCreditsToday / settingStore.dailyMessageLimit) * 100
  return Math.min(percentage, 100)
})

function updateLimits() {
  settingStore.updateSetting({
    dailyMessageLimit: dailyMessageLimit.value,
    costPerMessage: costPerMessage.value,
  })
  ms.success('Limits and costs updated')
}

function handleRecharge() {
  const newTotal = settingStore.totalCredits + 1000
  settingStore.updateSetting({ totalCredits: newTotal })
  ms.success('Recharge successful! +1000 Credits added.')
}

function handleResetCounter() {
  settingStore.updateSetting({ usedCreditsToday: 0 })
  ms.success('Daily counter reset to 0.')
}

</script>

<template>
  <div class="p-4 space-y-6 min-h-[200px]">
    <!-- Credit Balance Section -->
    <div class="flex justify-between items-center p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/20">
      <NStatistic label="Available Account Balance" :value="settingStore.totalCredits">
        <template #prefix>
          <SvgIcon icon="ri:coin-line" class="mr-2 text-yellow-500" />
        </template>
        <template #suffix>
          <span class="text-sm text-neutral-400 font-normal ml-1">Credits</span>
        </template>
      </NStatistic>
      <NButton type="primary" color="#10b981" @click="handleRecharge">
        <template #icon>
          <SvgIcon icon="ri:add-circle-line" />
        </template>
        Recharge Credits
      </NButton>
    </div>

    <!-- Daily Send Quota Visualization -->
    <div class="space-y-3 px-2">
      <div class="flex justify-between items-end">
        <label class="text-xs font-black uppercase tracking-widest text-neutral-500">Daily Send Quota</label>
        <span class="text-xs font-bold">{{ settingStore.usedCreditsToday }} / {{ settingStore.dailyMessageLimit }} messages</span>
      </div>
      <NProgress
        type="line"
        :percentage="quotaPercentage"
        indicator-placement="inside"
        processing
        color="#10b981"
        rail-color="rgba(0,0,0,0.05)"
        :height="24"
        class="rounded-full"
      />
      <div class="flex justify-end">
        <NButton size="tiny" tertiary @click="handleResetCounter">
          Reset Daily Counter
        </NButton>
      </div>
    </div>

    <NDivider title-placement="left">CRM Limit Controls</NDivider>

    <div class="space-y-5">
      <div class="flex items-center space-x-4">
        <span class="flex-shrink-0 w-[180px] text-sm font-medium">Daily AI Send Limit</span>
        <div class="flex-1">
          <NInputNumber v-model:value="dailyMessageLimit" :min="1" :max="5000" @update-value="updateLimits" />
        </div>
      </div>
      
      <div class="flex items-center space-x-4">
        <span class="flex-shrink-0 w-[180px] text-sm font-medium">Credit Cost Per Message</span>
        <div class="flex-1">
          <NInputNumber v-model:value="costPerMessage" :min="0" :max="100" @update-value="updateLimits" />
        </div>
      </div>
    </div>

    <div class="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl text-[11px] text-neutral-500 leading-relaxed italic">
      <p>⚠️ Note: Limits are enforced locally to prevent unintentional messaging spikes. High-frequency sending may require account verification.</p>
    </div>
  </div>
</template>
