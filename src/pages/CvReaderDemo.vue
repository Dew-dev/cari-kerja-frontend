<template>
  <div class="min-h-screen bg-gray-50">
    <div class="bg-linear-to-r from-blue-600 to-indigo-700 text-white py-10">
      <div class="max-w-6xl mx-auto px-6">
        <h1 class="text-3xl font-bold">CV Reader Demo (Tesseract)</h1>
        <p class="text-blue-100 mt-2">Upload a CV image and extract work experience, skills, and education.</p>
      </div>
    </div>

    <div class="max-w-6xl mx-auto px-6 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-1 space-y-6">
          <div class="bg-white rounded-xl shadow-sm p-6">
            <h2 class="text-lg font-semibold mb-4">Upload CV</h2>

            <input
              type="file"
              accept="image/*,application/pdf"
              @change="onFileChange"
              class="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />

            <div v-if="previewUrl" class="mt-4">
              <p class="text-xs text-gray-500 mb-2">Preview</p>
              <img
                v-if="fileType === 'image'"
                :src="previewUrl"
                alt="CV Preview"
                class="w-full rounded-lg border border-gray-200"
              />
              <div v-else class="border border-gray-200 rounded-lg p-4 text-sm text-gray-600 bg-gray-50">
                PDF selected. OCR will run on the first page.
              </div>
            </div>

            <div class="mt-4 flex flex-wrap gap-3">
              <button
                :disabled="!file || loading"
                @click="runOcr"
                class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium px-4 py-2 rounded-lg transition"
              >
                {{ loading ? 'Reading...' : 'Run OCR' }}
              </button>
              <button
                :disabled="loading"
                @click="clearAll"
                class="bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium px-4 py-2 rounded-lg transition"
              >
                Clear
              </button>
            </div>

            <div class="mt-5">
              <p class="text-xs text-gray-500 mb-2">OCR Languages</p>
              <div class="grid grid-cols-2 gap-2 text-sm text-gray-700">
                <label class="flex items-center gap-2">
                  <input v-model="selectedLangs" type="checkbox" value="eng" /> English
                </label>
                <label class="flex items-center gap-2">
                  <input v-model="selectedLangs" type="checkbox" value="rus" /> Russian
                </label>
                <label class="flex items-center gap-2">
                  <input v-model="selectedLangs" type="checkbox" value="uzb" /> Uzbek
                </label>
                <label class="flex items-center gap-2">
                  <input v-model="selectedLangs" type="checkbox" value="ind" /> Indonesian
                </label>
              </div>
              <p class="text-xs text-gray-500 mt-2">Tip: Selecting multiple languages may slow OCR.</p>
            </div>

            <div v-if="loading" class="mt-4">
              <div class="text-xs text-gray-500 mb-1">Progress: {{ Math.round(progress * 100) }}%</div>
              <div class="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div class="h-2 bg-blue-600" :style="{ width: `${progress * 100}%` }"></div>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-6">
            <h2 class="text-lg font-semibold mb-2">Tips</h2>
            <ul class="text-sm text-gray-600 list-disc pl-5 space-y-1">
              <li>Use a clear, high-resolution CV image or PDF.</li>
              <li>PDF OCR reads all pages in this demo.</li>
              <li>Ensure good contrast and lighting.</li>
              <li>Headings like “Work Experience”, “Skills”, “Education” help parsing.</li>
            </ul>
          </div>
        </div>

        <div class="lg:col-span-2 space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-white rounded-xl shadow-sm p-5">
              <h3 class="text-sm font-semibold text-gray-700 mb-3">Work Experience</h3>
              <ul v-if="parsed.experience.length" class="text-sm text-gray-700 space-y-2">
                <li v-for="(item, idx) in parsed.experience" :key="`exp-${idx}`">• {{ item }}</li>
              </ul>
              <p v-else class="text-sm text-gray-400">No data found.</p>
            </div>

            <div class="bg-white rounded-xl shadow-sm p-5">
              <h3 class="text-sm font-semibold text-gray-700 mb-3">Skills</h3>
              <ul v-if="parsed.skills.length" class="text-sm text-gray-700 space-y-2">
                <li v-for="(item, idx) in parsed.skills" :key="`skill-${idx}`">• {{ item }}</li>
              </ul>
              <p v-else class="text-sm text-gray-400">No data found.</p>
            </div>

            <div class="bg-white rounded-xl shadow-sm p-5">
              <h3 class="text-sm font-semibold text-gray-700 mb-3">Education</h3>
              <ul v-if="parsed.education.length" class="text-sm text-gray-700 space-y-2">
                <li v-for="(item, idx) in parsed.education" :key="`edu-${idx}`">• {{ item }}</li>
              </ul>
              <p v-else class="text-sm text-gray-400">No data found.</p>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-6">
            <div class="flex items-center justify-between mb-3">
              <h2 class="text-lg font-semibold">Raw OCR Text</h2>
              <button
                :disabled="!ocrText"
                @click="copyText"
                class="text-sm text-blue-600 hover:text-blue-700"
              >
                Copy
              </button>
            </div>
            <pre class="text-xs text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border border-gray-100 min-h-40">
{{ ocrText || 'OCR result will appear here.' }}
            </pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { recognize } from 'tesseract.js'
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

const file = ref(null)
const fileType = ref('image')
const previewUrl = ref('')
const ocrText = ref('')
const loading = ref(false)
const progress = ref(0)
const selectedLangs = ref(['eng', 'rus', 'uzb', 'ind'])

const parsed = computed(() => parseCv(ocrText.value))

const onFileChange = (event) => {
  const selected = event.target.files?.[0]
  if (!selected) return

  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  file.value = selected
  fileType.value = selected.type === 'application/pdf' ? 'pdf' : 'image'
  previewUrl.value = URL.createObjectURL(selected)
}

const runOcr = async () => {
  if (!file.value) return
  loading.value = true
  progress.value = 0
  ocrText.value = ''

  try {
    const langs = selectedLangs.value.length ? selectedLangs.value.join('+') : 'eng'
    if (fileType.value === 'pdf') {
      const pages = await renderPdfAllPagesToCanvas(file.value)
      const texts = []

      for (let i = 0; i < pages.length; i += 1) {
        const pageCanvas = pages[i]
        const result = await recognize(pageCanvas, langs, {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              progress.value = (i + m.progress) / pages.length
            }
          },
        })
        texts.push(result.data?.text || '')
      }

      ocrText.value = texts
        .map((t, idx) => `--- Page ${idx + 1} ---\n${t}`)
        .join('\n\n')
    } else {
      const result = await recognize(file.value, langs, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            progress.value = m.progress
          }
        },
      })
      ocrText.value = result.data?.text || ''
    }
  } catch (err) {
    console.error('OCR failed:', err)
  } finally {
    loading.value = false
  }
}

const clearAll = () => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  file.value = null
  fileType.value = 'image'
  previewUrl.value = ''
  ocrText.value = ''
  progress.value = 0
}

const copyText = async () => {
  if (!ocrText.value) return
  try {
    await navigator.clipboard.writeText(ocrText.value)
  } catch (err) {
    console.error('Copy failed:', err)
  }
}

function parseCv(text) {
  // Remove page markers from PDF output
  let cleanText = (text || '').replace(/--- Page \d+ ---/g, '').trim()

  // Normalize OCR bullet artifacts into line breaks
  cleanText = cleanText
    .replace(/[•·▪□*\-–—]\s+/g, '\n')
    .replace(/(^|\n)\s*[eе]\s+(?=\S)/g, '\n')
    .replace(/\n{2,}/g, '\n\n')

  // Split by double newlines or multiple empty lines to get paragraphs
  const rawParagraphs = cleanText.split(/\n\s*\n/)
  const paragraphs = rawParagraphs.map((p) => p.trim()).filter(Boolean)

  // Further split paragraphs into lines for more granular processing
  const lines = paragraphs.flatMap((p) => p.split(/\r?\n/).map((l) => l.trim()).filter(Boolean))

  const sections = {
    experience: [],
    skills: [],
    education: [],
  }

  const headingMap = [
    {
      key: 'experience',
      patterns: [
        /^work\s*experience/i,
        /^experience/i,
        /^employment/i,
        /^опыт\s*работы/i,
        /^опыт/i,
        /^ish\s*tajriba/i,
        /^tajriba/i,
        /^pengalaman\s*kerja/i,
        /^pengalaman/i,
        /^riwayat\s*pekerjaan/i,
        /^riwayat/i,
        /^kerja/i,
      ],
    },
    {
      key: 'skills',
      patterns: [
        /^skills?/i,
        /^technical\s*skills/i,
        /^competencies/i,
        /^навыки/i,
        /^умения/i,
        /^ko'nikmalar/i,
        /^ko‘nikmalar/i,
        /^malakalar/i,
        /^keterampilan/i,
        /^keahlian/i,
      ],
    },
    {
      key: 'education',
      patterns: [
        /^education/i,
        /^academic/i,
        /^qualifications/i,
        /^образование/i,
        /^ta'lim/i,
        /^ta’lim/i,
        /^pendidikan/i,
      ],
    },
  ]

  let current = null
  for (const line of lines) {
    // Clean OCR bullet artifacts
    const cleanedLine = line.replace(/^[•е•\-*·•□▪]\s*/, '').trim()
    if (!cleanedLine) continue

    const heading = headingMap.find((h) => h.patterns.some((p) => p.test(cleanedLine)))
    if (heading) {
      current = heading.key
      continue
    }

    if (current) {
      sections[current].push(cleanedLine)
    }
  }
  console.log('Parsed CV sections:', sections)
  return sections
}

async function renderPdfAllPagesToCanvas(fileBlob) {
  const buffer = await fileBlob.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  const canvases = []

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum)
    const viewport = page.getViewport({ scale: 2 })
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    canvas.width = viewport.width
    canvas.height = viewport.height
    await page.render({ canvasContext: context, viewport }).promise
    canvases.push(canvas)
  }

  return canvases
}
</script>
