import test from 'node:test';
import assert from 'node:assert/strict';
import { dragonCannelloniGrowth, standardGrowth } from './growth.ts';

const baseHealth = 500;
const baseDamage = 40;
// Observed level-1 PvE stats share this calibration factor. This is for
// comparison with the video, NOT a forced multiplier in the calculator.
const observedPveScale = 157.304 / baseDamage;

const observedPveSamples = [
    // [level, displayed damage, displayed health]
    [1, 157.3, 1960],
    [2, 224.55, 2680],
    [10, 813.75, 8990],
    [64, 48990, 524640],
    [65, 53590, 573850],
    [66, 56650, 606530],
    [100, 389620, 4170000],
    [115, 926770, 9910000],
];

test('Dragon Cannelloni retains level-1 base stats and uses independent growth', () => {
    const start = dragonCannelloniGrowth(1);
    assert.deepEqual(start, { health: 1, damage: 1 });
    assert.notEqual(dragonCannelloniGrowth(30).health, dragonCannelloniGrowth(30).damage);
});

test('Dragon Cannelloni uses 10% exponential growth through 65 and 6% afterward', () => {
    for (const level of [1, 2, 65, 66, 115, 120]) {
        const G = 1.1 ** Math.min(level - 1, 64) * 1.06 ** Math.max(level - 65, 0);
        const F = (level - 1) + 2 * (G - 1);
        const actual = dragonCannelloniGrowth(level);
        assert.ok(Math.abs(actual.health - (1 + (599.723 / 1966.3) * F)) < 1e-9);
        assert.ok(Math.abs(actual.damage - (1 + (56.039 / 157.304) * F)) < 1e-9);
    }
});

test('PvE samples fit within 0.4% despite rounded on-screen values', () => {
    for (const [level, observedDamage, observedHealth] of observedPveSamples) {
        const growth = dragonCannelloniGrowth(level);
        const damage = baseDamage * observedPveScale * growth.damage;
        const health = baseHealth * observedPveScale * growth.health;
        assert.ok(Math.abs(damage / observedDamage - 1) < 0.004, `damage level ${level}`);
        assert.ok(Math.abs(health / observedHealth - 1) < 0.004, `health level ${level}`);
    }
});

test('unrelated standard growth remains unchanged', () => {
    assert.equal(standardGrowth(1), 1);
    for (const level of [10, 65, 66, 115]) {
        const G = 1.1 ** Math.min(level - 1, 64) * 1.06 ** Math.max(level - 65, 0);
        assert.ok(Math.abs(standardGrowth(level) - (1 + 0.1 * ((level - 1) + 2 * (G - 1)))) < 1e-9);
    }
});
