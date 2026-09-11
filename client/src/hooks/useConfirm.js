import { useState } from 'react';

export function useConfirm() {
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    icon: '⚠️',
    onConfirm: null,
  });

  const confirm = (options) => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        title: options.title || 'Are you sure?',
        message: options.message || 'This action cannot be undone.',
        confirmText: options.confirmText || 'Confirm',
        icon: options.icon || '⚠️',
        onConfirm: () => {
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
          resolve(true);
        },
      });
    });
  };

  const closeConfirm = () => {
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
  };

  return { confirmState, confirm, closeConfirm };
}