type Vec3d = [number, number, number];

const G = 6.6743e-20;
// const G = 1.0; // 6.6743e-20;

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

    constructor() {
        this.bodies = [];
    }

    /** Add a body to the physics engine, return its internal id */
    addBody(body: Omit<Body, 'internalId'>): Body {
        const item: Body = {
            ...body,
            internalId: this.bodies.length,
        };

        this.bodies.push(item);
        return item;
    }

    private create_state_vector(target: Body, other: Body) {
        return [
            ...target.position,
            ...other.position,
            ...target.velocity,
            ...other.velocity,
        ];
    }

    private absolute_motion(state: number[], masses: [number, number]) {
        const accel = [0, 0, 0];

        const p1 = state.slice(0, 3);
        const p2 = state.slice(3, 6);

        const r = Math.sqrt(
            Math.pow(p2[0] - p1[0], 2) +
                Math.pow(p2[1] - p1[1], 2) +
                Math.pow(p2[2] - p1[2], 2) +
                // Helps with collision
                Math.pow(0.1, 2)
        );

        for (let i = 0; i < 3; i++) {
            const ddot = (G * (p2[i] - p1[i])) / Math.pow(r, 3);
            accel[i] = ddot * (masses[0] + masses[1]);
        }

        return accel;
    }

    /** Calculate each position change through time **/
    project(time_t: number) {
        let dt = 0.5;
        let solutions = [];
        const intermediary = this.bodies.map(
            (body) =>
                ({
                    position: [...body.position],
                    velocity: [...body.velocity],
                    mass: body.mass,
                    fixed: body.fixed,
                } as Body)
        );

        for (let t = 0; t < time_t; t += dt) {
            const set = [];
            for (let i = 0; i < intermediary.length; i++) {
                const target = intermediary[i];
                for (let j = 0; j < intermediary.length; j++) {
                    if (j === i) continue;
                    const next_state = this.compute(dt, target, this.bodies[j]);
                    for (let i = 0; i < 3; i++) {
                        target.velocity[i] += next_state[i];
                    }
                }

                if (target.fixed !== true) {
                    for (let i = 0; i < 3; i++) {
                        target.position[i] += target.velocity[i] * dt;
                    }
                }
                set.push([...target.position]);
            }
            solutions.push(set);
        }

        return solutions;
    }

    private compute(time_step: number, target: Body, other: Body) {
        const state = this.create_state_vector(target, other);
        const next_state = this.absolute_motion(state, [
            target.mass,
            other.mass,
        ]);

        return next_state.map((p) => p * time_step);
    }

    /** For each body, compute its updated position based on the effects of physics */
    update() {
        const dt = 0.5;

        for (let i = 0; i < this.bodies.length; i++) {
            const target = this.bodies[i];
            if (target.fixed === true) continue;

            for (let j = 0; j < this.bodies.length; j++) {
                if (j === i) continue;
                const next_state = this.compute(dt, target, this.bodies[j]);
                for (let i = 0; i < 3; i++) {
                    target.velocity[i] += next_state[i];
                }
            }

            for (let i = 0; i < 3; i++) {
                target.position[i] += target.velocity[i] * dt;
            }
        }
    }
}
