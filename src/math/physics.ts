import { degs, m3 } from 'webgl-engine';

type Vec3d = [number, number, number];

const G = 6.6743e-20;
type xyz = Array<number>;
type State = {
    positions: Array<xyz>;
    positionMatrix: Array<Array<xyz>>;
    velocities: Array<xyz>;
    accelerations: Array<xyz>;
};

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
    state: State;
    matrixes: Record<number, State>;

    constructor() {
        this.bodies = [];
        this.state = {
            positions: [],
            positionMatrix: [],
            velocities: [],
            accelerations: [],
        };
    }

    /** Add a body to the physics engine, return its internal id */
    addBody(body: Omit<Omit<Body, 'internalId'>, 'acceleration'>): Body {
        const item: Body = {
            ...body,
            acceleration: [0, 0, 0],
            internalId: this.bodies.length,
        };

        this.bodies.push(item);
        this.state = this.createStateMatrix();
        return item;
    }

    private enabled_bodies() {
        return this.bodies.filter((x) => x.disabled !== true);
    }

    private createStateMatrix(): State {
        const bodies = this.enabled_bodies();

        const positions = new Array(bodies.length);
        const positionMatrix = new Array(bodies.length);
        const velocities = new Array(bodies.length);
        const accelerations = new Array(bodies.length);
        const fixed = new Array(bodies.length);
        const masses = new Array(bodies.length);

        for (let i = 0; i < bodies.length; i++) {
            const body = bodies[i];
            positionMatrix[i] = new Array(bodies.length);
            velocities[i] = new Array(0, 0, 0);
            positions[i] = new Array(0, 0, 0);
            accelerations[i] = new Array(0, 0, 0);

            for (let r = 0; r < bodies.length; r++) {
                positionMatrix[i][r] = new Array(0, 0, 0);

                const other = bodies[r];
                for (let j = 0; j < 3; j++) {
                    positionMatrix[i][r][j] =
                        body.position[j] - other.position[j];
                }
            }

            for (let j = 0; j < 3; j++) {
                positions[i][j] = body.position[j];
                velocities[i][j] = body.velocity[j];
                accelerations[i][j] = body.acceleration[j];
            }

            masses[i] = body.mass;
        }

        return {
            positions,
            positionMatrix,
            velocities,
            accelerations,
        };
    }

    private cloneState(state: State): State {
        return {
            positions: [...state.positions.map((p) => [...p])],
            positionMatrix: [...state.positionMatrix.map((p) => [...p])],
            velocities: [...state.velocities.map((p) => [...p])],
            accelerations: [...state.accelerations.map((p) => [...p])],
        };
    }

    private calculateVelocities(dt: number, state: State): State {
        const result: State = {
            positions: [...state.positions],
            positionMatrix: [...state.positionMatrix],
            velocities: [...state.velocities],
            accelerations: [...state.accelerations],
        };

        const acceleration = new Array(state.velocities.length);

        for (let i = 0; i < acceleration.length; i++) {
            acceleration[i] = new Array(0, 0, 0);
        }

        for (let i = 0; i < state.positionMatrix.length; i++) {
            const positions = state.positionMatrix[i];
            if (acceleration[i][0] != 0) continue;

            // Each j is another body
            for (let k = 0; k < positions.length; k++) {
                if (k === i) continue;

                const r = Math.sqrt(
                    positions[k]
                        .map((p) => Math.pow(p, 2))
                        .reduce((a, b) => a + b, 0)
                );

                const unit = [
                    positions[k][0] / r,
                    positions[k][1] / r,
                    positions[k][2] / r,
                ];

                const r2 = Math.pow(r, 2);
                for (let j = 0; j < 3; j++) {
                    const F1 = ((-G * this.bodies[k].mass) / r2) * unit[j];
                    acceleration[i][j] += F1;
                }
            }
        }

        // Recalculate the matrix position differential
        // and update the other state variables
        for (let i = 0; i < result.positionMatrix.length; i++) {
            for (let j = 0; j < 3; j++) {
                result.velocities[i][j] += acceleration[i][j] * dt;
                result.positions[i][j] += result.velocities[i][j];
                result.accelerations[i][j] = acceleration[i][j];
            }
        }

        for (let i = 0; i < result.positionMatrix.length; i++) {
            const self_position = result.positions[i];
            for (let r = 0; r < state.positionMatrix.length; r++) {
                result.positionMatrix[i][r] = new Array(0, 0, 0);
                const other_position = result.positions[r];
                for (let j = 0; j < 3; j++) {
                    result.positionMatrix[i][r][j] =
                        self_position[j] - other_position[j];
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
        const bodies = this.enabled_bodies();
        const matrix = this.createStateMatrix();
        const next_state = this.calculateVelocities(dt, matrix);

        for (let i = 0; i < bodies.length; i++) {
            const target = bodies[i];
            for (let j = 0; j < 3; j++) {
                target.velocity[j] = next_state.velocities[i][j];
                target.position[j] = next_state.positions[i][j];
                target.acceleration[j] = next_state.accelerations[i][j];
            }
        }

        this.state = next_state;
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

    return {
        r,
        semiMajorAxis,
        semiMinorAxis,
        orbitalPeriod,
        nu,
        i,
        v,
        h,
        e,
    };
}
