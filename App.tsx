import React, { useState, useEffect } from 'react';
import { Card } from './components/Card';
import { InputGroup } from './components/InputGroup';
import { ResultsCharts } from './components/ResultsCharts';
import { ReportModal } from './components/ReportModal';
import { CalculatorState, CalculationResult, DEFAULT_STATE } from './types';
import { calculateDamageFactor } from './utils';

// --- Styled Components & Helpers ---

const TabButton = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: string; label: string }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 rounded-lg mb-1
        ${active 
            ? 'bg-[var(--accent-dim)] text-[var(--accent)] border border-[var(--accent-border)] shadow-sm' 
            : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)] border border-transparent'
        }`}
    >
        <i className={`fas ${icon} w-5 text-center ${active ? 'text-[var(--accent)]' : 'opacity-70'}`}></i>
        <span>{label}</span>
        {active && <i className="fas fa-chevron-right ml-auto text-xs opacity-50"></i>}
    </button>
);

const Switch = ({ checked, onChange, label }: { checked: boolean; onChange: (e: any) => void; label: string }) => (
    <label className="flex items-center cursor-pointer group select-none">
        <div className="relative">
            <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
            <div className={`block w-9 h-5 rounded-full transition-colors duration-200 ease-in-out border ${checked ? 'bg-[var(--accent-dim)] border-[var(--accent)]' : 'bg-[var(--bg-input)] border-[var(--border)] group-hover:border-[var(--text-muted)]'}`}></div>
            <div className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full transition-transform duration-200 ease-in-out transform shadow-sm ${checked ? 'translate-x-4 bg-[var(--accent)]' : 'translate-x-0 bg-[var(--text-muted)]'}`}></div>
        </div>
        <span className="ml-3 text-sm font-medium text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors">{label}</span>
    </label>
);

const App: React.FC = () => {
    const [state, setState] = useState<CalculatorState>(DEFAULT_STATE);
    const [result, setResult] = useState<CalculationResult | null>(null);
    const [activeTab, setActiveTab] = useState<'basis' | 'rates' | 'stress' | 'history' | 'factors'>('basis');
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [viewMode, setViewMode] = useState<'table' | 'charts'>('table');
    const [showReport, setShowReport] = useState(false);

    // Theme Effect
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    // Calculation Effect
    useEffect(() => {
        const res = calculateDamageFactor(state);
        setResult(res);
    }, [state]);

    const update = (key: keyof CalculatorState, value: any) => {
        setState(prev => ({ ...prev, [key]: value }));
    };

    const handleNumberChange = (key: keyof CalculatorState, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const val = parseFloat(e.target.value);
        update(key, isNaN(val) ? 0 : val);
    };

    const handleSelectChange = (key: keyof CalculatorState, e: React.ChangeEvent<HTMLSelectElement>) => {
        update(key, e.target.value);
    };

    const handleCheckChange = (key: keyof CalculatorState, e: React.ChangeEvent<HTMLInputElement>) => {
        update(key, e.target.checked);
    };

    const toggleUnits = (newSystem: 'imperial' | 'metric') => {
        if (state.unitSystem === newSystem) return;
        setState(prev => {
            const toMetric = newSystem === 'metric';
            const factorLen = toMetric ? 25.4 : 1 / 25.4;
            const factorStress = toMetric ? 0.006894757 : 145.0377;
            const convert = (val: number, factor: number) => {
                if (!val) return 0;
                return parseFloat((val * factor).toFixed(4));
            };
            return {
                ...prev,
                unitSystem: newSystem,
                t_furnished: convert(prev.t_furnished, factorLen),
                t_rdi_measured: convert(prev.t_rdi_measured, factorLen),
                t_cm_orig: convert(prev.t_cm_orig, factorLen),
                t_bm_orig: convert(prev.t_bm_orig, factorLen),
                t_min: convert(prev.t_min, factorLen),
                t_c: convert(prev.t_c, factorLen),
                diameter: convert(prev.diameter, factorLen),
                cr_bm: convert(prev.cr_bm, factorLen),
                cr_cm: convert(prev.cr_cm, factorLen),
                ys: convert(prev.ys, factorStress),
                ts: convert(prev.ts, factorStress),
                allowable_stress: convert(prev.allowable_stress, factorStress),
                pressure: convert(prev.pressure, factorStress),
            };
        });
    };

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const units = {
        length: state.unitSystem === 'imperial' ? 'in' : 'mm',
        rate: state.unitSystem === 'imperial' ? 'in/yr' : 'mm/yr',
        stress: state.unitSystem === 'imperial' ? 'psi' : 'MPa',
    };

    const getDfColor = (df: number) => {
        if (df > 100) return 'text-[var(--danger)] drop-shadow-[0_0_8px_rgba(251,113,133,0.4)]';
        if (df > 10) return 'text-[var(--warning)] drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]';
        return 'text-[var(--success)] drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]';
    };

    const inputClass = "w-full bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-main)] text-sm rounded-lg focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] block p-2.5 transition-all placeholder-[var(--text-muted)] hover:border-[var(--text-muted)] font-mono";
    const selectClass = `${inputClass} cursor-pointer`;
    const btnClass = (isActive: boolean) => `px-3 py-1 text-xs font-mono font-medium rounded transition-all ${isActive ? 'bg-[var(--bg-card)] text-[var(--accent)] shadow-sm border border-[var(--border)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`;

    return (
        <div className="min-h-screen pb-12 flex flex-col transition-colors duration-300 relative">
            
            {/* Watermark */}
            <div className="fixed bottom-4 right-4 text-[var(--text-muted)] opacity-20 text-xs font-mono pointer-events-none select-none z-0">
                Muhammad Ali Haider
            </div>

            <ReportModal isOpen={showReport} onClose={() => setShowReport(false)} state={state} result={result} />

            {/* --- Top Bar --- */}
            <header className="border-b border-[var(--border)] bg-[var(--bg-main)]/80 backdrop-blur-sm sticky top-0 z-50 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-gradient-to-br from-[var(--accent)] to-blue-600 flex items-center justify-center shadow-lg shadow-[var(--accent)]/20">
                            <i className="fas fa-cube text-white text-xs"></i>
                        </div>
                        <h1 className="text-lg font-bold text-[var(--text-main)] tracking-tight">Thinning DF Calculator <span className="text-[var(--text-muted)] mx-1">-</span> API 581</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="hidden md:block text-xs font-mono text-[var(--text-muted)] mr-2 font-medium">Muhammad Ali Haider</span>
                        <div className="flex bg-[var(--bg-input)] rounded-md p-1 border border-[var(--border)]">
                            <button onClick={() => toggleUnits('imperial')} className={btnClass(state.unitSystem === 'imperial')}>IMP</button>
                            <button onClick={() => toggleUnits('metric')} className={btnClass(state.unitSystem === 'metric')}>MET</button>
                        </div>
                        <button onClick={toggleTheme} className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--bg-input)] hover:text-[var(--text-main)] transition-all">
                            {theme === 'dark' ? <i className="fas fa-sun text-yellow-400"></i> : <i className="fas fa-moon text-indigo-600"></i>}
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 z-10">
                
                {/* --- Left Column: Navigation (2/12) --- */}
                <nav className="lg:col-span-2 hidden lg:block sticky top-24 h-fit">
                    <div className="space-y-1">
                        <TabButton active={activeTab === 'basis'} onClick={() => setActiveTab('basis')} icon="fa-ruler-combined" label="Basis" />
                        <TabButton active={activeTab === 'rates'} onClick={() => setActiveTab('rates')} icon="fa-water" label="Rates" />
                        <TabButton active={activeTab === 'stress'} onClick={() => setActiveTab('stress')} icon="fa-compress-arrows-alt" label="Stress" />
                        <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon="fa-history" label="History" />
                        <TabButton active={activeTab === 'factors'} onClick={() => setActiveTab('factors')} icon="fa-sliders" label="Factors" />
                    </div>
                </nav>
                
                {/* Mobile Nav */}
                <div className="lg:hidden col-span-1 overflow-x-auto flex gap-2 pb-2 mb-2 no-scrollbar">
                     <button onClick={() => setActiveTab('basis')} className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold border ${activeTab === 'basis' ? 'bg-[var(--accent-dim)] border-[var(--accent-border)] text-[var(--accent)]' : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-muted)]'}`}>Basis</button>
                     <button onClick={() => setActiveTab('rates')} className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold border ${activeTab === 'rates' ? 'bg-[var(--accent-dim)] border-[var(--accent-border)] text-[var(--accent)]' : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-muted)]'}`}>Rates</button>
                     <button onClick={() => setActiveTab('stress')} className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold border ${activeTab === 'stress' ? 'bg-[var(--accent-dim)] border-[var(--accent-border)] text-[var(--accent)]' : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-muted)]'}`}>Stress</button>
                     <button onClick={() => setActiveTab('history')} className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold border ${activeTab === 'history' ? 'bg-[var(--accent-dim)] border-[var(--accent-border)] text-[var(--accent)]' : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-muted)]'}`}>History</button>
                     <button onClick={() => setActiveTab('factors')} className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold border ${activeTab === 'factors' ? 'bg-[var(--accent-dim)] border-[var(--accent-border)] text-[var(--accent)]' : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-muted)]'}`}>Factors</button>
                </div>

                {/* --- Center Column: Active Input Tab (6/12) --- */}
                <main className="lg:col-span-6 space-y-6 min-h-[500px]">
                    
                    {activeTab === 'basis' && (
                        <div className="animate-fadeIn space-y-6">
                            <Card title="Calculation Basis" icon="fa-database">
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <button onClick={() => update('basis', 'furnished')}
                                        className={`p-4 rounded-lg border flex flex-col items-center gap-2 transition-all ${state.basis === 'furnished' ? 'bg-[var(--accent-dim)] border-[var(--accent)] text-[var(--accent)]' : 'bg-[var(--bg-input)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-main)]'}`}>
                                        <i className="fas fa-file-contract text-lg"></i>
                                        <span className="text-xs font-bold uppercase">Furnished</span>
                                    </button>
                                    <button onClick={() => update('basis', 'inspection')}
                                        className={`p-4 rounded-lg border flex flex-col items-center gap-2 transition-all ${state.basis === 'inspection' ? 'bg-[var(--accent-dim)] border-[var(--accent)] text-[var(--accent)]' : 'bg-[var(--bg-input)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-main)]'}`}>
                                        <i className="fas fa-microscope text-lg"></i>
                                        <span className="text-xs font-bold uppercase">Inspection</span>
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {state.basis === 'furnished' ? (
                                        <>
                                            <InputGroup label="Furnished Thick" subLabel={`[${units.length}]`} tooltip="Nominal thickness per design docs.">
                                                <input type="number" step="0.001" className={inputClass} value={state.t_furnished} onChange={(e) => handleNumberChange('t_furnished', e)} />
                                            </InputGroup>
                                            <InputGroup label="Age" subLabel="[years]" tooltip="Total time in service.">
                                                <input type="number" step="0.1" className={inputClass} value={state.age_comp} onChange={(e) => handleNumberChange('age_comp', e)} />
                                            </InputGroup>
                                        </>
                                    ) : (
                                        <>
                                            <InputGroup label="Measured Thick" subLabel={`[${units.length}]`} tooltip="Most recent thickness reading.">
                                                <input type="number" step="0.001" className={inputClass} value={state.t_rdi_measured} onChange={(e) => handleNumberChange('t_rdi_measured', e)} />
                                            </InputGroup>
                                            <InputGroup label="Time Since Insp" subLabel="[years]" tooltip="Years since last measurement.">
                                                <input type="number" step="0.1" className={inputClass} value={state.age_tk_measured} onChange={(e) => handleNumberChange('age_tk_measured', e)} />
                                            </InputGroup>
                                        </>
                                    )}
                                </div>
                            </Card>
                            
                            <Card title="Cladding Configuration" icon="fa-layer-group">
                                <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border)]">
                                    <span className="text-sm font-medium text-[var(--text-main)]">Is component clad?</span>
                                    <Switch checked={state.has_cladding} onChange={(e: any) => handleCheckChange('has_cladding', e)} label="Enable" />
                                </div>
                                {state.has_cladding && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                                        <InputGroup label="Cladding Thickness" subLabel={`[${units.length}]`} tooltip="Thickness of the protective alloy layer.">
                                            <input type="number" step="0.001" className={inputClass} value={state.t_cm_orig} onChange={(e) => handleNumberChange('t_cm_orig', e)} />
                                        </InputGroup>
                                        <InputGroup label="Base Metal Thickness" subLabel={`[${units.length}]`} tooltip="Reference thickness of base metal only.">
                                            <input type="number" step="0.001" className={inputClass} value={state.t_bm_orig} onChange={(e) => handleNumberChange('t_bm_orig', e)} />
                                        </InputGroup>
                                    </div>
                                )}
                            </Card>
                        </div>
                    )}

                    {activeTab === 'rates' && (
                        <div className="animate-fadeIn space-y-6">
                            <Card title="Corrosion Rates" icon="fa-water">
                                <div className="grid grid-cols-1 gap-4">
                                    <InputGroup label="Base Metal Rate (Cr,bm)" subLabel={`[${units.rate}]`} tooltip="Yearly corrosion rate for the base material.">
                                        <input type="number" step="0.001" className={inputClass} value={state.cr_bm} onChange={(e) => handleNumberChange('cr_bm', e)} />
                                    </InputGroup>
                                    {state.has_cladding && (
                                        <InputGroup label="Cladding Rate (Cr,cm)" subLabel={`[${units.rate}]`} tooltip="Yearly corrosion rate for the cladding.">
                                            <input type="number" step="0.001" className={inputClass} value={state.cr_cm} onChange={(e) => handleNumberChange('cr_cm', e)} />
                                        </InputGroup>
                                    )}
                                </div>
                            </Card>
                            
                            <Card title="Internal Liner" icon="fa-shield-halved">
                                <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border)]">
                                    <span className="text-sm font-medium text-[var(--text-main)]">Internal Liner Present?</span>
                                    <Switch checked={state.has_liner} onChange={(e: any) => handleCheckChange('has_liner', e)} label="Enable" />
                                </div>
                                {state.has_liner && (
                                    <div className="space-y-4 animate-fadeIn">
                                        <InputGroup label="Liner Material" tooltip="Type of liner determines baseline life expectancy.">
                                            <select className={selectClass} value={state.liner_type} onChange={(e) => handleSelectChange('liner_type', e)}>
                                                <option value="strip">Alloy strip (10y)</option>
                                                <option value="organic_low">Organic Low (2y)</option>
                                                <option value="organic_med">Organic Med (4y)</option>
                                                <option value="organic_high">Organic High (7.5y)</option>
                                                <option value="glass">Glass (7.5y)</option>
                                                <option value="acid_brick">Acid brick (15y)</option>
                                                <option value="refractory">Refractory (3y)</option>
                                            </select>
                                        </InputGroup>
                                        <div className="grid grid-cols-2 gap-4">
                                            <InputGroup label="Liner Age" subLabel="[yr]" tooltip="Years since liner installation.">
                                                <input type="number" step="0.1" className={inputClass} value={state.age_liner} onChange={(e) => handleNumberChange('age_liner', e)} />
                                            </InputGroup>
                                            <InputGroup label="Condition" tooltip="Visual condition affecting reliability factor.">
                                                <select className={selectClass} value={state.liner_condition} onChange={(e) => handleSelectChange('liner_condition', e)}>
                                                    <option value="1">Good</option>
                                                    <option value="2">Average</option>
                                                    <option value="10">Poor</option>
                                                </select>
                                            </InputGroup>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        </div>
                    )}

                    {activeTab === 'stress' && (
                        <div className="animate-fadeIn space-y-6">
                            <Card title="Material Properties" icon="fa-atom">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <InputGroup label="Yield Strength" subLabel={`[${units.stress}]`} tooltip="Yield point of material.">
                                        <input type="number" className={inputClass} value={state.ys} onChange={(e) => handleNumberChange('ys', e)} />
                                    </InputGroup>
                                    <InputGroup label="Tensile Strength" subLabel={`[${units.stress}]`} tooltip="Ultimate tensile strength.">
                                        <input type="number" className={inputClass} value={state.ts} onChange={(e) => handleNumberChange('ts', e)} />
                                    </InputGroup>
                                    <InputGroup label="Weld Efficiency" tooltip="Joint efficiency factor (0-1).">
                                        <input type="number" step="0.01" max="1.0" className={inputClass} value={state.wje} onChange={(e) => handleNumberChange('wje', e)} />
                                    </InputGroup>
                                </div>
                            </Card>

                            <Card title="Load Calculations" icon="fa-weight-hanging">
                                <div className="mb-6">
                                    <InputGroup label="Formula Method" tooltip="Eq 2.14 for code-based, Eq 2.15 for pure pressure/hoop.">
                                        <select className={selectClass} value={state.sr_method} onChange={(e) => handleSelectChange('sr_method', e)}>
                                            <option value="structural">Eq 2.14: Structural / Code Min</option>
                                            <option value="pressure">Eq 2.15: Internal Pressure</option>
                                        </select>
                                    </InputGroup>
                                </div>
                                {state.sr_method === 'structural' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                                        <InputGroup label="Allowable Stress" subLabel={`[${units.stress}]`}>
                                            <input type="number" className={inputClass} value={state.allowable_stress} onChange={(e) => handleNumberChange('allowable_stress', e)} />
                                        </InputGroup>
                                        <InputGroup label="Code Min Thick" subLabel={`[${units.length}]`}>
                                            <input type="number" step="0.001" className={inputClass} value={state.t_min} onChange={(e) => handleNumberChange('t_min', e)} />
                                        </InputGroup>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeIn">
                                        <InputGroup label="Pressure" subLabel={`[${units.stress}]`}>
                                            <input type="number" className={inputClass} value={state.pressure} onChange={(e) => handleNumberChange('pressure', e)} />
                                        </InputGroup>
                                        <InputGroup label="Inside Diameter" subLabel={`[${units.length}]`}>
                                            <input type="number" className={inputClass} value={state.diameter} onChange={(e) => handleNumberChange('diameter', e)} />
                                        </InputGroup>
                                        <InputGroup label="Shape Factor">
                                            <select className={selectClass} value={state.shape_factor} onChange={(e) => handleNumberChange('shape_factor', e)}>
                                                <option value="2">Cylinder (2)</option>
                                                <option value="4">Sphere (4)</option>
                                                <option value="1.13">Head (1.13)</option>
                                            </select>
                                        </InputGroup>
                                    </div>
                                )}
                            </Card>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="animate-fadeIn space-y-6">
                            <Card title="Inspection Effectiveness" icon="fa-magnifying-glass-chart">
                                <div className="mb-6">
                                    <InputGroup label="Data Confidence" tooltip="Overall confidence in the data quality.">
                                        <select className={selectClass} value={state.confidence_level} onChange={(e) => handleSelectChange('confidence_level', e)}>
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>
                                    </InputGroup>
                                </div>
                                <div className="grid grid-cols-4 gap-3 text-center">
                                    <div className="p-3 rounded bg-[var(--success)]/10 border border-[var(--success)]/30">
                                        <div className="text-xs font-bold text-[var(--success)] mb-2">Type A</div>
                                        <input type="number" min="0" className="w-full bg-transparent text-center font-mono text-[var(--text-main)] focus:outline-none border-b border-[var(--success)]/30 focus:border-[var(--success)]" value={state.n_A} onChange={(e) => handleNumberChange('n_A', e)} />
                                    </div>
                                    <div className="p-3 rounded bg-[var(--accent)]/10 border border-[var(--accent)]/30">
                                        <div className="text-xs font-bold text-[var(--accent)] mb-2">Type B</div>
                                        <input type="number" min="0" className="w-full bg-transparent text-center font-mono text-[var(--text-main)] focus:outline-none border-b border-[var(--accent)]/30 focus:border-[var(--accent)]" value={state.n_B} onChange={(e) => handleNumberChange('n_B', e)} />
                                    </div>
                                    <div className="p-3 rounded bg-[var(--warning)]/10 border border-[var(--warning)]/30">
                                        <div className="text-xs font-bold text-[var(--warning)] mb-2">Type C</div>
                                        <input type="number" min="0" className="w-full bg-transparent text-center font-mono text-[var(--text-main)] focus:outline-none border-b border-[var(--warning)]/30 focus:border-[var(--warning)]" value={state.n_C} onChange={(e) => handleNumberChange('n_C', e)} />
                                    </div>
                                    <div className="p-3 rounded bg-[var(--danger)]/10 border border-[var(--danger)]/30">
                                        <div className="text-xs font-bold text-[var(--danger)] mb-2">Type D</div>
                                        <input type="number" min="0" className="w-full bg-transparent text-center font-mono text-[var(--text-main)] focus:outline-none border-b border-[var(--danger)]/30 focus:border-[var(--danger)]" value={state.n_D} onChange={(e) => handleNumberChange('n_D', e)} />
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'factors' && (
                        <div className="animate-fadeIn space-y-6">
                            <Card title="Risk Modifiers" icon="fa-triangle-exclamation">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-4 rounded bg-[var(--bg-input)] border border-[var(--border)]">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <i className="fas fa-desktop text-[var(--text-muted)]"></i>
                                                <span className="text-sm font-bold text-[var(--text-main)] uppercase">Online Monitoring</span>
                                            </div>
                                            <div className="text-xs text-[var(--text-muted)] mb-3">Does the system use real-time corrosion monitoring?</div>
                                            {state.has_om && (
                                                 <div className="grid grid-cols-2 gap-2 animate-fadeIn">
                                                    <select className={selectClass} value={state.om_mechanism} onChange={(e) => handleSelectChange('om_mechanism', e)}>
                                                        <option value="hcl">HCl</option>
                                                        <option value="acid">Sulfidic</option>
                                                        <option value="sour">Sour Water</option>
                                                        <option value="amine">Amine</option>
                                                        <option value="other">Other</option>
                                                    </select>
                                                    <select className={selectClass} value={state.om_method} onChange={(e) => handleSelectChange('om_method', e)}>
                                                        <option value="probes">Probes</option>
                                                        <option value="coupons">Coupons</option>
                                                        <option value="key_var">Key Var</option>
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                        <div className="ml-4 h-full flex items-start">
                                            <Switch checked={state.has_om} onChange={(e: any) => handleCheckChange('has_om', e)} label="" />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded bg-[var(--bg-input)] border border-[var(--border)]">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <i className="fas fa-syringe text-[var(--text-muted)]"></i>
                                                <span className="text-sm font-bold text-[var(--text-main)] uppercase">Injection Point</span>
                                            </div>
                                            <div className="text-xs text-[var(--text-muted)] mb-2">Presence of injection/mixing points.</div>
                                            {state.has_ip && (
                                                <div className="animate-fadeIn">
                                                    <InputGroup label="Inspection Effective?" tooltip="Is inspection specifically targeted at the IP?">
                                                        <select className={selectClass} value={state.ip_effective} onChange={(e) => handleSelectChange('ip_effective', e)}>
                                                            <option value="no">No (3x Penalty)</option>
                                                            <option value="yes">Yes (1x)</option>
                                                        </select>
                                                    </InputGroup>
                                                </div>
                                            )}
                                        </div>
                                        <div className="ml-4">
                                            <Switch checked={state.has_ip} onChange={(e: any) => handleCheckChange('has_ip', e)} label="" />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded bg-[var(--bg-input)] border border-[var(--border)]">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <i className="fas fa-ban text-[var(--text-muted)]"></i>
                                                <span className="text-sm font-bold text-[var(--text-main)] uppercase">Dead Legs</span>
                                            </div>
                                            <div className="text-xs text-[var(--text-muted)] mb-2">Stagnant flow areas.</div>
                                            {state.has_dl && (
                                                 <div className="animate-fadeIn">
                                                    <InputGroup label="Inspection Effective?" tooltip="Is inspection specifically targeted at the dead leg?">
                                                        <select className={selectClass} value={state.dl_effective} onChange={(e) => handleSelectChange('dl_effective', e)}>
                                                            <option value="no">No (3x Penalty)</option>
                                                            <option value="yes">Yes (1x)</option>
                                                        </select>
                                                    </InputGroup>
                                                </div>
                                            )}
                                        </div>
                                        <div className="ml-4">
                                            <Switch checked={state.has_dl} onChange={(e: any) => handleCheckChange('has_dl', e)} label="" />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}
                </main>

                {/* --- Right Column: Results (4/12) --- */}
                <aside className="lg:col-span-4 space-y-6">
                    <div className="sticky top-24">
                        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] shadow-2xl shadow-[var(--shadow-color)] overflow-hidden relative group transition-colors duration-300">
                            <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-dim)]/5 to-[var(--accent-dim)]/10 pointer-events-none"></div>
                            
                            {/* HUD Header */}
                            <div className="p-6 border-b border-[var(--border)] relative bg-[var(--bg-main)]/50 backdrop-blur">
                                <div className="absolute top-0 left-0 w-20 h-[1px] bg-[var(--accent)] shadow-[0_0_10px_var(--accent)]"></div>
                                <h3 className="text-xs font-mono text-[var(--accent)] uppercase tracking-widest mb-1">Analysis Result</h3>
                                {result && !result.error ? (
                                    <div className={`text-6xl font-bold tracking-tighter ${getDfColor(result.df_final)} transition-all duration-300`}>
                                        {result.df_final.toFixed(2)}
                                    </div>
                                ) : (
                                    <div className="text-6xl font-bold text-[var(--text-muted)] animate-pulse">-</div>
                                )}
                                <div className="absolute top-4 right-4 flex flex-col gap-1 items-end opacity-60">
                                    <div className="w-1 h-1 rounded-full bg-[var(--accent)] animate-pulse"></div>
                                    <div className="w-1 h-1 rounded-full bg-[var(--text-muted)]"></div>
                                    <div className="w-1 h-1 rounded-full bg-[var(--text-muted)]"></div>
                                </div>
                            </div>

                            {/* View Toggle */}
                            <div className="flex border-b border-[var(--border)] bg-[var(--bg-input)]/50">
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${viewMode === 'table' ? 'text-[var(--accent)] bg-[var(--bg-card)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                                >
                                    Data Table
                                </button>
                                <button
                                    onClick={() => setViewMode('charts')}
                                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${viewMode === 'charts' ? 'text-[var(--accent)] bg-[var(--bg-card)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                                >
                                    Charts
                                </button>
                            </div>

                            {/* Data Grid / Charts */}
                            {result && !result.error && (
                                <div className="p-0">
                                    {viewMode === 'table' ? (
                                        <div className="animate-fadeIn">
                                            {/* Primary Factors */}
                                            <div className="grid grid-cols-2 divide-x divide-y divide-[var(--border)] border-b border-[var(--border)]">
                                                <div className="p-4">
                                                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Base DF</div>
                                                    <div className="text-sm font-mono text-[var(--text-main)]">{result.df_base.toExponential(2)}</div>
                                                </div>
                                                <div className="p-4">
                                                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Wall Loss (Ar/t)</div>
                                                    <div className="text-sm font-mono text-[var(--text-main)]">{result.art.toFixed(4)}</div>
                                                </div>
                                                <div className="p-4">
                                                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Strength Ratio</div>
                                                    <div className="text-sm font-mono text-[var(--text-main)]">{result.srp.toFixed(3)}</div>
                                                </div>
                                                <div className="p-4">
                                                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Flow Stress</div>
                                                    <div className="text-sm font-mono text-[var(--text-main)]">{Math.round(result.fs_thin)}</div>
                                                </div>
                                            </div>

                                            {/* Expanded Intermediate Factors */}
                                            <div className="p-4 border-b border-[var(--border)] bg-[var(--bg-input)]/50">
                                                <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-3">Intermediate Factors</div>
                                                <div className="grid grid-cols-2 gap-4 text-xs">
                                                    <div className="flex justify-between">
                                                        <span className="text-[var(--text-muted)]">Protection Life:</span>
                                                        <span className="font-mono text-[var(--text-main)]">{result.age_rc.toFixed(1)} yr</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-[var(--text-muted)]">Eff. Age:</span>
                                                        <span className="font-mono text-[var(--text-main)]">{result.effective_age.toFixed(1)} yr</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-[var(--text-muted)]">Gov. Thick:</span>
                                                        <span className="font-mono text-[var(--text-main)]">{result.governing_thick.toFixed(3)}</span>
                                                    </div>
                                                     <div className="flex justify-between">
                                                        <span className="text-[var(--text-muted)]">Clad Rem:</span>
                                                        <span className="font-mono text-[var(--text-main)]">{result.t_cm_curr.toFixed(3)}</span>
                                                    </div>
                                                </div>
                                                <div className="mt-3 pt-3 border-t border-[var(--border)]">
                                                    <div className="grid grid-cols-3 gap-1 text-center">
                                                        <div className="bg-[var(--bg-main)] rounded border border-[var(--border)] p-1">
                                                            <div className="text-[9px] text-[var(--text-muted)]">Beta 1</div>
                                                            <div className="text-xs font-mono">{result.beta1.toFixed(1)}</div>
                                                        </div>
                                                        <div className="bg-[var(--bg-main)] rounded border border-[var(--border)] p-1">
                                                            <div className="text-[9px] text-[var(--text-muted)]">Beta 2</div>
                                                            <div className="text-xs font-mono">{result.beta2.toFixed(1)}</div>
                                                        </div>
                                                        <div className="bg-[var(--bg-main)] rounded border border-[var(--border)] p-1">
                                                            <div className="text-[9px] text-[var(--text-muted)]">Beta 3</div>
                                                            <div className="text-xs font-mono">{result.beta3.toFixed(1)}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-6 space-y-4">
                                                <div>
                                                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-3">Bayesian Probability</div>
                                                    <div className="flex h-2 bg-[var(--bg-input)] rounded-full overflow-hidden mb-2 border border-[var(--border)]">
                                                        <div style={{ width: `${result.po1 * 100}%` }} className="bg-[var(--success)] transition-all duration-500"></div>
                                                        <div style={{ width: `${result.po2 * 100}%` }} className="bg-[var(--warning)] transition-all duration-500"></div>
                                                        <div style={{ width: `${result.po3 * 100}%` }} className="bg-[var(--danger)] transition-all duration-500"></div>
                                                    </div>
                                                    <div className="flex justify-between text-[10px] font-mono text-[var(--text-muted)]">
                                                        <span>Low</span>
                                                        <span>Med</span>
                                                        <span>High</span>
                                                    </div>
                                                </div>

                                                <div className="pt-4 border-t border-[var(--border)]">
                                                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-3">Active Modifiers</div>
                                                    <div className="flex gap-2">
                                                        <div className={`px-2 py-1 rounded text-[10px] font-bold border ${result.f_om < 1 ? 'bg-[var(--success)]/10 border-[var(--success)]/30 text-[var(--success)]' : 'bg-[var(--bg-input)] border-[var(--border)] text-[var(--text-muted)]'}`}>OM</div>
                                                        <div className={`px-2 py-1 rounded text-[10px] font-bold border ${result.f_ip > 1 ? 'bg-[var(--danger)]/10 border-[var(--danger)]/30 text-[var(--danger)]' : 'bg-[var(--bg-input)] border-[var(--border)] text-[var(--text-muted)]'}`}>IP</div>
                                                        <div className={`px-2 py-1 rounded text-[10px] font-bold border ${result.f_dl > 1 ? 'bg-[var(--danger)]/10 border-[var(--danger)]/30 text-[var(--danger)]' : 'bg-[var(--bg-input)] border-[var(--border)] text-[var(--text-muted)]'}`}>DL</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4">
                                            <ResultsCharts result={result} state={state} />
                                        </div>
                                    )}
                                </div>
                            )}

                            {result?.error && (
                                <div className="p-6 bg-[var(--danger)]/10 border-t border-[var(--danger)]/20 text-center">
                                    <div className="text-[var(--danger)] text-xs font-mono">{result.error}</div>
                                </div>
                            )}
                            
                            {/* Report Button */}
                            {result && !result.error && (
                                <div className="p-4 bg-[var(--bg-main)]/50 border-t border-[var(--border)]">
                                    <button 
                                        onClick={() => setShowReport(true)}
                                        className="w-full py-3 px-4 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white font-bold rounded-lg shadow-lg shadow-[var(--accent)]/20 transition-all flex items-center justify-center gap-2 text-sm"
                                    >
                                        <i className="fas fa-file-pdf"></i>
                                        Generate Report
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default App;