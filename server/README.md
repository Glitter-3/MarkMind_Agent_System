# MarkMind Backend

本地化个人知识库系统后端，基于 FastAPI + SurrealDB + LangGraph 实现 Graph RAG。

## 功能特性

- 📄 支持多种文档格式（Markdown、PDF、纯文本）
- 🔍 语义搜索和向量检索
- 🕸️ 知识图谱自动构建
- 💬 基于 ReAct 的智能对话
- 🎯 混合检索（Graph + Vector）

## 技术栈

- **Framework**: FastAPI
- **Database**: SurrealDB (向量数据库)
- **LLM**: OpenAI Compatible API
- **Orchestration**: LangGraph
- **Embeddings**: 1024 维向量模型

## 快速开始

### 1. 安装依赖

使用 uv（推荐）:
```bash
uv sync
```

或使用 pip:
```bash
pip install -e .
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env` 并配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件，设置你的 OpenAI API 配置。

如果你有 Tavily 实例并想让 Agent 能调用 Tavily，请在 `.env` 中设置：

```dotenv
TAVILY_ENABLED=true
TAVILY_API_KEY=your_key_here
TAVILY_HOST=https://api.tavily.example
```


### 3. 启动 SurrealDB

```bash
surreal start --log trace --user root --pass root memory
```

或使用文件存储:
```bash
surreal start --log trace --user root --pass root file://markmind.db
```

### 4. 初始化数据库

```bash
python -m app.init_db
```

这会创建数据库表结构并插入测试数据。

### 5. 启动服务

```bash
fastapi dev main.py
```

服务将在 http://localhost:8000 启动。

访问 API 文档：http://localhost:8000/docs

## API 接口

### 数据摄入

- `POST /api/ingest/upload` - 上传文档（文件或文本）

### 图谱交互

- `GET /api/graph/overview` - 获取完整知识图谱
- `GET /api/graph/node/{node_id}` - 获取节点详情和推荐
- `POST /api/graph/search` - 语义搜索

### 智能对话

- `POST /api/chat/chat` - Agent RAG 对话（流式响应）

## 项目结构

```
server/
├── main.py                 # 应用入口
├── app/
│   ├── __init__.py
│   ├── config.py          # 配置管理
│   ├── models.py          # 数据模型
│   ├── database.py        # 数据库操作
│   ├── utils.py           # LLM 和文本处理工具
│   ├── file_utils.py      # 文件处理
│   ├── init_db.py         # 数据库初始化
│   └── api/
│       ├── __init__.py
│       ├── ingest.py      # 文档摄入 API
│       ├── graph.py       # 图谱交互 API
│       └── chat.py        # 对话 API
├── pyproject.toml
└── .env.example
```

## 开发指南

### 数据库模型

- **doc**: 文档节点（图谱可视化）
- **concept**: 概念节点（图谱可视化）
- **chunk**: 文本切片（仅用于检索）
- **mentions**: 文档→概念关系
- **related**: 概念↔概念关系

### 处理流程

1. **文档上传** → 生成摘要和向量
2. **文本切分** → 创建 chunks 用于精确检索
3. **知识提取** → LLM 提取概念和关系
4. **图谱构建** → 建立节点和边

### 测试

启动后可以使用 curl 或 Postman 测试：

```bash
# 健康检查
curl http://localhost:8000/health

# 获取图谱
curl http://localhost:8000/api/graph/overview

# 搜索
curl -X POST http://localhost:8000/api/graph/search \
  -H "Content-Type: application/json" \
  -d '{"query": "machine learning"}'
```

## 注意事项

1. 首次使用需要启动 SurrealDB 并初始化数据库
2. 需要配置有效的 OpenAI Compatible API
3. Embedding 模型必须支持 1024 维向量
4. 推荐使用 `text-embedding-3-large` 模型

## License

MIT
