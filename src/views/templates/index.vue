<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { NButton, NInput, NSpace, useMessage, NTooltip, NSwitch, NDivider, NCard, NGrid, NGi } from 'naive-ui'
import { SvgIcon } from '@/components/common'
import { fetchChatAPIProcess } from '@/api'
import { useAppStore } from '@/store'
import { ls } from '@/utils/storage'

interface CTA {
  text: string
  type: 'Visit Website' | 'Quick Reply' | 'Call Now'
  url?: string
  phone?: string
}

interface TemplateVariation {
  id?: string | number
  type: 'Promotional' | 'Urgent' | 'Educational'
  image: string
  body: string
  ctas: CTA[]
  isSaved?: boolean
}

const LOCAL_STORAGE_KEY = 'myTemplatesStorage'
const ms = useMessage()
const appStore = useAppStore()
const loading = ref(false)
const campaignGoal = ref('')
const activeVariantIndex = ref(0)
const fileInputRef = ref<HTMLInputElement | null>(null)

const variations = ref<TemplateVariation[]>([
  {
    type: 'Promotional',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop',
    body: 'Hey {{name}}! 🎧 Our Summer Sale is finally here. Grab your premium headphones at 20% off before they\'re gone!',
    ctas: [
      { text: 'Shop 20% Off', type: 'Visit Website', url: 'https://headway.com/sale' },
      { text: 'Chat with us', type: 'Quick Reply', url: 'action_chat' }
    ]
  },
  {
    type: 'Urgent',
    image: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?q=80&w=1000&auto=format&fit=crop',
    body: 'Last call {{name}}! 🚨 The 20% discount on all audio gear ends in 4 hours. Secure yours now!',
    ctas: [
      { text: 'Claim Offer', type: 'Visit Website', url: 'https://headway.com/offer' },
      { text: 'Contact Support', type: 'Quick Reply', url: 'action_support' }
    ]
  },
  {
    type: 'Educational',
    image: 'https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?q=80&w=1000&auto=format&fit=crop',
    body: 'Better sound, better focus {{name}}. 🧘‍♂️ Discover how our noise-canceling tech helps you stay in the zone.',
    ctas: [
      { text: 'Learn More', type: 'Visit Website', url: 'https://headway.com/blog' },
      { text: 'Ask a Question', type: 'Quick Reply', url: 'action_question' }
    ]
  }
])

const savedTemplates = ref<TemplateVariation[]>([])

const businessProfile = ref({
  name: 'Headway Inc.',
  isVerified: true,
  avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=HI&backgroundColor=000000'
})

const previewText = computed(() => {
  const current = variations.value[activeVariantIndex.value]
  if (!current) return ''
  return current.body.replace(/\{\{name\}\}/g, 'Saumya')
})

function triggerUpload() {
  fileInputRef.value?.click()
}

function handleImageUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        variations.value[activeVariantIndex.value].image = e.target.result as string
        ms.success('Creative uploaded successfully')
      }
    }
    reader.readAsDataURL(input.files[0])
  }
}

async function handleAIGenerate() {
  if (!campaignGoal.value) {
    ms.warning('Goal required')
    return
  }

  loading.value = true
  try {
    const prompt = `You are a direct-response copywriter. Goal: "${campaignGoal.value}". 
    Variations: Promotional, Urgent, Educational. Include hook, {{name}}, offer, and emoji.
    Return JSON array of 3 objects: type, body, ctaText1, ctaUrl1, ctaText2.`

    let aiResponse = ''
    await fetchChatAPIProcess({
      prompt,
      options: {},
      onDownloadProgress: ({ event }) => {
        const xhr = event.target
        const { responseText } = xhr
        const lastIndex = responseText.lastIndexOf('\n', responseText.length - 2)
        let chunk = responseText
        if (lastIndex !== -1)
          chunk = responseText.substring(lastIndex)
        try {
          const data = JSON.parse(chunk)
          aiResponse = data.text
        }
        catch (e) {}
      },
    })

    if (aiResponse) {
      const jsonStr = aiResponse.match(/\[[\s\S]*\]/)?.[0]
      if (jsonStr) {
        const data = JSON.parse(jsonStr)
        const timestamp = Date.now()
        data.forEach((item: any, index: number) => {
          if (variations.value[index]) {
            variations.value[index].body = item.body
            const keywords = campaignGoal.value.split(' ').join(',')
            variations.value[index].image = `https://images.unsplash.com/featured/?${keywords}&sig=${timestamp + index}`
            if (variations.value[index].ctas[0]) {
              variations.value[index].ctas[0].text = item.ctaText1 || 'Visit Website'
              variations.value[index].ctas[0].url = item.ctaUrl1 || 'https://example.com'
            }
            if (variations.value[index].ctas[1]) variations.value[index].ctas[1].text = item.ctaText2 || 'Chat'
          }
        })
        ms.success('Variations ready')
      }
    }
  }
  catch (error: any) {
    ms.error('Failed to generate')
  }
  finally {
    loading.value = false
  }
}

function handleSave() {
  const current = JSON.parse(JSON.stringify(variations.value[activeVariantIndex.value]))
  current.id = Date.now()
  savedTemplates.value.unshift(current)
  saveToLocalStorage()
  ms.success('Saved to Library')
}

function saveToLocalStorage() {
  ls.set(LOCAL_STORAGE_KEY, savedTemplates.value)
}

function loadFromLocalStorage() {
  const data = ls.get(LOCAL_STORAGE_KEY)
  if (data) savedTemplates.value = data
}

function deleteTemplate(id: string | number) {
  savedTemplates.value = savedTemplates.value.filter(t => t.id !== id)
  saveToLocalStorage()
}

function useTemplate(template: TemplateVariation) {
  variations.value[activeVariantIndex.value] = JSON.parse(JSON.stringify(template))
  ms.success('Loaded')
}

onMounted(() => {
  appStore.setSiderCollapsed(true)
  loadFromLocalStorage()
})

</script>

<template>
  <div class="min-h-screen bg-[#0f0f12] text-white font-sans p-4 overflow-x-hidden flex flex-col">
    
    <!-- Compact Header -->
    <div class="max-w-[1200px] mx-auto w-full flex items-center justify-between gap-4 mb-4 h-8">
      <h1 class="text-xs font-black uppercase tracking-tighter">Campaign Studio</h1>

      <div class="flex-1 max-w-[260px] relative">
        <NInput 
          v-model:value="campaignGoal" 
          placeholder="Campaign Goal..." 
          class="!bg-white/5 !border-white/10 !rounded-full !h-7 !text-[10px] !pl-7 !pr-7"
          @keyup.enter="handleAIGenerate"
        >
          <template #prefix><SvgIcon icon="ri:search-2-line" class="text-neutral-600 text-[10px]" /></template>
        </NInput>
        <button @click="handleAIGenerate" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-green-500" :disabled="loading">
          <SvgIcon v-if="loading" icon="ri:loader-4-line" class="animate-spin text-[10px]" />
          <SvgIcon v-else icon="ri:magic-line" class="text-[10px]" />
        </button>
      </div>

      <div class="flex items-center gap-1.5">
        <div class="w-1 h-1 rounded-full bg-green-500"></div>
        <span class="text-[7px] font-bold text-neutral-600 uppercase">Online</span>
      </div>
    </div>

    <!-- Main Workspace -->
    <div class="max-w-[1200px] mx-auto w-full flex-1 flex flex-col gap-4 pb-8">
      
      <div class="flex gap-4 overflow-hidden relative">
        <!-- Sidebar: Fixed 320px -->
        <div class="w-[320px] flex-shrink-0 flex flex-col gap-4">
          <div class="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4 backdrop-blur-xl">
            <div class="flex justify-between items-center">
              <h3 class="text-[8px] font-black uppercase tracking-widest text-green-500">Refine Draft</h3>
              <div class="flex gap-1">
                <NButton v-for="(v, idx) in variations" :key="idx" size="tiny" round :type="activeVariantIndex === idx ? 'primary' : 'default'" :color="activeVariantIndex === idx ? '#10b981' : ''" @click="activeVariantIndex = idx" class="!text-[7px] !h-4 !px-1.5">V{{ idx+1 }}</NButton>
              </div>
            </div>
            
            <div class="space-y-4">
              <!-- 1. Upload Creative (TOP) -->
              <div class="space-y-1.5">
                <label class="text-[6px] font-black text-neutral-600 uppercase">Upload Creative</label>
                <div class="flex flex-col gap-2">
                  <NButton block dashed @click="triggerUpload" class="!h-8 !rounded-lg !border-white/10 !text-[10px]">
                    <template #icon><SvgIcon icon="ri:upload-cloud-2-line" /></template>
                    Upload Creative
                  </NButton>
                  <input type="file" ref="fileInputRef" style="display: none" accept="image/*" @change="handleImageUpload" />
                  <div v-if="variations[activeVariantIndex].image" class="w-full aspect-[16/9] rounded-lg overflow-hidden border border-white/10 bg-black/40">
                    <img :src="variations[activeVariantIndex].image" class="w-full h-full object-cover" />
                  </div>
                </div>
              </div>

              <!-- 2. Message Copy -->
              <div class="space-y-1.5">
                <label class="text-[6px] font-black text-neutral-600 uppercase">Message Copy</label>
                <NInput v-model:value="variations[activeVariantIndex].body" type="textarea" :autosize="{ minRows: 3, maxRows: 6 }" class="!bg-black/20 !border-white/5 !text-[10px] !rounded-lg !p-2" />
              </div>

              <!-- 3. Call to Actions -->
              <div class="space-y-1.5">
                <label class="text-[6px] font-black text-neutral-600 uppercase">Call to Actions</label>
                <div class="grid grid-cols-1 gap-2">
                  <div v-for="(cta, ci) in variations[activeVariantIndex].ctas" :key="ci" class="bg-black/20 p-2.5 rounded-xl border border-white/5 flex flex-col gap-2">
                    <div class="flex items-center gap-2">
                      <SvgIcon :icon="cta.type === 'Visit Website' ? 'ri:global-line' : 'ri:chat-3-line'" class="text-[10px] text-neutral-500" />
                      <NInput v-model:value="cta.text" size="tiny" class="!bg-transparent !border-none !text-[10px] !font-bold" placeholder="Label" />
                    </div>
                    <!-- URL/Action input for ALL types -->
                    <div>
                      <NInput 
                        v-model:value="cta.url" 
                        size="tiny" 
                        placeholder="URL or Action Payload" 
                        class="!bg-black/40 !border-white/5 !rounded-md !text-[8px] !h-5" 
                      >
                        <template #prefix><SvgIcon icon="ri:link" class="text-[7px] text-neutral-600" /></template>
                      </NInput>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <NButton block type="primary" color="#10b981" @click="handleSave" class="!h-8 !rounded-lg !font-bold !text-[9px]">Save to Library</NButton>
          </div>
        </div>

        <!-- Preview: Center & Scaled -->
        <div class="flex-1 flex flex-col items-center">
          <div class="sticky top-0 h-full flex flex-col items-center transform scale-[0.85] origin-top">
            <div class="relative">
              <span class="absolute -top-6 left-1/2 -translate-x-1/2 text-[7px] font-black text-neutral-600 uppercase tracking-widest">Mockup</span>

              <!-- iPhone frame: 270px wide -->
              <div class="relative w-[270px] h-[540px] bg-black rounded-[40px] p-1.5 border border-white/5 shadow-2xl">
                <div class="relative w-full h-full bg-[#efe7de] rounded-[34px] overflow-hidden flex flex-col">
                  
                  <div class="absolute top-1.5 left-1/2 -translate-x-1/2 w-20 h-4.5 bg-black rounded-full z-[100]"></div>

                  <!-- Header -->
                  <div class="bg-white/95 px-3 pt-7 pb-2.5 flex items-center gap-2.5 border-b border-black/5 z-40">
                    <div class="w-6 h-6 rounded-full bg-black overflow-hidden flex-shrink-0"><img :src="businessProfile.avatar" class="p-1" /></div>
                    <div class="flex flex-col">
                      <span class="text-[10px] font-bold text-[#111b21] leading-none">{{ businessProfile.name }}</span>
                      <span class="text-[6px] text-[#00a884] font-black uppercase">online</span>
                    </div>
                  </div>

                  <!-- Bubble Layout: Image -> Text -> Buttons -->
                  <div class="flex-1 whatsapp-doodle-bg p-3 flex flex-col">
                    <div class="self-center bg-white/70 px-3 py-0.5 rounded-full text-[6px] text-[#54656f] font-black mb-3.5 uppercase">Today</div>

                    <div class="self-start max-w-[92%] bg-white rounded-2xl rounded-tl-none shadow-sm overflow-hidden flex flex-col">
                      
                      <!-- 1. The Creative (Image sits at the top) -->
                      <div class="p-1 pb-0">
                        <img :src="variations[activeVariantIndex].image" class="w-full aspect-[16/9] object-cover rounded-t-2xl rounded-b-md shadow-inner" />
                      </div>

                      <!-- 2. The Body (Below Image) -->
                      <div class="px-3.5 py-3">
                        <p class="text-[11px] leading-[1.55] text-[#111b21] font-medium whitespace-pre-wrap">
                          {{ previewText }}
                        </p>
                        <div class="flex justify-end mt-1.5"><span class="text-[6px] text-[#667781] font-black uppercase opacity-30">10:43 AM</span></div>
                      </div>

                      <!-- 3. The Actions -->
                      <div class="border-t border-[#f0f2f5] divide-y divide-[#f0f2f5]">
                        <a 
                          v-for="(cta, ci) in variations[activeVariantIndex].ctas" 
                          :key="ci" 
                          :href="(cta.type === 'Visit Website' || cta.type === 'Quick Reply') ? cta.url : 'javascript:void(0)'"
                          target="_blank"
                          class="py-2.5 px-3 flex items-center justify-center gap-2 text-[#00a884] font-bold text-[11px] hover:bg-slate-50 transition-colors no-underline"
                        >
                          <SvgIcon :icon="cta.type === 'Visit Website' ? 'ri:external-link-line' : 'ri:chat-3-line'" class="text-xs" />
                          {{ cta.text }}
                        </a>
                      </div>
                    </div>
                  </div>

                  <!-- Footer -->
                  <div class="bg-white p-2 flex items-center gap-2 border-t border-black/5">
                    <div class="w-5 h-5 rounded-full bg-slate-50 flex items-center justify-center text-slate-300"><SvgIcon icon="ri:add-line" /></div>
                    <div class="flex-1 bg-slate-50 h-6 rounded-full px-3 text-[7px] text-slate-200 uppercase font-black tracking-widest leading-6">Message</div>
                    <div class="w-6 h-6 rounded-full bg-[#00a884] flex items-center justify-center text-white shadow-md"><SvgIcon icon="ri:mic-line" class="text-xs" /></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Library Grid -->
      <div class="space-y-3">
        <h2 class="text-[10px] font-black tracking-tight uppercase border-b border-white/5 pb-2">My Library</h2>
        <NGrid :x-gap="8" :y-gap="8" :cols="6">
          <NGi v-for="t in savedTemplates" :key="t.id">
            <div class="bg-white/5 border border-white/10 rounded-lg overflow-hidden group hover:border-green-500/20 transition-all duration-300">
              <div class="aspect-[16/9] relative bg-black/20 overflow-hidden">
                <img :src="t.image" class="w-full h-full object-cover" />
                <div class="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col p-1.5 gap-1 justify-center">
                  <NButton block type="primary" color="#10b981" size="tiny" @click="useTemplate(t)" class="!text-[8px] !h-4">Load</NButton>
                  <NButton block ghost size="tiny" @click="deleteTemplate(t.id!)" class="!text-red-500 !text-[8px] !h-4">Del</NButton>
                </div>
              </div>
              <div class="p-1.5"><p class="text-[8px] text-neutral-500 line-clamp-1 leading-none">{{ t.body }}</p></div>
            </div>
          </NGi>
        </NGrid>
      </div>

    </div>
  </div>
</template>

<style scoped>
.whatsapp-doodle-bg {
  background-image: url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png');
  background-size: 300px;
  background-blend-mode: soft-light;
  background-color: #efe7de;
}

:deep(.n-input) {
  --n-text-color: #fff !important;
  --n-placeholder-color: #333 !important;
  --n-font-size: 10px !important;
}

.sticky {
  position: -webkit-sticky;
  position: sticky;
}
</style>
