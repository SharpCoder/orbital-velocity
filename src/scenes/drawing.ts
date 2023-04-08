import {
    cuboid,
    cylinder,
    DefaultShader,
    Flatten,
    rads,
    Repeat,
    Scene,
    Vec3,
    zeros,
    type Obj3d,
} from 'webgl-engine';
import { lineTo } from '../objects/orbit';

export const DrawingScene = new Scene({
    title: 'drawing',
    shaders: [DefaultShader],
    init: (engine) => {
        const { camera } = engine.activeScene;
        engine.settings.fogColor = [1, 1, 1, 1];
        camera.setPosition(100, 20, 500);
        camera.setPosition(0, 0, 500);

        camera.setPosition(500, 0, -100);
        camera.rotateY(rads(130));

        // camera.rotateX(rads(45));
        // camera.rotateZ(rads(-90));
    },
    update: (time, engine) => {
        const { camera } = engine.activeScene;
        // useMapCamera(engine, camera, 6);
        // camera.rotateY(camera.rotation[1] + rads(1));
    },
    status: 'ready',
});

function cube(x: number, y: number, z: number): Obj3d {
    const size = 4;
    return {
        vertexes: cuboid(size, size, size),
        colors: Flatten(Repeat(Vec3(0, 0, 0), 36)),
        offsets: [-size / 2, -size / 2, -size / 2],
        position: [x, y, z],
        rotation: zeros(),
    };
}

const lineScale = 1;
DrawingScene.addObject(lineTo(Vec3(0, 0, 0), Vec3(100, 100, 0), lineScale));
DrawingScene.addObject(lineTo(Vec3(100, 100, 0), Vec3(100, 0, 0), lineScale));
DrawingScene.addObject(lineTo(Vec3(100, 0, 0), Vec3(200, 50, 0), lineScale));
DrawingScene.addObject(lineTo(Vec3(200, 50, 0), Vec3(300, 10, 0), lineScale));
DrawingScene.addObject(
    lineTo(Vec3(300, 10, 0), Vec3(320, 10, 50), lineScale, Vec3(0, 0, 255))
);
DrawingScene.addObject(
    lineTo(Vec3(320, 10, 50), Vec3(10, -50, -75), lineScale, Vec3(0, 0, 255))
);
DrawingScene.addObject(cube(0, 0, 0));
DrawingScene.addObject(cube(100, 100, 0));
DrawingScene.addObject(cube(100, 0, 0));
DrawingScene.addObject(cube(200, 50, 0));
DrawingScene.addObject(cube(300, 10, 0));
DrawingScene.addObject(cube(320, 10, 50));
DrawingScene.addObject(cube(10, -50, -75));
