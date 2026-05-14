<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { NButton, NInput, NSpace, useMessage, NTooltip, NSwitch } from 'naive-ui'
import { SvgIcon } from '@/components/common'
import { fetchChatAPIProcess } from '@/api'
import { useAppStore } from '@/store'

interface CTA {
  text: string
  type: 'Visit Website' | 'Quick Reply' | 'Call Now'
  url?: string
  phone?: string
}

interface TemplateVariation {
  type: 'Promotional' | 'Urgent' | 'Educational'
  image: string
  body: string
  ctas: CTA[]
  isSaved?: boolean
}

const ms = useMessage()
const appStore = useAppStore()
const loading = ref(false)
const campaignGoal = ref('')
const activeVariantIndex = ref(0)
const editingIndex = ref<number | null>(null)

const variations = ref<TemplateVariation[]>([
  {
    type: 'Promotional',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop',
    body: 'Hey {{name}}! 🎧 Our Summer Sale is finally here. Grab your premium headphones at 20% off before they\'re gone!',
    ctas: [
      { text: 'Shop 20% Off', type: 'Visit Website', url: 'https://example.com' },
      { text: 'Chat with us', type: 'Quick Reply' }
    ],
    isSaved: false
  },
  {
    type: 'Urgent',
    image: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?q=80&w=1000&auto=format&fit=crop',
    body: 'Last call {{name}}! 🚨 The 20% discount on all audio gear ends in 4 hours. Secure yours now!',
    ctas: [
      { text: 'Claim Offer', type: 'Visit Website', url: 'https://example.com' },
      { text: 'Contact Support', type: 'Quick Reply' }
    ],
    isSaved: false
  },
  {
    type: 'Educational',
    image: 'https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?q=80&w=1000&auto=format&fit=crop',
    body: 'Better sound, better focus {{name}}. 🧘‍♂️ Discover how our noise-canceling tech helps you stay in the zone.',
    ctas: [
      { text: 'Learn More', type: 'Visit Website', url: 'https://example.com' },
      { text: 'Ask a Question', type: 'Quick Reply' }
    ],
    isSaved: false
  }
])

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

async function handleAIGenerate() {
  if (!campaignGoal.value) {
    ms.warning('Enter a campaign goal first')
    return
  }

  loading.value = true
  try {
    const prompt = `You are a direct-response copywriter. Goal: "${campaignGoal.value}". 
    Variations: Promotional, Urgent, Educational. Include hook, {{name}}, offer, and emoji.
    Return JSON array of 3 objects: type, body, ctaText1, ctaText2.`

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
            if (variations.value[index].ctas[0]) variations.value[index].ctas[0].text = item.ctaText1 || 'Visit Website'
            if (variations.value[index].ctas[1]) variations.value[index].ctas[1].text = item.ctaText2 || 'Chat with us'
            variations.value[index].isSaved = false
          }
        })
        ms.success('Studio: Fresh variations ready!')
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

function openEdit(index: number) {
  editingIndex.value = index
  activeVariantIndex.value = index
}

function handleSave() {
  if (activeVariantIndex.value !== null) {
    variations.value[activeVariantIndex.value].isSaved = true
    ms.success('Campaign draft saved successfully!')
  }
}

// Collapsed sidebar on mount
onMounted(() => {
  appStore.setSiderCollapsed(true)
})

</script>

<template>
  <div class="min-h-screen bg-[#0a0a0c]/90 backdrop-blur-3xl text-white font-sans p-4 md:p-6 overflow-hidden flex flex-col">
    
    <!-- Header Studio Bar -->
    <div class="max-w-[1600px] mx-auto w-full flex items-center justify-between gap-8 mb-8 h-12">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]">
          <SvgIcon icon="ri:pencil-ruler-2-fill" class="text-lg" />
        </div>
        <h1 class="text-xl font-black tracking-tight uppercase">Campaign Studio</h1>
      </div>

      <!-- Slim Goal Bar -->
      <div class="flex-1 max-w-md relative group">
        <NInput 
          v-model:value="campaignGoal" 
          placeholder="Describe your goal (e.g. Summer Sale)" 
          class="!bg-white/5 !border-white/10 !rounded-full !h-10 !text-sm !pl-10 !pr-10 transition-all focus:!bg-white/10"
          @keyup.enter="handleAIGenerate"
        >
          <template #prefix>
            <SvgIcon icon="ri:search-2-line" class="text-neutral-500" />
          </template>
        </NInput>
        <button 
          @click="handleAIGenerate"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 hover:scale-110 transition-transform disabled:opacity-50"
          :disabled="loading"
        >
          <SvgIcon v-if="loading" icon="ri:loader-4-line" class="animate-spin text-lg" />
          <SvgIcon v-else icon="ri:magic-line" class="text-lg" />
        </button>
      </div>

      <div class="flex gap-4">
        <NButton type="primary" color="#10b981" round @click="handleSave" class="!px-8 !font-bold">Save All</NButton>
      </div>
    </div>

    <!-- Main Workspace -->
    <div class="max-w-[1600px] mx-auto w-full flex-1 flex gap-12 overflow-hidden relative">
      
      <!-- Left side: Strategy & Refinement -->
      <div class="w-[450px] flex flex-col gap-8 h-full overflow-y-auto no-scrollbar">
        
        <!-- Selection Ribbon -->
        <div class="space-y-4">
          <label class="text-[10px] font-black text-neutral-600 uppercase tracking-[0.3em]">Strategy Variants</label>
          <div class="flex flex-col gap-3">
            <div 
              v-for="(v, index) in variations" 
              :key="index"
              class="relative bg-white/5 border border-white/5 rounded-2xl p-4 cursor-pointer transition-all duration-300 hover:bg-white/10 flex items-center gap-4 group"
              :class="activeVariantIndex === index ? 'border-green-500/50 bg-white/10 shadow-lg' : ''"
              @click="activeVariantIndex = index"
            >
              <div class="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-black/40">
                <img :src="v.image" class="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex justify-between items-center mb-1">
                  <span class="text-[9px] font-black uppercase text-neutral-400 tracking-wider">{{ v.type }}</span>
                  <div class="flex items-center gap-2">
                    <SvgIcon v-if="v.isSaved" icon="ri:checkbox-circle-fill" class="text-green-500 text-sm" />
                    <NButton 
                      circle 
                      size="tiny" 
                      @click.stop="openEdit(index)"
                      class="!bg-white/5 !text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <template #icon><SvgIcon icon="ri:edit-line" /></template>
                    </NButton>
                  </div>
                </div>
                <p class="text-[11px] text-neutral-500 truncate italic">"{{ v.body }}"</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Refine Draft Section (Real-time Interactivity) -->
        <div class="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-3xl space-y-6">
          <div class="flex justify-between items-center">
            <h3 class="text-xs font-black uppercase tracking-widest text-green-500 flex items-center gap-2">
              <SvgIcon icon="ri:quill-pen-line" />
              Refine active draft
            </h3>
          </div>
          
          <div class="space-y-6">
            <div class="space-y-3">
              <label class="text-[9px] font-black text-neutral-600 uppercase tracking-widest">Message Copy</label>
              <NInput 
                v-model:value="variations[activeVariantIndex].body" 
                type="textarea" 
                :autosize="{ minRows: 4, maxRows: 8 }" 
                class="!bg-black/20 !border-white/5 !text-[13px] !rounded-2xl !p-4" 
              />
            </div>

            <div class="space-y-3">
              <label class="text-[9px] font-black text-neutral-600 uppercase tracking-widest">Call to Actions</label>
              <div class="grid grid-cols-1 gap-3">
                <div v-for="(cta, ci) in variations[activeVariantIndex].ctas" :key="ci" class="bg-black/20 p-4 rounded-2xl border border-white/5 flex items-center gap-4">
                  <div class="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-neutral-500">
                    <SvgIcon :icon="cta.type === 'Visit Website' ? 'ri:global-line' : 'ri:chat-3-line'" />
                  </div>
                  <div class="flex-1">
                    <p class="text-[8px] font-black text-neutral-600 uppercase mb-1">{{ cta.type }}</p>
                    <NInput v-model:value="cta.text" size="small" class="!bg-transparent !border-none !text-[12px] !font-bold" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="pt-4 border-t border-white/5">
            <NButton block type="primary" color="#10b981" @click="handleSave" class="!h-12 !rounded-2xl !font-black">
              Save Variation
            </NButton>
          </div>
        </div>
      </div>

      <!-- Right Column: Sticky Slim Preview -->
      <div class="flex-1 flex flex-col items-center justify-center relative">
        <div class="sticky top-0 h-full flex items-center justify-center">
          
          <!-- Mockup Container -->
          <div class="relative transition-all duration-700">
            
            <div class="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-2 whitespace-nowrap">
              <div class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
              <span class="text-[9px] font-black text-neutral-600 uppercase tracking-[0.4em]">Live Production Mock</span>
            </div>

            <!-- Slim iPhone Frame (Width reduced to 290px) -->
            <div class="relative w-[290px] h-[580px] bg-[#0c0c0c] rounded-[50px] p-[8px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.9)] border border-white/5 ring-1 ring-white/10">
              
              <!-- Inner content with scale(0.8) for crisp text -->
              <div class="relative w-full h-full bg-[#efe7de] rounded-[42px] overflow-hidden flex flex-col transform scale-[1] origin-top h-[100%]">
                
                <!-- Dynamic Island -->
                <div class="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-7 bg-black rounded-full z-[100]"></div>

                <!-- Chat Header -->
                <div class="bg-white/95 backdrop-blur-xl px-4 pt-10 pb-3 flex items-center gap-3 border-b border-black/5 z-50">
                  <div class="w-8 h-8 rounded-full bg-black flex items-center justify-center overflow-hidden flex-shrink-0 shadow-lg">
                    <img :src="businessProfile.avatar" class="w-full h-full object-contain p-1" />
                  </div>
                  <div class="flex flex-col">
                    <div class="flex items-center gap-1">
                      <span class="text-[13px] font-bold text-[#111b21]">{{ businessProfile.name }}</span>
                      <SvgIcon v-if="businessProfile.isVerified" icon="ri:checkbox-circle-fill" class="text-[#3b82f6] text-[13px]" />
                    </div>
                    <span class="text-[8px] text-[#00a884] font-black uppercase tracking-tighter">online</span>
                  </div>
                </div>

                <!-- Chat Stream -->
                <div class="flex-1 relative overflow-hidden whatsapp-doodle-bg p-3 flex flex-col">
                  
                  <div class="self-center bg-white/70 backdrop-blur-md px-3 py-1 rounded-full text-[8px] text-[#54656f] font-black mb-4 shadow-sm border border-black/5 uppercase">
                    Today
                  </div>

                  <!-- The Message Bubble (Real-time Sync) -->
                  <div class="self-start max-w-[94%] bg-white rounded-[20px] rounded-tl-none shadow-[0_1px_2px_rgba(0,0,0,0.15)] overflow-hidden transition-all duration-300">
                    <div class="p-1 pb-0">
                      <img :src="variations[activeVariantIndex].image" class="w-full aspect-[1.8] object-cover rounded-[16px]" />
                    </div>
                    
                    <div class="px-4 py-4 relative">
                      <p class="text-[12.5px] leading-[1.5] text-[#111b21] font-medium whitespace-pre-wrap">
                        {{ previewText }}
                      </p>
                      <div class="flex justify-end items-center gap-1 mt-2">
                        <span class="text-[8px] text-[#667781] font-black uppercase opacity-40">10:43 AM</span>
                      </div>
                    </div>

                    <!-- CTA Buttons (Real-time Sync) -->
                    <div class="border-t border-[#f0f2f5] divide-y divide-[#f0f2f5] pb-1">
                      <div 
                        v-for="(cta, ci) in variations[activeVariantIndex].ctas" 
                        :key="ci" 
                        class="py-3 px-4 flex items-center justify-center gap-2.5 text-[#00a884] font-black text-[12px] hover:bg-slate-50 transition-colors"
                      >
                        <SvgIcon :icon="cta.type === 'Visit Website' ? 'ri:external-link-line' : 'ri:chat-3-line'" class="text-lg" />
                        {{ cta.text }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Input Mock -->
                <div class="bg-white p-3 flex items-center gap-3 z-50 border-t border-black/5">
                  <div class="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                    <SvgIcon icon="ri:add-line" class="text-xl" />
                  </div>
                  <div class="flex-1 bg-slate-50 h-9 rounded-3xl px-4 flex items-center text-slate-200 font-bold text-[10px] border border-black/5 uppercase tracking-widest">
                    Message
                  </div>
                  <div class="w-9 h-9 rounded-full bg-[#00a884] flex items-center justify-center text-white shadow-lg">
                    <SvgIcon icon="ri:mic-line" class="text-lg" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.whatsapp-doodle-bg {
  background-image: url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png');
  background-size: 500px;
  background-blend-mode: soft-light;
  background-color: #efe7de;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

@keyframes slide-in {
  from { transform: translateX(-20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.animate-in {
  animation: slide-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

:deep(.n-input) {
  --n-text-color: #fff !important;
  --n-placeholder-color: #444 !important;
}

/* Ensure sticky columns work in flex layout */
.sticky {
  position: -webkit-sticky;
  position: sticky;
}
</style>
