<script lang="ts" setup>
import { ref } from 'vue'
import { NButton, NInput, NSlider, useMessage } from 'naive-ui'
import { useSettingStore } from '@/store'
import type { SettingsState } from '@/store/modules/settings/helper'
import { t } from '@/locales'

const settingStore = useSettingStore()

const ms = useMessage()

const systemMessage = ref(settingStore.systemMessage ?? '')

const temperature = ref(settingStore.temperature ?? 0.5)

const top_p = ref(settingStore.top_p ?? 1)

const contextLength = ref(settingStore.contextLength ?? 5)

function updateSettings(options: Partial<SettingsState>) {
  settingStore.updateSetting(options)
  ms.success(t('common.success'))
}

function handleReset() {
  settingStore.resetSetting()
  ms.success(t('common.success'))
  window.location.reload()
}
</script>

<template>
  <div class="p-4 space-y-5 min-h-[200px]">
    <div class="space-y-6">
      <div class="flex flex-col space-y-2">
        <div class="flex items-center space-x-4">
          <span class="flex-shrink-0 w-[140px]">{{ $t('setting.role') }}</span>
          <div class="flex-1">
            <NInput 
              v-model:value="systemMessage" 
              type="textarea" 
              :autosize="{ minRows: 1, maxRows: 4 }" 
              placeholder="Act as a friendly marketing assistant for a Real Estate business"
            />
          </div>
          <NButton size="tiny" text type="primary" @click="updateSettings({ systemMessage })">
            {{ $t('common.save') }}
          </NButton>
        </div>
      </div>

      <div class="flex flex-col space-y-2">
        <div class="flex items-center space-x-4">
          <span class="flex-shrink-0 w-[140px]">{{ $t('setting.temperature') }} </span>
          <div class="flex-1">
            <NSlider v-model:value="temperature" :max="2" :min="0" :step="0.1" />
          </div>
          <span>{{ temperature }}</span>
          <NButton size="tiny" text type="primary" @click="updateSettings({ temperature })">
            {{ $t('common.save') }}
          </NButton>
        </div>
        <div class="pl-[156px] text-xs text-neutral-500">
          Increase for creative marketing offers, decrease for accurate contact data extraction.
        </div>
      </div>

      <div class="flex items-center space-x-4">
        <span class="flex-shrink-0 w-[140px]">{{ $t('setting.top_p') }} </span>
        <div class="flex-1">
          <NSlider v-model:value="top_p" :max="1" :min="0" :step="0.1" />
        </div>
        <span>{{ top_p }}</span>
        <NButton size="tiny" text type="primary" @click="updateSettings({ top_p })">
          {{ $t('common.save') }}
        </NButton>
      </div>

      <div class="flex items-center space-x-4">
        <span class="flex-shrink-0 w-[140px]">{{ $t('setting.contextLength') }} </span>
        <div class="flex-1">
          <NSlider v-model:value="contextLength" :max="20" :min="1" :step="1" />
        </div>
        <span>{{ contextLength }}</span>
        <NButton size="tiny" text type="primary" @click="updateSettings({ contextLength })">
          {{ $t('common.save') }}
        </NButton>
      </div>

      <div class="flex items-center space-x-4">
        <span class="flex-shrink-0 w-[140px]">&nbsp;</span>
        <NButton size="small" @click="handleReset">
          {{ $t('common.reset') }}
        </NButton>
      </div>
    </div>
  </div>
</template>
