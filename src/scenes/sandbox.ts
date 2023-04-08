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

const ox = 0;
const oy = 0;
const oz = 0;

export const SandboxScene = new Scene({
    title: 'sandbox',
    shaders: [DefaultShader],
    init: (engine) => {
        const { camera } = engine.activeScene;
        engine.settings.fogColor = [1, 1, 1, 1];
        const d = 50;
        camera.setPosition(ox, oy, 400);
        // camera.target = [ox, oy, oz];

        camera.rotateX(rads(-45));
        camera.rotateY(rads(-45));
        camera.rotateZ(rads(-45));
        // camera.rotateZ(rads(90));
        // camera.rotateZ(rads(-90));
    },
    update: (time, engine) => {
        const { camera, objects } = engine.activeScene;

        // useMapCamera(engine, camera, 6);
        // camera.target = [100, 100, 0];
        // camera.rotateX(camera.rotation[0] + rads(0.5));
        // camera.rotateY(camera.rotation[1] + rads(0.5));
        // camera.position[1] += 1;
        // camera.rotateZ(camera.rotation[2] + rads(0.5));
    },
    status: 'ready',
});

function cube(x: number, y: number, z: number, color?: number[]): Obj3d {
    const size = 10;
    return {
        vertexes: cuboid(size, size, size),
        colors: Flatten(
            color
                ? Repeat(Vec3(color[0], color[1], color[2]), 36)
                : [
                      Repeat(Vec3(0, 199, 255), 6),
                      Repeat(Vec3(255, 0, 199), 6),
                      Repeat(Vec3(199, 255, 0), 6),
                      Repeat(Vec3(0, 255, 222), 6),
                      Repeat(Vec3(222, 0, 255), 6),
                      Repeat(Vec3(255, 222, 0), 6),
                  ]
        ),
        offsets: [-size / 2, -size / 2, -size / 2],
        position: [x, y, z],
        // rotation: zeros(),
        rotation: [rads(45), rads(45), rads(45)],
    };
}

const lineScale = 1;

// SandboxScene.addObject(cube(ox, oy, oz));

SandboxScene.addObject(
    lineTo(
        Vec3(ox, oy, oz - 50),
        Vec3(ox, oy, oz + 50),
        lineScale,
        Vec3(255, 0, 0)
    )
);
SandboxScene.addObject(cube(ox, oy, oz - 50, [255, 0, 0]));
SandboxScene.addObject(cube(ox, oy, oz + 50, [255, 0, 0]));

SandboxScene.addObject(
    lineTo(
        Vec3(ox, oy - 50, oz),
        Vec3(ox, oy + 50, oz),
        lineScale,
        Vec3(0, 0, 255)
    )
);
SandboxScene.addObject(cube(ox, oy - 50, oz, [0, 0, 255]));
SandboxScene.addObject(cube(ox, oy + 50, oz, [0, 0, 255]));

SandboxScene.addObject(
    lineTo(
        Vec3(ox - 50, oy, oz),
        Vec3(ox + 50, oy, oz),
        lineScale,
        Vec3(0, 255, 0)
    )
);
SandboxScene.addObject(cube(ox - 50, oy, oz, [0, 255, 0]));
SandboxScene.addObject(cube(ox + 50, oy, oz, [0, 255, 0]));

const v4x = 0;
const v4y = 50;
const v4z = 150;

SandboxScene.addObject(
    lineTo(
        Vec3(ox - v4x, oy - v4y, oz - v4z),
        Vec3(ox + v4x, oy + v4y, oz + v4z),
        lineScale,
        Vec3(0, 0, 0)
    )
);
SandboxScene.addObject(cube(ox - v4x, oy - v4y, oz - v4z, [0, 0, 0]));
SandboxScene.addObject(cube(ox + v4x, oy + v4y, oz + v4z, [0, 0, 0]));

const v4x2 = -150;
const v4y2 = 50;
const v4z2 = -150;

SandboxScene.addObject(
    lineTo(
        Vec3(ox - v4x2, oy - v4y2, oz - v4z2),
        Vec3(ox + v4x2, oy + v4y2, oz + v4z2),
        lineScale,
        Vec3(255, 0, 255)
    )
);
SandboxScene.addObject(cube(ox - v4x2, oy - v4y2, oz - v4z2, [255, 0, 255]));
SandboxScene.addObject(cube(ox + v4x2, oy + v4y2, oz + v4z2, [255, 0, 255]));
