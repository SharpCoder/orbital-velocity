import './app.css';
import App from './App.svelte';
import { Engine } from 'webgl-engine';
import { UniverseScene } from './scenes/universe';
import type { EngineProperties } from './types';
import gameState from './gameState';

let engine = new Engine<EngineProperties>();
window['gameEngine'] = engine;
engine.settings.zFar = 150000;
engine.properties = {
    freezePhysics: true,
};

// Register the scenes
// engine.addScene(SandboxScene);
engine.addScene(UniverseScene);
gameState.setScene('universe');

function draw() {
    engine.draw();
    requestAnimationFrame(draw.bind(this));
}

function update() {
    engine.update();
    requestAnimationFrame(update.bind(this));
}

draw();
update();

const app = new App({
    target: document.getElementById('app'),
});

export default app;
