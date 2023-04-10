type Vec3d = [number, number, number];

const G = 6.6743e-20;

type State = {
    positions: Array<Array<number>>;
    positionMatrix: Array<Array<Array<number>>>;
    velocities: Array<Array<number>>;
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
        const masses = new Array(this.bodies.length);

        for (let i = 0; i < this.bodies.length; i++) {
            const body = this.bodies[i];
            positionMatrix[i] = new Array(this.bodies.length);
            velocities[i] = new Array(0, 0, 0);
            positions[i] = new Array(0, 0, 0);

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
        }

        return {
            positions,
            positionMatrix,
            velocities,
            masses,
        };
    }

    private calculateVelocities(time_step: number, state: State): State {
        const result: State = {
            positions: [...state.positions],
            positionMatrix: [...state.positionMatrix],
            velocities: [...state.velocities],
            masses: [...state.masses],
        };

        for (let i = 0; i < state.positionMatrix.length; i++) {
            const positions = state.positionMatrix[i];

            // Each j is another body
            for (let k = 0; k < positions.length; k++) {
                const r = Math.sqrt(
                    positions[k]
                        .map((p) => Math.pow(p, 2))
                        .reduce((a, b) => a + b, 0) + Math.pow(0.1, 2)
                );

                const r3 = Math.pow(r, 3);
                for (let j = 0; j < 3; j++) {
                    result.velocities[i][j] +=
                        ((G * positions[k][j]) / r3) *
                        (state.masses[i] + state.masses[k]);
                }
            }
        }

        // Recalculate the matrix position differential
        // and update the other state variables
        for (let i = 0; i < result.velocities.length; i++) {
            const self_position = result.positions[i];
            for (let j = 0; j < 3; j++) {
                result.positions[i][j] += result.velocities[i][j];
            }

            for (let r = 0; r < this.bodies.length; r++) {
                result.positionMatrix[i][r] = new Array(0, 0, 0);

                const other = this.bodies[r];
                for (let j = 0; j < 3; j++) {
                    result.positionMatrix[i][r][j] =
                        other.position[j] - self_position[j];
                }
            }
        }

        return result;
    }

    private create_state_vector(target: Body, other: Body) {
        return [
            ...target.position,
            ...other.position,
            ...target.velocity,
            ...other.velocity,
        ];
    }

    /** Calculate each position change through time **/
    project(dt: number, time_t: number) {
        let solutions = [];
        let state = this.createStateMatrix();

        for (let t = 0; t < time_t; t += dt) {
            const set = [];
            state = this.calculateVelocities(dt, state);
            for (let j = 0; j < state.positions.length; j++) {
                set.push([...state.positions[j]]);
            }
            solutions.push(set);
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
                target.position[j] += target.velocity[j];
            }
        }
    }
}
