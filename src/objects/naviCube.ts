import { degs, m3, r, rads, type Obj3d } from 'webgl-engine';
import { drawCube, drawCylinder } from '../drawing';
import { createStickyElement } from './sticky';

export function NaviCube(): Obj3d {
    let initialized = false;

    const NaviCubeSize = [5, 5, 5];
    const naviCube = drawCube({
        x: 0,
        y: 0,
        z: 0,
        size: NaviCubeSize,
    });

    const dotProductLine = drawCylinder({
        length: 12,
        sides: 10,
        thickness: 0.25,
        color: [0, 0, 0],
        position: [0, 0, 0],
    });

    dotProductLine.offsets = dotProductLine.offsets.map((p) => p + 5 / 2);
    naviCube.children = [dotProductLine];

    const hudElement = createStickyElement(0.75, 0.75, -100);
    hudElement.children = [naviCube];

    dotProductLine.update = function (t, engine) {
        const { camera } = engine.activeScene;
        const cross = m3.cross([0, 1, 0], camera.rotation);
    };

    return hudElement;
}
