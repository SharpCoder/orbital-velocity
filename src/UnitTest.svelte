<script lang="ts">
    import { r } from 'webgl-engine';
    import { PhysicsEngine, type Body } from './math/physics';
    let outputEl;
    const logs = [];

    const physicsEngine = new PhysicsEngine();
    const Planet = physicsEngine.addBody({
        mass: 1e26,
        position: [0, 0, 0],
        velocity: [0, 0, 0],
    });

    const Satellite = physicsEngine.addBody({
        mass: 1,
        position: [1500, 0, 0],
        velocity: [0, 10, 20],
    });

    function print(body: Body) {
        logs.push(`Position <${body.position.map((v) => r(v)).join(', ')}>`);
        logs.push(`Velocity <${body.velocity.map((v) => r(v)).join(', ')}>`);

        const params = physicsEngine.keplerianParameters(body);
        for (const param in params) {
            logs.push(`${param} ${r(params[param])}`);
        }
        logs.push(' ---- ');
    }

    // Time step 10 times

    print(Satellite);

    physicsEngine.update(1);

    print(Satellite);

    // Debug output
    $: {
        if (outputEl) {
            outputEl.innerText = logs.join('\n');
        }
    }
</script>

<div bind:this={outputEl} />

<style>
    div {
        color: black;
        font-size: 1.25rem;
    }
</style>
