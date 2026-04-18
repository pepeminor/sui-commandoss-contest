'use client';

import { useEffect, useCallback, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function Modal({ open, onClose, title, children, actions }: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="modal__header">
            <h3 className="modal__title">{title}</h3>
            <button className="modal__close" onClick={onClose} aria-label="Close">
              <i className="ri-close-line" style={{ fontSize: 16 }} />
            </button>
          </div>
        )}
        <div className="modal__body">{children}</div>
        {actions && <div className="modal__actions">{actions}</div>}
      </div>
    </div>
  );
}
