import { DefaultShader, rads, Scene } from 'webgl-engine';
import { useTouchCamera } from '../logic/useTouchCamera';
import { drawCube, lineTo } from '../drawing';
import { NaviCube } from '../objects/naviCube';
import { keplerianParameters, PhysicsEngine } from '../math/physics';
import { Propagator } from '../math/propagator';
import { createContainer } from '../objects/container';

const physicsEngine = new PhysicsEngine();
const Satellite = physicsEngine.addBody({
    position: [2500, 0, 0],
    velocity: [0, 20, 30],
    mass: 1,
});

const Sun = physicsEngine.addBody({
    position: [0, 0, 0],
    velocity: [0, 0, 0],
    mass: 1e26,
});

const Sun2 = physicsEngine.addBody({
    position: [-2000, 0, 0],
    velocity: [22, 0, -40],
    mass: 2,
});

const cubeSize = 60;
const sunSize = 100;
const dt = 1;
const orbitThickness = 5;
const segments = [];
let initialY = 0;
let next = 0;
let elapsed = 0;
let period = 0;
const orbit = createContainer();

export const UniverseScene = new Scene({
    title: 'universe',
    shaders: [DefaultShader],
    init: (engine) => {
        engine.settings.fogColor = [1, 1, 1, 1];
        engine.settings.fogColor = [0.0, 0.0, 0.0, 1];
        const { camera } = UniverseScene;
        camera.offset[2] = 3000;
        camera.rotation[0] = -rads(63);
        camera.rotation[1] = -rads(171);
    },
    update: (time, engine) => {
        useTouchCamera(engine, initialY);
        physicsEngine.update(dt);
        elapsed += dt;

        // Update the orbit
        if (elapsed > next) {
            const { orbitalPeriod } = keplerianParameters(
                Satellite.position,
                Satellite.velocity,
                Satellite.mass + Sun.mass
            );

            period = orbitalPeriod;
            next = elapsed + period;

            const next_solutions = physicsEngine.project(
                Math.min(period + 1, 300),
                dt
            );
            engine.activeScene.removeObject(orbit);
            orbit.children.splice(0, orbit.children.length);

            const color = [255, 128, 0];

            for (let i = 0; i < next_solutions.length - 1; i++) {
                let fromId = i;
                let toId = i + 1;

                const from = next_solutions[fromId].positions[0];
                const to = next_solutions[toId].positions[0];
                const next_segment = lineTo({
                    from: [...from],
                    to: [...to],
                    thickness: orbitThickness,
                    color,
                });

                orbit.children.push(next_segment);
            }

            UniverseScene.addObject(orbit);
        }

        engine.debug(`${Math.round(period)} [orbital period]`);
    },
    status: 'initializing',
});

const Borg = drawCube({
    x: 0,
    y: 0,
    z: 0,
    size: [cubeSize, cubeSize, cubeSize],
    update: function (t, engine) {
        this.position = Satellite.position;
    },
});

UniverseScene.addObject(
    drawCube({
        x: Sun.position[0],
        y: Sun.position[1],
        z: Sun.position[2],
        size: [sunSize, sunSize, sunSize],
        color: [255, 128, 0],
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
        size: [cubeSize, cubeSize, cubeSize],
        update: function (t, engine) {
            this.position = Sun2.position;
        },
    })
);

UniverseScene.addObject(Borg);
segments.forEach((segment) => UniverseScene.addObject(segment));
UniverseScene.addObject(NaviCube());
