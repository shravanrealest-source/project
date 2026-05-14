<script setup lang='ts'>
import type { CSSProperties } from 'vue'
import { computed, ref, watch } from 'vue'
import { NButton, NLayoutSider, useDialog } from 'naive-ui'
import List from './List.vue'
import Footer from './Footer.vue'
import { useAppStore, useChatStore } from '@/store'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { useRouter } from 'vue-router'
import { SvgIcon } from '@/components/common'
import { t } from '@/locales'

const router = useRouter()

const appStore = useAppStore()
const chatStore = useChatStore()

const dialog = useDialog()

const { isMobile } = useBasicLayout()

const navItems = [
  { label: 'Dashboard', icon: 'ri:dashboard-line', path: '/dashboard' },
  { label: 'Contacts', icon: 'ri:contacts-line', path: '/contacts' },
  { label: 'Campaigns', icon: 'ri:rocket-line', path: '/campaigns' },
  { label: 'Templates', icon: 'ri:file-list-3-line', path: '/templates' },
]

const collapsed = computed(() => appStore.siderCollapsed)

function handleAdd() {
  chatStore.addHistory({ title: t('chat.newChatTitle'), uuid: Date.now(), isEdit: false })
  if (router.currentRoute.value.name !== 'Chat')
    router.push('/chat')

  if (isMobile.value)
    appStore.setSiderCollapsed(true)
}

function handleNav(path: string) {
  router.push(path)
  if (isMobile.value)
    appStore.setSiderCollapsed(true)
}

function handleUpdateCollapsed() {
  appStore.setSiderCollapsed(!collapsed.value)
}



const getMobileClass = computed<CSSProperties>(() => {
  if (isMobile.value) {
    return {
      position: 'fixed',
      zIndex: 50,
    }
  }
  return {}
})

const mobileSafeArea = computed(() => {
  if (isMobile.value) {
    return {
      paddingBottom: 'env(safe-area-inset-bottom)',
    }
  }
  return {}
})

watch(
  isMobile,
  (val) => {
    appStore.setSiderCollapsed(val)
  },
  {
    immediate: true,
    flush: 'post',
  },
)
</script>

<template>
  <NLayoutSider
    :collapsed="collapsed"
    :collapsed-width="0"
    :width="260"
    :show-trigger="isMobile ? false : 'arrow-circle'"
    collapse-mode="transform"
    position="absolute"
    bordered
    :style="getMobileClass"
    @update-collapsed="handleUpdateCollapsed"
  >
    <div class="flex flex-col h-full" :style="mobileSafeArea">
      <main class="flex flex-col flex-1 min-h-0">
        <div class="p-4 flex flex-col gap-2">
          <!-- WhatsApp Marketing Navigation -->
          <div class="flex flex-col gap-2 mb-2">
            <NButton
              v-for="item in navItems"
              :key="item.label"
              block
              ghost
              :type="router.currentRoute.value.path === item.path ? 'primary' : 'default'"
              class="!justify-start group"
              style="border-radius: 6px; height: 42px;"
              @click="handleNav(item.path)"
            >
              <template #icon>
                <SvgIcon :icon="item.icon" class="text-lg" />
              </template>
              <span class="ml-1">{{ item.label }}</span>
            </NButton>
          </div>

          <NButton dashed block @click="handleAdd">
            {{ $t('chat.newChatButton') }}
          </NButton>
        </div>
        <div class="flex-1 min-h-0 pb-4 overflow-hidden">
          <List />
        </div>
      </main>
      <Footer />
    </div>
  </NLayoutSider>
  <template v-if="isMobile">
    <div v-show="!collapsed" class="fixed inset-0 z-40 w-full h-full bg-black/40" @click="handleUpdateCollapsed" />
  </template>
</template>

<style lang="less" scoped>
:deep(.group:hover) {
  .n-button__content, .n-button__icon {
    color: #4b9e5f !important;
  }
  border-color: #4b9e5f !important;
}
</style>
