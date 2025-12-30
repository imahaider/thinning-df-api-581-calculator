export type CalculationBasis = 'furnished' | 'inspection';
export type SRMethod = 'structural' | 'pressure';
export type ConfidenceLevel = 'low' | 'medium' | 'high';
export type LinerType = 'strip' | 'organic_low' | 'organic_med' | 'organic_high' | 'glass' | 'acid_brick' | 'refractory';
export type LinerCondition = '1' | '2' | '10'; // Good, Average, Poor (values are F_LC)
export type BooleanSelect = 'yes' | 'no';
export type UnitSystem = 'imperial' | 'metric';

export interface CalculatorState {
    unitSystem: UnitSystem;

    // Basis
    basis: CalculationBasis;

    // Step 1: Thickness & Age
    t_furnished: number;
    age_comp: number;
    t_rdi_measured: number;
    age_tk_measured: number;

    // Cladding
    has_cladding: boolean;
    t_cm_orig: number; // Furnished or Original Cladding Thickness
    t_bm_orig: number; // Base Material Thickness (for reference mostly)

    // Step 2: Corrosion Rates
    cr_bm: number; // Base metal corrosion rate
    cr_cm: number; // Cladding corrosion rate

    // Step 3: Liner
    has_liner: boolean;
    liner_type: LinerType;
    age_liner: number;
    liner_condition: LinerCondition;
    liner_om: boolean; // True = 0.1 (effective), False = 1.0

    // Step 4: Strength
    sr_method: SRMethod;
    ys: number; // Yield Strength
    ts: number; // Tensile Strength
    wje: number; // Weld Joint Efficiency
    allowable_stress: number;
    t_min: number; // Code min thickness
    t_c: number; // Structural min thickness
    pressure: number; // Operating Pressure
    diameter: number; // Inside Diameter
    shape_factor: number;

    // Step 5: Inspection History
    confidence_level: ConfidenceLevel;
    n_A: number;
    n_B: number;
    n_C: number;
    n_D: number;

    // Step 6: Adjustments
    has_om: boolean; // Online Monitoring
    om_mechanism: string;
    om_method: string;

    has_ip: boolean; // Injection Point
    ip_effective: BooleanSelect;

    has_dl: boolean; // Dead Legs
    dl_effective: BooleanSelect;
}

export interface CalculationResult {
    df_final: number;
    df_base: number;
    art: number;
    age_rc: number;
    t_cm_curr: number; // Calculated current cladding
    fs_thin: number;
    srp: number;
    po1: number;
    po2: number;
    po3: number;
    f_om: number;
    f_ip: number;
    f_dl: number;
    
    // Advanced Outputs
    beta1: number;
    beta2: number;
    beta3: number;
    effective_age: number;
    governing_thick: number;
    
    error?: string;
}

export const DEFAULT_STATE: CalculatorState = {
    unitSystem: 'imperial',
    basis: 'furnished',
    t_furnished: 0.500,
    age_comp: 5.0,
    t_rdi_measured: 0.450,
    age_tk_measured: 2.0,
    has_cladding: false,
    t_cm_orig: 0,
    t_bm_orig: 0,
    cr_bm: 0.005,
    cr_cm: 0,
    has_liner: false,
    liner_type: 'organic_low',
    age_liner: 0,
    liner_condition: '1',
    liner_om: false,
    sr_method: 'structural',
    ys: 30000,
    ts: 60000,
    wje: 1.0,
    allowable_stress: 20000,
    t_min: 0.25,
    t_c: 0,
    pressure: 100,
    diameter: 48,
    shape_factor: 2,
    confidence_level: 'low',
    n_A: 0,
    n_B: 0,
    n_C: 0,
    n_D: 0,
    has_om: false,
    om_mechanism: 'hcl',
    om_method: 'probes',
    has_ip: false,
    ip_effective: 'no',
    has_dl: false,
    dl_effective: 'no'
};