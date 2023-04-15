import { DefaultShader, Scene } from 'webgl-engine';
import type { EngineProperties } from '../types';

export const MenuScene = new Scene<EngineProperties>({
    title: 'universe',
    shaders: [DefaultShader],
    init: (engine) => {
        const { camera } = MenuScene;
        engine.settings.fogColor = [0, 0, 0, 1];
    },
    update: () => {},
});
