<script setup lang="ts">
import { computed, h, ref } from 'vue'
import { NButton, NCard, NDataTable, NGi, NGrid, NProgress, NStatistic, NTag } from 'naive-ui'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { SvgIcon } from '@/components/common'
import { useTheme } from '@/hooks/useTheme'

// Register ECharts modules
use([CanvasRenderer, LineChart, GridComponent, TooltipComponent])

const { theme } = useTheme()
const isDark = computed(() => theme.value?.name === 'dark')

// Metrics Data
const metrics = [
  { label: 'Sent', value: '12,450', change: '+5.2%', icon: 'ri:send-plane-fill', color: '#2080f0' },
  { label: 'Delivered', value: '11,820', change: '+4.1%', icon: 'ri:check-double-line', color: '#4b9e5f' },
  { label: 'Read', value: '8,420', change: '+2.8%', icon: 'ri:mail-open-line', color: '#722ed1' },
  { label: 'Clicked', value: '1,240', change: '-1.2%', icon: 'ri:cursor-fill', color: '#fa8c16' },
]

// Chart Options
const chartOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'cross', label: { backgroundColor: '#6a7985' } },
  },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    axisLine: { lineStyle: { color: isDark.value ? '#444' : '#eee' } },
  },
  yAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: isDark.value ? '#222' : '#f5f5f5' } },
  },
  series: [
    {
      name: 'Message Volume',
      type: 'line',
      stack: 'Total',
      smooth: true,
      lineStyle: { width: 3, color: '#4b9e5f' },
      showSymbol: false,
      areaStyle: {
        opacity: 0.1,
        color: '#4b9e5f',
      },
      emphasis: { focus: 'series' },
      data: [820, 932, 901, 934, 1290, 1330, 1320],
    },
  ],
}))

// Recent Campaigns Table
const campaignsColumns = [
  { title: 'Campaign Name', key: 'name', width: 200 },
  {
    title: 'Status',
    key: 'status',
    align: 'center',
    width: 100,
    render(row: any) {
      return h(
        NTag,
        { type: row.status === 'Completed' ? 'success' : 'info', size: 'small', round: true },
        { default: () => row.status },
      )
    },
  },
  { title: 'Sent', key: 'sent', align: 'right', width: 100 },
  { title: 'Delivered', key: 'delivered', align: 'right', width: 100 },
  { title: 'Read', key: 'read', align: 'right', width: 100 },
  { title: 'Clicked', key: 'clicked', align: 'right', width: 100 },
]

const campaignsData = [
  { key: 1, name: 'Eid Special Offer', status: 'Completed', sent: '5,000', delivered: '4,850', read: '3,900', clicked: '1,100' },
  { key: 2, name: 'Weekend Flash Sale', status: 'Sending', sent: '2,450', delivered: '2,320', read: '1,800', clicked: '450' },
  { key: 3, name: 'New Lead Welcome', status: 'Completed', sent: '1,200', delivered: '1,180', read: '1,100', clicked: '280' },
]
</script>

<template>
  <div class="h-full p-6 overflow-y-auto bg-neutral-50 dark:bg-[#101014] transition-colors">
    <div class="max-w-screen-2xl mx-auto space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
          Dashboard Overview
        </h2>
        <NButton type="primary" color="#4b9e5f">
          <template #icon>
            <SvgIcon icon="ri:refresh-line" />
          </template>
          Refresh Data
        </NButton>
      </div>

      <!-- Metric Cards Row -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <NCard
          v-for="m in metrics"
          :key="m.label"
          shadowed
          size="small"
          class="hover:shadow-md transition-shadow dark:bg-[#24272e] dark:border-neutral-800"
        >
          <div class="relative flex flex-col py-1">
            <!-- Icon at top-right -->
            <div
              class="absolute top-0 right-0 p-2 rounded-lg flex items-center justify-center"
              :style="{ backgroundColor: m.color + '15' }"
            >
              <SvgIcon :icon="m.icon" class="text-xl" :style="{ color: m.color }" />
            </div>

            <!-- Label -->
            <p class="text-neutral-500 dark:text-neutral-400 text-xs font-semibold uppercase tracking-tight">
              {{ m.label }}
            </p>

            <!-- Value & Change -->
            <div class="flex items-baseline gap-2 mt-3">
              <span class="text-2xl font-bold dark:text-white leading-none">{{ m.value }}</span>
              <span
                class="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                :class="m.change.startsWith('+') ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'"
              >
                {{ m.change }}
              </span>
            </div>
          </div>
        </NCard>
      </div>

      <!-- Middle Row: Analytics & Status -->
      <NGrid :x-gap="16" :y-gap="16" :cols="24" item-responsive>
        <!-- Engagement Trend -->
        <NGi span="24 l:16">
          <NCard title="Engagement Trend" shadowed class="dark:bg-[#24272e] dark:border-neutral-800 h-full">
            <template #header-extra>
              <NTag size="small" :bordered="false" type="success">Last 7 Days</NTag>
            </template>
            <div class="h-[300px] w-full">
              <VChart :option="chartOption" autoresize />
            </div>
          </NCard>
        </NGi>

        <!-- Health & Tier -->
        <NGi span="24 l:8">
          <NCard title="Health & Tier" shadowed class="dark:bg-[#24272e] dark:border-neutral-800 h-full">
            <div class="space-y-6">
              <div>
                <div class="flex justify-between mb-2">
                  <span class="text-neutral-500 dark:text-neutral-400">Account Health</span>
                  <span class="text-green-500 font-medium">Healthy</span>
                </div>
                <NProgress
                  type="line"
                  :percentage="98"
                  color="#4b9e5f"
                  :show-indicator="false"
                  processing
                />
              </div>

              <div class="p-4 rounded-lg bg-neutral-100 dark:bg-[#1e2025] border dark:border-neutral-700">
                <p class="text-xs text-neutral-500 mb-1">CURRENT TIER</p>
                <p class="text-lg font-bold text-[#4b9e5f]">Tier 2</p>
                <p class="text-sm text-neutral-400 mt-2">
                  Limit: 10,000 business-initiated conversations per 24 hours.
                </p>
              </div>

              <div class="flex items-center gap-2 text-xs text-neutral-500">
                <SvgIcon icon="ri:information-line" />
                <span>Next upgrade after 1,240 more messages.</span>
              </div>
            </div>
          </NCard>
        </NGi>
      </NGrid>

      <!-- Bottom Row: Recent Campaigns -->
      <NCard title="Recent Campaigns" shadowed class="dark:bg-[#24272e] dark:border-neutral-800">
        <template #header-extra>
          <NButton text type="primary" color="#4b9e5f">View All</NButton>
        </template>
        <NDataTable
          :columns="campaignsColumns"
          :data="campaignsData"
          :bordered="false"
          size="small"
          :scroll-x="700"
        />
      </NCard>
    </div>
  </div>
</template>

<style scoped>
.shadowed {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
}
.dark .shadowed {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1);
}
</style>
