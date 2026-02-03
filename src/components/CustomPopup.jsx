import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import '../styles/CustomPopup.css';

const CustomPopup = ({
    show,
    onClose,
    onConfirm,
    title,
    message,
    type = 'info',
    mode = 'alert', // 'alert' or 'confirm'
    confirmText = 'OK',
    cancelText = 'Cancel',
    children // NEW: Support for custom content
}) => {
    if (!show) return null;

    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle size={32} />;
            case 'error': return <XCircle size={32} />;
            case 'warning': return <AlertTriangle size={32} />;
            default: return <Info size={32} />;
        }
    };

    // If children are provided, render custom content layout
    if (children) {
        return (
            <div className="popup-overlay" onClick={onClose}>
                <div className="popup-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', width: '100%' }}>
                    <button
                        className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        onClick={onClose}
                    >
                        <X size={20} />
                    </button>
                    {children}
                </div>
            </div>
        );
    }

    // Default layout with title and message
    return (
        <div className="popup-overlay" onClick={mode === 'alert' ? onClose : undefined}>
            <div className="popup-content" onClick={e => e.stopPropagation()}>
                <div className="popup-header">
                    <div className={`popup-icon ${type}`}>
                        {getIcon()}
                    </div>
                </div>
                <div className="popup-body">
                    <h3>{title}</h3>
                    <p>{message}</p>
                </div>
                <div className="popup-footer">
                    {mode === 'confirm' && (
                        <button className="popup-btn secondary" onClick={onClose}>
                            {cancelText}
                        </button>
                    )}
                    <button
                        className="popup-btn primary"
                        onClick={() => {
                            if (mode === 'confirm' && onConfirm) {
                                onConfirm();
                            } else {
                                onClose();
                            }
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomPopup;
