import {
    DefaultShader,
    Flatten,
    loadModel,
    r,
    rads,
    Repeat,
    Scene,
    Vec3,
    zeros,
    type Obj3d,
} from 'webgl-engine';
import { useTouchCamera } from '../logic/useTouchCamera';
import { PhysicsEngine } from '../math/physics';
import { drawManeuverNode } from '../objects/maneuverNode';
import { drawOrbit } from '../objects/orbit';
import { DepthShader } from '../shaders/depth';
import { StarboxShader } from '../shaders/starbox';

const offset = 0;
const offsetY = 0;

const physicsEngine = new PhysicsEngine();

const Sun = physicsEngine.addBody({
    position: [-500 - offset, 0, 0],
    velocity: [0, 0, 0],
    mass: 1e26,
});

const Satellite = physicsEngine.addBody({
    position: [1000 - offset, 0, 0],
    velocity: [0, 20, 30],
    mass: 1e1,
});

const cubeSize = 25;
const dt = 0.05;

export const UniverseScene = new Scene({
    title: 'universe',
    shaders: [DefaultShader, DepthShader, StarboxShader],
    init: (engine) => {
        engine.settings.fogColor = [1, 1, 1, 1];
        engine.settings.fogColor = [0, 0, 0, 1];
        const { camera } = UniverseScene;
        camera.rotation[0] = -rads(180 + 45);
        camera.rotation[1] = -rads(180);
    },
    update: (time, engine) => {
        const { camera } = engine.activeScene;
        camera.position = Sun.position;
        useTouchCamera(engine);

        if (engine.properties['freeze_physics'] !== true) {
            physicsEngine.update(dt);
        }
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
                this.position = Satellite.position;
                this.offsets = [-cubeSize / 4, -cubeSize / 4, -cubeSize / 4];

                const readoutLines = [
                    `Position: <${r(Satellite.position[0])}, ${r(
                        Satellite.position[1]
                    )}, ${r(Satellite.position[2])}>`,
                    `Velocity: <${r(Satellite.velocity[0])}, ${r(
                        Satellite.velocity[1]
                    )}, ${r(Satellite.velocity[2])}>`,
                ];

                engine.properties['readout'] = readoutLines.join('\n');
            },
        });
    });

const orbitalManeuverNode = drawManeuverNode(physicsEngine, Satellite, 1.2);
const orbit = drawOrbit(
    physicsEngine,
    Satellite,
    {
        color: [128, 64, 255],
    },
    {
        children: [orbitalManeuverNode],
    }
);

UniverseScene.addObject(orbit);
