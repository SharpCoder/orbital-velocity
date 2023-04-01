import { DefaultShader, Scene } from "webgl-engine";

export const MenuScene = new Scene({
  title: "menu",
  shaders: [DefaultShader],
  init: (engine) => {
    engine.settings.fogColor = [1, 1, 1, 1];
  },
  update: () => {},
});
