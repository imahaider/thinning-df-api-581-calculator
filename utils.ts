import { CalculatorState, CalculationResult } from './types';
import { TABLE_4_5, TABLE_4_6, LINER_LIFE, MONITORING_FACTORS } from './constants';

function NORMSDIST(z: number): number {
    const p = 0.2316419;
    const b1 = 0.319381530;
    const b2 = -0.356563782;
    const b3 = 1.781477937;
    const b4 = -1.821255978;
    const b5 = 1.330274429;
    const t = 1 / (1 + p * Math.abs(z));
    const sigma = 1 - (1 / Math.sqrt(2 * Math.PI) * Math.exp(-0.5 * z * z)) * (b1 * t + b2 * Math.pow(t, 2) + b3 * Math.pow(t, 3) + b4 * Math.pow(t, 4) + b5 * Math.pow(t, 5));
    return z >= 0 ? sigma : 1 - sigma;
}

export function calculateDamageFactor(state: CalculatorState): CalculationResult {
    try {
        // 1. Gather Inputs based on Basis
        let t_rdi = 0;
        let age_tk = 0;

        if (state.basis === 'furnished') {
            t_rdi = state.t_furnished;
            age_tk = state.age_comp;
            if (t_rdi <= 0) throw new Error("Furnished Thickness must be > 0.");
        } else {
            t_rdi = state.t_rdi_measured;
            age_tk = state.age_tk_measured;
            if (t_rdi <= 0) throw new Error("Measured Thickness (t_rdi) must be > 0.");
        }

        const cr_bm = state.cr_bm;

        // 2. Determine age_rc (Cladding & Liner)
        // Cladding Logic
        let age_rc_clad = 0;
        let t_cm_curr = 0;

        if (state.has_cladding) {
            const cr_cm = state.cr_cm;
            t_cm_curr = state.t_cm_orig; // Used directly as per original logic

            if (t_cm_curr > 0 && cr_cm > 0) {
                age_rc_clad = t_cm_curr / cr_cm;
            } else if (t_cm_curr > 0 && cr_cm === 0) {
                age_rc_clad = 1000; // sufficiently large
            }
        }

        // Liner Logic
        let age_rc_liner = 0;
        if (state.has_liner) {
            const rl_exp = LINER_LIFE[state.liner_type];
            const age_liner = state.age_liner;
            const f_lc = parseFloat(state.liner_condition);
            const f_liner_om = state.liner_om ? 0.1 : 1.0;

            // Equation 2.11
            age_rc_liner = (rl_exp - age_liner) / f_lc * f_liner_om;
            if (age_rc_liner < 0) age_rc_liner = 0;
        }

        // Combined Remaining Life (Clad + Liner)
        const age_rc = age_rc_clad + age_rc_liner;

        // 3. Wall Loss Fraction (Art) - Eq 2.12
        const effective_corrosion_time = Math.max(age_tk - age_rc, 0);
        const art = (cr_bm * effective_corrosion_time) / t_rdi;
        
        // 4. Flow Stress - Eq 2.13
        const ys = state.ys;
        const ts = state.ts;
        const eff = state.wje;
        
        if (ys <= 0 || ts <= 0) throw new Error("Yield and Tensile Strength must be > 0.");
        
        const fs_thin = ((ys + ts) / 2) * eff * 1.1;

        // 5. Strength Ratio (SRp)
        let srp = 0;
        let governing_t = t_rdi; // Default if not structural

        if (state.sr_method === 'structural') {
            const S = state.allowable_stress;
            const t_min = state.t_min;
            const t_c = state.t_c;
            governing_t = Math.max(t_min, t_c);

            if (S <= 0) throw new Error("Allowable Stress must be > 0.");
            
            srp = ( (S * eff) / fs_thin ) * (governing_t / t_rdi);

        } else {
            const P = state.pressure;
            const D = state.diameter;
            const alpha = state.shape_factor;

            if (D <= 0) throw new Error("Diameter must be > 0.");

            srp = (P * D) / (alpha * fs_thin * t_rdi);
        }

        // 6. Bayesian Update
        const priors = TABLE_4_5[state.confidence_level];
        
        const nA = state.n_A;
        const nB = state.n_B;
        const nC = state.n_C;
        const nD = state.n_D;

        const calcI = (pr: number, colName: 'Co1' | 'Co2' | 'Co3') => {
            return pr * 
                   Math.pow(TABLE_4_6.A[colName], nA) * 
                   Math.pow(TABLE_4_6.B[colName], nB) * 
                   Math.pow(TABLE_4_6.C[colName], nC) * 
                   Math.pow(TABLE_4_6.D[colName], nD);
        };

        const I1 = calcI(priors.Pr1, 'Co1');
        const I2 = calcI(priors.Pr2, 'Co2');
        const I3 = calcI(priors.Pr3, 'Co3');
        const sumI = I1 + I2 + I3;

        // Prevent division by zero if all Ns are huge and result in underflow (though unlikely with JS double)
        const Po1 = sumI === 0 ? 0 : I1 / sumI;
        const Po2 = sumI === 0 ? 0 : I2 / sumI;
        const Po3 = sumI === 0 ? 0 : I3 / sumI;

        // 7. Reliability Indices (Beta)
        const cov_dt = 0.20;
        const cov_sf = 0.20;
        const cov_p = 0.05;

        const calcBeta = (Ds: number) => {
            const num = 1 - (Ds * art) - srp;
            const term1 = Math.pow(Ds * art * cov_dt, 2);
            const term2 = Math.pow((1 - (Ds * art)) * cov_sf, 2);
            const term3 = Math.pow(srp * cov_p, 2);
            const den = Math.sqrt(term1 + term2 + term3);
            if (den === 0) return 0; // Avoid NaN
            return num / den;
        };

        const beta1 = calcBeta(1);
        const beta2 = calcBeta(2);
        const beta3 = calcBeta(4);

        // 8. Base DF
        const term1 = Po1 * NORMSDIST(-beta1);
        const term2 = Po2 * NORMSDIST(-beta2);
        const term3 = Po3 * NORMSDIST(-beta3);
        
        // 1.56e-4 is the failure probability at DF=1
        const df_base = (term1 + term2 + term3) / 1.56e-4;

        // 9. Adjustments
        let f_om = 1.0;
        if (state.has_om) {
            f_om = MONITORING_FACTORS[state.om_mechanism][state.om_method];
        }

        let f_ip = 1.0;
        if (state.has_ip) {
            f_ip = state.ip_effective === 'yes' ? 1.0 : 3.0;
        }

        let f_dl = 1.0;
        if (state.has_dl) {
            f_dl = state.dl_effective === 'yes' ? 1.0 : 3.0;
        }

        let df_final = (df_base * f_ip * f_dl) / f_om;
        df_final = Math.max(df_final, 0.1);

        return {
            df_final,
            df_base,
            art,
            age_rc,
            t_cm_curr,
            fs_thin,
            srp,
            po1: Po1,
            po2: Po2,
            po3: Po3,
            f_om,
            f_ip,
            f_dl,
            beta1,
            beta2,
            beta3,
            effective_age: effective_corrosion_time,
            governing_thick: governing_t
        };

    } catch (e: any) {
        return {
            df_final: 0,
            df_base: 0,
            art: 0,
            age_rc: 0,
            t_cm_curr: 0,
            fs_thin: 0,
            srp: 0,
            po1: 0,
            po2: 0,
            po3: 0,
            f_om: 1,
            f_ip: 1,
            f_dl: 1,
            beta1: 0,
            beta2: 0,
            beta3: 0,
            effective_age: 0,
            governing_thick: 0,
            error: e.message || "Calculation Error"
        };
    }
}