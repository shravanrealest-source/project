<script setup lang="ts">
import { h, ref } from 'vue'
import { NButton, NDataTable, NPagination, NSelect, NSpace, NTag } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { SvgIcon } from '@/components/common'

interface Contact {
  key: number
  name: string
  mobile: string
  tags: string[]
  source: 'ORGANIC' | 'IMPORTED'
}

const data = ref<Contact[]>([
  { key: 1, name: 'Eyal Tzidkiyahu', mobile: '972524600875', tags: [], source: 'ORGANIC' },
  { key: 2, name: 'Mayurr Singh', mobile: '919009089022', tags: ['warm lead', 'important'], source: 'ORGANIC' },
  { key: 3, name: 'Sanket Sonawane', mobile: '917666242340', tags: ['Counselling', 'important'], source: 'ORGANIC' },
  { key: 4, name: 'Santhosh', mobile: '91904767772300', tags: ['TAG'], source: 'IMPORTED' },
  { key: 5, name: 'Raja', mobile: '919490668860', tags: ['northstar', 'Marketing'], source: 'IMPORTED' },
  { key: 6, name: 'Hitesh Narang', mobile: '919313045019', tags: ['property in extension', 'important'], source: 'ORGANIC' },
  { key: 7, name: 'Sarthak', mobile: '917306437517', tags: ['important'], source: 'ORGANIC' },
  { key: 8, name: 'Rupyaapaisa.Com', mobile: '919811773199', tags: ['warm lead', 'important'], source: 'ORGANIC' },
  { key: 9, name: 'Amit Kumar', mobile: '918800112233', tags: ['new lead'], source: 'ORGANIC' },
  { key: 10, name: 'Deepak Verma', mobile: '917766554433', tags: ['follow up'], source: 'IMPORTED' },
])

const columns: DataTableColumns<Contact> = [
  { type: 'selection' },
  { title: 'Name', key: 'name', width: 150 },
  { title: 'Mobile Number', key: 'mobile', width: 150 },
  {
    title: 'Tags',
    key: 'tags',
    width: 250,
    render(row) {
      const tags = row.tags.map((tag) => {
        return h(
          NTag,
          {
            style: { marginRight: '6px' },
            type: tag === 'important' ? 'error' : 'success',
            size: 'small',
            round: true,
          },
          { default: () => tag },
        )
      })
      return tags
    },
  },
  { title: 'Source', key: 'source', width: 120 },
]

const pagination = ref({
  page: 1,
  pageSize: 25,
  showSizePicker: true,
  pageSizes: [10, 25, 50],
  itemCount: 192,
})

const checkedRowKeys = ref<number[]>([])
const handleCheck = (keys: number[]) => {
  checkedRowKeys.value = keys
}
</script>

<template>
  <div class="flex flex-col h-full p-6 overflow-hidden bg-neutral-50 dark:bg-[#101014]">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-4">
        <h2 class="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
          Contacts
        </h2>
        <NButton ghost size="small">
          <template #icon>
            <SvgIcon icon="ri:filter-3-line" />
          </template>
          Filter
        </NButton>
      </div>
      <div class="flex items-center gap-3">
        <NButton ghost>
          <template #icon>
            <SvgIcon icon="ri:file-download-line" />
          </template>
          Import
        </NButton>
        <NButton type="primary" color="#4b9e5f" text-color="#fff">
          <template #icon>
            <SvgIcon icon="ri:file-upload-line" />
          </template>
          Export
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
        @update:checked-row-keys="handleCheck"
        :scroll-x="800"
      />
      
      <!-- Custom Pagination Footer -->
      <div class="flex items-center justify-center gap-6 mt-4 pt-4 border-t dark:border-neutral-800">
        <div class="text-sm text-neutral-500">
          1-25 of 192
        </div>
        <NPagination
          v-model:page="pagination.page"
          :page-count="8"
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
              { label: '50 per page', value: 50 },
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
