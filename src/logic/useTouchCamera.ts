import { debug } from 'svelte/internal';
import {
    cylinder,
    degs,
    m3,
    m4,
    r,
    rads,
    rotationBetweenPoints,
    type Engine,
} from 'webgl-engine';
import { drawCylinder, lineTo } from '../drawing';

type CameraMode = 'initializing' | 'inactive' | 'pan' | 'rotate';
let rx = 0, // rotateX
    wrx = 0, // windowRotateX
    wry = 0, // windowRotateY
    wrz = 0, // windowRotateZ
    sx = 0, // startX
    sy = 0, // startY
    wx = 0, // windowX
    wy = 0, // windowY
    zoom = 3000,
    init = false,
    mode: CameraMode = 'initializing';

document.addEventListener('mousedown', (evt) => {
    sx = evt.clientX;
    sy = evt.clientY;
});

document.addEventListener('wheel', (evt) => {
    zoom += evt.deltaY / 10;
});

export function useTouchCamera(engine: Engine, initialY: number) {
    const { camera } = engine.activeScene;

    if (!init) {
        init = true;
        // camera.rotation[1] = initialY;
        // camera.rotation[0] = rads(90 - 15);
        // camera.position[0] = rads(90);
    }

    switch (engine.mousebutton) {
        case 1: {
            mode = 'pan';
            break;
        }
        case 4: {
            mode = 'rotate';
            break;
        }
        default: {
            if (mode !== 'inactive') {
                // Save state
                wx = camera.offset[0];
                wy = camera.offset[1];
                wrx = camera.rotation[0];
                wry = camera.rotation[1];
                wrz = camera.rotation[2];
            }
            mode = 'inactive';
            break;
        }
    }

    const deltaX = sx - engine.mousex;
    const deltaY = engine.mousey - sy;
    if (mode === 'pan') {
        // Do pan logic
        camera.offset[0] = wx + deltaX / 3;
        camera.offset[1] = wy + deltaY / 3;
    } else if (mode === 'rotate') {
        // Do rotate logic
        camera.rotation[0] = (wrx - rads(deltaY / 3)) % rads(360);
        camera.rotation[1] = (wry + rads(deltaX / 3)) % rads(360);
    }

    engine.debug(`${r(degs(camera.rotation[0]))} [rx]`);
    engine.debug(`${r(degs(camera.rotation[1]))} [ry]`);
    engine.debug(`${r(degs(camera.rotation[2]))} [rz]`);
    engine.debug(`${r(degs(initialY))} [incl]`);

    // camera.rotation[1] = initialY;
    camera.offset[2] = zoom;
    // camera.position[2] = zoom;
}

function getAnglesFromMatrix(mm: number[]) {
    let thetaX = 0,
        thetaY = 0,
        thetaZ = 0;

    function idx(row, col) {
        return (col - 1) * 4 + row - 1;
    }

    thetaX = Math.asin(mm[idx(3, 2)]);
    if (thetaX < Math.PI / 2) {
        if (thetaX > -Math.PI / 2) {
            thetaZ = Math.atan2(-mm[idx(1, 2)], mm[idx(2, 2)]);
            thetaY = Math.atan2(-mm[idx(3, 1)], mm[idx(3, 3)]);
        } else {
            thetaZ = -Math.atan2(-mm[idx(1, 3)], mm[idx(1, 1)]);
            thetaY = 0;
        }
    } else {
        thetaZ = Math.atan2(mm[idx(1, 3)], mm[idx(1, 1)]);
        thetaY = 0;
    }
    return [thetaX, thetaY, thetaZ];
}
