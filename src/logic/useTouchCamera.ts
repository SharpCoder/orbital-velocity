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
    zoom = 2700,
    init = false,
    mode: CameraMode = 'initializing';

export function useTouchCamera(engine: Engine) {
    const { camera } = engine.activeScene;

    if (!init) {
        init = true;
        document.addEventListener('keydown', () => {
            if (engine.keymap['Control'] || engine.keymap['Shift']) {
                sx = engine.mousex;
                sy = engine.mousey;
            }
        });

        document.addEventListener('mousedown', () => {
            sx = engine.mousex;
            sy = engine.mousey;
        });

        document.addEventListener('wheel', (evt) => {
            zoom += evt.deltaY / 1;
        });
    }

    if (engine.keymap['Control']) {
        engine.mousebutton = 4;
    } else if (engine.keymap['Shift']) {
        engine.mousebutton = 1;
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
        camera.offset[0] = wx + deltaX;
        camera.offset[1] = wy + deltaY;
    } else if (mode === 'rotate') {
        // Do rotate logic
        camera.rotation[0] = (wrx - rads(deltaY / 3)) % rads(360);
        camera.rotation[1] = (wry + rads(deltaX / 3)) % rads(360);
    }

    camera.offset[2] = zoom;
}
