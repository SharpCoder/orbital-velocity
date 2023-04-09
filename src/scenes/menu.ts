import {
    cylinder,
    DefaultShader,
    Flatten,
    loadModel,
    m4,
    rads,
    Repeat,
    Scene,
    Vec3,
} from 'webgl-engine';
import { zero } from '../utils';
import { sgp4, twoline2satrec } from 'satellite.js';
import { drawOrbit } from '../objects/orbit';
import { useTouchCamera } from '../logic/useTouchCamera';
import { drawCube } from '../drawing';
import { NaviCube } from '../objects/naviCube';

let initialY = 0;
export const MenuScene = new Scene({
    title: 'menu',
    shaders: [DefaultShader],
    init: (engine) => {
        engine.settings.fogColor = [1, 1, 1, 1];
        // engine.activeScene.camera.rotation[1] = -rads(51.6);
        // engine.activeScene.camera.rotation[2] = rads(45);
        const { camera } = MenuScene;
        camera.offset[2] = 400;
    },
    update: (time, engine) => {
        useTouchCamera(engine, initialY);

        // useSliderCamera(engine);
    },
    status: 'initializing',
});

fetch('models/ball.obj')
    .then((resp) => resp.blob())
    .then(async (blob) => {
        const model = await loadModel(blob, 'obj');
        const scale = 5;
        const colors = Flatten(
            Repeat(Vec3(0, 0, 0), model.vertexes.length / 3)
        );

        // Sample TLE
        var tleLine1 =
                '1 25544U 98067A   19156.50900463  .00003075  00000-0  59442-4 0  9992',
            tleLine2 =
                '2 25544  51.6433  59.2583 0008217  16.4489 347.6017 15.51174618173442';

        // Initialize a satellite record
        var satrec = twoline2satrec(tleLine1, tleLine2);
        const orbitScale = 400;

        initialY = -satrec.inclo;

        MenuScene.addObject({
            ...model,
            colors,
            offsets: zero(),
            position: zero(),
            rotation: zero(),
            scale: [scale, scale, scale],
            properties: {
                acc: 0,
            },
            update: function (t) {
                this.properties.acc += t * 10;
                const { position } = sgp4(
                    satrec,
                    this.properties.acc / 1000
                ) as any;

                this.position = [
                    position.x / orbitScale,
                    position.y / orbitScale,
                    position.z / orbitScale,
                ];
            },
            allowClipping: true,
        });

        for (const object of drawOrbit(satrec, 0, scale, orbitScale)) {
            MenuScene.addObject(object);
        }

        MenuScene.addObject(NaviCube());
        MenuScene.status = 'ready';
    });
