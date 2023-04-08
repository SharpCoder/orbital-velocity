import {
    rads,
    sphereRectCollision,
    type Camera,
    type Engine,
} from 'webgl-engine';

let prevMouseX = 0.0;
let prevMouseY = 0.0;

let velocityZ = 0.0;
let velocityX = 0.0;

export function useMapCamera(engine: Engine, camera: Camera, speed: number) {
    const cameraX = Math.cos(camera.rotation[1]);
    const cameraY = Math.sin(camera.rotation[1]);
    // const speed = 20.0;
    // const speed = 6.0;
    const MAXIMUM_ACCEL = 1.0;
    const ACCEL = 0.2;
    const DAMP = 0.1;

    // Figure out velocity
    if (engine.keymap['w']) {
        velocityZ += ACCEL * cameraX;
        velocityX += ACCEL * cameraY;
    } else if (engine.keymap['s']) {
        velocityZ += -ACCEL * cameraX;
        velocityX += -ACCEL * cameraY;
    }

    if (engine.keymap['d']) {
        // Calculate 90 degrees to the side of "forward"
        const theta = camera.rotation[1] - Math.PI / 2;
        const tangentX = Math.cos(theta);
        const tangentY = Math.sin(theta);

        velocityZ += ACCEL * tangentX;
        velocityX += ACCEL * tangentY;
    } else if (engine.keymap['a']) {
        // Calculate 90 degrees to the side of "forward"
        const theta = camera.rotation[1] + Math.PI / 2;
        const tangentX = Math.cos(theta);
        const tangentY = Math.sin(theta);

        velocityZ += ACCEL * tangentX;
        velocityX += ACCEL * tangentY;
    }

    if (velocityZ > 0.1) {
        velocityZ -= DAMP;
    } else if (velocityZ < -0.1) {
        velocityZ += DAMP;
    } else {
        velocityZ = 0.0;
    }

    if (velocityX > 0.1) {
        velocityX -= DAMP;
    } else if (velocityX < -0.1) {
        velocityX += DAMP;
    } else {
        velocityX = 0.0;
    }

    // Clamp
    if (velocityZ > 0) {
        velocityZ = Math.min(velocityZ, MAXIMUM_ACCEL);
    } else {
        velocityZ = Math.max(velocityZ, -MAXIMUM_ACCEL);
    }

    if (velocityX > 0) {
        velocityX = Math.min(velocityX, MAXIMUM_ACCEL);
    } else {
        velocityX = Math.max(velocityX, -MAXIMUM_ACCEL);
    }

    const nextX = camera.position[0] - velocityX * speed;
    const nextZ = camera.position[2] - velocityZ * speed;

    const sphere = {
        x: nextX,
        y: camera.position[1],
        z: nextZ,
        radius: 50,
    };

    // Check if collision happened
    camera.colliding = false;
    for (const obj of engine.activeScene.objects) {
        if (obj._bbox && obj.allowClipping !== true) {
            const [collision, _d] = sphereRectCollision(sphere, obj._bbox);
            camera.colliding = camera.colliding || collision;

            if (collision) {
                velocityX = 0;
                velocityZ = 0;
            }
        }
    }

    camera.setX(camera.position[0] - velocityX * speed);
    camera.setZ(camera.position[2] - velocityZ * speed);

    const mouseFactor = 2.4;

    if (prevMouseX === 0 || prevMouseY === 0) {
        prevMouseX = engine.mousex;
        prevMouseY = engine.mousey;
    }

    let mx = (prevMouseX - engine.mousex) / mouseFactor;
    let my = (prevMouseY - engine.mousey) / mouseFactor;

    prevMouseX = engine.mousex;
    prevMouseY = engine.mousey;

    // const ox = window.innerWidth / 2;
    // const oy = window.innerHeight / 2;
    // const mx = engine.mousex - ox;
    // const my = engine.mousey - oy;

    camera.rotation[1] = camera.rotation[1] + rads(mx);
    camera.rotation[0] = Math.max(
        Math.min(camera.rotation[0] + rads(my), rads(55)),
        rads(-55)
    );
}
