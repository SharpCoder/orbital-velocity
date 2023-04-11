import { degs, m3 } from 'webgl-engine';

type Vec3d = [number, number, number];

const G = 6.6743e-20;

type State = {
    positions: Array<Array<number>>;
    positionMatrix: Array<Array<Array<number>>>;
    velocities: Array<Array<number>>;
    fixed: Array<boolean>;
    masses: Array<number>;
};

export type Body = {
    /** The internal id of this object */
    internalId: number;
    /** The current position in 3d space */
    position: Vec3d;
    /** The current velcoity in 3d space */
    velocity: Vec3d;
    /** The mass of the object */
    mass: number;
    /** If true, the position and velocity vectors will never update */
    fixed?: boolean;
};

export class PhysicsEngine {
    bodies: Body[];
    state: State;
    matrixes: Record<number, State>;

    constructor() {
        this.bodies = [];
        this.state = {
            positions: [],
            positionMatrix: [],
            velocities: [],
            masses: [],
            fixed: [],
        };
    }

    /** Add a body to the physics engine, return its internal id */
    addBody(body: Omit<Body, 'internalId'>): Body {
        const item: Body = {
            ...body,
            internalId: this.bodies.length,
        };

        this.bodies.push(item);
        this.state = this.createStateMatrix();
        return item;
    }

    private createStateMatrix(): State {
        const positions = new Array(this.bodies.length);
        const positionMatrix = new Array(this.bodies.length);
        const velocities = new Array(this.bodies.length);
        const accelerations = new Array(this.bodies.length);
        const fixed = new Array(this.bodies.length);
        const masses = new Array(this.bodies.length);

        for (let i = 0; i < this.bodies.length; i++) {
            const body = this.bodies[i];
            positionMatrix[i] = new Array(this.bodies.length);
            velocities[i] = new Array(0, 0, 0);
            positions[i] = new Array(0, 0, 0);
            accelerations[i] = new Array(0, 0, 0);

            for (let r = 0; r < this.bodies.length; r++) {
                positionMatrix[i][r] = new Array(0, 0, 0);

                const other = this.bodies[r];
                for (let j = 0; j < 3; j++) {
                    positionMatrix[i][r][j] =
                        other.position[j] - body.position[j];
                }
            }

            for (let j = 0; j < 3; j++) {
                positions[i][j] = body.position[j];
                velocities[i][j] = body.velocity[j];
            }

            masses[i] = body.mass;
            fixed[i] = body.fixed ? true : false;
        }

        return {
            positions,
            positionMatrix,
            velocities,
            masses,
            fixed,
        };
    }

    private cloneState(state: State): State {
        return {
            fixed: [...state.fixed],
            masses: [...state.masses],
            positions: [...state.positions.map((p) => [...p])],
            positionMatrix: [...state.positionMatrix.map((p) => [...p])],
            velocities: [...state.velocities.map((p) => [...p])],
        };
    }

    private calculateVelocities(dt: number, state: State): State {
        const result: State = {
            positions: [...state.positions],
            positionMatrix: [...state.positionMatrix],
            velocities: [...state.velocities],
            masses: [...state.masses],
            fixed: [...state.fixed],
        };

        const acceleration = new Array(state.velocities.length);

        for (let i = 0; i < state.positionMatrix.length; i++) {
            const positions = state.positionMatrix[i];
            acceleration[i] = new Array(0, 0, 0);

            // Each j is another body
            for (let k = 0; k < positions.length; k++) {
                const r = Math.sqrt(
                    positions[k]
                        .map((p) => Math.pow(p, 2))
                        .reduce((a, b) => a + b, 0) + Math.pow(0.1, 2)
                );

                const r3 = Math.pow(r, 3);
                for (let j = 0; j < 3; j++) {
                    acceleration[i][j] +=
                        ((G * positions[k][j]) / r3) *
                        (state.masses[i] + state.masses[k]) *
                        dt;
                }
            }
        }

        // Recalculate the matrix position differential
        // and update the other state variables
        for (let i = 0; i < result.positionMatrix.length; i++) {
            if (result.fixed[i]) continue;
            for (let j = 0; j < 3; j++) {
                result.velocities[i][j] += acceleration[i][j];
                result.positions[i][j] += result.velocities[i][j];
            }
        }

        for (let i = 0; i < result.positionMatrix.length; i++) {
            const self_position = result.positions[i];
            if (result.fixed[i]) continue;

            for (let r = 0; r < state.positionMatrix.length; r++) {
                result.positionMatrix[i][r] = new Array(0, 0, 0);
                const other_position = result.positions[r];
                for (let j = 0; j < 3; j++) {
                    result.positionMatrix[i][r][j] =
                        other_position[j] - self_position[j];
                }
            }
        }

        return result;
    }

    /** Calculate each position change through time **/
    project(duration: number, step: number) {
        let solutions = [];
        let state = this.createStateMatrix();

        for (let t = 0; t < duration; t += step) {
            state = this.calculateVelocities(step, state);
            solutions.push(this.cloneState(state));
        }
        return solutions;
    }

    /** For each body, compute its updated position based on the effects of physics */
    update(dt: number) {
        const matrix = this.createStateMatrix();
        const next_state = this.calculateVelocities(dt, matrix);

        for (let i = 0; i < this.bodies.length; i++) {
            const target = this.bodies[i];
            if (target.fixed === true) continue;
            for (let j = 0; j < 3; j++) {
                target.velocity[j] = next_state.velocities[i][j];
                target.position[j] = next_state.positions[i][j];
            }
        }
    }
}

export function calculate_parameters(
    position: number[],
    velocity: number[],
    mass?: number
) {
    mass = mass ?? 5.972161874653522e24;
    const mu = G * mass;

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

    const theta = Math.acos(h / (r * v));

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
    const a = (r_max + r_min) / 2;
    const b = a * Math.sqrt(1 - Math.pow(e, 2));
    const l = a * (1 - Math.pow(e, 2));
    const al = Math.pow(b, 2);
    const semiMajorAxis = Math.pow(b, 2) / l;

    // let nu = Math.acos(m3.dot(nu_r_vec, nu_e_vec));

    return {
        r,
        r_min,
        r_max,
        semiMajorAxis,
        v,
        h,
        e,
    };
}

// window['pos'] = [1.2756, 1.9135, 3.1891];
// window['vel'] = [7.9053, 15.8106, 0];

window['pos'] = [1000, 5000, 7000];
window['vel'] = [3, 4, 5];

window['calculate_parameters'] = calculate_parameters;

export function orbitalPeriod(states: State[], targetOfInterest: number) {
    // Try to find the semi-major axis
    // Take the origin point
    const idx = 0;

    let origin = [...states[idx].positions[targetOfInterest]];
    const velocity = [...states[idx].velocities[targetOfInterest]];

    const mass =
        [...states[idx].masses].sort((a, b) => b - a)[0] +
        states[idx].masses[targetOfInterest];

    const parameters = calculate_parameters(origin, velocity, mass);

    // Return the orbital period
    return (
        2 *
        Math.PI *
        Math.sqrt(Math.pow(parameters.semiMajorAxis, 3) / (G * mass))
    );
}

window['m3'] = m3;
