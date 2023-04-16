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
    /** The mass of the object */
    mass: number;
    /** If true, this object will not update its velocity or position */
    fixed?: boolean;
    /** If true, this object is skipped entirely */
    disabled?: boolean;
    /** The amount of force calculated on each body */
    _forces: Array<number[]>;
};

export class PhysicsEngine {
    bodies: Body[];
    state: StateVector;

    constructor() {
        this.bodies = [];
    }

    /** Add a body to the physics engine, return its internal id */
    addBody(body: Omit<Omit<Body, 'internalId'>, '_forces'>): Body {
        const item: Body = {
            ...body,
            internalId: this.bodies.length,
            _forces: [],
        };

        this.bodies.push(item);
        return item;
    }

    private enabled_bodies() {
        return this.bodies.filter((x) => x.disabled !== true);
    }

    private solve(vector: StateVector, mass: number[]): StateVector {
        const result: StateVector = [...vector];

        // Copy the velocities into the position
        const midpoint = vector.length / 2;
        const bodies = midpoint / 3;
        const accel = new Array(bodies);
        accel[0] = [0, 0, 0];

        for (let i = 0; i < midpoint; i++) {
            result[i] = vector[midpoint + i];
        }

        for (let i = 1; i < bodies; i++) {
            accel[i] = [0, 0, 0];

            // Calculate newtons law
            const other = i * 3;
            const unit = [
                vector[other + 0] - vector[0],
                vector[other + 1] - vector[1],
                vector[other + 2] - vector[2],
            ];

            const mag = norm(unit);
            for (let j = 0; j < 3; j++) {
                const ddot = (G * unit[j]) / Math.pow(mag, 3);
                accel[0][j] += mass[i] * ddot;
                accel[i][j] -= mass[0] * ddot;
            }
        }

        for (let i = 0; i < bodies; i++) {
            for (let j = 0; j < 3; j++) {
                result[midpoint + i * 3 + j] = accel[i][j];
            }
        }

        return result;
    }

    private orbitingBody(target: Body): Body {
        const bodies = this.enabled_bodies();

        let closestForce = 0;
        let closestBody: Body;

        for (let i = 0; i < bodies.length; i++) {
            if (bodies[i] === target) continue;
            const other = bodies[i];
            const unit = [
                other.position[0] - target.position[0],
                other.position[1] - target.position[1],
                other.position[2] - target.position[2],
            ];
            const mag = norm(unit);
            const forces = new Array(0, 0, 0);
            for (let j = 0; j < 3; j++) {
                forces[j] = (other.mass * G * unit[j]) / Math.pow(mag, 3);
            }

            const force = norm(forces);
            if (force > closestForce) {
                closestForce = force;
                closestBody = other;
            }
        }

        return closestBody;
    }

    keplerianParameters(body: Body) {
        const position = [...body.position];
        const velocity = [...body.velocity];

        const other = this.orbitingBody(body);
        const masses = body.mass + other.mass;
        const center = other.position;

        return keplerianParameters(position, velocity, center, masses);
    }

    private create_state_vec(targetOfInterest: number) {
        const bodies = this.enabled_bodies();
        const target = bodies[targetOfInterest];
        let state_vec = [...target.position];
        let masses = [target.mass];

        // Formulate the position vectors
        for (let k = 0; k < bodies.length; k++) {
            if (k === targetOfInterest) continue;
            masses.push(bodies[k].mass);
            state_vec = [...state_vec, ...bodies[k].position];
        }

        // Formulate the velocity vectors
        state_vec = [...state_vec, ...target.velocity];
        for (let k = 0; k < bodies.length; k++) {
            if (k === targetOfInterest) continue;
            state_vec = [...state_vec, ...bodies[k].velocity];
        }

        return [state_vec, masses];
    }

    /** Take an initial state vector and step through time, generating new state vectors along the way */
    project(
        target: Body,
        acceleration: number[],
        dt: number,
        duration: number
    ) {
        const bodies = this.enabled_bodies();
        const targetOfInterest = bodies.indexOf(target);
        let [state_vector, masses] = this.create_state_vec(targetOfInterest);
        const midpoint = state_vector.length / 2;

        for (let i = 0; i < duration; i += dt) {
            state_vector = rk4iter(this.solve, [...state_vector], masses, dt);
            for (let j = 0; j < 3; j++) {
                state_vector[midpoint + j] += acceleration[j];
            }
        }
        return rk4iter(this.solve, [...state_vector], masses, dt);
    }

    /** For each body, compute its updated position based on the effects of physics */
    update(dt: number) {
        const bodies = this.enabled_bodies();

        for (let i = 0; i < bodies.length; i++) {
            if (bodies[i].fixed) continue;

            const target = bodies[i];
            let [state_vec, masses] = this.create_state_vec(i);
            const next_state = rk4iter(this.solve, [...state_vec], masses, dt);
            const midpoint = next_state.length / 2;

            // Save the force multiplier relative to each other body
            for (let i = 0; i < bodies.length - 1; i++) {
                target._forces[i] = new Array(0, 0, 0);
                for (let j = 0; j < 3; j++) {
                    target._forces[i][j] =
                        next_state[midpoint + (i + 1) * 3 + j];
                }
            }

            for (let j = 0; j < 3; j++) {
                bodies[i].position[j] = next_state[0 + j];
                bodies[i].velocity[j] = next_state[midpoint + j];
            }
        }
    }
}

export function keplerianParameters(
    position: number[],
    velocity: number[],
    center: number[],
    mass: number
) {
    // TODO: this fails when there are multiple large
    // objects around.
    for (let j = 0; j < 3; j++) {
        position[j] -= center[j];
    }

    const mu = G * mass;
    const r = norm(position);
    const v = norm(velocity);
    const v_r = m3.dot(
        [position[0] / r, position[1] / r, position[2] / r],
        velocity
    );
    const h_vec = m3.cross(position, velocity);
    const h = norm(h_vec);
    const i = Math.acos(h_vec[2] / h);

    let e_vec = m3.cross(velocity, h_vec);
    for (let i = 0; i < 3; i++) {
        e_vec[i] /= mu;
        e_vec[i] -= position[i] / r;
    }

    const e = norm(e_vec);
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
    if (v_r < 0) {
        nu = 2 * Math.PI - nu;
    }

    const orbitalPeriod =
        2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxis, 3) / (G * mass));

    const XYZ = [0, 1, 2];

    const K = [0, 0, 1];
    const N_vec = m3.cross(K, h_vec);
    const N = norm(N_vec);
    let Omega = Math.acos(N_vec[0] / N);

    if (N[XYZ[1]] >= 0) {
        Omega = 2 * Math.PI - Omega;
    }

    let omega = Math.acos(m3.dot(N_vec, e_vec) / (N * e));
    if (e_vec[XYZ[2]] < 0) {
        omega = 2 * Math.PI - omega;
    }
    return {
        r,
        center,
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
    fn: (state: StateVector, mass: number[]) => void,
    state: number[],
    mass: number[],
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
