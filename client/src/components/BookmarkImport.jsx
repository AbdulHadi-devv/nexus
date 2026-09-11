// Add import at top
import BookmarkImport from '../components/BookmarkImport';

// Add state
const [showImportModal, setShowImportModal] = useState(false);

// Add to header actions (after New Item button):
<button onClick={() => setShowImportModal(true)} className="secondary-button small">
  📥 Import
</button>

// Add modal at bottom of dashboard-content (before closing div):
{showImportModal && (
  <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
    <div className="modal-content bookmark-import-modal" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h2>📥 Import Bookmarks</h2>
        <button onClick={() => setShowImportModal(false)} className="modal-close">✕</button>
      </div>
      <BookmarkImport onImportComplete={() => {
        setShowImportModal(false);
        fetchItems();
      }} />
    </div>
  </div>
)}