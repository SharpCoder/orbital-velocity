import { m4, type ProgramTemplate } from 'webgl-engine';

const defaultSkyboxVertexShader = `
    attribute vec4 a_position;
    varying vec4 v_position;

    void main() {
        v_position = a_position;
        gl_Position = a_position;
        gl_Position.z = 1.0;
    }
`;

const defaultSkyboxFragmentShader = `
    #define LOG2 1.442695

    precision mediump float;
    
    uniform samplerCube u_skybox;
    uniform mat4 u_camera;
    
    varying vec4 v_position;

    void main() {
        vec4 t = u_camera * v_position;
        gl_FragColor = textureCube(u_skybox, normalize(t.xyz / t.w));
    }
`;

const gl = document.createElement('canvas').getContext('webgl');
export const StarboxShader: ProgramTemplate = {
    name: 'skybox',
    order: 999,
    sceneDrawArgs: {
        mode: gl.TRIANGLES,
        count: 6,
        depthFunc: gl.LEQUAL,
    },
    vertexShader: defaultSkyboxVertexShader,
    fragmentShader: defaultSkyboxFragmentShader,
    attributes: {
        a_position: {
            components: 2,
            type: gl.FLOAT,
            normalized: false,
            generateData: () => {
                return new Float32Array([
                    -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
                ]);
            },
        },
    },
    constantUniforms: {
        u_skybox: (engine, loc) => {
            const { gl } = engine;
            const texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

            const targets = [
                {
                    uri: 'textures/starbox.png',
                    target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
                },
                {
                    uri: 'textures/starbox.png',
                    target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
                },
                {
                    uri: 'textures/starbox.png',
                    target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
                },
                {
                    uri: 'textures/starbox.png',
                    target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
                },
                {
                    uri: 'textures/starbox.png',
                    target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
                },
                {
                    uri: 'textures/starbox.png',
                    target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
                },
            ];

            const level = 0;
            const internalFormat = gl.RGBA;
            const width = 512;
            const height = 512;
            const format = gl.RGBA;
            const type = gl.UNSIGNED_BYTE;

            const loaderMap = {};
            const promises = [];
            for (const { uri, target } of targets) {
                if (!loaderMap[uri]) {
                    loaderMap[uri] = true;
                    promises.push(engine.loader.load(uri));
                }

                // Setup a default renderer
                gl.texImage2D(
                    target,
                    level,
                    internalFormat,
                    width,
                    height,
                    0,
                    format,
                    type,
                    null
                );
            }

            Promise.all(promises).then(() => {
                for (const { uri, target } of targets) {
                    const image = engine.loader.fetch(uri);
                    // const texture = gl.createTexture();
                    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
                    gl.texImage2D(
                        target,
                        level,
                        internalFormat,
                        format,
                        type,
                        image
                    );
                    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
                }
            });

            gl.generateMipmap(gl.TEXTURE_CUBE_MAP);

            gl.texParameteri(
                gl.TEXTURE_CUBE_MAP,
                gl.TEXTURE_MIN_FILTER,
                gl.LINEAR_MIPMAP_LINEAR
            );
            gl.uniform1i(loc, 0);
        },
    },
    staticUniforms: {
        u_camera: (engine, loc) => {
            // We only care about direciton so remove the translation
            const { gl } = engine;
            const { camera } = engine.activeScene;
            const viewDirectionMatrix = m4.combine([
                m4.rotateX(-camera.rotation[0]),
                m4.rotateY(-camera.rotation[1]),
            ]);

            gl.uniformMatrix4fv(
                loc,
                false,
                m4.inverse(
                    m4.multiply(
                        engine.computed.projectionMatrix,
                        viewDirectionMatrix
                    )
                )
            );
        },
    },
};
