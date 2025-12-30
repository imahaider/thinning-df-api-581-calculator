import React from 'react';
import { CalculatorState, CalculationResult } from '../types';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    state: CalculatorState;
    result: CalculationResult | null;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, state, result }) => {
    if (!isOpen || !result) return null;

    const units = {
        length: state.unitSystem === 'imperial' ? 'in' : 'mm',
        rate: state.unitSystem === 'imperial' ? 'in/yr' : 'mm/yr',
        stress: state.unitSystem === 'imperial' ? 'psi' : 'MPa',
    };

    const handlePrint = () => {
        window.print();
    };

    const SectionHeader = ({ title }: { title: string }) => (
        <div className="border-b-2 border-gray-800 pb-1 mb-3 mt-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800">{title}</h3>
        </div>
    );

    const Row = ({ label, value, unit, sub }: { label: string; value: string | number; unit?: string; sub?: string }) => (
        <div className="flex justify-between py-1 text-xs border-b border-gray-100 last:border-0">
            <span className="text-gray-600 font-medium">
                {label}
                {sub && <span className="text-gray-400 text-[10px] ml-1">({sub})</span>}
            </span>
            <span className="font-mono font-bold text-gray-900">
                {value}
                {unit && <span className="text-gray-500 ml-1 font-sans font-normal">{unit}</span>}
            </span>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:p-0 print:bg-white print:static print:block">
            <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl animate-fadeIn print:shadow-none print:max-h-none print:w-full print:rounded-none">
                
                {/* Header / Actions */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center print:hidden z-10">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <i className="fas fa-file-invoice"></i> Calculation Report
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={handlePrint} className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded hover:bg-gray-800 transition-colors">
                            <i className="fas fa-print mr-2"></i> Print
                        </button>
                        <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded hover:bg-gray-200 transition-colors">
                            Close
                        </button>
                    </div>
                </div>

                {/* Printable Content */}
                <div className="p-8 print:p-0 text-gray-900">
                    
                    {/* Report Header */}
                    <div className="mb-8 flex justify-between items-end border-b-4 border-gray-900 pb-4">
                        <div>
                            <h1 className="text-2xl font-bold uppercase tracking-tight">API 581 Thinning</h1>
                            <div className="text-sm text-gray-500 font-mono mt-1">Damage Factor Calculation</div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-gray-400">Date Generated</div>
                            <div className="text-sm font-mono font-bold">{new Date().toLocaleDateString()}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2">
                        
                        {/* Inputs Column */}
                        <div>
                            <SectionHeader title="1. Design & Material Inputs" />
                            <Row label="Basis" value={state.basis === 'furnished' ? 'Furnished Thickness' : 'Inspection Data'} />
                            <Row label="Reference Thickness" sub="t_rdi" value={state.basis === 'furnished' ? state.t_furnished : state.t_rdi_measured} unit={units.length} />
                            <Row label="Age" value={state.basis === 'furnished' ? state.age_comp : state.age_tk_measured} unit="years" />
                            
                            <div className="mt-3 bg-gray-50 p-2 rounded border border-gray-100">
                                <Row label="Yield Strength" value={state.ys} unit={units.stress} />
                                <Row label="Tensile Strength" value={state.ts} unit={units.stress} />
                                <Row label="Weld Efficiency" value={state.wje} />
                            </div>

                            <SectionHeader title="2. Corrosion Inputs" />
                            <Row label="Base Metal Rate" value={state.cr_bm} unit={units.rate} />
                            <Row label="Cladding Present" value={state.has_cladding ? 'Yes' : 'No'} />
                            {state.has_cladding && (
                                <>
                                    <Row label="Clad Rate" value={state.cr_cm} unit={units.rate} />
                                    <Row label="Clad Thickness" value={state.t_cm_orig} unit={units.length} />
                                </>
                            )}
                            <Row label="Liner Present" value={state.has_liner ? 'Yes' : 'No'} />
                            {state.has_liner && (
                                <Row label="Liner Type" value={state.liner_type.replace('_', ' ')} />
                            )}
                        </div>

                        {/* Calculations Column */}
                        <div>
                            <SectionHeader title="3. Intermediate Results" />
                            <div className="space-y-2">
                                <div className="bg-gray-50 p-3 rounded border border-gray-100">
                                    <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Time to Corrode Protection</div>
                                    <div className="flex justify-between items-baseline">
                                        <span className="font-mono text-xs">age_rc =</span>
                                        <span className="font-mono font-bold">{result.age_rc.toFixed(2)} years</span>
                                    </div>
                                </div>
                                
                                <div className="bg-gray-50 p-3 rounded border border-gray-100">
                                    <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Wall Loss Fraction</div>
                                    <div className="flex justify-between items-baseline">
                                        <span className="font-mono text-xs">Ar/t =</span>
                                        <span className="font-mono font-bold">{result.art.toFixed(4)}</span>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-3 rounded border border-gray-100">
                                    <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Strength Ratio</div>
                                    <div className="flex justify-between items-baseline">
                                        <span className="font-mono text-xs">SRp =</span>
                                        <span className="font-mono font-bold">{result.srp.toFixed(3)}</span>
                                    </div>
                                    <div className="text-[9px] text-gray-400 mt-1 text-right">Governing t: {result.governing_thick}</div>
                                </div>
                            </div>

                            <SectionHeader title="4. Reliability (Bayesian)" />
                            <Row label="Confidence Level" value={state.confidence_level.toUpperCase()} />
                            <div className="grid grid-cols-3 gap-2 mt-2 text-center text-xs">
                                <div className="p-1 bg-green-50 border border-green-100 rounded">
                                    <div className="text-green-700 font-bold">{result.po1.toFixed(2)}</div>
                                    <div className="text-[9px] text-green-600">Low</div>
                                </div>
                                <div className="p-1 bg-yellow-50 border border-yellow-100 rounded">
                                    <div className="text-yellow-700 font-bold">{result.po2.toFixed(2)}</div>
                                    <div className="text-[9px] text-yellow-600">Med</div>
                                </div>
                                <div className="p-1 bg-red-50 border border-red-100 rounded">
                                    <div className="text-red-700 font-bold">{result.po3.toFixed(2)}</div>
                                    <div className="text-[9px] text-red-600">High</div>
                                </div>
                            </div>
                            
                            <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs font-mono text-gray-500">
                                <div>β1: {result.beta1.toFixed(1)}</div>
                                <div>β2: {result.beta2.toFixed(1)}</div>
                                <div>β3: {result.beta3.toFixed(1)}</div>
                            </div>
                        </div>
                    </div>

                    <SectionHeader title="5. Final Calculation" />
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-mono mb-4 text-gray-600">
                             <div className="flex flex-col items-center">
                                <span className="font-bold text-gray-900">{result.df_base.toExponential(2)}</span>
                                <span className="text-[10px]">DF_Base</span>
                            </div>
                            <i className="fas fa-times text-gray-300"></i>
                            <div className="flex flex-col items-center">
                                <span className="font-bold text-gray-900">{result.f_ip}</span>
                                <span className="text-[10px]">F_IP</span>
                            </div>
                            <i className="fas fa-times text-gray-300"></i>
                            <div className="flex flex-col items-center">
                                <span className="font-bold text-gray-900">{result.f_dl}</span>
                                <span className="text-[10px]">F_DL</span>
                            </div>
                            <i className="fas fa-divide text-gray-300"></i>
                            <div className="flex flex-col items-center">
                                <span className="font-bold text-gray-900">{result.f_om}</span>
                                <span className="text-[10px]">F_OM</span>
                            </div>
                        </div>
                        
                        <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                             <span className="text-sm font-bold uppercase tracking-wider text-gray-600">Final Damage Factor</span>
                             <span className="text-3xl font-bold font-mono text-gray-900">{result.df_final.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 pt-4 border-t border-gray-200 text-[10px] text-gray-400 text-center font-mono">
                        <p>Calculated per API 581 3rd Edition, Part 2, Section 4 (Thinning).</p>
                        <p>User assumes all risk for usage. Verify with certified professional.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
