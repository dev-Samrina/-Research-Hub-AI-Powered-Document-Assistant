// frontend/src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import { api } from "../services/api";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import { Upload, Trash2, FileText, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";

export default function Dashboard() {
  const [docs, setDocs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchDocs = async () => {
    try {
      const data = await api.getDocuments();
      setDocs(data);
    } catch (err) {
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
    const interval = setInterval(fetchDocs, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    let successCount = 0;

    for (const file of files) {
      try {
        await api.uploadDocument(file);
        successCount++;
      } catch (err) {
        toast.error(`Failed to upload ${file.name}: ${err.message}`);
      }
    }

    e.target.value = ""; // Reset input
    fetchDocs(); // Refresh list

    if (successCount > 0) {
      toast.success(`Successfully uploaded ${successCount} document(s)!`);
    }
    setUploading(false);
  };

  const handleDelete = async (docId) => {
    try {
      await api.deleteDocument(docId);
      fetchDocs();
      toast.success("Document deleted successfully!");
      setDeleteConfirm(null);
    } catch (err) {
      toast.error("Delete failed: " + err.message);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "ready":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "processing":
        return <Clock className="w-5 h-5 text-yellow-500 animate-pulse" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      ready: "bg-green-100 text-green-700 border-green-200",
      processing: "bg-yellow-100 text-yellow-700 border-yellow-200",
      failed: "bg-red-100 text-red-700 border-red-200",
    };
    return styles[status] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Documents</h1>
          <p className="text-gray-600 mt-2">Upload and manage your research documents</p>
        </div>

        {/* Upload Card */}
        {/* Upload Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Upload className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload New Document</h3>
              <p className="text-sm text-gray-600 mb-4">
                Supported format: PDF. You can select multiple files at once.
              </p>

              {/* Bulletproof Hidden Input + Custom Button */}
              <label className="inline-flex cursor-pointer group">
                <input
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={handleUpload}
                  disabled={uploading || loading}
                  className="hidden" /* <-- THIS COMPLETELY HIDES THE UGLY DEFAULT BROWSER INPUT */
                />
                <span className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg group-hover:from-blue-700 group-hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                  {uploading ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 mr-2" />
                      Choose PDF File(s)
                    </>
                  )}
                </span>
              </label>

              {uploading && (
                <p className="text-blue-600 mt-3 text-sm flex items-center">
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></span>
                  Uploading and processing in the background...
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Documents List */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Your Documents ({docs.length})
          </h2>

          {loading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-gray-500 mt-4">Loading documents...</p>
              </div>
            </div>
          ) : docs.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
              <p className="text-gray-500">Upload your first PDF to get started!</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {doc.filename}
                        </h3>
                        <div className="flex items-center space-x-4 mt-2">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadge(
                              doc.status
                            )}`}
                          >
                            {getStatusIcon(doc.status)}
                            <span className="ml-2 capitalize">{doc.status}</span>
                          </span>
                          {doc.total_chunks > 0 && (
                            <span className="text-sm text-gray-500">
                              {doc.total_chunks} chunks
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setDeleteConfirm(doc)}
                      className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Delete document"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Document</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{deleteConfirm.filename}</strong>? This action
              cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
