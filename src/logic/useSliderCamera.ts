import { rads, type Engine } from 'webgl-engine';

function n(num: any) {
    if (isNaN(parseInt(num))) {
        return 0;
    } else {
        return parseFloat(num);
    }
}

export function useSliderCamera(engine: Engine) {
    const { camera } = engine.activeScene;
    const mm = 24.5;

    let { xrot, yrot, zrot, xpos, ypos, zpos } = engine.properties;

    camera.rotateX(rads(n(xrot)));
    camera.rotateY(rads(n(yrot)));
    camera.rotateZ(rads(n(zrot)));
    camera.position = [n(xpos) * mm, n(ypos) * mm, n(zpos) * mm];
}
