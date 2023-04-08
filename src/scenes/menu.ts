import {
    cylinder,
    DefaultShader,
    Flatten,
    loadModel,
    rads,
    Repeat,
    Scene,
    Vec3,
} from 'webgl-engine';
import { zero } from '../utils';
import { sgp4, twoline2satrec } from 'satellite.js';
import { drawOrbit } from '../objects/orbit';
import { useMapCamera } from '../logic/useMapCamera';

export const MenuScene = new Scene({
    title: 'menu',
    shaders: [DefaultShader],
    init: (engine) => {
        const { camera } = engine.activeScene;
        engine.settings.fogColor = [1, 1, 1, 1];
        // camera.setPosition(0, 0, 200);
    },
    update: (time, engine) => {
        const { camera, objects } = engine.activeScene;
        const { position } = objects[0];

        // useMapCamera(engine, camera, 6);
        camera.target = Vec3(position[0], position[1], position[2]);
        camera.position = Vec3(position[0], position[1], position[2]);
        camera.position[2] -= 200;
        camera.rotateX(camera.rotation[0] + time / 1000);
        camera.rotateY(camera.rotation[1] + time / 1000);
        camera.rotateZ(camera.rotation[2] + time / 1000);
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

        MenuScene.addObject({
            ...model,
            colors,
            offsets: zero(),
            position: zero(),
            rotation: zero(),
            scale: [scale, scale, scale],
            properties: {
                t: 1680398531648,
            },
            update: function (t) {
                const { position } = sgp4(
                    satrec,
                    (new Date().getTime() - this.properties.t) / 1000
                ) as any;

                this.position = [
                    position.x / orbitScale,
                    position.y / orbitScale,
                    0, //position.z / orbitScale,
                ];
            },
            allowClipping: true,
        });

        for (const object of drawOrbit(satrec, scale, orbitScale)) {
            MenuScene.addObject(object);
        }

        MenuScene.status = 'ready';
    });
