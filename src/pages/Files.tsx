import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';

interface FileInfo {
  cid: string;
  name: string;
  size: number;
  uploadedAt: string;
}

function Files() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const loadFiles = useCallback(async () => {
    try {
      setLoading(true);
      const result = await invoke<FileInfo[]>('list_files');
      setFiles(result);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUpload = async () => {
    try {
      const selected = await open({
        multiple: true,
        title: 'Select files to upload',
      });

      if (!selected) return;

      const paths = Array.isArray(selected) ? selected : [selected];

      for (const path of paths) {
        setUploadProgress(`Uploading ${path}...`);
        await invoke('upload_file', { path });
      }

      setUploadProgress(null);
      await loadFiles();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to upload file');
      setUploadProgress(null);
    }
  };

  const handleDownload = async (cid: string, filename: string) => {
    try {
      const savePath = await save({
        title: 'Save file as',
        defaultPath: filename,
      });

      if (!savePath) return;

      setLoading(true);
      await invoke('download_file', { cid, destPath: savePath });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to download file');
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Files</h2>
        <div className="actions">
          <button onClick={handleUpload} disabled={loading}>
            Upload Files
          </button>
          <button onClick={loadFiles} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {uploadProgress && <div className="info-banner">{uploadProgress}</div>}

      <div className="files-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>CID</th>
              <th>Size</th>
              <th>Uploaded</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {files.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-state">
                  No files yet. Upload some files to get started.
                </td>
              </tr>
            ) : (
              files.map((file) => (
                <tr key={file.cid}>
                  <td>{file.name}</td>
                  <td>
                    <code className="cid">{file.cid.slice(0, 20)}...</code>
                  </td>
                  <td>{formatBytes(file.size)}</td>
                  <td>{new Date(file.uploadedAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="small"
                      onClick={() => handleDownload(file.cid, file.name)}
                    >
                      Download
                    </button>
                    <button
                      className="small"
                      onClick={() => navigator.clipboard.writeText(file.cid)}
                    >
                      Copy CID
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Files;
