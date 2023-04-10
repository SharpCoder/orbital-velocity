import './app.css';
import App from './App.svelte';
import { Engine } from 'webgl-engine';
// import { MenuScene } from './scenes/menu';
// import { DrawingScene } from './scenes/drawing';
// import { SandboxScene } from './scenes/sandbox';
// import { MenuScene } from './scenes/menu';
import { UniverseScene } from './scenes/universe';
// import { SimpleScene } from './scenes/simple';
// import { SimplifiedSandbox } from './scenes/simplifiedSandbox';

let engine = new Engine();
window['gameEngine'] = engine;
engine.settings.zFar = 5000;

// Register the scenes
// engine.addScene(SimpleScene);
// engine.addScene(SimplifiedSandbox);
// engine.addScene(SandboxScene);
engine.addScene(UniverseScene);
// engine.addScene(MenuScene);
// engine.addScene(MenuScene);

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
