<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import Modal from '@/components/ui/Modal.vue'
import Badge from '@/components/ui/Badge.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Textarea from '@/components/ui/Textarea.vue'
import Spinner from '@/components/ui/Spinner.vue'
import { Plus, Pencil, Trash, X } from 'lucide-vue-next'
import type { GraphNode, NodeDetail } from '@/types'
import { getNodeDetail, getNodeRelations, updateConcept, deleteConcept, deleteMention, deleteRelated, createRelated } from '@/api'
import { getTypeLabel, getBadgeStyle } from '@/lib/nodeTypes'

const props = defineProps<{
    node: GraphNode | null
    open: boolean
}>()

const emit = defineEmits<{
    'update:open': [value: boolean]
    nodeClick: [node: GraphNode]
    'add-to-context': [node: GraphNode]
    changed: []
}>()

const loading = ref(false)
const detail = ref<NodeDetail | null>(null)
const error = ref<string | null>(null)

// Relations state
const relations = ref<any>(null)
const relationsLoading = ref(false)

// Edit concept state
const editing = ref(false)
const editForm = ref({ name: '', desc: '' })
const editLoading = ref(false)
const editError = ref('')

// Add related state
const addingRelated = ref(false)
const newRelatedId = ref('')
const newRelatedDesc = ref('')
const addRelatedError = ref('')
const addRelatedLoading = ref(false)

watch(
    () => props.node,
    async (newNode) => {
        if (!newNode) {
            detail.value = null
            relations.value = null
            editing.value = false
            return
        }
        loading.value = true
        error.value = null
        try {
            detail.value = await getNodeDetail(newNode.id)
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Failed to load node detail'
            detail.value = null
        } finally {
            loading.value = false
        }
        // Load relations
        loadRelations(newNode.id)
    },
    { immediate: true },
)

async function loadRelations(nodeId: string) {
    relationsLoading.value = true
    try {
        relations.value = await getNodeRelations(nodeId)
    } catch (e) {
        relations.value = null
    } finally {
        relationsLoading.value = false
    }
}

function startEdit() {
    if (!detail.value) return
    editForm.value = { name: detail.value.node.label, desc: detail.value.node.desc || '' }
    editError.value = ''
    editing.value = true
}

async function submitEdit() {
    if (!props.node) return
    editLoading.value = true
    editError.value = ''
    try {
        await updateConcept(props.node.id, editForm.value.name, editForm.value.desc)
        editing.value = false
        detail.value = await getNodeDetail(props.node.id)
        emit('changed')
    } catch (e) {
        editError.value = e instanceof Error ? e.message : '保存失败'
    } finally {
        editLoading.value = false
    }
}

async function handleDeleteConcept() {
    if (!props.node) return
    if (!window.confirm('确定要删除该概念节点吗？相关关系也会一并删除。')) return
    try {
        await deleteConcept(props.node.id)
        emit('changed')
        emit('update:open', false)
    } catch (e) {
        alert(e instanceof Error ? e.message : '删除失败')
    }
}

async function handleDeleteMention(docId: string, conceptId: string) {
    if (!window.confirm('确定要删除该引用关系吗？')) return
    try {
        await deleteMention(docId, conceptId)
        await loadRelations(props.node!.id)
        emit('changed')
    } catch (e) {
        alert(e instanceof Error ? e.message : '删除失败')
    }
}

async function handleDeleteRelated(fromId: string, toId: string) {
    if (!window.confirm('确定要删除该关联关系吗？')) return
    try {
        await deleteRelated(fromId, toId)
        await loadRelations(props.node!.id)
        emit('changed')
    } catch (e) {
        alert(e instanceof Error ? e.message : '删除失败')
    }
}

async function handleAddRelated() {
    if (!props.node || !newRelatedId.value.trim()) return
    addRelatedLoading.value = true
    addRelatedError.value = ''
    try {
        await createRelated(props.node.id, newRelatedId.value.trim(), newRelatedDesc.value.trim())
        newRelatedId.value = ''
        newRelatedDesc.value = ''
        addingRelated.value = false
        await loadRelations(props.node.id)
        emit('changed')
    } catch (e) {
        addRelatedError.value = e instanceof Error ? e.message : '添加失败'
    } finally {
        addRelatedLoading.value = false
    }
}

function handleRecommendationClick(node: GraphNode) {
    emit('update:open', false)
    setTimeout(() => emit('nodeClick', node), 200)
}

function handleAddToContext(node: GraphNode) {
    emit('update:open', false)
    setTimeout(() => emit('add-to-context', node), 200)
}

function escapeHtml(str: string) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

const urlRegex = /((?:https?:\/\/|www\.)[^\s"'<>]+)/gi

function linkify(text: string) {
    if (!text) return ''
    const escaped = escapeHtml(text)
    return escaped.replace(urlRegex, (m) => {
        const href = m.startsWith('http') ? m : `https://${m}`
        return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-stone-600 underline">${m}</a>`
    })
}

const linkifiedDesc = computed(() =>
    detail.value?.node?.desc ? linkify(detail.value.node.desc) : ''
)
const linkifiedFullContent = computed(() =>
    detail.value?.full_content ? linkify(detail.value.full_content) : ''
)

const isConcept = computed(() => props.node?.type === 'concept')
</script>

<template>
    <Modal :open="open" @update:open="emit('update:open', $event)" class="max-w-2xl">
        <div v-if="loading" class="flex justify-center py-12">
            <Spinner size="lg" />
        </div>

        <div v-else-if="error" class="py-12 text-center text-stone-500">
            {{ error }}
        </div>

        <div v-else-if="detail" class="space-y-6">
            <!-- Header -->
            <div>
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <Badge :style="getBadgeStyle(detail.node.type, detail.node.doc_type)">
                            {{ getTypeLabel(detail.node.type, detail.node.doc_type) }}
                        </Badge>
                        <Badge :style="getBadgeStyle(detail.node.type, detail.node.doc_type)"
                            class="cursor-pointer flex items-center gap-1"
                            @click="handleAddToContext(detail.node)">
                            <Plus class="h-3 w-3" />
                            加入上下文
                        </Badge>
                    </div>
                    <!-- concept 操作按钮 -->
                    <div v-if="isConcept" class="flex gap-2 mr-8">
                        <button class="text-stone-400 hover:text-stone-600" @click="startEdit" title="编辑">
                            <Pencil class="h-4 w-4" />
                        </button>
                        <button class="text-stone-400 hover:text-red-500" @click="handleDeleteConcept" title="删除">
                            <Trash class="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <!-- 编辑表单 -->
                <div v-if="editing" class="mt-3 space-y-2">
                    <Input v-model="editForm.name" placeholder="概念名称" />
                    <Textarea v-model="editForm.desc" :rows="3" placeholder="概念描述" />
                    <div v-if="editError" class="text-sm text-red-600">{{ editError }}</div>
                    <div class="flex gap-2">
                        <Button size="sm" @click="submitEdit" :disabled="editLoading">
                            {{ editLoading ? '保存中...' : '保存' }}
                        </Button>
                        <Button size="sm" variant="secondary" @click="editing = false">取消</Button>
                    </div>
                </div>
                <template v-else>
                    <h2 class="mt-2 text-xl font-semibold text-stone-800">{{ detail.node.label }}</h2>
                    <p v-if="detail.node.desc" class="mt-1 text-stone-500" v-html="linkifiedDesc"></p>
                    <a v-if="detail.node.url" :href="detail.node.url" target="_blank" rel="noopener noreferrer"
                        class="text-sm text-stone-600 underline break-all">
                        {{ detail.node.url }}
                    </a>
                    <p v-if="detail.node.created_at" class="mt-1 text-xs text-stone-400">
                        创建于: {{ new Date(detail.node.created_at).toLocaleString() }}
                    </p>
                </template>
            </div>

            <!-- Full content -->
            <div v-if="detail.full_content" class="max-h-64 overflow-y-auto rounded-lg bg-stone-100 p-4">
                <div class="whitespace-pre-wrap text-sm text-stone-700" v-html="linkifiedFullContent"></div>
            </div>

            <!-- Relations (concept only) -->
            <div v-if="isConcept && relations">
                <!-- Related concepts -->
                <div v-if="relations.related?.length > 0 || addingRelated">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="font-medium text-stone-700">关联概念 ({{ relations.related?.length ?? 0 }})</h3>
                        <button class="text-stone-400 hover:text-stone-600 text-sm flex items-center gap-1"
                            @click="addingRelated = !addingRelated">
                            <Plus class="h-3 w-3" />添加
                        </button>
                    </div>
                    <!-- Add related form -->
                    <div v-if="addingRelated" class="mb-2 p-3 rounded border border-stone-200 bg-stone-50 space-y-2">
                        <Input v-model="newRelatedId" placeholder="目标概念 ID（如 concept:xxx）" class="text-sm" />
                        <Input v-model="newRelatedDesc" placeholder="关系描述（可选）" class="text-sm" />
                        <div v-if="addRelatedError" class="text-sm text-red-600">{{ addRelatedError }}</div>
                        <div class="flex gap-2">
                            <Button size="sm" @click="handleAddRelated" :disabled="addRelatedLoading">
                                {{ addRelatedLoading ? '添加中...' : '确认' }}
                            </Button>
                            <Button size="sm" variant="secondary" @click="addingRelated = false">取消</Button>
                        </div>
                    </div>
                    <div class="space-y-1">
                        <div v-for="(rel, idx) in relations.related" :key="idx"
                            class="flex items-center justify-between rounded border border-stone-200 bg-white px-3 py-2 text-sm">
                            <span class="text-stone-600">
                                {{ rel.from_id === node?.id ? rel.to_id : rel.from_id }}
                                <span v-if="rel.desc" class="text-stone-400 ml-1">— {{ rel.desc }}</span>
                            </span>
                            <button class="text-stone-300 hover:text-red-500 ml-2"
                                @click="handleDeleteRelated(rel.from_id, rel.to_id)">
                                <X class="h-3 w-3" />
                            </button>
                        </div>
                    </div>
                </div>
                <div v-else>
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="font-medium text-stone-700">关联概念</h3>
                        <button class="text-stone-400 hover:text-stone-600 text-sm flex items-center gap-1"
                            @click="addingRelated = !addingRelated">
                            <Plus class="h-3 w-3" />添加
                        </button>
                    </div>
                    <div v-if="addingRelated" class="mb-2 p-3 rounded border border-stone-200 bg-stone-50 space-y-2">
                        <Input v-model="newRelatedId" placeholder="目标概念 ID（如 concept:xxx）" class="text-sm" />
                        <Input v-model="newRelatedDesc" placeholder="关系描述（可选）" class="text-sm" />
                        <div v-if="addRelatedError" class="text-sm text-red-600">{{ addRelatedError }}</div>
                        <div class="flex gap-2">
                            <Button size="sm" @click="handleAddRelated" :disabled="addRelatedLoading">
                                {{ addRelatedLoading ? '添加中...' : '确认' }}
                            </Button>
                            <Button size="sm" variant="secondary" @click="addingRelated = false">取消</Button>
                        </div>
                    </div>
                    <p v-else class="text-sm text-stone-400">暂无关联概念</p>
                </div>

                <!-- Mentions (docs that reference this concept) -->
                <div v-if="relations.mentions_in?.length > 0" class="mt-4">
                    <h3 class="font-medium text-stone-700 mb-2">
                        被引用的文档 ({{ relations.mentions_in.length }})
                    </h3>
                    <div class="space-y-1">
                        <div v-for="(m, idx) in relations.mentions_in" :key="idx"
                            class="flex items-center justify-between rounded border border-stone-200 bg-white px-3 py-2 text-sm">
                            <span class="text-stone-600">
                                {{ m.doc_title || m.doc_id }}
                                <span v-if="m.desc" class="text-stone-400 ml-1">— {{ m.desc }}</span>
                            </span>
                            <button class="text-stone-300 hover:text-red-500 ml-2"
                                @click="handleDeleteMention(m.doc_id, node!.id)">
                                <X class="h-3 w-3" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Recommendations -->
            <div v-if="detail.recommendations.length > 0">
                <h3 class="mb-3 font-medium text-stone-700">相关推荐</h3>
                <div class="space-y-2">
                    <div v-for="rec in detail.recommendations" :key="rec.id"
                        class="cursor-pointer rounded-lg border border-stone-200 bg-white p-3 transition-colors hover:bg-stone-50"
                        @click="handleRecommendationClick(rec)">
                        <div class="flex items-center gap-2">
                            <Badge :style="getBadgeStyle(rec.type, rec.doc_type)" class="text-xs">
                                {{ getTypeLabel(rec.type, rec.doc_type) }}
                            </Badge>
                            <span class="font-medium text-stone-700">{{ rec.label }}</span>
                        </div>
                        <p v-if="rec.desc" class="mt-1 line-clamp-1 text-sm text-stone-500">
                            {{ rec.desc }}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </Modal>
</template>
