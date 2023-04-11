import { DefaultShader, rads, Scene } from 'webgl-engine';
import { useTouchCamera } from '../logic/useTouchCamera';
import { drawCube, lineTo } from '../drawing';
import { NaviCube } from '../objects/naviCube';
import { PhysicsEngine } from '../math/physics';

const physicsEngine = new PhysicsEngine();
const Satellite = physicsEngine.addBody({
    position: [2000, 0, 0],
    velocity: [10, 20, 30],
    mass: 1.0,
});

const Sun = physicsEngine.addBody({
    position: [0, 0, 0],
    velocity: [0, 0, 0],
    mass: 1.0e26,
    fixed: true,
});

const Sun2 = physicsEngine.addBody({
    position: [-2000, 0, 500],
    velocity: [10, 20, 30],
    mass: 0.0,
});

const dt = 0.75;
const orbitThickness = 10;
const solutions = physicsEngine.project(dt, 300);
const segments = [];

console.log(solutions);

for (let i = 0; i < solutions.length - 1; i++) {
    const from = solutions[i][0];
    const to = solutions[i + 1][0];
    segments.push(
        lineTo({
            from: [...from],
            to: [...to],
            thickness: orbitThickness,
            color: [0, 0, 0],
        })
    );
}

let initialY = 0;
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

        // Update the orbit
        // const next_solutions = physicsEngine.project(110);
        // for (let i = 0; i < segments.length; i++) {
        //     const segment = segments[i];
        //     UniverseScene.removeObject(segment);
        // }

        // segments.splice(0, segments.length);

        // for (let i = 0; i < next_solutions.length - 1; i++) {
        //     const from = next_solutions[i][0];
        //     const to = next_solutions[i + 1][0];
        //     const next_segment = lineTo({
        //         from: [...from],
        //         to: [...to],
        //         thickness: orbitThickness,
        //         color: [0, 0, 0],
        //     });
        //     segments.push(next_segment);
        //     UniverseScene.addObject(next_segment);
        // }
    },
    status: 'initializing',
});

const Borg = drawCube({
    x: 0,
    y: 0,
    z: 0,
    size: [50, 50, 50],
    update: function (t, engine) {
        physicsEngine.update(dt);
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

UniverseScene.addObject(Borg);
segments.forEach((segment) => UniverseScene.addObject(segment));
UniverseScene.addObject(NaviCube());
