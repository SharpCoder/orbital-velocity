<script lang="ts">
  import type { Engine } from "webgl-engine";

  let webglCanvas: HTMLCanvasElement;
  const engine: Engine = window["gameEngine"];

  $: {
    if (webglCanvas) {
      engine.setCanvas(webglCanvas);
    }
  }
</script>

<canvas id="canvas" bind:this={webglCanvas} />

<style>
  #canvas {
    width: 100%;
    height: 100%;
  }
</style>
