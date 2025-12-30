import React from 'react';

interface InputGroupProps {
    label: string;
    subLabel?: string;
    tooltip?: string;
    children: React.ReactNode;
}

export const InputGroup: React.FC<InputGroupProps> = ({ label, subLabel, tooltip, children }) => {
    return (
        <div className="group">
            <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider transition-colors group-focus-within:text-[var(--accent)]">
                    {label}
                    {tooltip && (
                        <span className="ml-1.5 hover:text-[var(--accent)] cursor-help relative inline-block align-top transition-colors">
                            <i className="fas fa-circle-info text-[10px]"></i>
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-main)] text-xs font-medium normal-case p-3 rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none text-left leading-relaxed">
                                {tooltip}
                            </span>
                        </span>
                    )}
                </label>
                {subLabel && <span className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-main)] px-1.5 py-0.5 rounded border border-[var(--border)] opacity-80">{subLabel}</span>}
            </div>
            <div className="relative">
                {children}
            </div>
        </div>
    );
};