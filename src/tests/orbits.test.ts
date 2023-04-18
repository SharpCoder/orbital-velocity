import { degs, m3, r } from 'webgl-engine';
import { G, PhysicsEngine } from '../math/physics';

function whole(val: number) {
    return Math.trunc(val);
}

function createPhysicsEngine(mass = 1 / G) {
    const physicsEngine = new PhysicsEngine();
    physicsEngine.addBody({
        position: [0, 0, 0],
        velocity: [0, 0, 0],
        mass,
    });
    return physicsEngine;
}

test('Basic math functions', () => {
    expect(m3.cross([6, 7, 8], [8, 9, 10])).toStrictEqual([-2, 4, -2]);
    expect(m3.dot([1, 2, 3], [2, 3, 4])).toBe(20);
});

test('Basic keplerian elements are derived properly', () => {
    const physicsEngine = createPhysicsEngine();
    const planet = physicsEngine.addBody({
        position: [3000, 0, 0],
        velocity: [10, 10, 10],
        mass: 1,
    });

    const params = physicsEngine.keplerianParameters(planet);
    expect(params.h_vec).toStrictEqual([0, -30000, 30000]);
    expect(params.e_vec).toStrictEqual([5.99999e5, -3e5, -3e5]);
    expect(whole(params.e)).toBe(whole(734846));
    expect(r(degs(params.i))).toBe(45);
    expect(r(degs(params.rightAscensionNode))).toBe(0);
    expect(r(degs(params.argumentOfPeriapsis))).toBe(324.74);
    expect(r(degs(params.nu))).toBe(35.26);
    expect(Math.round(params.a * 10000) / 10000).toBe(-0.0033);
});

test('Keplerian elements are derived properly at aggressive inclination', () => {
    const physicsEngine = createPhysicsEngine();
    const planet = physicsEngine.addBody({
        position: [2500, 100, 0],
        velocity: [0, 20, 40],
        mass: 1,
    });

    const params = physicsEngine.keplerianParameters(planet);
    expect(params.h_vec).toStrictEqual([4000, -1e5, 50000]);
    expect(whole(params.e)).toBe(whole(5003197));
    expect(r(degs(params.i))).toBe(63.45);
    expect(r(degs(params.rightAscensionNode))).toBe(2.29);
    expect(r(degs(params.argumentOfPeriapsis))).toBe(358.98);
    expect(r(degs(params.nu))).toBe(1.02);
    expect(Math.round(params.a * 10000) / 10000).toBe(-0.0005);
});

test('Keplerian elements are derived properly at more weird inclinations', () => {
    const physicsEngine = createPhysicsEngine(1e26);
    const planet = physicsEngine.addBody({
        position: [1500, -500, 1000],
        velocity: [0, 20, 40],
        mass: 1,
    });

    const params = physicsEngine.keplerianParameters(planet);
    expect(r(params.e)).toBe(r(0.54));
    expect(r(params.i)).toBe(1.18);
    expect(r(params.rightAscensionNode)).toBe(5.7);
    expect(r(params.nu)).toBe(2.79);
    expect(r(params.argumentOfPeriapsis)).toBe(4.11);
});
