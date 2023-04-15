import { DefaultShader, Scene } from 'webgl-engine';
import { useTouchCamera } from '../logic/useTouchCamera';
import { StarboxShader } from '../shaders/starbox';
import type { EngineProperties } from '../types';

export const SandboxScene = new Scene<EngineProperties>({
    title: 'universe',
    shaders: [DefaultShader, StarboxShader],
    init: (engine) => {
        const { camera } = SandboxScene;
        engine.settings.fogColor = [0, 0, 0, 1];
    },
    update: (time, engine) => {
        const { camera } = engine.activeScene;
        useTouchCamera(engine);
    },
    status: 'initializing',
});
