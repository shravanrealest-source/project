<script setup lang="ts">
import { h, ref } from 'vue'
import { NButton, NDataTable, NPagination, NSelect, NTag } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { SvgIcon } from '@/components/common'

interface Campaign {
  key: number
  name: string
  status: 'Completed' | 'Sending' | 'Draft'
  sent: string
  delivered: string
  read: string
  clicked: string
}

const data = ref<Campaign[]>([
  { key: 1, name: 'Eid Special Offer', status: 'Completed', sent: '5,000', delivered: '4,850', read: '3,900', clicked: '1,100' },
  { key: 2, name: 'Weekend Flash Sale', status: 'Sending', sent: '2,450', delivered: '2,320', read: '1,800', clicked: '450' },
  { key: 3, name: 'New Lead Welcome', status: 'Completed', sent: '1,200', delivered: '1,180', read: '1,100', clicked: '280' },
  { key: 4, name: 'Spring Collection Launch', status: 'Completed', sent: '10,000', delivered: '9,800', read: '7,500', clicked: '2,100' },
  { key: 5, name: 'Abandoned Cart Recovery', status: 'Sending', sent: '1,500', delivered: '1,450', read: '1,200', clicked: '600' },
  { key: 6, name: 'Customer Feedback Survey', status: 'Draft', sent: '0', delivered: '0', read: '0', clicked: '0' },
  { key: 7, name: 'Loyalty Program Invite', status: 'Completed', sent: '3,000', delivered: '2,900', read: '2,500', clicked: '900' },
])

const columns: DataTableColumns<Campaign> = [
  { title: 'Campaign Name', key: 'name', width: 250 },
  {
    title: 'Status',
    key: 'status',
    align: 'center',
    width: 120,
    render(row) {
      return h(
        NTag,
        {
          type: row.status === 'Completed' ? 'success' : row.status === 'Sending' ? 'info' : 'default',
          size: 'small',
          round: true,
        },
        { default: () => row.status },
      )
    },
  },
  { title: 'Sent', key: 'sent', align: 'right', width: 100 },
  { title: 'Delivered', key: 'delivered', align: 'right', width: 100 },
  { title: 'Read', key: 'read', align: 'right', width: 100 },
  { title: 'Clicked', key: 'clicked', align: 'right', width: 100 },
]

const pagination = ref({
  page: 1,
  pageSize: 10,
  itemCount: 7,
})
</script>

<template>
  <div class="flex flex-col h-full p-6 overflow-hidden bg-neutral-50 dark:bg-[#101014]">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-4">
        <h2 class="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
          Campaign Performance
        </h2>
        <NButton ghost size="small">
          <template #icon>
            <SvgIcon icon="ri:filter-3-line" />
          </template>
          Filter
        </NButton>
      </div>
      <div class="flex items-center gap-3">
        <NButton type="primary" color="#4b9e5f" text-color="#fff">
          <template #icon>
            <SvgIcon icon="ri:add-line" />
          </template>
          Create Campaign
        </NButton>
      </div>
    </div>

    <!-- Table Container -->
    <div class="flex-1 min-h-0 p-4 bg-white border rounded-md shadow-sm dark:bg-[#24272e] dark:border-neutral-800 overflow-hidden flex flex-col">
      <NDataTable
        remote
        flex-height
        class="flex-1"
        :columns="columns"
        :data="data"
        :row-key="(row) => row.key"
        :scroll-x="900"
      />
      
      <!-- Custom Pagination Footer -->
      <div class="flex items-center justify-center gap-6 mt-4 pt-4 border-t dark:border-neutral-800">
        <div class="text-sm text-neutral-500">
          1-7 of 7
        </div>
        <NPagination
          v-model:page="pagination.page"
          :page-count="1"
          size="medium"
        />
        <div class="flex items-center gap-2">
          <NSelect
            v-model:value="pagination.pageSize"
            size="small"
            style="width: 120px"
            :options="[
              { label: '10 per page', value: 10 },
              { label: '25 per page', value: 25 },
            ]"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.n-data-table-td) {
  white-space: nowrap;
}
</style>
