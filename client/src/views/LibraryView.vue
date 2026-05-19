<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { FileText, Plus, ArrowLeft, Trash, FileUp, Pencil } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Textarea from '@/components/ui/Textarea.vue'
import Badge from '@/components/ui/Badge.vue'
import Card from '@/components/ui/Card.vue'
import Modal from '@/components/ui/Modal.vue'
import Spinner from '@/components/ui/Spinner.vue'
import ImportWizard from '@/components/ImportWizard.vue'
import { getGraphOverview, deleteDocument, updateDocument, getNodeDetail } from '@/api'
import type { GraphNode } from '@/types'
import { getTypeLabel, getBadgeStyle } from '@/lib/nodeTypes'

const documents = ref<GraphNode[]>([])
const loading = ref(true)
const importWizardOpen = ref(false)

// Edit state
const editOpen = ref(false)
const editLoading = ref(false)
const editError = ref('')
const editDocId = ref('')
const editForm = ref({ title: '', summary: '', content: '', url: '' })

async function loadDocuments() {
    loading.value = true
    try {
        const data = await getGraphOverview()
        documents.value = data.nodes
            .filter((n) => n.type === 'doc')
            .sort((a, b) => {
                const da = a.created_at ? new Date(a.created_at).getTime() : 0
                const db = b.created_at ? new Date(b.created_at).getTime() : 0
                return db - da
            })
    } catch (e) {
        console.error('Failed to load documents:', e)
    } finally {
        loading.value = false
    }
}

async function confirmDelete(docId: string) {
    const ok = window.confirm('确定要删除该文档吗？此操作不可恢复。')
    if (!ok) return
    try {
        await deleteDocument(docId)
        await loadDocuments()
    } catch (e) {
        console.error('Delete failed:', e)
        alert(e instanceof Error ? e.message : '删除失败')
    }
}

async function openEdit(doc: GraphNode) {
    editDocId.value = doc.id
    editError.value = ''
    editForm.value = {
        title: doc.label,
        summary: doc.desc || '',
        content: '',
        url: doc.url || '',
    }
    // Load full content from node detail
    try {
        const detail = await getNodeDetail(doc.id)
        editForm.value.content = detail.full_content || ''
    } catch (e) {
        console.error('Failed to load document content:', e)
    }
    editOpen.value = true
}

async function handleEditSubmit() {
    if (!editDocId.value) return
    editLoading.value = true
    editError.value = ''
    try {
        await updateDocument(editDocId.value, {
            title: editForm.value.title,
            summary: editForm.value.summary,
            content: editForm.value.content,
            url: editForm.value.url || null,
        })
        editOpen.value = false
        await loadDocuments()
    } catch (e) {
        editError.value = e instanceof Error ? e.message : '保存失败'
    } finally {
        editLoading.value = false
    }
}

onMounted(() => {
    loadDocuments()
})

function handleImportSuccess() {
    loadDocuments()
}
</script>

<template>
    <div class="min-h-screen bg-stone-100">
        <!-- Header -->
        <header class="border-b border-stone-200 bg-white">
            <div class="mx-auto max-w-5xl px-6 py-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <RouterLink to="/"
                            class="flex items-center gap-2 text-stone-400 hover:text-stone-600 transition-colors">
                            <ArrowLeft class="h-4 w-4" />
                            返回
                        </RouterLink>
                        <h1 class="text-xl font-semibold text-stone-700">知识库</h1>
                    </div>
                    <div class="flex gap-2">
                        <Button @click="importWizardOpen = true">
                            <FileUp class="mr-2 h-4 w-4" />
                            智能导入
                        </Button>
                    </div>
                </div>
            </div>
        </header>

        <!-- Content -->
        <main class="mx-auto max-w-5xl px-6 py-8">
            <div v-if="loading" class="flex justify-center py-16">
                <Spinner size="lg" />
            </div>

            <div v-else-if="documents.length === 0" class="flex flex-col items-center justify-center py-16">
                <FileText class="h-12 w-12 text-stone-300" />
                <p class="mt-4 text-stone-500">暂无文档</p>
                <Button class="mt-4" @click="importWizardOpen = true">
                    <Plus class="mr-2 h-4 w-4" />
                    导入第一个文档
                </Button>
            </div>
            <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card v-for="doc in documents" :key="doc.id"
                    class="cursor-pointer transition-colors hover:bg-stone-100">
                    <div class="flex items-start justify-between">
                        <!-- Left: icon + badge -->
                        <div class="flex flex-col items-center gap-2 m-2 ml-0">
                            <div class="flex h-10 w-10 items-center justify-center rounded-lg"
                                :style="{ backgroundColor: getBadgeStyle('doc', doc.doc_type).backgroundColor }">
                                <FileText class="h-5 w-5 text-stone-600" />
                            </div>
                            <Badge :style="getBadgeStyle('doc', doc.doc_type)" class="text-xs">
                                {{ getTypeLabel('doc', doc.doc_type) }}
                            </Badge>
                        </div>

                        <!-- Middle: main content -->
                        <div class="min-w-0 flex-1">
                            <h3 class="truncate font-medium text-stone-700">
                                {{ doc.label }}
                            </h3>
                            <p v-if="doc.desc" class="mt-1 line-clamp-2 text-sm text-stone-500">
                                {{ doc.desc }}
                            </p>
                            <div class="flex flex-row items-end justify-between">
                                <div class="text-xs text-stone-400 mt-2">
                                    {{ doc.created_at ? new Date(doc.created_at).toLocaleString() : '' }}
                                </div>
                                <div class="flex gap-3">
                                    <button class="text-stone-400 hover:text-stone-600" @click.stop="openEdit(doc)">
                                        <Pencil class="h-4 w-4" />
                                    </button>
                                    <button class="text-stone-400 hover:text-red-500" @click.stop="confirmDelete(doc.id)">
                                        <Trash class="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </main>

        <!-- Import Wizard -->
        <ImportWizard :show="importWizardOpen" @close="importWizardOpen = false" @success="handleImportSuccess" />

        <!-- Edit Modal -->
        <Modal :open="editOpen" @update:open="(v) => { if (!v) editOpen = false }" class="max-w-2xl">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-bold">编辑文档</h2>
                <div class="flex gap-2">
                    <Button variant="secondary" @click="editOpen = false">取消</Button>
                    <Button @click="handleEditSubmit" :disabled="editLoading">
                        {{ editLoading ? '保存中...' : '保存' }}
                    </Button>
                </div>
            </div>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-1">标题</label>
                    <Input v-model="editForm.title" placeholder="文档标题" />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">摘要</label>
                    <Textarea v-model="editForm.summary" :rows="3" placeholder="文档摘要" />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">内容</label>
                    <Textarea v-model="editForm.content" :rows="12" placeholder="文档内容" />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">链接</label>
                    <Input v-model="editForm.url" placeholder="可选" />
                </div>
                <div v-if="editError" class="p-3 bg-red-100 text-red-700 rounded text-sm">
                    {{ editError }}
                </div>
            </div>
        </Modal>
    </div>
</template>
