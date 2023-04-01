import "./app.css";
import App from "./App.svelte";
import { Engine } from "webgl-engine";
import { MenuScene } from "./scenes/menu";

let engine = new Engine();
window["gameEngine"] = engine;

// Register the scenes
engine.addScene(MenuScene);

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
  target: document.getElementById("app"),
});

export default app;
