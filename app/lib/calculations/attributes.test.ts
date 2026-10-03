import { describe, it, expect } from 'vitest';
import { calculateSkillAttributeEffects, getAttributeSlotCount, getFixedAttributeIds } from './attributes';
const build = { weaponId: 'block-buster', armorId: null, weaponAttributeIds: [], armorAttributeIds: [], currentHpPercent: 100 };
describe('CSV gear effects', () => {
 it('does not assume a stun-dependent Rude Awakening proc in baseline DPS', () => {
  const effects = calculateSkillAttributeEffects(build, 'Fire');
  expect(effects.damageDoubleChance).toBe(5);
  expect(effects.expectedDamageMultiplier).toBe(1);
  expect(effects.skillDamageMultiplier).toBe(1);
 });
 it('reads fixed attributes and random slot counts from gear data', () => {
  expect(getFixedAttributeIds('radish-lance')).toEqual(['all-damage-2', 'dominance']);
  expect(getAttributeSlotCount('Mythical', 'radish-lance')).toBe(0);
  expect(getAttributeSlotCount('Secret', 'block-buster')).toBe(2);
  const effects = calculateSkillAttributeEffects({ ...build, weaponId: 'radish-lance', weaponAttributeIds: ['all-damage-2'] }, 'Fire');
  expect(effects.skillDamageMultiplier).toBeCloseTo(1.15 * 1.30);
 });
 it('normalizes Healing Pulse and Earth attributes from CSV', () => {
  const effects = calculateSkillAttributeEffects({ ...build, armorId: 'nectar-heart', weaponAttributeIds: ['earth-damage-3'] }, 'Ground');
  expect(effects.maxHpRegenPerSecond).toBe(1.5);
  expect(effects.skillDamageMultiplier).toBeCloseTo(1.18);
 });
});

import { getTraitPostCastShield } from './traits';
it('Vital Barrier grants 5% of maximum HP after casting', () => {
 expect(getTraitPostCastShield('vital-barrier', 1000000)).toBe(50000);
 expect(getTraitPostCastShield(null, 1000000)).toBe(0);
});

import { getAvailableTraits } from '../../data/traits';
import { getTraitPostCastShieldEffect } from './traits';
it('Vital Barrier appears last and uses a six-second non-stacking shield effect', () => {
 expect(getAvailableTraits().at(-1)?.id).toBe('vital-barrier');
 expect(getTraitPostCastShieldEffect('vital-barrier')).toMatchObject({
  type: 'shield', target: 'Self', amountPercent: 5,
  scaling: 'MaxHealth', durationSeconds: 6, stacks: 1, maxStacks: 1,
 });
 expect(getTraitPostCastShieldEffect(null)).toBeNull();
});

it('Rude Awakening toggle doubles hits without adding another chance multiplier', () => {
 const active = calculateSkillAttributeEffects({ ...build, rudeAwakeningActive: true }, 'Fire');
 expect(active.skillDamageMultiplier).toBe(2);
 expect(active.expectedDamageMultiplier).toBe(1);
 const other = calculateSkillAttributeEffects({ ...build, weaponId: 'bloodrend-claws', rudeAwakeningActive: true }, 'Fire');
 expect(other.skillDamageMultiplier).toBe(1);
 expect(other.rudeAwakeningActive).toBe(false);
});

import { createDefaultBuild } from '../../types/build';
import { encodeBuildForShare, decodeSharedBuildCode } from '../build-sharing';
import { calculateSkillSummary } from './skill-summary';
import type { CalculatedStats } from './stats';
import { monsters } from '../../data/monsters';
import { getSkill } from '../../data/skills';
it('triggered damage reaches skill results and survives share-code round trips', () => {
 const monster = monsters.find((monster) => monster.skillIds.some((id) => (getSkill(id)?.damageInstances.length ?? 0) > 0))!;
 const skill = monster.skillIds.map(getSkill).find((skill) => skill && skill.damageInstances.length > 0)!;
 const base = { ...createDefaultBuild({ monsterId: monster.id }), weaponId: 'block-buster' };
 const stats = { damage: 100, health: 1000, critMultiplier: 2, critChance: 10, accountRiftDamageMultiplier: 1 } as CalculatedStats;
 const inactive = calculateSkillSummary(monster, skill, stats, base, []);
 const activeBuild = { ...base, rudeAwakeningActive: true };
 const active = calculateSkillSummary(monster, skill, stats, activeBuild, []);
 expect(active.normalDamage).toBe(inactive.normalDamage! * 2);
 expect(active.criticalDamage).toBe(inactive.criticalDamage! * 2);
 if (inactive.dps !== null) expect(active.dps).toBeCloseTo(inactive.dps * 2);
 const restored = decodeSharedBuildCode(encodeBuildForShare(activeBuild));
 expect(restored?.rudeAwakeningActive).toBe(true);
 expect(restored?.weaponId).toBe('block-buster');
});

it('Block Buster baseline skill DPS excludes its situational proc', () => {
 const monster = monsters.find((monster) => monster.skillIds.some((id) => (getSkill(id)?.damageInstances.length ?? 0) > 0))!;
 const skill = monster.skillIds.map(getSkill).find((skill) => skill && skill.damageInstances.length > 0)!;
 const base = { ...createDefaultBuild({ monsterId: monster.id }) };
 const stats = { damage: 100, health: 1000, critMultiplier: 2, critChance: 10, accountRiftDamageMultiplier: 1 } as CalculatedStats;
 const noProc = calculateSkillSummary(monster, skill, stats, base, []);
 const blockBuster = calculateSkillSummary(monster, skill, stats, { ...base, weaponId: 'block-buster' }, []);
 expect(blockBuster.normalDamage).toBe(noProc.normalDamage);
 expect(blockBuster.dps).toBe(noProc.dps);
});
