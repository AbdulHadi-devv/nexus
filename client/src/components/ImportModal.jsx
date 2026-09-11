import { useState, useRef } from 'react';
import { useToast } from '../context/ToastContext';
import * as api from '../services/api';

export default function ImportModal({ isOpen, onClose, onImportComplete }) {
  const { showToast } = useToast();
  const fileInputRef = useRef(null);
  const [fileData, setFileData] = useState(null);
  const [mode, setMode] = useState('merge');
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, step: '' });

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      showToast('Please select a .json file', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);

        if (!data.items || !Array.isArray(data.items)) {
          showToast('Invalid backup file — missing items array', 'error');
          return;
        }

        setFileData(data);
        showToast(`Loaded ${data.items.length} items from backup`, 'success');
      } catch (error) {
        console.error('Parse error:', error);
        showToast('Failed to parse JSON file', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    setFileData(null);
    setProgress({ current: 0, total: 0, step: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImport = async () => {
    if (!fileData) {
      showToast('Please select a file first', 'error');
      return;
    }

    setImporting(true);

    try {
      // Step 1: Optionally delete existing items (replace mode)
      if (mode === 'replace') {
        setProgress({ current: 0, total: 1, step: 'Clearing existing data...' });

        const existingItems = await api.getItems();
        for (const item of existingItems.data) {
          await api.deleteItem(item.id);
        }
      }

      // Step 2: Create tags first (items reference them)
      const tagMap = {}; // oldId → newId
      const uniqueTags = new Map();

      fileData.items.forEach(item => {
        item.tags?.forEach(tag => {
          if (!uniqueTags.has(tag.name)) {
            uniqueTags.set(tag.name, tag);
          }
        });
      });

      const tagList = Array.from(uniqueTags.values());
      setProgress({ current: 0, total: tagList.length, step: 'Importing tags...' });

      for (let i = 0; i < tagList.length; i++) {
        const tag = tagList[i];
        setProgress({ current: i + 1, total: tagList.length, step: `Importing tag #${tag.name}` });

        try {
          const response = await api.createTag({
            name: tag.name,
            color: tag.color || '#6366f1',
          });
          tagMap[tag.id] = response.data.id;
        } catch (error) {
          // Tag may already exist in merge mode — fetch it
          if (mode === 'merge') {
            const allTags = await api.getTags();
            const existing = allTags.data.find(t => t.name === tag.name);
            if (existing) tagMap[tag.id] = existing.id;
          }
        }
      }

      // Step 3: Create items
      const itemMap = {}; // oldId → newId
      setProgress({ current: 0, total: fileData.items.length, step: 'Importing items...' });

      for (let i = 0; i < fileData.items.length; i++) {
        const item = fileData.items[i];
        setProgress({
          current: i + 1,
          total: fileData.items.length,
          step: `Importing "${item.title}"`
        });

        try {
          // Map old tag IDs to new tag IDs
          const newTagIds = (item.tags || [])
            .map(tag => tagMap[tag.id])
            .filter(Boolean);

          const response = await api.createItem({
            title: item.title,
            content: item.content,
            type: item.type || 'NOTE',
            url: item.url || null,
            language: item.language || null,
            tagIds: newTagIds,
          });

          itemMap[item.id] = response.data.id;

          // Preserve favorite state
          if (item.favorite) {
            await api.updateItem(response.data.id, {
              favorite: true,
            });
          }
        } catch (error) {
          console.error(`Failed to import item "${item.title}":`, error);
        }
      }

      // Step 4: Create connections
      const connectionsToImport = [];
      fileData.items.forEach(item => {
        item.connectionsFrom?.forEach(conn => {
          connectionsToImport.push({
            fromOldId: conn.fromItemId,
            toOldId: conn.toItemId,
            type: conn.type || 'RELATED',
          });
        });
      });

      // Deduplicate
      const uniqueConnections = [];
      const seen = new Set();
      connectionsToImport.forEach(conn => {
        const key = `${conn.fromOldId}-${conn.toOldId}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueConnections.push(conn);
        }
      });

      setProgress({ current: 0, total: uniqueConnections.length, step: 'Importing connections...' });

      for (let i = 0; i < uniqueConnections.length; i++) {
        const conn = uniqueConnections[i];
        setProgress({
          current: i + 1,
          total: uniqueConnections.length,
          step: 'Linking items...'
        });

        const newFromId = itemMap[conn.fromOldId];
        const newToId = itemMap[conn.toOldId];

        if (newFromId && newToId) {
          try {
            await api.createConnection({
              fromItemId: newFromId,
              toItemId: newToId,
              type: conn.type,
            });
          } catch (error) {
            // Ignore duplicate connection errors
          }
        }
      }

      showToast(
        `✅ Imported ${Object.keys(itemMap).length} items, ${Object.keys(tagMap).length} tags, ${uniqueConnections.length} connections`,
        'success'
      );

      handleReset();
      onImportComplete?.();
      onClose();
    } catch (error) {
      console.error('Import failed:', error);
      showToast('Import failed — check console for details', 'error');
    } finally {
      setImporting(false);
      setProgress({ current: 0, total: 0, step: '' });
    }
  };

  const progressPercent = progress.total > 0
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  return (
    <div className="modal-overlay" onClick={importing ? undefined : onClose}>
      <div className="modal-content import-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📤 Import Knowledge</h2>
          <button
            className="modal-close"
            onClick={onClose}
            disabled={importing}
          >
            ✕
          </button>
        </div>

        {!fileData ? (
          <>
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
              Upload a Nexus backup file (.json) to restore your knowledge.
            </p>

            <div className="import-upload-area">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                id="import-file"
                className="file-input"
              />
              <label htmlFor="import-file" className="import-upload-label">
                <span className="import-icon">📂</span>
                <span className="import-title">Click to select backup file</span>
                <span className="import-hint">
                  Backup files are created via Dashboard → Export JSON
                </span>
              </label>
            </div>
          </>
        ) : (
          <>
            {/* Preview */}
            <div className="import-preview">
              <div className="import-preview-header">
                <span className="import-icon-small">📦</span>
                <div>
                  <strong>Backup File Loaded</strong>
                  <p className="import-preview-meta">
                    Exported: {fileData.exportedAt
                      ? new Date(fileData.exportedAt).toLocaleString()
                      : 'Unknown'}
                  </p>
                </div>
              </div>

              <div className="import-preview-stats">
                <div className="import-stat">
                  <span className="import-stat-value">{fileData.items?.length || 0}</span>
                  <span className="import-stat-label">Items</span>
                </div>
                <div className="import-stat">
                  <span className="import-stat-value">
                    {new Set(fileData.items?.flatMap(i => i.tags?.map(t => t.name) || [])).size}
                  </span>
                  <span className="import-stat-label">Unique Tags</span>
                </div>
                <div className="import-stat">
                  <span className="import-stat-value">
                    {fileData.items?.reduce((acc, i) => acc + (i.connectionsFrom?.length || 0), 0) || 0}
                  </span>
                  <span className="import-stat-label">Connections</span>
                </div>
                <div className="import-stat">
                  <span className="import-stat-value">
                    {fileData.items?.filter(i => i.favorite).length || 0}
                  </span>
                  <span className="import-stat-label">Favorites</span>
                </div>
              </div>
            </div>

            {/* Mode Selection */}
            <div className="import-mode-section">
              <h3 className="import-section-title">Import Mode</h3>

              <div className="import-mode-options">
                <label className={`import-mode-option ${mode === 'merge' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="import-mode"
                    value="merge"
                    checked={mode === 'merge'}
                    onChange={() => setMode('merge')}
                    disabled={importing}
                  />
                  <div className="import-mode-content">
                    <span className="import-mode-icon">➕</span>
                    <div>
                      <strong>Merge</strong>
                      <p>Add to your existing knowledge. Safe choice.</p>
                    </div>
                  </div>
                </label>

                <label className={`import-mode-option ${mode === 'replace' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="import-mode"
                    value="replace"
                    checked={mode === 'replace'}
                    onChange={() => setMode('replace')}
                    disabled={importing}
                  />
                  <div className="import-mode-content">
                    <span className="import-mode-icon">⚠️</span>
                    <div>
                      <strong>Replace</strong>
                      <p>Delete everything, then import. Cannot be undone.</p>
                    </div>
                  </div>
                </label>
              </div>

              {mode === 'replace' && (
                <div className="import-warning">
                  ⚠️ <strong>Warning:</strong> All existing items, tags, and connections will be permanently deleted.
                </div>
              )}
            </div>

            {/* Progress */}
            {importing && (
              <div className="import-progress">
                <div className="import-progress-header">
                  <span>{progress.step}</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="import-progress-bar">
                  <div
                    className="import-progress-fill"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="import-progress-counter">
                  {progress.current} / {progress.total}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="form-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={handleReset}
                disabled={importing}
              >
                Choose Different File
              </button>
              <button
                type="button"
                className={`primary-button ${importing ? 'loading' : ''}`}
                onClick={handleImport}
                disabled={importing}
              >
                {importing ? (
                  <>
                    <span className="spinner"></span>
                    Importing...
                  </>
                ) : (
                  `Import ${fileData.items.length} Items`
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}