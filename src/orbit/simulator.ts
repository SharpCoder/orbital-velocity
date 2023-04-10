export type Body = {
    position: number[];
    vector: number[];
    mass: number;
};

const R1: Body = {
    position: [2000, 0, 0],
    vector: [10, 20, 30],
    mass: 1.0,
};

const R2: Body = {
    position: [0, 0, 0],
    vector: [0, 0, 0],
    mass: 1.0e26,
};

const G = 6.6743e-20;
const state = [...R1.position, ...R2.position, ...R1.vector, ...R2.vector];

function absolute_motion(t: number, state: number[]) {
    const R_1 = state.slice(0, 3);
    const R_2 = state.slice(3, 6);
    const ydot = [...state];

    for (let i = 0; i < 6; i++) {
        ydot[i] = ydot[state.length - 6 + i];
    }

    const r = Math.sqrt(
        Math.pow(R_2[0] - R_1[0], 2) +
            Math.pow(R_2[1] - R_1[1], 2) +
            Math.pow(R_2[2] - R_1[2], 2)
    );

    for (let i = 0; i < 3; i++) {
        const ddot = (G * (R_2[i] - R_1[i])) / Math.pow(r, 3);
        ydot[6 + i] = R2.mass * ddot;
        ydot[9 + i] = -R1.mass * ddot;
    }

    return ydot;
}

function rungeKutta(fn, state, h) {
    const k1 = fn(h, state);
    const k2 = fn(
        h,
        state.map((p, idx) => p + k1[idx] / 2)
    );
    const k3 = fn(
        h,
        state.map((p, idx) => p + k2[idx] / 2)
    );
    const k4 = fn(
        h,
        state.map((p, idx) => p + k3[idx])
    );
    const k = state.map(
        (_, idx) => (k1[idx] + 2 * k2[idx] + 2 * k3[idx] + k4[idx]) / 6
    );
    return state.map((p, idx) => p + k[idx]);
}

let next_state = [...state];
export function step() {
    next_state = rungeKutta(absolute_motion, next_state, 1);
    const [x1, y1, z1] = next_state;
    return [x1, y1, z1];
}
