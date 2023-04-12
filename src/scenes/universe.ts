import { DefaultShader, rads, Scene } from 'webgl-engine';
import { useTouchCamera } from '../logic/useTouchCamera';
import { drawCube, lineTo } from '../drawing';
import { NaviCube } from '../objects/naviCube';
import {
    calculate_parameters,
    orbitalPeriod,
    PhysicsEngine,
} from '../math/physics';
import { Propagator } from '../math/propagator';
import { createContainer } from '../objects/container';

const propagator = new Propagator();
const physicsEngine = new PhysicsEngine();
const Satellite = physicsEngine.addBody({
    position: [2000, 55, 51],
    velocity: [-15, 10, 40],
    mass: 1,
});

const Sun = physicsEngine.addBody({
    position: [0, 0, 0],
    velocity: [0, 0, 0],
    mass: 1e26,
    fixed: false,
});

const Sun2 = physicsEngine.addBody({
    position: [-2000, 0, 0],
    velocity: [22, 0, -40],
    mass: 1e24,
    // fixed: false,
    disabled: true,
});

const dt = 1;
const orbitThickness = 10;
const segments = [];

// const solutions = physicsEngine.project(150, dt);

// for (let i = 0; i < solutions.length - 1; i++) {
//     const from = solutions[i].positions[0];
//     const to = solutions[i + 1].positions[0];

//     segments.push(
//         lineTo({
//             from: [...from],
//             to: [...to],
//             thickness: orbitThickness,
//             color: [0, 0, 0],
//         })
//     );
// }

let initialY = 0;
const orbit = createContainer();

export const UniverseScene = new Scene({
    title: 'universe',
    shaders: [DefaultShader],
    init: (engine) => {
        engine.settings.fogColor = [1, 1, 1, 1];
        const { camera } = UniverseScene;
        camera.offset[2] = 3000;
        camera.rotation[0] = -rads(63);
        camera.rotation[1] = -rads(171);
    },
    update: (time, engine) => {
        useTouchCamera(engine, initialY);
        physicsEngine.update(dt);

        // Update the orbit
        const state = physicsEngine.state;
        const parameters = calculate_parameters(
            state.positions[0],
            state.velocities[0],
            Sun.mass
        );

        const period = orbitalPeriod([physicsEngine.state], 0);
        const next_solutions = physicsEngine.project(Math.min(period, 300), dt);
        engine.activeScene.removeObject(orbit);
        orbit.children.splice(0, orbit.children.length);

        for (let i = 0; i < next_solutions.length - 1; i++) {
            const from = next_solutions[i].positions[0];
            const to = next_solutions[i + 1].positions[0];
            const next_segment = lineTo({
                from: [...from],
                to: [...to],
                thickness: orbitThickness,
                color: [0, 0, 0],
            });
            // segments.push(next_segment);
            orbit.children.push(next_segment);
        }

        // engine.debug(`orbital period ${Math.round(period)}`);
        UniverseScene.addObject(orbit);
    },
    status: 'initializing',
});

const Borg = drawCube({
    x: 0,
    y: 0,
    z: 0,
    size: [50, 50, 50],
    update: function (t, engine) {
        this.position = Satellite.position;
    },
});

UniverseScene.addObject(
    drawCube({
        x: Sun.position[0],
        y: Sun.position[1],
        z: Sun.position[2],
        size: [100, 100, 100],
        color: [0, 0, 0],
        update: function (t, engine) {
            this.position = Sun.position;
        },
    })
);

UniverseScene.addObject(
    drawCube({
        x: Sun2.position[0],
        y: Sun2.position[1],
        z: Sun2.position[2],
        size: [50, 50, 50],
        update: function (t, engine) {
            this.position = Sun2.position;
        },
    })
);

UniverseScene.addObject(
    drawCube({
        x: Sun.position[0],
        y: Sun.position[1],
        z: Sun.position[2],
        size: [50, 50, 50],
        color: [255, 0, 0],
        update: function (t, engine) {
            const state = physicsEngine.state;
            const position = state.positions[0];
            const velocity = state.velocities[0];
            const mass = Sun.mass;
            const parameters = calculate_parameters(position, velocity, mass);
            this.position = [parameters.semiMajorAxis, 0, 0];
            engine.debug(
                `${velocity.map((a) => Math.round(a)).join(',')} velocity`
            );
            engine.debug(`${Math.round(parameters.v)} v`);
        },
    })
);

UniverseScene.addObject(Borg);
segments.forEach((segment) => UniverseScene.addObject(segment));
UniverseScene.addObject(NaviCube());
