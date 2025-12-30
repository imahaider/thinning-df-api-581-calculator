import React, { ReactNode } from 'react';

interface CardProps {
    children: ReactNode;
    title?: string;
    className?: string;
    icon?: string;
}

export const Card: React.FC<CardProps> = ({ children, title, className = "", icon }) => {
    return (
        <div className={`bg-[var(--bg-card)] rounded-xl border border-[var(--border)] shadow-lg shadow-[var(--shadow-color)] overflow-hidden transition-colors duration-300 ${className}`}>
            {title && (
                <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-3 bg-[var(--bg-main)]/30 backdrop-blur-sm transition-colors duration-300">
                    {icon && <i className={`fas ${icon} text-[var(--accent)] text-sm`}></i>}
                    <h2 className="text-sm font-bold text-[var(--text-main)] uppercase tracking-widest font-mono opacity-80">
                        {title}
                    </h2>
                </div>
            )}
            <div className="p-6">
                {children}
            </div>
        </div>
    );
};