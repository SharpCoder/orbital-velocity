import { cuboid, m4, zeros, type Obj3d } from 'webgl-engine';

export function createStickyElement(x: number, y: number, z: number): Obj3d {
    const initialWidth = window.innerWidth;
    const initialHeight = window.innerHeight;

    return {
        vertexes: [],
        offsets: zeros(),
        position: zeros(),
        rotation: zeros(),
        properties: {
            initialWidth,
            initialHeight,
        },
        update: function (t, engine) {
            const { camera } = engine.activeScene;
            const cameraPosition = m4.combine([
                camera.getMatrix(),
                m4.translate(
                    ((x - 0.5) * window.innerWidth) / 4,
                    ((0.5 - y) * window.innerHeight) / 4,
                    z
                ),
            ]);

            this.offsets[0] = cameraPosition[12];
            this.offsets[1] = cameraPosition[13];
            this.offsets[2] = cameraPosition[14];
        },
    };
}
