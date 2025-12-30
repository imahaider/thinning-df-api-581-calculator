export const TABLE_4_5 = {
    low: { Pr1: 0.5, Pr2: 0.3, Pr3: 0.2 },
    medium: { Pr1: 0.7, Pr2: 0.2, Pr3: 0.1 },
    high: { Pr1: 0.8, Pr2: 0.15, Pr3: 0.05 }
};

export const TABLE_4_6 = {
    E: { Co1: 0.33, Co2: 0.33, Co3: 0.33 },
    D: { Co1: 0.4, Co2: 0.33, Co3: 0.27 },
    C: { Co1: 0.5, Co2: 0.3, Co3: 0.2 },
    B: { Co1: 0.7, Co2: 0.2, Co3: 0.1 },
    A: { Co1: 0.9, Co2: 0.09, Co3: 0.01 }
};

export const LINER_LIFE: Record<string, number> = {
    strip: 10,
    organic_low: 2,
    organic_med: 4,
    organic_high: 7.5,
    glass: 7.5,
    acid_brick: 15,
    refractory: 3
};

// Table 4.9 Mapping
// Record<Mechanism, Record<Method, Factor>>
export const MONITORING_FACTORS: Record<string, Record<string, number>> = {
    hcl: { probes: 10, coupons: 2, key_var: 10 },
    acid: { probes: 10, coupons: 2, key_var: 10 }, // Sulfidic/Naphthenic
    sour: { probes: 10, coupons: 2, key_var: 10 },
    amine: { probes: 10, coupons: 2, key_var: 10 },
    other: { probes: 1, coupons: 1, key_var: 1 }
};
