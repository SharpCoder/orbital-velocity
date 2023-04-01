import {
  cuboid,
  cuboidNormals,
  DefaultShader,
  Flatten,
  loadModel,
  rads,
  Repeat,
  Scene,
  Vec3,
} from "webgl-engine";

export const MenuScene = new Scene({
  title: "menu",
  shaders: [DefaultShader],
  init: (engine) => {
    const { camera } = engine.activeScene;
    engine.settings.fogColor = [1, 1, 1, 1];
    camera.setPosition(0, 0, 200);
  },
  update: () => {},
  status: "initializing",
});

fetch("models/ball.obj")
  .then((resp) => resp.blob())
  .then(async (blob) => {
    const model = await loadModel(blob, "obj");
    const colors = Flatten(Repeat(Vec3(0, 0, 0), model.vertexes.length));
    const scale = 20;

    MenuScene.addObject({
      vertexes: model.vertexes,
      normals: model.normals,
      offsets: [0, 0, 0],
      position: [0, 0, 0],
      scale: [scale, scale, scale],
      rotation: [0, 0, 0],
      properties: {
        rx: Math.random() * rads(0.5),
        ry: Math.random() * rads(0.5),
      },
      update: function (t) {
        this.rotation[0] += t * this.properties.rx;
        this.rotation[1] += t * this.properties.ry;
      },
      colors,
    });

    MenuScene.status = "ready";
  });
