import React from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie, ReferenceLine, Legend
} from 'recharts';
import { CalculationResult, CalculatorState } from '../types';

interface ResultsChartsProps {
    result: CalculationResult;
    state: CalculatorState;
}

export const ResultsCharts: React.FC<ResultsChartsProps> = ({ result, state }) => {
    // --- 1. Corrosion Profile Data ---
    const generateProfileData = () => {
        const data = [];
        const maxAge = Math.ceil(state.age_comp + 10);
        
        // Determine initial conditions
        let t_base_start = 0;
        let t_clad_start = 0;
        let start_age_offset = 0; // If measuring from t=age_tk

        if (state.basis === 'furnished') {
            t_base_start = state.has_cladding ? state.t_bm_orig : state.t_furnished;
            t_clad_start = state.has_cladding ? state.t_cm_orig : 0;
            start_age_offset = 0;
        } else {
            // Reconstruct t=0 approximation for visualization
            // This assumes constant rate history.
            const t_measured = state.t_rdi_measured;
            const age_measured = state.age_tk_measured;
            
            if (state.has_cladding) {
                // Complex reconstruction ignored for simplicity in viz, assume t_measured is total
                // Just project forward from current measurement
                 t_base_start = t_measured; // simplified
                 t_clad_start = 0; // simplified
            } else {
                 t_base_start = t_measured + (age_measured * state.cr_bm);
                 t_clad_start = 0;
            }
        }

        const clad_life = (state.has_cladding && state.cr_cm > 0) ? t_clad_start / state.cr_cm : (state.has_cladding ? 999 : 0);

        for (let year = 0; year <= maxAge; year++) {
            let t_val = 0;
            
            if (state.has_cladding) {
                if (year < clad_life) {
                    // Cladding still there
                    const clad_rem = Math.max(0, t_clad_start - (year * state.cr_cm));
                    t_val = t_base_start + clad_rem;
                } else {
                    // Cladding gone, eating base
                    const base_loss = (year - clad_life) * state.cr_bm;
                    t_val = Math.max(0, t_base_start - base_loss);
                }
            } else {
                t_val = Math.max(0, t_base_start - (year * state.cr_bm));
            }

            data.push({
                year,
                thickness: Number(t_val.toFixed(3)),
                limit: result.governing_thick
            });
        }
        return data;
    };

    const profileData = generateProfileData();

    // --- 2. Beta Data ---
    const betaData = [
        { name: 'Beta 1', value: result.beta1 },
        { name: 'Beta 2', value: result.beta2 },
        { name: 'Beta 3', value: result.beta3 },
    ];

    // --- 3. Posterior Data ---
    const posteriorData = [
        { name: 'Low', value: result.po1, color: 'var(--success)' },
        { name: 'Med', value: result.po2, color: 'var(--warning)' },
        { name: 'High', value: result.po3, color: 'var(--danger)' },
    ].filter(d => d.value > 0.01); // Filter tiny slices

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[var(--bg-card)] border border-[var(--border)] p-2 rounded shadow-lg text-xs font-mono">
                    <p className="font-bold mb-1">{label}</p>
                    {payload.map((p: any, idx: number) => (
                        <p key={idx} style={{ color: p.color }}>
                            {p.name}: {p.value.toFixed(3)}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Corrosion Profile */}
            <div className="h-48 w-full">
                <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2 text-center">Thickness Projection</div>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={profileData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="year" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} domain={['auto', 'auto']} width={30} />
                        <Tooltip content={<CustomTooltip />} cursor={{stroke: 'var(--border)'}} />
                        <ReferenceLine y={result.governing_thick} stroke="var(--danger)" strokeDasharray="3 3" label={{ value: 'Min', position: 'insideTopRight', fill: 'var(--danger)', fontSize: 10 }} />
                         <ReferenceLine x={state.age_comp} stroke="var(--accent)" strokeDasharray="3 3" />
                        <Line type="monotone" dataKey="thickness" stroke="var(--accent)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="Thickness" />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-2">
                 {/* Beta Values */}
                <div className="h-32 w-full bg-[var(--bg-input)]/30 rounded border border-[var(--border)] p-2">
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2 text-center">Reliability Indices</div>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={betaData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                            <XAxis dataKey="name" hide />
                            <YAxis hide domain={[0, 'auto']} />
                            <Tooltip cursor={{fill: 'transparent'}} content={<CustomTooltip />} />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                {betaData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--success)' : index === 1 ? 'var(--warning)' : 'var(--danger)'} opacity={0.8} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                    <div className="flex justify-between px-2 text-[9px] text-[var(--text-muted)] mt-1 font-mono">
                        <span>β1</span><span>β2</span><span>β3</span>
                    </div>
                </div>

                {/* Posterior Pie */}
                <div className="h-32 w-full bg-[var(--bg-input)]/30 rounded border border-[var(--border)] p-2">
                     <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2 text-center">Confidence Dist.</div>
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={posteriorData}
                                cx="50%"
                                cy="50%"
                                innerRadius={25}
                                outerRadius={40}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {posteriorData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};
