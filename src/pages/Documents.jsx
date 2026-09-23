import React, { useState, useEffect, useCallback } from 'react';
import { documentsApi, DOC_TYPES } from '../api/documents';
import { useToast } from '../components/Toast';
import { PacmanLoader } from '../components/PacmanLoader';
import {
  FileText, Upload, Trash2, ExternalLink, Star, AlertCircle, ShieldAlert,
} from 'lucide-react';

/** Mirrors the backend's allow-list; rejecting here saves a wasted upload. */
const ACCEPT = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
const MAX_BYTES = 10 * 1024 * 1024;

const TYPE_LABEL = Object.fromEntries(DOC_TYPES.map((t) => [t.value, t.label]));

function formatSize(bytes) {
  if (!bytes && bytes !== 0) return '—';
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(instant) {
  if (!instant) return '—';
  return new Date(instant).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export function Documents() {
  const { toast } = useToast();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState('RESUME');
  const [primary, setPrimary] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setDocuments((await documentsApi.list()) || []);
    } catch (err) {
      toast.error(err.message || 'Could not load your documents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const pickFile = (e) => {
    const picked = e.target.files?.[0] || null;
    if (picked && picked.size > MAX_BYTES) {
      toast.error(`${picked.name} is ${formatSize(picked.size)}. The limit is 10 MB.`);
      e.target.value = '';
      return;
    }
    setFile(picked);
  };

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      await documentsApi.upload(file, docType, primary);
      setFile(null);
      document.getElementById('doc-file-input').value = '';
      await load();
      toast.success(`${TYPE_LABEL[docType]} uploaded.`);
    } catch (err) {
      toast.error(err.message || 'Could not upload the document');
    } finally {
      setUploading(false);
    }
  };

  const remove = async (doc) => {
    try {
      await documentsApi.remove(doc.id);
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      toast.success('Document removed.');
    } catch (err) {
      toast.error(err.message || 'Could not remove the document');
    }
  };

  if (loading) return <PacmanLoader />;

  const primaryResume = documents.find((d) => d.docType === 'RESUME' && d.primary);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Documents</h1>
        <p className="page-subtitle">
          Your resume and certificates. Whichever resume is marked primary is the one attached to
          every drive you apply to.
        </p>
      </div>

      {/*
        Stated plainly rather than buried in a policy page. These links are public
        and non-expiring so they keep working when a company opens them weeks
        later -- students should know that before uploading an Aadhaar.
      */}
      <div className="alert alert-warning" style={{ marginBottom: '18px', display: 'flex', gap: '10px' }}>
        <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
        <span style={{ fontSize: '12.5px', lineHeight: 1.5 }}>
          Anyone with the link to a document can open it, and the link keeps working after you share
          it — this is deliberate, so a recruiter opening your resume weeks later never hits a dead
          link. Every time the placement team views one of your documents it is recorded.
        </span>
      </div>

      {!primaryResume && (
        <div className="alert alert-danger" style={{ marginBottom: '18px', display: 'flex', gap: '10px' }}>
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span style={{ fontSize: '12.5px' }}>
            You have no primary resume. Applications you make will reach the placement team without
            one attached.
          </span>
        </div>
      )}

      <div className="panel" style={{ marginBottom: '18px' }}>
        <div className="panel-header">
          <div className="panel-title">Upload a document</div>
        </div>
        <div style={{ padding: '4px 0', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            className="form-control"
            style={{ width: 'auto', minWidth: '180px' }}
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
          >
            {DOC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>

          <input
            id="doc-file-input"
            type="file"
            className="form-control"
            style={{ maxWidth: '320px' }}
            accept={ACCEPT}
            onChange={pickFile}
          />

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}>
            <input type="checkbox" checked={primary} onChange={(e) => setPrimary(e.target.checked)} />
            Use as my primary {TYPE_LABEL[docType].toLowerCase()}
          </label>

          <button className="btn btn-primary btn-sm" onClick={upload} disabled={uploading || !file}>
            <Upload size={14} /> {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
        <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '8px' }}>
          PDF, Word or image. Up to 10 MB.
          {file && ` · Selected: ${file.name} (${formatSize(file.size)})`}
        </p>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            {documents.length} document{documents.length === 1 ? '' : 's'}
          </div>
        </div>

        {documents.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FileText size={28} style={{ opacity: 0.4, marginBottom: '8px' }} />
            <p style={{ fontSize: '13px' }}>Nothing uploaded yet. Start with your resume.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>File</th><th>Type</th><th>Size</th><th>Uploaded</th><th>Link</th><th></th>
                </tr>
              </thead>
              <tbody>
                {documents.map((d) => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {d.primary && <Star size={13} fill="var(--warning)" color="var(--warning)" />}
                      {d.fileName}
                    </td>
                    <td style={{ fontSize: '12px' }}>{TYPE_LABEL[d.docType] || d.docType}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px' }}>{formatSize(d.sizeBytes)}</td>
                    <td style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{formatDate(d.uploadedAt)}</td>
                    <td>
                      <a href={d.url} target="_blank" rel="noreferrer"
                         style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                        Open <ExternalLink size={11} />
                      </a>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => remove(d)} title="Remove">
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
