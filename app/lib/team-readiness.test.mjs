import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMinimumEffectiveHp, minimumRosterEffectiveHp, assessTeamReadiness,
  readinessAdjustedFit, compareTeamReadiness } from './team-readiness.ts';

test('automatic floor follows strongest OWNED context eHP, never total HP', () => {
  assert.equal(minimumRosterEffectiveHp([3.627e12, 129.2e6, 154.5e6]), 544.05e9);
  assert.equal(minimumRosterEffectiveHp([1e9, 5e9], 2e9), 2e9);
  assert.equal(minimumRosterEffectiveHp([1e9, 5e9], 0), 0);
});
test('weak supports are not disguised by a huge team total', () => {
  const result = assessTeamReadiness([3.627e12, 129.2e6, 154.5e6], 544.05e9);
  assert.equal(result.readyCount, 1);
  assert.equal(result.allReady, false);
  assert.ok(result.coverage < .334);
  assert.equal(result.weakestEffectiveHp, 129.2e6);
});
test('a fully ready trio wins even if an unready team has a stronger raw fit', () => {
  const ready = {readiness: assessTeamReadiness([600e9, 700e9, 800e9], 500e9), score: .6};
  const weak = {readiness: assessTeamReadiness([3e12, 100e6, 100e6], 500e9), score: .99};
  assert.ok(compareTeamReadiness(ready, weak) < 0);
  assert.ok(readinessAdjustedFit(.99, weak.readiness) < .5);
});
test('when no eligible trio exists, prefer more ready members and penalize shortfalls', () => {
  const one = {readiness: assessTeamReadiness([1e12, 200e6, 200e6], 100e9), score: .98};
  const two = {readiness: assessTeamReadiness([200e9, 200e9, 200e6], 100e9), score: .5};
  assert.ok(compareTeamReadiness(two, one) < 0);
  assert.ok(two.readiness.coverage > one.readiness.coverage);
});
test('manual minimum supports game-sized suffixes, zero disables floor and bad text is rejected', () => {
  assert.equal(parseMinimumEffectiveHp('500B'), 500e9);
  assert.equal(parseMinimumEffectiveHp('1.5T'), 1.5e12);
  assert.equal(parseMinimumEffectiveHp('3,000,000'), 3e6);
  assert.equal(parseMinimumEffectiveHp('0'), 0);
  assert.equal(parseMinimumEffectiveHp(' '), undefined);
  assert.ok(Number.isNaN(parseMinimumEffectiveHp('oops')));
  assert.ok(Number.isNaN(parseMinimumEffectiveHp('-1')));
});
