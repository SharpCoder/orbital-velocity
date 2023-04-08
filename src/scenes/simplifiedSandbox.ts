import {
    cuboid,
    cylinder,
    DefaultShader,
    degs,
    Flatten,
    m3,
    r,
    rads,
    Repeat,
    Scene,
    Vec3,
    zeros,
    type Obj3d,
} from 'webgl-engine';
import { useSliderCamera } from '../logic/useSliderCamera';

const ox = 50;
const oy = 50;
const oz = 0;
let thetaX = 0;
let thetaY = 0;
let thetaZ = 0;
let phi = 0;
let theta = 0;

const colors = [[68, 1, 84]];
const sizes = [1, 1, 100];
const cube1 = cube(0, 0, 0, colors[0]);
const cube2 = cube(0, 0, 0, colors[0]);
const line = {
    vertexes: cuboid(sizes[0], sizes[1], sizes[2]),
    colors: Flatten([
        Repeat(Vec3(0, 199, 255), 6),
        Repeat(Vec3(255, 0, 199), 6),
        Repeat(Vec3(0, 255, 222), 6),
        Repeat(Vec3(222, 0, 255), 6),
        Repeat(Vec3(199, 255, 0), 6),
        Repeat(Vec3(255, 222, 0), 6),
    ]),
    update: function (t) {
        // this.rotation[1] = rads(20);
        // this.rotation[0] = rads(35);
        // this.rotation[2] += rads(1);
    },
    offsets: [-sizes[1] / 2, -sizes[0] / 2, -sizes[2] / 2],
    position: zeros(),
    rotation: zeros(),
    // rotation: [thetaX, thetaZ, thetaY],
};

export const SimplifiedSandbox = new Scene({
    title: 'simplified-sandbox',
    shaders: [DefaultShader],
    init: (engine) => {
        const { camera } = engine.activeScene;
        engine.settings.fogColor = [1, 1, 1, 1];
        camera.setPosition(ox, oy, 300);
        const mm = 24.5;

        // X-Forward
        camera.setPosition(0, -200, -20);
        camera.rotateX(rads(95));
        camera.rotateY(rads(45));
        camera.rotateZ(rads(45));

        // Z-Forward
        // camera.setPosition(0, 0, 300);
        // camera.rotateX(rads(0));
        // camera.rotateY(rads(0));
        // camera.rotateZ(rads(0));

        // camera.target = [ox, oy, oz];

        // camera.rotateX(rads(45));
        // camera.rotateY(rads(45));
        // camera.rotateZ(rads(-35));
        // camera.rotateZ(rads(90));

        // camera.rotateZ(rads(90));
        // camera.rotateZ(rads(-90));
    },
    update: function (time, engine) {
        const { camera, objects } = engine.activeScene;
        useSliderCamera(engine);

        const cube1_xyz = [
            cube1.position[0],
            cube1.position[1],
            cube1.position[2],
        ];

        const cube2_xyz = [
            cube2.position[0],
            cube2.position[1],
            cube2.position[2],
        ];

        // console.log(cube1);

        engine._debugLogs = `(${cube1_xyz.join(',')})\n(${cube2_xyz.join(
            ','
        )})\n${r(degs(thetaX))} [rx]\n${r(degs(thetaY))} [ry]\n${r(
            degs(thetaZ)
        )} [rz]\n${r(degs(phi))} [phi]\n${r(degs(theta))} [theta]`;
        // this.debug('hilllo');

        // useMapCamera(engine, camera, 6);
        // camera.target = [100, 100, 0];
        // camera.rotateX(camera.rotation[0] + rads(0.5));
        // camera.rotateY(camera.rotation[1] + rads(0.5));
        // camera.rotateZ(camera.rotation[2] + rads(0.5));
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
        rotation: zeros(),
        // rotation: [rads(45), rads(45), rads(45)],
    };
}

// SimplifiedSandbox.addObject(
//     lineTo(
//         Vec3(ox - 25, oy - 50, oz - 100),
//         Vec3(ox + 25, oy + 50, oz + 100),
//         lineScale,
//         Vec3(colors[0][0], colors[0][1], colors[0][2])
//     )
// );

function ff(v) {
    if (isNaN(v)) {
        return 0;
    } else {
        return v;
    }
}

SimplifiedSandbox.addObject(cube1);
SimplifiedSandbox.addObject(cube2);
SimplifiedSandbox.addObject(line);

function update(x1, y1, z1, x2, y2, z2) {
    const from = [x1, y1, z1];
    const to = [x2, y2, z2];
    const min = [Math.min(x1, x2), Math.min(y1, y2), Math.min(z1, z2)];
    const max = [Math.max(x1, x2), Math.max(y1, y2), Math.max(z1, z2)];
    const vel = [
        Math.abs(max[0] - min[0]),
        Math.abs(max[1] - min[1]),
        Math.abs(max[2] - min[2]),
    ];

    let cx = from[0] - to[0];
    let cy = from[1] - to[1];
    let cz = from[2] - to[2];

    const midpoint = [
        min[0] + vel[0] / 2,
        min[1] + vel[1] / 2,
        min[2] + vel[2] / 2,
    ];

    // const xarg = cx;
    // const yarg = cy;
    // const zarg = cz;

    // thetaX = Math.atan2(yarg, zarg);
    // thetaY = Math.atan2(xarg, zarg); // ::
    // thetaZ = Math.atan2(yarg, xarg); // ::

    // thetaX = Math.atan2(zarg, yarg);
    // thetaY = Math.atan2(zarg, xarg);
    // thetaZ = Math.atan2(xarg, yarg);

    // const x = min[0] / 2;
    // const y = midpoint[1];
    // const z = midpoint[2];

    // const x = from[0] <= to[0] ? -vel[0] : vel[0];
    // const y = from[1] >= to[1] ? -vel[1] : vel[1];
    // const z = from[2] <= to[2] ? -vel[2] : vel[2];

    // const x = from[0] - to[0];
    // const y = from[1] - to[1];
    // const z = from[2] - to[2];

    // console.log(midpoint);
    // let m = [cx, cy, cz];
    // // for (let i = 0; i < 3; i++) {
    // //     if (m[i] > 0) {
    // //         m[i] += vel[i] / 2;
    // //     } else {
    // //         m[i] -= vel[i] / 2;
    // //     }
    // // }

    // const x = cx;
    // const y = cz;
    // const z = cy;

    const x = cx;
    const y = -cy;
    let z = cz;

    // const rotationAxis = normalize(m3.cross(currentDirection, newDirection));
    // const rotationAngle = ff(Math.acos(m3.dot(currentDirection, newDirection)));

    // rotationAxis[0] = ff(rotationAxis[0]);
    // rotationAxis[1] = ff(rotationAxis[1]);
    // rotationAxis[2] = ff(rotationAxis[2]);

    // thetaX = ff(Math.atan2(y, x));
    // thetaY = ff(Math.atan2(z, y));
    // thetaZ = rads(180) - ff(Math.atan2(x, z));

    // thetaX = ff(Math.atan2(y, x));
    // thetaY = ff(Math.atan2(x, z));
    // thetaZ = ff(Math.atan2(z, y)) - rads(90);

    // thetaX = rotationAngle * rotationAxis[1];
    // thetaY = rotationAngle * rotationAxis[0];
    // thetaZ = rotationAngle * rotationAxis[2];

    // if (from[0] <= to[0]) {
    // thetaX *= -1;
    // }

    // if (from[1] < to[1]) {
    // thetaY *= -1;
    // }

    /// Don't let z be absolutely zero because that fucks with atan2
    if (z === 0) {
        z -= 0.0001;
    }

    thetaX = Math.atan2(y, z);

    if (z >= 0) {
        thetaY = Math.atan2(x * Math.cos(thetaX), -z);
    } else {
        thetaY = -Math.atan2(x * Math.cos(thetaX), z);
    }

    thetaZ = Math.atan2(Math.cos(thetaX), Math.sin(thetaX) * Math.sin(thetaY));

    cube1.position = [x1, y1, z1];
    cube2.position = [x2, y2, z2];
    line.position = midpoint;
    line.rotation = [
        ff(thetaX),
        ff(thetaY),
        ff(thetaZ),
        // ff(thetaY),
        // ff(thetaX),
        // ff(thetaZ),
        // ff(rotationAxis[0]) * rotationAngle,
        // ff(rotationAxis[1]) * rotationAngle,
        // ff(rotationAxis[2]) * rotationAngle,
    ];
}

const positions = [
    [100, 0, 0, 0, 0, 0],
    [0, 100, 0, 0, 0, 0],
    [0, 0, 100, 0, 0, 0],
    [0, 0, 0, 100, 0, 0],
    [0, 0, 0, 0, 100, 0],
    [0, 0, 0, 0, 0, 100],
    [-100, 0, 0, 0, 0, 0],
    [0, -100, 0, 0, 0, 0],
    [0, 0, -100, 0, 0, 0],
    [0, 0, 0, -100, 0, 0],
    [0, 0, 0, 0, -100, 0],
    [0, 0, 0, 0, 0, -100],
    [100, 100, 0, 0, 0, 0],
    [100, 100, 100, 0, 0, 0],
    [0, 0, 0, 100, 100, 100],
    [0, 0, 0, 0, 100, 100],
    [0, 0, 0, 0, 0, 100],
    [-100, -100, 0, 0, 0, 0],
    [0, -100, -100, 0, 0, 0],
    [0, 0, -100, -100, 0, 0],
    [0, 0, 0, -100, -100, 0],
    [0, 0, 0, 0, -100, -100],
    [0, 0, 0, 0, 0, -100],
    [-100, -100, -100, 100, 0, 0],
    [0, -100, -100, 0, 100, 0],
    [-50, 0, -100, -100, 0, 100],
    [50, 20, 0, -100, -100, 0],
    [0, 0, 20, 0, -100, -100],
    [0, 20, 0, 0, 0, -100],
];

// const oox = 30;
// const ooy = 30;
// const ooz = 40;
// const positions = [[-oox, -ooy, -ooz, oox, ooy, ooz]];
// const positions = [[-30, 50, 10, 30, 50, 10]];

let idx = 1;
clearInterval(timerId);
var timerId = setInterval(() => {
    const args = positions[idx % positions.length].map((arg) => arg - 50);
    idx++;
    update.apply(this, args);
}, 500);

update.apply(this, positions[0]);
