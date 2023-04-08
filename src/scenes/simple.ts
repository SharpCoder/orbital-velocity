import {
    cuboid,
    cylinder,
    DefaultShader,
    Flatten,
    m4,
    rads,
    Repeat,
    Scene,
    Vec3,
    zeros,
    type Obj3d,
} from 'webgl-engine';
import { useSliderCamera } from '../logic/useSliderCamera';

const ox = 0;
const oy = 0;
const oz = 0;

export const SimpleScene = new Scene({
    title: 'simple',
    shaders: [DefaultShader],
    init: (engine) => {
        const { camera } = engine.activeScene;
        engine.settings.fogColor = [1, 1, 1, 1];
        const d = 25;

        const matrix = m4.combine([m4.rotateY(90), m4.translate(0, 0, -300)]);

        const x = matrix[12] / 2;
        const y = matrix[13] / 2;
        const mm = 24.5;

        camera.setPosition(0 * mm, 0 * mm, 7.96 * mm);
        // camera.setPosition(-0.74 * mm, 0.05 * mm, 3.96 * mm);
        // camera.setPosition(-3 * mm, 0 * mm, 10.036 * mm);
        // camera.rotateX(rads(-10));
        // camera.rotateY(rads(-10));
        // camera.rotateZ(rads(10));

        // Z-Forward
        // camera.setPosition(0, 0, 3 * mm);
        // camera.rotateX(rads(0));
        // camera.rotateY(rads(0));
        // camera.rotateZ(rads(0));

        // X-Forward
        // camera.setPosition(3 * mm, 0, 0);
        // camera.rotateX(rads(0));
        // camera.rotateY(rads(90));
        // camera.rotateZ(rads(0));

        // Y-Forward
        // camera.setPosition(0, -3 * mm, 0);
        // camera.rotateX(rads(90));
        // camera.rotateY(rads(0));
        // camera.rotateZ(rads(0));

        // camera.rotateZ(rads(-180));
        // camera.rotateZ(rads(-180));
        // camera.rotateX(rads(5));
        // camera.rotateZ(rads(45));
        // camera.rotateZ(rads(-45));
        // camera.rotateZ(rads(90));
        // camera.rotateZ(rads(-90));
    },
    update: (time, engine) => {
        const { camera, objects } = engine.activeScene;
        useSliderCamera(engine);
        // useMapCamera(engine, camera, 6);
        // camera.target = [100, 100, 0];
        // camera.rotateZ(camera.rotation[2] - rads(0.5));
        // camera.rotateY(camera.rotation[1] + rads(0.25));
        // camera.position[1] += 1;
        // camera.rotateZ(camera.rotation[2] + rads(0.5));
    },
    status: 'ready',
});

function cube(x: number, y: number, z: number, color?: number[]): Obj3d {
    const size = 50;
    return {
        vertexes: cuboid(size, size, size - 20),
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
        properties: {
            v: 0,
            range: 20.0,
            delta: 2,
            up: false,
            axis: 2,
        },
        update: function (t) {
            let { axis, v, delta, up, range } = this.properties;
            v = parseInt(v);
            const step = t / 40;

            if (up && v > range) {
                this.properties['up'] = false;
            } else if (!up && v < -range) {
                this.properties['up'] = true;
            }

            if (up) {
                this.properties['v'] += delta * step;
            } else {
                this.properties['v'] -= delta * step;
            }

            const newSizes = [size, size, size];
            newSizes[axis] = size + v;
            if (newSizes[axis] > size + range) {
                newSizes[axis] = size + range;
            } else if (newSizes[axis] < size - range) {
                newSizes[axis] = size - range;
            }

            this.vertexes = cuboid.apply(this, newSizes);
            this.offsets = [
                -newSizes[0] / 2,
                -newSizes[1] / 2,
                -newSizes[2] / 2,
            ];
            // this.rotation[0] += rads(0.5);
            // this.rotation[1] += rads(0.5);
            // this.rotation[2] += rads(0.5);
            // this.rotation[0] = rads(45);
            // this.rotation[1] = rads(45);
            // this.rotation[2] = rads(32.05);
        },
        offsets: [-size / 2, -size / 2, -size / 2],
        position: [x, y, z],
        // rotation: zeros(),
        rotation: [rads(45), rads(25), rads(0)],
        // rotation: [rads(45), rads(45), rads(45)],
    };
}

const lineScale = 1;

// SimpleScene.addObject(cube(ox, oy, oz));
SimpleScene.addObject(cube(0, 0, 0));
