import React from 'react';
// Removed Modal.css import - now using Tailwind classes

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info', // 'info', 'success', 'error', 'warning', 'confirm'
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Cancel',
  showCancel = false 
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'confirm':
        return '❓';
      default:
        return 'ℹ️';
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 dark:bg-black/80 flex items-center justify-center z-50 animate-fade-in" onClick={handleBackdropClick}>
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-11/12 max-h-96 overflow-hidden animate-slide-in">
        <div className={`flex items-center p-5 border-b ${
          type === 'success' ? 'border-green-200 dark:border-green-700' :
          type === 'error' ? 'border-red-200 dark:border-red-700' :
          type === 'warning' ? 'border-orange-200 dark:border-orange-700' :
          type === 'confirm' ? 'border-purple-200 dark:border-purple-700' :
          'border-gray-200 dark:border-gray-700'
        } relative`}>
          <div className="text-7xl mr-3">{getIcon()}</div>
          {title && <h3 className="flex-1 m-0 text-xl font-semibold text-gray-800 dark:text-white">{title}</h3>}
          <button
            className="absolute top-4 right-5 bg-none border-none text-2xl cursor-pointer text-gray-500 dark:text-gray-400 p-1 leading-none transition-colors hover:text-gray-700 dark:hover:text-gray-300"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="p-5">
          <p className="m-0 text-base leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-line">{message}</p>
        </div>
        
        <div className={`p-4 pl-5 pr-5 pb-5 flex gap-3 justify-end border-t ${
          type === 'success' ? 'border-green-200 dark:border-green-700' :
          type === 'error' ? 'border-red-200 dark:border-red-700' :
          type === 'warning' ? 'border-orange-200 dark:border-orange-700' :
          type === 'confirm' ? 'border-purple-200 dark:border-purple-700' :
          'border-gray-200 dark:border-gray-700'
        }`}>
          {showCancel && (
            <button
              className="px-5 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all border border-transparent min-w-20 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
              onClick={handleCancel}
            >
              {cancelText}
            </button>
          )}
          <button
            className={`px-5 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all border border-transparent min-w-20 text-white ${
              type === 'success' ? 'bg-green-500 border-green-500 hover:bg-green-600 hover:border-green-600 dark:bg-green-600 dark:border-green-600 dark:hover:bg-green-700 dark:hover:border-green-700' :
              type === 'error' ? 'bg-red-500 border-red-500 hover:bg-red-600 hover:border-red-600 dark:bg-red-600 dark:border-red-600 dark:hover:bg-red-700 dark:hover:border-red-700' :
              type === 'warning' ? 'bg-orange-500 border-orange-500 hover:bg-orange-600 hover:border-orange-600 dark:bg-orange-600 dark:border-orange-600 dark:hover:bg-orange-700 dark:hover:border-orange-700' :
              type === 'confirm' ? 'bg-purple-500 border-purple-500 hover:bg-purple-600 hover:border-purple-600 dark:bg-purple-600 dark:border-purple-600 dark:hover:bg-purple-700 dark:hover:border-purple-700' :
              'bg-blue-500 border-blue-500 hover:bg-blue-600 hover:border-blue-600 dark:bg-blue-600 dark:border-blue-600 dark:hover:bg-blue-700 dark:hover:border-blue-700'
            }`}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
