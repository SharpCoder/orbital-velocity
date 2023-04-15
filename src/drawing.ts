import {
    cuboid,
    cylinder,
    Flatten,
    Repeat,
    rotationBetweenPoints,
    Vec3,
    zeros,
    type Obj3d,
    type Vec3D,
} from 'webgl-engine';

export type CubProps = {
    position: number[];
    size: Vec3D;
    color?: Vec3D;
    colors?: number[];
};
export function drawCube({
    position,
    size,
    color,
    colors,
    ...props
}: CubProps & Partial<Obj3d>): Obj3d {
    return {
        vertexes: cuboid(size[0], size[1], size[2]),
        colors:
            colors ??
            Flatten(
                color
                    ? Repeat(color, 36)
                    : [
                          Repeat(Vec3(0, 199, 255), 6),
                          Repeat(Vec3(255, 0, 199), 6),
                          Repeat(Vec3(199, 255, 0), 6),
                          Repeat(Vec3(0, 255, 222), 6),
                          Repeat(Vec3(222, 0, 255), 6),
                          Repeat(Vec3(255, 222, 0), 6),
                      ]
            ),
        offsets: [-size[0] / 2, -size[1] / 2, -size[2] / 2],
        position,
        rotation: zeros(),
        ...props,
    };
}

export type CylinderProps = {
    position: number[];
    sides: number;
    length: number;
    thickness: number;
    rotation?: Vec3D;
    color?: Vec3D;
};
export function drawCylinder({
    position,
    rotation,
    sides,
    length,
    thickness,
    color,
}: CylinderProps): Obj3d {
    const vertexes = cylinder(sides, length, thickness);
    const sizes = [thickness, thickness, length];

    return {
        vertexes,
        colors: Flatten(Repeat(color ?? [255, 0, 0], vertexes.length / 3)),
        offsets: [-sizes[0], -sizes[1], -sizes[2] / 2],
        position,
        rotation: rotation ?? zeros(),
    };
}

export type LineToProps = {
    from: Vec3D;
    to: Vec3D;
    color?: Vec3D;
    sides?: number;
    thickness?: number;
} & Partial<Obj3d>;

export function lineToPositionAndRotation({
    from,
    to,
}: {
    from: number[];
    to: number[];
}): { length: number; position: number[]; rotation: number[] } {
    const [x1, y1, z1] = from;
    const [x2, y2, z2] = to;
    const min = [Math.min(x1, x2), Math.min(y1, y2), Math.min(z1, z2)];
    const max = [Math.max(x1, x2), Math.max(y1, y2), Math.max(z1, z2)];
    const magnitudes = [
        Math.abs(max[0] - min[0]),
        Math.abs(max[1] - min[1]),
        Math.abs(max[2] - min[2]),
    ];
    const midpoint = [
        min[0] + magnitudes[0] / 2,
        min[1] + magnitudes[1] / 2,
        min[2] + magnitudes[2] / 2,
    ];

    const length = Math.sqrt(
        Math.pow(magnitudes[0], 2) +
            Math.pow(magnitudes[1], 2) +
            Math.pow(magnitudes[2], 2)
    );

    return {
        length,
        position: midpoint,
        rotation: rotationBetweenPoints(from, to),
    };
}

export function lineTo({
    from,
    to,
    sides,
    thickness,
    color,
    ...props
}: LineToProps): Obj3d {
    return {
        ...drawCylinder({
            ...lineToPositionAndRotation({ from, to }),
            sides: sides ?? 10,
            thickness: thickness ?? 0.4,
            color,
        }),
        ...props,
    };
}
