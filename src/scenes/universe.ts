import { DefaultShader, rads, Scene, zeros } from 'webgl-engine';
import { useTouchCamera } from '../logic/useTouchCamera';
import { drawCube } from '../drawing';
import { PhysicsEngine } from '../math/physics';
import { drawOrbit } from '../objects/orbit';

const physicsEngine = new PhysicsEngine();
const Satellite = physicsEngine.addBody({
    position: [500, 0, 0],
    velocity: [0, 20, 40],
    mass: 1,
});

const Sun = physicsEngine.addBody({
    position: [-500, 0, 0],
    velocity: [0, 0, 0],
    mass: 1e26,
});

const Sun2 = physicsEngine.addBody({
    position: [1000, 0, 0],
    velocity: [0, 50, 30],
    mass: 1e1,
});

window['sat'] = Satellite;

const cubeSize = 60;
const sunSize = 100;
const dt = 0.35;

export const UniverseScene = new Scene({
    title: 'universe',
    shaders: [DefaultShader],
    init: (engine) => {
        engine.settings.fogColor = [1, 1, 1, 1];
        engine.settings.fogColor = [0.0, 0.0, 0.0, 1];
        const { camera } = UniverseScene;
        camera.rotation[0] = rads(-65);
        camera.rotation[1] = -rads(180);
    },
    update: (time, engine) => {
        const { camera } = engine.activeScene;

        camera.position = Sun.position;

        useTouchCamera(engine);
        physicsEngine.update(dt);
    },
    status: 'initializing',
});

const Borg = drawCube({
    position: zeros(),
    size: [cubeSize, cubeSize, cubeSize],
    update: function (t, engine) {
        this.position = Satellite.position;
    },
});

const TheSun = drawCube({
    position: Sun.position,
    size: [sunSize, sunSize, sunSize],
    color: [255, 255, 255],
    update: function (t, engine) {
        this.position = Sun.position;
    },
});

UniverseScene.addObject(TheSun);
UniverseScene.addObject(
    drawCube({
        position: Sun2.position,
        size: [cubeSize, cubeSize, cubeSize],
        update: function (t, engine) {
            this.position = Sun2.position;
        },
    })
);

UniverseScene.addObject(Borg);
UniverseScene.addObject(
    drawOrbit(physicsEngine, Satellite, {
        color: [0, 128, 255],
    })
);

UniverseScene.addObject(
    drawOrbit(physicsEngine, Sun2, {
        color: [128, 64, 255],
    })
);
