import React from 'react';
import {
  Copy, FileText, FileJson, Share2, Star, Printer,
} from 'lucide-react';
import {
  copyToClipboard,
  formatBlueprintForCopy,
  showToast,
  exportAsJSON,
  copyShareableLink,
} from '../services/utils';

function cleanText(text) {
  if (!text) return '';
  return String(text)
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .replace(/`/g, '')
    .trim();
}

function Blueprint({ blueprint, loading, blueprintId, onRefresh, sharePayload }) {
  if (loading) {
    return (
      <section className="blueprint-section">
        <div className="section-heading">
          <span className="step-label">04</span>
          <h2>MVP Blueprint</h2>
          <p>Nexus is turning your selected solution into an actionable product plan.</p>
        </div>

        <div className="loading-card">
          <div className="loading-spinner"></div>
          <strong>Building your MVP blueprint</strong>
          <p>
            Nexus is organizing the features, pages, database,
            technology and development plan.
          </p>
        </div>
      </section>
    );
  }

  if (!blueprint) {
    return (
      <section className="blueprint-section">
        <div className="section-heading">
          <span className="step-label">04</span>
          <h2>MVP Blueprint</h2>
          <p>No blueprint data available. Please generate a blueprint first.</p>
        </div>
      </section>
    );
  }

  const handleCopy = async () => {
    const text = formatBlueprintForCopy(blueprint);
    const success = await copyToClipboard(text);
    if (success) {
      showToast('Blueprint copied to clipboard!', 'success');
    } else {
      showToast('Failed to copy. Please try again.', 'error');
    }
  };

  const handleExportMarkdown = () => {
    const text = formatBlueprintForCopy(blueprint);
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${blueprint.title || 'blueprint'}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Blueprint exported as Markdown!', 'success');
  };

  const handleExportJSON = () => {
    exportAsJSON(blueprint);
  };

  const handleShare = () => {
    // Prefer the full sharePayload (problem + analysis + solution + blueprint)
    // Fall back to just the blueprint
    const payload = sharePayload || { blueprint };
    copyShareableLink(payload);
  };

  const handleToggleFavorite = () => {
    if (blueprintId) {
      // Uses localStorage history
      const { toggleFavorite } = require('../services/history');
      const isFavorite = toggleFavorite(blueprintId);
      showToast(
        isFavorite ? 'Added to favorites!' : 'Removed from favorites',
        'success'
      );
      if (onRefresh) onRefresh();
    } else {
      showToast('Save to history first to favorite!', 'info');
    }
  };

  const handleExportPDF = () => {
    showToast('Opening print dialog...', 'info');
    setTimeout(() => window.print(), 500);
  };

  const features = Array.isArray(blueprint.features) ? blueprint.features : [];
  const pages = Array.isArray(blueprint.pages) ? blueprint.pages : [];
  const database = Array.isArray(blueprint.database) ? blueprint.database : [];
  const tasks = Array.isArray(blueprint.tasks) ? blueprint.tasks : [];
  const buildOrder = Array.isArray(blueprint.buildOrder) ? blueprint.buildOrder : [];
  const techStack = blueprint.techStack || {};

  return (
    <section className="blueprint-section" id="blueprint-content">
      <div className="section-heading">
        <span className="step-label">04</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0 }}>MVP Blueprint</h2>
          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto', flexWrap: 'wrap' }}>
            <button className="copy-button" onClick={handleCopy} title="Copy to clipboard">
              <Copy size={14} /> Copy
            </button>
            <button className="copy-button" onClick={handleExportMarkdown} title="Export as Markdown">
              <FileText size={14} /> MD
            </button>
            <button className="copy-button" onClick={handleExportJSON} title="Export as JSON">
              <FileJson size={14} /> JSON
            </button>
            <button className="copy-button" onClick={handleShare} title="Share blueprint">
              <Share2 size={14} /> Share
            </button>
            <button className="copy-button" onClick={handleToggleFavorite} title="Add to favorites">
              <Star size={14} /> Favorite
            </button>
            <button className="copy-button" onClick={handleExportPDF} title="Export as PDF">
              <Printer size={14} /> PDF
            </button>
          </div>
        </div>
        <p>Your selected solution, turned into an actionable product plan.</p>
      </div>

      <div className="blueprint-hero">
        <div>
          <span className="card-label">PRODUCT</span>
          <h3>{cleanText(blueprint.title) || 'Untitled Product'}</h3>
          <p>{cleanText(blueprint.summary) || 'No description available.'}</p>
        </div>
        <div className="blueprint-status">MVP READY</div>
      </div>

      <div className="blueprint-block">
        <div className="blueprint-block-header">
          <span className="card-label">01</span>
          <h3>Core Features</h3>
        </div>
        <div className="feature-grid">
          {features.length > 0 ? (
            features.map((feature, index) => (
              <div className="feature-item" key={index}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <p>
                  {typeof feature === 'string'
                    ? cleanText(feature)
                    : cleanText(feature.name || feature.description || 'Feature')}
                </p>
              </div>
            ))
          ) : (
            <p className="empty-state">No core features available.</p>
          )}
        </div>
      </div>

      <div className="blueprint-block">
        <div className="blueprint-block-header">
          <span className="card-label">02</span>
          <h3>Pages</h3>
        </div>
        <div className="pages-list">
          {pages.length > 0 ? (
            pages.map((page, index) => (
              <div className="page-item" key={index}>
                <span className="page-number">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <strong>{cleanText(page.name) || 'Page'}</strong>
                  <p>{cleanText(page.description || page.purpose) || 'No purpose described'}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="empty-state">No pages described.</p>
          )}
        </div>
      </div>

      <div className="blueprint-two-column">
        <div className="blueprint-block">
          <div className="blueprint-block-header">
            <span className="card-label">03</span>
            <h3>Tech Stack</h3>
          </div>
          <div className="tech-stack">
            <div>
              <span>FRONTEND</span>
              <strong>{cleanText(techStack.frontend) || 'Not specified'}</strong>
            </div>
            <div>
              <span>BACKEND</span>
              <strong>{cleanText(techStack.backend) || 'Not specified'}</strong>
            </div>
            <div>
              <span>DATABASE</span>
              <strong>{cleanText(techStack.database) || 'Not specified'}</strong>
            </div>
            {techStack.ai && (
              <div>
                <span>AI</span>
                <strong>{cleanText(techStack.ai)}</strong>
              </div>
            )}
          </div>
        </div>

        <div className="blueprint-block">
          <div className="blueprint-block-header">
            <span className="card-label">04</span>
            <h3>Database</h3>
          </div>
          <div className="database-list">
            {database.length > 0 ? (
              database.map((item, index) => (
                <div key={index}>
                  <strong>{cleanText(item.name) || 'Table'}</strong>
                  <p>{cleanText(item.description || item.purpose) || 'No description'}</p>
                </div>
              ))
            ) : (
              <p className="empty-state">No database tables described.</p>
            )}
          </div>
        </div>
      </div>

      <div className="blueprint-block">
        <div className="blueprint-block-header">
          <span className="card-label">05</span>
          <h3>Development Tasks</h3>
        </div>
        <div className="task-list">
          {tasks.length > 0 ? (
            tasks.map((task, index) => (
              <div className="task-item" key={index}>
                <span className="task-number">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span>{cleanText(task)}</span>
              </div>
            ))
          ) : (
            <p className="empty-state">No development tasks listed.</p>
          )}
        </div>
      </div>

      <div className="blueprint-block build-order">
        <div className="blueprint-block-header">
          <span className="card-label">06</span>
          <h3>Recommended Build Order</h3>
        </div>
        <ol>
          {buildOrder.length > 0 ? (
            buildOrder.map((step, index) => (
              <li key={index}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                {cleanText(step)}
              </li>
            ))
          ) : (
            <li>No build order available.</li>
          )}
        </ol>
      </div>
    </section>
  );
}

export default Blueprint;