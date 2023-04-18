import { DefaultShader, Scene } from 'webgl-engine';
import { StarboxShader } from '../shaders/starbox';
import type { EngineProperties } from '../types';

export const MapScene = new Scene<EngineProperties>({
    title: 'map',
    shaders: [DefaultShader, StarboxShader],
    init: (engine) => {
        const { camera } = MapScene;
        engine.settings.fogColor = [0, 0, 0, 1];
    },
    update: (time, engine) => {
        const { camera } = engine.activeScene;
    },
    status: 'initializing',
});
