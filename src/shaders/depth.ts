import { m4, type ProgramTemplate } from 'webgl-engine';

const depthVertexShader = `
    attribute vec4 a_position;
    uniform mat4 u_worldView;
    uniform mat4 u_projection;
    uniform mat4 u_camera_inverse;
    uniform mat4 u_camera;
    uniform float u_far;
    uniform float u_width;
    uniform float u_height;

    varying vec4 v_color;

    void main() {
        gl_Position = u_projection * u_camera_inverse * u_worldView * a_position;
        vec4 position = a_position * u_camera;

        v_color = vec4(0, position.x / u_height, position.z / u_width, 1);
    }
`;

const depthFragmentShader = `
    precision mediump float;    
    varying vec4 v_color;

    void main() {
        gl_FragColor = v_color;
    }
`;

const gl = document.createElement('canvas').getContext('webgl');
export const DepthShader: ProgramTemplate = {
    name: 'depth',
    order: -2,
    objectDrawArgs: {
        depthFunc: gl.LESS,
        mode: gl.TRIANGLES,
    },
    afterDraw: function (engine) {
        const { gl, canvas } = engine;
        const data = new Uint8Array(4);
        const rect = canvas.getBoundingClientRect();
        const mx = engine.mousex - rect.left;
        const my = engine.mousey - rect.top;
        const pixelX = (mx * gl.canvas.width) / gl.canvas.clientWidth;
        const pixelY =
            gl.canvas.height -
            (my * gl.canvas.height) / gl.canvas.clientHeight -
            1;

        gl.readPixels(
            pixelX, // x
            pixelY, // y
            1, // width
            1, // height
            gl.RGBA, // format
            gl.UNSIGNED_BYTE, // type
            data
        ); // typed array to hold result

        const x = data[1] / 255;
        const z = data[2] / 255;

        engine.properties['mouse_x'] = x;
        engine.properties['mouse_z'] = z;

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    },
    vertexShader: depthVertexShader,
    fragmentShader: depthFragmentShader,
    attributes: {
        a_position: {
            components: 3,
            type: gl.FLOAT,
            normalized: false,
            generateData: (engine) => {
                return new Float32Array(
                    engine.activeScene.objects.flatMap((obj) => {
                        if (obj.properties?.['plane']) {
                            return obj.vertexes;
                        } else {
                            return obj.vertexes.map((_) => 0);
                        }
                    })
                );
            },
        },
    },
    staticUniforms: {
        u_far: (engine, loc) => {
            const { gl } = engine;
            gl.uniform1f(loc, engine.settings.zFar);
        },
        u_projection: (engine, loc) => {
            const { gl } = engine;
            gl.uniformMatrix4fv(loc, false, engine.computed.projectionMatrix);
        },
        u_camera: (engine, loc) => {
            const { gl } = engine;
            const { camera } = engine.activeScene;

            const cameraMatrix = m4.translate(
                -camera.offset[0],
                -camera.offset[1],
                -camera.offset[2]
            );

            gl.uniformMatrix4fv(loc, false, cameraMatrix);
        },
        u_camera_inverse: (engine, loc) => {
            const { gl } = engine;
            gl.uniformMatrix4fv(
                loc,
                false,
                engine.computed.inverseCameraMatrix
            );
        },
    },
    dynamicUniforms: {
        u_worldView: (engine, loc, obj) => {
            const { gl } = engine;
            gl.uniformMatrix4fv(loc, false, obj._computed.positionMatrix);
        },
        u_width: (engine, loc, obj) => {
            const { gl } = engine;
            const max = obj._bbox.d * 2;
            gl.uniform1f(loc, Math.abs(max));
        },
        u_height: (engine, loc, obj) => {
            const { gl } = engine;
            const max = obj._bbox.w * 2;
            gl.uniform1f(loc, Math.abs(max));
        },
    },
};
