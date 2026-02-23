'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg';
}

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const maxWidthClass = size === 'sm' ? 'max-w-md' : size === 'lg' ? 'max-w-3xl' : 'max-w-xl';

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={`modal-content ${maxWidthClass}`}>
                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-4 border-b border-dark-100">
                    <h2 className="text-lg font-bold text-dark-900">{title}</h2>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-xl bg-dark-50 flex items-center justify-center text-dark-500 hover:text-dark-900 hover:bg-dark-100 transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                {/* Body */}
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
}
