import { Flatten, m4, Repeat, Vec3, type Obj3d } from 'webgl-engine';
import { drawCube } from '../drawing';

export function NaviCube(): Obj3d {
    const NaviCubeOffset = [45, -30, -60];
    const NaviCubeSize = [5, 5, 5];
    const NaviCube = drawCube({
        x: 0,
        y: 0,
        z: 0,
        size: NaviCubeSize,
        color: Flatten([
            Repeat(Vec3(0, 199, 255), 6),
            Repeat(Vec3(255, 0, 199), 6),
            Repeat(Vec3(199, 255, 0), 6),
            Repeat(Vec3(0, 255, 222), 6),
            Repeat(Vec3(222, 0, 255), 6),
            Repeat(Vec3(255, 222, 0), 6),
        ]),
    });

    NaviCube.update = function (t, engine) {
        const { camera } = engine.activeScene;
        const cameraMatrixes = [
            m4.rotateY(camera.rotation[1]),
            m4.rotateX(camera.rotation[0]),
            m4.rotateZ(camera.rotation[2]),
            m4.translate(camera.offset[0], camera.offset[1], camera.offset[2]),
            m4.translate(
                NaviCubeOffset[0],
                NaviCubeOffset[1],
                NaviCubeOffset[2]
            ),
        ];

        const cameraPosition = m4.combine(cameraMatrixes);

        NaviCube.offsets[0] = cameraPosition[12] - NaviCubeSize[0] / 2;
        NaviCube.offsets[1] = cameraPosition[13] - NaviCubeSize[1] / 2;
        NaviCube.offsets[2] = cameraPosition[14] - NaviCubeSize[2] / 2;

        console.log({
            x: cameraPosition[12],
            y: cameraPosition[13],
            z: cameraPosition[14],
        });
    };

    return NaviCube;
}
