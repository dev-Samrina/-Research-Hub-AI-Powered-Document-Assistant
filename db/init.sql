-- db/init.sql
-- Research Hub Database Schema
-- PostgreSQL + pgvector

-- ============================================
-- 1. Enable the pgvector extension
-- ============================================
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- 2. Users table (Authentication)
-- ============================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    full_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast email lookups during login
CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- 3. Documents table (PDF metadata)
-- ============================================
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'uploaded',  -- uploaded, processing, ready, failed
    total_chunks INTEGER DEFAULT 0,
    uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast user document lookups
CREATE INDEX idx_documents_user_id ON documents(user_id);

-- ============================================
-- 4. Chunks table (Text chunks + vector embeddings)
-- ============================================
CREATE TABLE chunks (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INTEGER,
    content TEXT NOT NULL,
    embedding vector(384)  -- 384 dimensions for BAAI/bge-small-en-v1.5
);

-- Index for fast document chunk lookups
CREATE INDEX idx_chunks_document_id ON chunks(document_id);

-- HNSW index for fast vector similarity searches
-- Note: Using HNSW instead of IVFFlat because:
--   - HNSW works on empty tables (IVFFlat requires pre-existing data)
--   - HNSW has better query performance
--   - HNSW supports incremental inserts
CREATE INDEX idx_chunks_embedding ON chunks
USING hnsw (embedding vector_cosine_ops);

-- ============================================
-- 5. Chat sessions table (Conversation grouping)
-- ============================================
CREATE TABLE chat_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) DEFAULT 'New Chat',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast user session lookups
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_updated_at ON chat_sessions(updated_at DESC);

-- ============================================
-- 6. Conversations table (Individual Q&A pairs)
-- ============================================
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES chat_sessions(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    sources JSONB,  -- Array of source citations
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for fast conversation lookups
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_session_id ON conversations(session_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);
