import {
    DefaultShader,
    Flatten,
    loadModel,
    rads,
    Repeat,
    Scene,
    Vec3,
    zeros,
    type Obj3d,
} from 'webgl-engine';
import { useTouchCamera } from '../logic/useTouchCamera';
import { PhysicsEngine } from '../math/physics';
import { drawOrbit } from '../objects/orbit';
import { DepthShader } from '../shaders/depth';

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

const cubeSize = 25;
const dt = 0.05;

export const UniverseScene = new Scene({
    title: 'universe',
    shaders: [DefaultShader, DepthShader],
    init: (engine) => {
        engine.settings.fogColor = [1, 1, 1, 1];
        engine.settings.fogColor = [0, 0, 0, 1];
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

fetch('models/ball.obj')
    .then((obj) => {
        return obj.blob();
    })
    .then(async (moonModel) => {
        const obj = await loadModel(moonModel, 'obj');
        const size = obj.vertexes.reduce((a, b) => {
            if (isNaN(a)) a = 0;
            if (isNaN(b)) b = 0;
            return Math.max(Math.abs(a), Math.abs(b));
        }, 0);

        const vertexes = obj.vertexes.map((p) => {
            if (isNaN(p)) p = 0;
            return p / size;
        });

        const scale = 50;
        const TheSun: Obj3d = {
            vertexes: vertexes,
            position: Sun.position,
            offsets: zeros(),
            rotation: zeros(),
            scale: [scale, scale, scale],
            colors: Flatten(
                Repeat(Vec3(255, 255, 255), obj.vertexes.length / 3)
            ),
            update: function (t, engine) {
                this.position = Sun.position;
                this.offsets = [-scale / 2, -scale / 2, -scale / 2];
            },
        };

        UniverseScene.addObject(TheSun);

        // UniverseScene.addObject({
        //     ...obj,
        //     position: zeros(),
        //     offsets: zeros(),
        //     rotation: zeros(),
        //     scale: [cubeSize, cubeSize, cubeSize],
        //     colors: Flatten(
        //         Repeat(Vec3(255, 255, 255), obj.vertexes.length / 3)
        //     ),
        //     update: function (t, engine) {
        //         this.position = Satellite.position;
        //         this.offsets = [-cubeSize / 4, -cubeSize / 4, -cubeSize / 4];
        //     },
        // });

        UniverseScene.addObject({
            ...obj,
            position: zeros(),
            offsets: zeros(),
            rotation: zeros(),
            scale: [cubeSize, cubeSize, cubeSize],
            colors: Flatten(
                Repeat(Vec3(255, 255, 255), obj.vertexes.length / 3)
            ),
            update: function (t, engine) {
                this.position = Sun2.position;
                this.offsets = [-cubeSize / 4, -cubeSize / 4, -cubeSize / 4];
            },
        });
    });

// UniverseScene.addObject(
//     drawOrbit(physicsEngine, Satellite, {
//         color: [0, 128, 255],
//     })
// );

UniverseScene.addObject(
    drawOrbit(physicsEngine, Sun2, {
        color: [128, 64, 255],
    })
);
