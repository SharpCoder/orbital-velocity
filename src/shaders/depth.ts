import { Camera, m4, type ProgramTemplate } from 'webgl-engine';

const depthVertexShader = `
    attribute vec4 a_position;
    uniform mat4 u_worldView;
    uniform mat4 u_projection;
    uniform mat4 u_camera;
    uniform mat4 u_render_camera;

    varying vec4 v_color;

    void main() {
        gl_Position = u_projection * u_camera * u_worldView * a_position;
        vec4 dist = a_position;

        v_color = vec4(0, dist.x / 3000.0, dist.z / 3000.0, 1);
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
            (engine.mousey * gl.canvas.height) / gl.canvas.clientHeight -
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

        engine.debug(`${mx}`);
        engine.debug(`${my}`);
        engine.debug(data.join(', '));

        const cross = data[1] / (200 * 1.5);
        const depth = data[2] / (200 * 1.5);

        engine.properties['cross'] = cross;
        engine.properties['depth'] = depth;
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
        u_projection: (engine, loc) => {
            const { gl } = engine;
            gl.uniformMatrix4fv(loc, false, engine.computed.projectionMatrix);
        },
        u_camera: (engine, loc) => {
            const { gl } = engine;
            gl.uniformMatrix4fv(
                loc,
                false,
                engine.computed.inverseCameraMatrix
            );
        },
        u_render_camera: (engine, loc) => {
            const { gl } = engine;
            const { camera } = engine.activeScene;
            const renderCamera = new Camera({
                position: [...camera.position],
                rotation: [...camera.rotation],
            });
            // renderCamera.offset = [...camera.offset];

            const matrix = m4.inverse(renderCamera.getMatrix());
            gl.uniformMatrix4fv(loc, false, matrix);
        },
    },
    dynamicUniforms: {
        u_worldView: (engine, loc, obj) => {
            const { gl } = engine;
            gl.uniformMatrix4fv(loc, false, obj._computed.positionMatrix);
        },
    },
};
