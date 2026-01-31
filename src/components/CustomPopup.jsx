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
    cancelText = 'Cancel'
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
