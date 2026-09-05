// frontend/src/pages/Chat.jsx
import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { api } from "../services/api";
import toast from "react-hot-toast";
import Layout from "../components/Layout";

import {
  Send,
  FileText,
  BookOpen,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Plus,
  Globe,
  MessageSquare,
  Trash2,
  Sparkles,
} from "lucide-react";

export default function Chat() {
  const [docs, setDocs] = useState([]);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSources, setExpandedSources] = useState({});
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [selectedModel, setSelectedModel] = useState("llama-3.1-8b-instant"); // <-- Model State
  const messagesEndRef = useRef(null);

  // Fetch documents on load
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const data = await api.getDocuments();
        const readyDocs = data.filter((d) => d.status === "ready");
        setDocs(readyDocs);
        setSelectedDocs(readyDocs.map((d) => d.id));
      } catch (err) {
        toast.error("Failed to load documents");
      }
    };
    fetchDocs();
  }, []);

  // Fetch chat sessions on load
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const data = await api.getChatSessions();
        setSessions(data);
      } catch (err) {
        console.error("Failed to load sessions", err);
      }
    };
    fetchSessions();
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Create a new chat session
  const handleNewChat = () => {
    setCurrentSession(null);
    setMessages([]);
    setExpandedSources({});
    setInput("");
    toast.success("Started new chat");
  };

  // Load an existing chat session
  const handleLoadSession = async (session) => {
    try {
      setCurrentSession(session);
      const history = await api.getSessionHistory(session.id);
      const formattedMessages = [];
      history.forEach((h) => {
        formattedMessages.push({ role: "user", content: h.question });
        formattedMessages.push({
          role: "ai",
          content: h.answer,
          sources: h.sources || [],
        });
      });
      setMessages(formattedMessages);
    } catch (err) {
      toast.error("Failed to load chat history");
    }
  };

  // Delete a chat session
  const handleDeleteSession = async (sessionId, e) => {
    e.stopPropagation(); // Prevent triggering the "load session" click
    if (!window.confirm("Are you sure you want to delete this chat?")) return;

    try {
      await api.deleteChatSession(sessionId);
      setSessions(sessions.filter((s) => s.id !== sessionId));

      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
        setMessages([]);
      }
      toast.success("Chat deleted");
    } catch (err) {
      toast.error("Failed to delete chat");
    }
  };

  // Send a message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (selectedDocs.length === 0) {
      toast.error("Please select at least one document");
      return;
    }

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    try {
      const response = await api.askQuestion(
        currentInput,
        selectedDocs,
        currentSession?.id,
        selectedModel // <-- Pass model to API
      );

      if (!currentSession && response.session_id) {
        const newSession = {
          id: response.session_id,
          title: currentInput.substring(0, 50),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setCurrentSession(newSession);
        setSessions([newSession, ...sessions]);
      }

      const aiMessage = {
        role: "ai",
        content: response.answer,
        sources: response.sources,
        usedWebSearch: response.used_web_search,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: "Sorry, I encountered an error. Please try again.",
          isError: true,
          timestamp: new Date().toISOString(),
        },
      ]);
      toast.error("Failed to get response");
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle source expansion
  const toggleSource = (messageIdx, sourceIdx) => {
    const key = `${messageIdx}-${sourceIdx}`;
    setExpandedSources((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Clear current chat UI
  const handleClearChat = () => {
    setMessages([]);
    setExpandedSources({});
    toast.success("Chat cleared");
  };

  return (
    <Layout>
      <div className="flex h-[calc(100vh-8rem)] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

        {/* ================= SIDEBAR ================= */}
        <div className="w-80 bg-gradient-to-b from-slate-50 to-blue-50 border-r border-gray-200 flex flex-col">

          {/* 1. Fixed Header */}
          <div className="p-6 border-b border-gray-200 bg-white/60 backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Chat Assistant</h2>
                <p className="text-xs text-gray-500">Ask questions about your docs</p>
              </div>
            </div>
          </div>

          {/* 2. Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">

            {/* New Chat Button */}
            <button
              onClick={handleNewChat}
              className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium flex items-center justify-center space-x-2 shadow-sm"
            >
              <Plus className="w-5 h-5" />
              <span>New Chat</span>
            </button>

            {/* Recent Chats List */}
            {sessions.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Recent Chats
                </label>
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className={`group flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${currentSession?.id === session.id
                        ? "bg-blue-100 text-blue-700 font-medium border border-blue-200"
                        : "text-gray-700 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200"
                        }`}
                      onClick={() => handleLoadSession(session)}
                    >
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <MessageSquare className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{session.title}</span>
                      </div>

                      {/* Delete Button (shows on hover) */}
                      <button
                        onClick={(e) => handleDeleteSession(session.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                        title="Delete chat"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Document Selection */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Select Documents ({selectedDocs.length}/{docs.length})
              </label>
              <div className="space-y-2">
                {docs.map((doc) => (
                  <label
                    key={doc.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all ${selectedDocs.includes(doc.id)
                      ? "bg-blue-50 border-2 border-blue-500"
                      : "bg-white border-2 border-gray-200 hover:border-gray-300"
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedDocs.includes(doc.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDocs([...selectedDocs, doc.id]);
                        } else {
                          setSelectedDocs(selectedDocs.filter((id) => id !== doc.id));
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {doc.filename}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{doc.total_chunks} chunks</p>
                    </div>
                  </label>
                ))}
              </div>
              {docs.length === 0 && (
                <div className="text-center py-6">
                  <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No documents available</p>
                </div>
              )}
            </div>
          </div>

          {/* 3. Fixed Footer (Settings & Actions) */}
          <div className="p-4 border-t border-gray-200 bg-white/60 backdrop-blur-sm space-y-3">

            {/* AI Model Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>AI Model</span>
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all cursor-pointer appearance-none"
              >
                <option value="llama-3.1-8b-instant">⚡ Llama 3.1 8B (Fast)</option>
                <option value="openai/gpt-oss-20b">⚖️ GPT OSS 20B (Balanced)</option>
                <option value="llama-3.1-70b-versatile">🧠 Llama 3.1 70B (Smart)</option>
                <option value="openai/gpt-oss-120b">💎 GPT OSS 120B (Genius)</option>
              </select>
            </div>

            {/* Clear Chat Button */}
            <button
              onClick={handleClearChat}
              disabled={messages.length === 0}
              className="w-full px-4 py-2.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Chat</span>
            </button>
          </div>

        </div>

        {/* ================= MAIN CHAT AREA ================= */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
                  <BookOpen className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  Start a conversation
                </h3>
                <p className="text-gray-500 max-w-md">
                  Ask questions about your uploaded documents and get AI-powered answers with source citations.
                </p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-3xl ${msg.role === "user" ? "order-2" : "order-1"}`}>
                  <div className={`rounded-2xl px-6 py-4 ${msg.role === "user"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                    : msg.isError
                      ? "bg-red-50 border-2 border-red-200 text-red-900"
                      : "bg-white border-2 border-gray-200 text-gray-900 shadow-sm"
                    }`}>
                    <div className="prose prose-sm max-w-none leading-relaxed text-gray-800">
                      <ReactMarkdown
                        components={{
                          p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                          ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />,
                          ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-2 space-y-1" {...props} />,
                          strong: ({ node, ...props }) => <strong className="font-semibold text-gray-900" {...props} />,
                          a: ({ node, ...props }) => <a className="text-blue-600 hover:underline" {...props} />,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>

                    {/* Web Search Indicator */}
                    {msg.role === "ai" && msg.usedWebSearch && !msg.isError && (
                      <div className="mt-3 flex items-center space-x-2 text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                        <Globe className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium">Searched the internet for additional context</span>
                      </div>
                    )}

                    {/* Sources Section */}
                    {msg.role === "ai" && msg.sources && msg.sources.length > 0 && !msg.isError && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center space-x-2 mb-3">
                          <BookOpen className="w-4 h-4 text-blue-600" />
                          <p className="text-sm font-semibold text-gray-700">Sources ({msg.sources.length})</p>
                        </div>
                        <div className="space-y-2">
                          {msg.sources.map((source, sIdx) => {
                            const key = `${idx}-${sIdx}`;
                            const isExpanded = expandedSources[key];
                            return (
                              <div key={sIdx} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 overflow-hidden">
                                <button
                                  onClick={() => toggleSource(idx, sIdx)}
                                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-blue-100 transition-all"
                                >
                                  <div className="flex items-center space-x-3 flex-1 text-left">
                                    <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">
                                        {source.filename || "Web Source"}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {source.chunk_index !== undefined ? `Chunk ${source.chunk_index} • ` : ""}
                                        {source.similarity_score ? `${(source.similarity_score * 100).toFixed(1)}% match` : source.url || "Source"}
                                      </p>
                                    </div>
                                  </div>
                                  {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                                </button>
                                {isExpanded && (
                                  <div className="px-4 pb-4 border-t border-blue-200">
                                    <p className="text-sm text-gray-700 mt-3 italic bg-white p-3 rounded border-l-4 border-blue-500">
                                      "{source.content}"
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border-2 border-gray-200 rounded-2xl px-6 py-4 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    </div>
                    <span className="text-sm text-gray-500 ml-2">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 bg-gradient-to-r from-slate-50 to-blue-50 p-6">
            <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={selectedDocs.length === 0 ? "Select documents to start chatting..." : "Ask a question about your documents..."}
                  className="flex-1 rounded-xl border-2 border-gray-300 shadow-sm p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  disabled={isLoading || selectedDocs.length === 0}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim() || selectedDocs.length === 0}
                  className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl font-medium flex items-center space-x-2"
                >
                  <Send className="w-5 h-5" />
                  <span>Send</span>
                </button>
              </div>
              {selectedDocs.length === 0 && (
                <p className="text-center text-xs text-red-500 mt-3 font-medium">
                  Please select at least one document from the sidebar
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
