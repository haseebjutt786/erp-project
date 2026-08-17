import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import AppLayout from '../components/layouts/AppLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  getDocuments, getDocumentFolders, uploadDocument,
  updateDocument, deleteDocument, downloadDocumentUrl, BASE_URL,
} from '../services/api.js';

const CATEGORIES = ['General','HR','Finance','Legal','Operations','IT','Personal'];
const FILE_ICONS = {
  'application/pdf':   { icon: 'ti-file-type-pdf',  color: '#eb0910', bg: '#fff0f0' },
  'application/msword':{ icon: 'ti-file-type-doc',  color: '#466ae6', bg: '#eef4ff' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon:'ti-file-type-doc', color:'#466ae6', bg:'#eef4ff' },
  'application/vnd.ms-excel': { icon:'ti-file-type-xls', color:'#18a04b', bg:'#e8f9f0' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon:'ti-file-type-xls', color:'#18a04b', bg:'#e8f9f0' },
  'text/csv':          { icon: 'ti-file-type-csv',  color: '#18a04b', bg: '#e8f9f0' },
  'text/plain':        { icon: 'ti-file-type-txt',  color: '#76767b', bg: '#f6f5f8' },
  'image/jpeg':        { icon: 'ti-photo',           color: '#7b4fa0', bg: '#f5f0ff' },
  'image/png':         { icon: 'ti-photo',           color: '#7b4fa0', bg: '#f5f0ff' },
  'image/gif':         { icon: 'ti-photo',           color: '#7b4fa0', bg: '#f5f0ff' },
  'image/webp':        { icon: 'ti-photo',           color: '#7b4fa0', bg: '#f5f0ff' },
  default:             { icon: 'ti-file',            color: '#76767b', bg: '#f6f5f8' },
};

const getFileIcon = (mime) => FILE_ICONS[mime] || FILE_ICONS.default;
const fmtSize = (b) => {
  if (!b) return '—';
  if (b < 1024) return `${b} B`;
  if (b < 1024*1024) return `${(b/1024).toFixed(1)} KB`;
  return `${(b/(1024*1024)).toFixed(1)} MB`;
};

const EMPTY_FORM = { name:'', description:'', category:'General', folder:'Root', isPublic:false, tags:'' };

export default function Documents() {
  const { user } = useAuth();
  const isAdmin = !!user?.isAdmin;
  const fileInputRef = useRef(null);

  const [docs, setDocs]             = useState([]);
  const [folders, setFolders]       = useState([]);
  const [pagination, setPagination] = useState({ page:1, pages:1, total:0 });
  const [loading, setLoading]       = useState(true);
  const [uploading, setUploading]   = useState(false);
  const [search, setSearch]         = useState('');
  const [category, setCategory]     = useState('');
  const [folder, setFolder]         = useState('');
  const [page, setPage]             = useState(1);
  const [view, setView]             = useState('grid'); // grid | list
  const [uploadModal, setUploadModal] = useState(false);
  const [editDoc, setEditDoc]       = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [file, setFile]             = useState(null);
  const [dragOver, setDragOver]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (search)   params.search   = search;
      if (category) params.category = category;
      if (folder)   params.folder   = folder;
      const { data } = await getDocuments(params);
      setDocs(data.documents);
      setPagination(data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load documents');
    } finally { setLoading(false); }
  }, [page, search, category, folder]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    getDocumentFolders().then(({ data }) => setFolders(data)).catch(() => {});
  }, [docs]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please select a file');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('name', form.name || file.name);
      fd.append('description', form.description);
      fd.append('category', form.category);
      fd.append('folder', form.folder);
      fd.append('isPublic', form.isPublic);
      fd.append('tags', form.tags);
      await uploadDocument(fd);
      toast.success('Document uploaded successfully');
      setUploadModal(false);
      setFile(null);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally { setUploading(false); }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await updateDocument(editDoc._id, { name: form.name, description: form.description, category: form.category, folder: form.folder, isPublic: form.isPublic, tags: form.tags });
      toast.success('Updated');
      setEditDoc(null);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Delete "${doc.name}"?`)) return;
    try {
      await deleteDocument(doc._id);
      toast.success('Deleted');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const openEdit = (doc) => {
    setEditDoc(doc);
    setForm({ name: doc.name, description: doc.description||'', category: doc.category, folder: doc.folder, isPublic: doc.isPublic, tags: (doc.tags||[]).join(', ') });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); setForm(p => ({ ...p, name: f.name })); setUploadModal(true); }
  };

  const token = JSON.parse(localStorage.getItem('hrmsUserInfo') || '{}')?.token;

  const handleDownload = (doc) => {
    const url = `${BASE_URL}/api/documents/${doc._id}/download?token=${encodeURIComponent(token || '')}`;
    const a   = document.createElement('a');
    a.href    = url;
    a.download = doc.originalName;
    a.target  = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5 shadow-card">
        <div>
          <h2 className="text-xl font-800 text-gray-800 dark:text-gray-100">Documents</h2>
          <p className="text-sm text-gray-400 mt-0.5">{pagination.total} file{pagination.total !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 dark:bg-dark-surface rounded-lg p-0.5">
            {['grid','list'].map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-md transition-all ${view === v ? 'bg-white dark:bg-dark-card shadow-sm text-gray-800 dark:text-gray-100' : 'text-gray-400'}`}>
                <i className={`ti ${v === 'grid' ? 'ti-layout-grid' : 'ti-list'} text-sm`} />
              </button>
            ))}
          </div>
          <button onClick={() => { setUploadModal(true); setFile(null); setForm(EMPTY_FORM); }}
            className="flex items-center gap-2 bg-gradient-orange text-white px-4 py-2 rounded-lg text-sm font-700 hover:shadow-glow transition-all">
            <i className="ti ti-upload" /> Upload
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input placeholder="Search documents..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30" />
        </div>
        <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={folder} onChange={e => { setFolder(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30">
          <option value="">All Folders</option>
          {folders.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>

      {/* Drop zone hint */}
      <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
        className={`mb-5 border-2 border-dashed rounded-xl p-4 text-center transition-all ${dragOver ? 'border-brand-400 bg-brand-50 dark:bg-brand-400/10' : 'border-gray-200 dark:border-dark-border'}`}>
        <i className={`ti ti-cloud-upload text-2xl ${dragOver ? 'text-brand-400' : 'text-gray-300'}`} />
        <p className="text-xs text-gray-400 mt-1">Drag & drop a file here to upload</p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" /></div>
      ) : docs.length === 0 ? (
        <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-16 text-center shadow-card">
          <i className="ti ti-files text-gray-200 text-6xl mb-3 block" />
          <p className="text-gray-500 font-600">No documents found</p>
          <button onClick={() => setUploadModal(true)} className="mt-3 text-sm text-brand-400 font-600 hover:text-brand-500 transition-colors">Upload your first document →</button>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {docs.map((doc, i) => {
            const fi = getFileIcon(doc.mimetype);
            return (
              <motion.div key={doc._id} initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} transition={{ delay: i*0.03 }}
                className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-4 shadow-card hover:shadow-hover hover:-translate-y-0.5 transition-all group">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: fi.bg }}>
                    <i className={`ti ${fi.icon} text-2xl`} style={{ color: fi.color }} />
                  </div>
                  <div className="w-full text-center">
                    <p className="text-xs font-600 text-gray-800 dark:text-gray-200 truncate">{doc.name}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{fmtSize(doc.size)}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleDownload(doc)}
                      className="w-6 h-6 bg-blue-50 text-blue-500 rounded-md flex items-center justify-center hover:bg-blue-100 transition-colors" title="Download">
                      <i className="ti ti-download text-xs" />
                    </button>
                    <button onClick={() => openEdit(doc)}
                      className="w-6 h-6 bg-orange-50 text-brand-400 rounded-md flex items-center justify-center hover:bg-orange-100 transition-colors" title="Edit">
                      <i className="ti ti-edit text-xs" />
                    </button>
                    <button onClick={() => handleDelete(doc)}
                      className="w-6 h-6 bg-red-50 text-red-500 rounded-md flex items-center justify-center hover:bg-red-100 transition-colors" title="Delete">
                      <i className="ti ti-trash text-xs" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border shadow-card overflow-hidden">
          <table className="w-full">
            <thead><tr className="bg-gray-50 dark:bg-dark-surface">
              {['Name','Category','Folder','Size','Uploaded By','Date',''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-700 text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-dark-border">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {docs.map((doc, i) => {
                const fi = getFileIcon(doc.mimetype);
                return (
                  <motion.tr key={doc._id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay: i*0.03 }}
                    className="hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors">
                    <td className="px-4 py-3 border-b border-gray-50 dark:border-dark-border">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: fi.bg }}>
                          <i className={`ti ${fi.icon} text-sm`} style={{ color: fi.color }} />
                        </div>
                        <div><p className="text-sm font-600 text-gray-800 dark:text-gray-200">{doc.name}</p>
                          <p className="text-xs text-gray-400">{doc.originalName}</p></div>
                      </div>
                    </td>
                    <td className="px-4 py-3 border-b border-gray-50 dark:border-dark-border text-xs text-gray-500">{doc.category}</td>
                    <td className="px-4 py-3 border-b border-gray-50 dark:border-dark-border text-xs text-gray-500">{doc.folder}</td>
                    <td className="px-4 py-3 border-b border-gray-50 dark:border-dark-border text-xs text-gray-500">{fmtSize(doc.size)}</td>
                    <td className="px-4 py-3 border-b border-gray-50 dark:border-dark-border text-xs text-gray-500">{doc.uploadedBy?.fullName}</td>
                    <td className="px-4 py-3 border-b border-gray-50 dark:border-dark-border text-xs text-gray-500">{new Date(doc.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 border-b border-gray-50 dark:border-dark-border">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleDownload(doc)} className="text-xs bg-blue-50 text-blue-500 px-2 py-1 rounded-lg hover:bg-blue-100 transition-colors font-600">Download</button>
                        <button onClick={() => openEdit(doc)} className="text-xs bg-orange-50 text-brand-400 px-2 py-1 rounded-lg hover:bg-orange-100 transition-colors font-600">Edit</button>
                        <button onClick={() => handleDelete(doc)} className="text-xs bg-red-50 text-red-500 px-2 py-1 rounded-lg hover:bg-red-100 transition-colors font-600">Delete</button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button disabled={page<=1} onClick={() => setPage(p=>p-1)} className="px-3 py-1.5 text-sm border border-gray-200 dark:border-dark-border rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors text-gray-600 dark:text-gray-300"><i className="ti ti-chevron-left" /></button>
          <span className="text-sm text-gray-500 px-3">Page {page} of {pagination.pages}</span>
          <button disabled={page>=pagination.pages} onClick={() => setPage(p=>p+1)} className="px-3 py-1.5 text-sm border border-gray-200 dark:border-dark-border rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors text-gray-600 dark:text-gray-300"><i className="ti ti-chevron-right" /></button>
        </div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {uploadModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setUploadModal(false)}>
            <motion.form initial={{ scale:0.95, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.95, opacity:0 }}
              className="bg-white dark:bg-dark-card rounded-xl w-full max-w-md shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()} onSubmit={handleUpload}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-dark-border">
                <h3 className="text-base font-700 text-gray-800 dark:text-gray-100">Upload Document</h3>
                <button type="button" onClick={() => setUploadModal(false)} className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-dark-surface flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-border transition-colors"><i className="ti ti-x text-sm" /></button>
              </div>
              <div className="p-6 space-y-4">
                {/* File picker */}
                <div>
                  <label className="block text-xs font-700 text-gray-500 mb-1.5">File *</label>
                  <div onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${file ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-brand-400'}`}>
                    {file ? (
                      <div className="flex items-center justify-center gap-3">
                        <i className="ti ti-file-check text-2xl text-brand-400" />
                        <div className="text-left">
                          <p className="text-sm font-600 text-gray-800">{file.name}</p>
                          <p className="text-xs text-gray-400">{fmtSize(file.size)}</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <i className="ti ti-cloud-upload text-3xl text-gray-300 mb-2 block" />
                        <p className="text-sm text-gray-500">Click to select file</p>
                        <p className="text-xs text-gray-400 mt-1">PDF, Word, Excel, Images — max 10MB</p>
                      </>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp"
                    onChange={e => { const f = e.target.files[0]; if (f) { setFile(f); setForm(p => ({ ...p, name: p.name || f.name })); } }} />
                </div>
                <div>
                  <label className="block text-xs font-700 text-gray-500 mb-1.5">Display Name</label>
                  <input value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="Document name..."
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30" />
                </div>
                <div>
                  <label className="block text-xs font-700 text-gray-500 mb-1.5">Description</label>
                  <textarea rows={2} value={form.description} onChange={e => setForm({...form, description:e.target.value})} placeholder="Optional description..."
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-700 text-gray-500 mb-1.5">Category</label>
                    <select value={form.category} onChange={e => setForm({...form, category:e.target.value})}
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-700 text-gray-500 mb-1.5">Folder</label>
                    <input value={form.folder} onChange={e => setForm({...form, folder:e.target.value})} placeholder="Root"
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-700 text-gray-500 mb-1.5">Tags (comma separated)</label>
                  <input value={form.tags} onChange={e => setForm({...form, tags:e.target.value})} placeholder="hr, policy, 2024"
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isPublic} onChange={e => setForm({...form, isPublic:e.target.checked})} className="w-4 h-4 accent-orange-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Make publicly visible to all employees</span>
                </label>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-dark-surface border-t border-gray-100 dark:border-dark-border">
                <button type="button" onClick={() => setUploadModal(false)} className="px-4 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg text-gray-600 hover:bg-gray-100 transition-colors font-600">Cancel</button>
                <button type="submit" disabled={uploading} className="flex items-center gap-2 px-5 py-2 bg-gradient-orange text-white rounded-lg text-sm font-700 hover:shadow-glow transition-all disabled:opacity-60">
                  {uploading ? <><i className="ti ti-loader-2 animate-spin" /> Uploading...</> : <><i className="ti ti-upload" /> Upload</>}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editDoc && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setEditDoc(null)}>
            <motion.form initial={{ scale:0.95, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.95, opacity:0 }}
              className="bg-white dark:bg-dark-card rounded-xl w-full max-w-sm shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()} onSubmit={handleEdit}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-dark-border">
                <h3 className="text-base font-700 text-gray-800 dark:text-gray-100">Edit Document</h3>
                <button type="button" onClick={() => setEditDoc(null)} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500"><i className="ti ti-x text-sm" /></button>
              </div>
              <div className="p-6 space-y-3">
                <div><label className="block text-xs font-700 text-gray-500 mb-1.5">Name</label>
                  <input value={form.name} onChange={e => setForm({...form, name:e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400/30" /></div>
                <div><label className="block text-xs font-700 text-gray-500 mb-1.5">Description</label>
                  <textarea rows={2} value={form.description} onChange={e => setForm({...form, description:e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand-400/30" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-700 text-gray-500 mb-1.5">Category</label>
                    <select value={form.category} onChange={e => setForm({...form, category:e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400/30">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                  <div><label className="block text-xs font-700 text-gray-500 mb-1.5">Folder</label>
                    <input value={form.folder} onChange={e => setForm({...form, folder:e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400/30" /></div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
                  <input type="checkbox" checked={form.isPublic} onChange={e => setForm({...form, isPublic:e.target.checked})} className="w-4 h-4 accent-orange-500" />
                  Publicly visible
                </label>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-dark-surface border-t border-gray-100 dark:border-dark-border">
                <button type="button" onClick={() => setEditDoc(null)} className="px-4 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-card font-600">Cancel</button>
                <button type="submit" className="flex items-center gap-2 px-5 py-2 bg-gradient-orange text-white rounded-lg text-sm font-700">
                  <i className="ti ti-check" /> Save
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}

