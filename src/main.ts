import './app.css';
import App from './App.svelte';
import { Engine } from 'webgl-engine';
import { UniverseScene } from './scenes/universe';

let engine = new Engine();
window['gameEngine'] = engine;
engine.settings.zFar = 15000;

// Register the scenes
engine.addScene(UniverseScene);

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
