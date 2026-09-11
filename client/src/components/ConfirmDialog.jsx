export default function ConfirmDialog({ 
  isOpen, 
  title = 'Are you sure?', 
  message = 'This action cannot be undone.', 
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  icon = '⚠️',
  onConfirm, 
  onCancel,
  danger = true 
}) {
  if (!isOpen) return null;

  return (
    <div className="confirm-modal-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-icon">{icon}</div>
        <h3 className="confirm-title">{title}</h3>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="confirm-button-cancel" onClick={onCancel}>
            {cancelText}
          </button>
          <button 
            className={danger ? 'confirm-button-confirm' : 'primary-button'} 
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}