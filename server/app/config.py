"""Configuration management using pydantic-settings"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings"""

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # OpenAI Configuration
    openai_api_key: str = "sk-4521df8132364b1c991742ecc20a67a8"
    openai_base_url: str = "https://dashscope.aliyuncs.com/compatible-mode/v1"
    openai_model: str = "qwen-plus"
    openai_embedding_model: str = "text-embedding-v2"

    # Langfuse Configuration (optional)
    langfuse_secret_key: str | None = None
    langfuse_public_key: str | None = None
    langfuse_host: str = "https://cloud.langfuse.com"
    langfuse_enabled: bool = False

    # SurrealDB Configuration
    surrealdb_url: str = "ws://localhost:8000/rpc"
    surrealdb_namespace: str = "markmind"
    surrealdb_database: str = "knowledge"
    surrealdb_username: str = "root"
    surrealdb_password: str = "root"

    # Application Configuration
    app_host: str = "0.0.0.0"
    app_port: int = 8080
    upload_dir: str = "./uploads"
    chunk_size: int = 1000
    chunk_overlap: int = 200

    # Optional Tavily search integration
    tavily_api_key: str | None = None
    tavily_host: str | None = None
    tavily_enabled: bool = False

    # Vector dimension
    embedding_dimension: int = 1536

    # Embedding API batch size (max items per request)
    embedding_batch_size: int = 10


settings = Settings()
