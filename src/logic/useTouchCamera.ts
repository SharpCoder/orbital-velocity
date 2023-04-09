import {
    degs,
    r,
    rads,
    rotationBetweenPoints,
    type Engine,
} from 'webgl-engine';

type CameraMode = 'initializing' | 'inactive' | 'pan' | 'rotate';
let rx = 0, // rotateX
    wrx = 0, // windowRotateX
    wry = 0, // windowRotateY
    wrz = 0, // windowRotateZ
    sx = 0, // startX
    sy = 0, // startY
    wx = 0, // windowX
    wy = 0, // windowY
    zoom = 200,
    mode: CameraMode = 'initializing';

document.addEventListener('mousedown', (evt) => {
    sx = evt.clientX;
    sy = evt.clientY;
});

document.addEventListener('wheel', (evt) => {
    zoom += evt.deltaY / 10;
});

export function useTouchCamera(engine: Engine, initialY) {
    const { camera } = engine.activeScene;

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
        const mag = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
        camera.rotation[0] = wrx - rads(deltaY / 3);
        camera.rotation[1] = wry + rads(deltaX / 3);
        // camera.rotation[1] = wry + rads(deltaX / 3);
        // camera.rotation[2] = wrz - rads(deltaY / 3);
    }

    engine.debug(`${r(degs(camera.rotation[0]))} [rx]`);
    engine.debug(`${r(degs(camera.rotation[1]))} [ry]`);
    engine.debug(`${r(degs(camera.rotation[2]))} [rz]`);
    engine.debug(`${r(degs(initialY))} [incl]`);

    // camera.rotation[1] = initialY;
    camera.offset[2] = zoom;
    // camera.position[2] = zoom;
}
