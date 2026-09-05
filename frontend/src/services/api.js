// frontend/src/services/api.js
const API_URL = "http://localhost:8000";

export const api = {
    // Helper to get the token from localStorage
    getHeaders() {
        const token = localStorage.getItem("token");
        return {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
    },

    async login(email, password) {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        if (!res.ok) throw new Error("Invalid credentials");
        return res.json();
    },

    async register(email, password, fullName) {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, full_name: fullName }),
        });
        if (!res.ok) throw new Error("Registration failed");
        return res.json();
    },

    async getDocuments() {
        const res = await fetch(`${API_URL}/documents/`, {
            headers: this.getHeaders(),
        });
        if (!res.ok) throw new Error("Failed to fetch documents");
        return res.json();
    },

    async uploadDocument(file) {
        const formData = new FormData();

        // 1. CHANGE "file" to "files" to match the backend parameter name
        formData.append("files", file);

        const res = await fetch(`${API_URL}/documents/upload`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
                // Note: Do NOT set "Content-Type": "application/json" here.
                // The browser automatically sets the correct multipart/form-data boundary.
            },
            body: formData,
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));

            // 2. Extract the actual error message from FastAPI's 422 response
            // FastAPI returns 422 errors as an array of objects under "detail"
            const errorMsg = Array.isArray(errorData.detail)
                ? errorData.detail[0].msg
                : (errorData.detail || "Upload failed");

            throw new Error(errorMsg);
        }

        return res.json();
    },

    async askQuestion(question, documentIds) {
        const res = await fetch(`${API_URL}/chat/ask`, {
            method: "POST",
            headers: this.getHeaders(),
            body: JSON.stringify({ question, document_ids: documentIds }),
        });
        if (!res.ok) throw new Error("Chat request failed");
        return res.json();
    },

    async deleteDocument(documentId) {
        const res = await fetch(`${API_URL}/documents/${documentId}`, {
            method: "DELETE",
            headers: this.getHeaders(),
        });
        if (!res.ok) throw new Error("Delete failed");
        return true;
    },
    // Add these methods to the api object

    async createChatSession() {
        const res = await fetch(`${API_URL}/chat/sessions`, {
            method: "POST",
            headers: this.getHeaders(),
        });
        if (!res.ok) throw new Error("Failed to create session");
        return res.json();
    },

    async getChatSessions() {
        const res = await fetch(`${API_URL}/chat/sessions`, {
            headers: this.getHeaders(),
        });
        if (!res.ok) throw new Error("Failed to fetch sessions");
        return res.json();
    },

    async getSessionHistory(sessionId) {
        const res = await fetch(`${API_URL}/chat/sessions/${sessionId}/history`, {
            headers: this.getHeaders(),
        });
        if (!res.ok) throw new Error("Failed to fetch history");
        return res.json();
    },

    async askQuestion(question, documentIds, sessionId = null, modelName = "llama-3.1-8b-instant") {
        const res = await fetch(`${API_URL}/chat/ask`, {
            method: "POST",
            headers: this.getHeaders(),
            body: JSON.stringify({
                question,
                document_ids: documentIds,
                session_id: sessionId,
                model_name: modelName
            }),
        });
        if (!res.ok) throw new Error("Chat request failed");
        return res.json();
    },
    async deleteChatSession(sessionId) {
        const res = await fetch(`${API_URL}/chat/sessions/${sessionId}`, {
            method: "DELETE",
            headers: this.getHeaders(),
        });
        if (!res.ok) throw new Error("Failed to delete session");
        return true;
    },
};
