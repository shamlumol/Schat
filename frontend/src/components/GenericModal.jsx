import React, { useState, useEffect } from 'react';

const GenericModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  mode = 'alert', // 'alert' | 'confirm' | 'prompt'
  type = 'default', // 'default' | 'danger'
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  defaultValue = '',
}) => {
  const [inputValue, setInputValue] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) {
      setInputValue(defaultValue);
    }
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (mode === 'prompt') {
      onConfirm(inputValue);
    } else {
      onConfirm();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div 
        className="bg-surface w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-outline-variant/20 animate-fade-in-up"
        style={{ minWidth: '300px' }}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-outline-variant/10">
          <h2 className="text-lg font-bold font-display text-on-surface m-0 flex items-center gap-2">
            {type === 'danger' && <span className="material-symbols-outlined text-error">warning</span>}
            {title || (mode === 'alert' ? 'Alert' : mode === 'confirm' ? 'Confirm' : 'Input Required')}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {message && <p className="text-sm text-on-surface-variant mb-4">{message}</p>}
          
          {mode === 'prompt' && (
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-surface-container-low border border-outline-variant/20 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-xl py-3 px-4 text-sm text-on-surface outline-none transition-all"
              autoFocus
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-outline-variant/10 bg-surface-container-lowest flex justify-end gap-3">
          {mode !== 'alert' && (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl font-medium text-sm text-on-surface-variant hover:bg-surface-variant transition-colors"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors shadow-sm hover:shadow active:scale-95 ${
              type === 'danger' 
                ? 'bg-error text-on-error hover:bg-error/90' 
                : 'bg-primary text-on-primary hover:bg-primary/90'
            }`}
          >
            {mode === 'alert' ? 'OK' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenericModal;
