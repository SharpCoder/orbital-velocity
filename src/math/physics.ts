import { degs, m3, norm } from 'webgl-engine';

type Vec3d = [number, number, number];
type StateVector = number[];

let iter = 0;
const G = 6.6743e-20;
export type Body = {
    /** The internal id of this object */
    internalId: number;
    /** The current position in 3d space */
    position: Vec3d;
    /** The current velcoity in 3d space */
    velocity: Vec3d;
    /** The previous acceleration vector */
    acceleration: Vec3d;
    /** The mass of the object */
    mass: number;
    /** If true, this object is skipped entirely */
    disabled?: boolean;
};

export class PhysicsEngine {
    bodies: Body[];
    state: StateVector;

    constructor() {
        this.bodies = [];
    }

    /** Add a body to the physics engine, return its internal id */
    addBody(body: Omit<Omit<Body, 'internalId'>, 'acceleration'>): Body {
        const item: Body = {
            ...body,
            acceleration: [0, 0, 0],
            internalId: this.bodies.length,
        };

        this.bodies.push(item);
        return item;
    }

    private enabled_bodies() {
        return this.bodies.filter((x) => x.disabled !== true);
    }

    private solve(vector: StateVector, mass: [number, number]): StateVector {
        const result: StateVector = [...vector];

        // Copy the velocities into the position
        for (let i = 0; i < 6; i++) {
            result[i] = vector[6 + i];
        }

        // Calculate newtons law
        const unit = [
            vector[3] - vector[0],
            vector[4] - vector[1],
            vector[5] - vector[2],
        ];

        const mag = norm(unit);
        for (let j = 0; j < 3; j++) {
            const ddot = (G * unit[j]) / Math.pow(mag, 3);
            result[6 + j] = mass[1] * ddot;
            result[9 + j] = -mass[0] * ddot;
        }

        return result;
    }

    /** For each body, compute its updated position based on the effects of physics */
    update(dt: number) {
        const bodies = this.enabled_bodies();
        const processed = {};

        for (let i = 0; i < bodies.length; i++) {
            for (let k = 0; k < bodies.length; k++) {
                if (i === k) continue;
                if (processed[`${k}_${i}`]) continue;
                if (processed[`${i}_${k}`]) continue;
                processed[`${i}_${k}`] = true;
                processed[`${k}_${i}`] = true;

                const state_vec = [
                    ...bodies[i].position,
                    ...bodies[k].position,
                    ...bodies[i].velocity,
                    ...bodies[k].velocity,
                ] as StateVector;

                const next_state = rk4iter(
                    this.solve,
                    [...state_vec],
                    [bodies[i].mass, bodies[k].mass],
                    dt
                );

                for (let j = 0; j < 3; j++) {
                    bodies[i].position[j] = next_state[0 + j];
                    bodies[k].position[j] = next_state[3 + j];
                    bodies[i].velocity[j] = next_state[6 + j];
                    bodies[k].velocity[j] = next_state[9 + j];
                }
            }
        }
    }
}

export function keplerianParameters(
    position: number[],
    velocity: number[],
    masses: number
) {
    const mu = G * masses;
    const r = Math.sqrt(
        Math.pow(position[0], 2) +
            Math.pow(position[1], 2) +
            Math.pow(position[2], 2)
    );
    const v = Math.sqrt(
        Math.pow(velocity[0], 2) +
            Math.pow(velocity[1], 2) +
            Math.pow(velocity[2], 2)
    );
    const h_vec = m3.cross(position, velocity);
    const h = Math.sqrt(
        Math.pow(h_vec[0], 2) + Math.pow(h_vec[1], 2) + Math.pow(h_vec[2], 2)
    );

    const i = Math.acos(h_vec[2] / h);

    let e_vec = m3.cross(velocity, h_vec);
    for (let i = 0; i < 3; i++) {
        e_vec[i] /= mu;
        e_vec[i] -= position[i] / r;
    }

    const e = Math.sqrt(
        Math.pow(e_vec[0], 2) + Math.pow(e_vec[1], 2) + Math.pow(e_vec[2], 2)
    );

    let nu_r_vec = [...position];
    let nu_e_vec = [...e_vec];

    for (let i = 0; i < 3; i++) {
        nu_r_vec[i] /= r;
        nu_e_vec[i] /= e;
    }

    const p = Math.pow(h, 2) / mu;
    const r_min = p / (1 + e * Math.cos(0));
    const r_max = p / (1 + e * Math.cos(Math.PI));
    const semiMajorAxis = (r_max + r_min) / 2;
    const semiMinorAxis = Math.sqrt(r_max * r_min);

    let nu = Math.acos(m3.dot(nu_r_vec, nu_e_vec));
    const orbitalPeriod =
        2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxis, 3) / (G * masses));

    const K = [0, 0, 1];
    const N_vec = m3.cross(K, h_vec);
    const N = Math.sqrt(
        Math.pow(N_vec[0], 2) + Math.pow(N_vec[1], 2) + Math.pow(N_vec[2], 2)
    );

    let Omega = Math.acos(N_vec[0] / N);
    if (N[1] >= 0) {
        Omega = 2 * Math.PI - Omega;
    }

    let omega = Math.acos(m3.dot(N_vec, e_vec) / (N * e));
    if (e_vec[2] < 0) {
        omega = 2 * Math.PI - omega;
    }
    return {
        r,
        semiMajorAxis,
        semiMinorAxis,
        orbitalPeriod,
        rightAscensionNode: Omega,
        argumentOfPeriapsis: omega,
        nu,
        i,
        v,
        h,
        e,
    };
}

function rk4iter(
    fn: (state: StateVector, mass: [number, number]) => void,
    state: number[],
    mass: [number, number],
    dt
) {
    const k1 = fn([...state], mass);
    const k2 = fn(
        [...state].map((y, idx) => y + k1[idx] * (dt / 2)),
        mass
    );
    const k3 = fn(
        [...state].map((y, idx) => y + k2[idx] * (dt / 2)),
        mass
    );
    const k4 = fn(
        [...state].map((y, idx) => y + k3[idx] * dt),
        mass
    );

    // compute the y value at the end of the iteration
    return [...state].map((y, idx) => {
        return y + (k1[idx] + 2 * k2[idx] + 2 * k3[idx] + k4[idx]) * (dt / 6);
    });
}
