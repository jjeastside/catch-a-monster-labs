import { test } from 'vitest';
import assert from 'node:assert/strict';
import { calculateTeamSynergy } from './team-synergy.ts';
import { withTeamDungeonLevel, teamForCombatContext } from './team-dungeon-level.ts';
import { GENERATED_MONSTERS } from '../data/generated/monsters.ts';
import { GENERATED_SKILLS } from '../data/generated/skills.ts';

const mkSkill = (id, effects, cooldown = 8) => ({
  id, name: id, element: 'Common', damageInstances: [], cooldown,
  statusEffects: effects,
});
const mkMember = (id, skills = [], extras = {}) => ({
  id, name: id, skills, dps: 100, soloDps: 100,
  effectiveHealth: 1000, soloEffectiveHealth: 1000,
  ...extras,
});
const eff = (type, target, amountPercent, more = {}) => ({
  type, target, amountPercent, durationSeconds: 8, ...more,
});
const score = (result, key) => result.categories.find((x) => x.key === key).score;

test('0 or 1 monster cannot earn team synergy', () => {
  const healer = mkMember('healer', [mkSkill('heal', [eff('healing', 'Team', 30)])]);
  assert.equal(calculateTeamSynergy([]).score, 0);
  assert.equal(calculateTeamSynergy([healer]).score, 0);
});

test('teammate passive lift is measured against the solo result (own power earns nothing)', () => {
  const passiveDonor = mkMember('donor');
  const receiver = mkMember('receiver', [], { dps: 150, effectiveHealth: 1250 });
  const team = calculateTeamSynergy([passiveDonor, receiver]);
  assert.ok(score(team, 'passives') > 0);
  assert.ok(team.categories.find((c) => c.key === 'passives').details.some((d) => d.includes('DPS lift')));
  assert.equal(score(calculateTeamSynergy([mkMember('a'), mkMember('b')]), 'passives'), 0);
});

test('different monsters combine Vulnerability and team damage buff', () => {
  const vul = mkMember('vul', [mkSkill('vul', [eff('vulnerability', 'Enemy', 20)])]);
  const buff = mkMember('buff', [mkSkill('buff', [eff('damageIncrease', 'Team', 25)])]);
  const combined = calculateTeamSynergy([vul, buff]);
  assert.ok(score(combined, 'offense') > 0);
  assert.ok(score(combined, 'combos') > 0);
  assert.equal(score(calculateTeamSynergy([
    mkMember('both', [mkSkill('both', [eff('vulnerability', 'Enemy', 20), eff('damageIncrease', 'Team', 25)])]),
    mkMember('other'),
  ]), 'combos'), 0);
});

test('same-type duplicate effects have diminishing returns and weaker effects score lower', () => {
  const v20 = mkMember('v20', [mkSkill('v20', [eff('vulnerability', 'Enemy', 20)])]);
  const v40 = mkMember('v40', [mkSkill('v40', [eff('vulnerability', 'Enemy', 40)])]);
  const blank = mkMember('blank');
  const basic = score(calculateTeamSynergy([v20, blank]), 'offense');
  assert.ok(score(calculateTeamSynergy([v40, blank]), 'offense') > basic);
  const duplicate = score(calculateTeamSynergy([v20, mkMember('duplicate', [mkSkill('v20b', [eff('vulnerability', 'Enemy', 20)])])]), 'offense');
  assert.ok(duplicate > basic && duplicate < basic * 2);
});

test('unavailable zero-chance effects give no points, while shortening cooldown improves the proxy', () => {
  const blank = mkMember('blank');
  const never = mkMember('never', [mkSkill('never', [eff('shield', 'Team', 20, {chancePercent: 0})])]);
  assert.equal(calculateTeamSynergy([never, blank]).score, 0);
  const slow = mkMember('slow', [mkSkill('slow', [eff('shield', 'Team', 20, {durationSeconds: 2})], 12)]);
  const fast = mkMember('fast', [mkSkill('fast', [eff('shield', 'Team', 20, {durationSeconds: 2})], 3)]);
  assert.ok(score(calculateTeamSynergy([fast, blank]), 'defense') > score(calculateTeamSynergy([slow, blank]), 'defense'));
});

test('self heal gives limited personal sustain; team shield is worth more', () => {
  const self = mkMember('self', [mkSkill('self', [eff('healing', 'Self', 20)])]);
  const shared = mkMember('shared', [mkSkill('shared', [eff('shield', 'Team', 20)])]);
  assert.ok(score(calculateTeamSynergy([self, mkMember('other')]), 'defense') > 0);
  assert.ok(score(calculateTeamSynergy([shared, mkMember('other')]), 'defense') > score(calculateTeamSynergy([self, mkMember('other')]), 'defense'));
});

test('Burn/Poison from ANOTHER monster enables conditional Fragility combo', () => {
  const burner = mkMember('burner', [mkSkill('burn', [eff('burn', 'Enemy', 5)])]);
  const fragility = mkMember('fragility', [], { statusDamagePercent: 50 });
  assert.ok(score(calculateTeamSynergy([burner, fragility]), 'combos') > 0);
  const selfBurner = mkMember('selfBurner', [mkSkill('burn', [eff('burn', 'Enemy', 5)])], { statusDamagePercent: 50 });
  assert.equal(score(calculateTeamSynergy([selfBurner, mkMember('other')]), 'combos'), 0);
});

test('score remains 0–100 and consistent with breakdown', () => {
  const many = Array.from({length: 3}, (_, i) => mkMember(`m${i}`, [mkSkill(`s${i}`, [
    eff('vulnerability', 'Enemy', 100), eff('damageIncrease', 'Team', 100),
    eff('shield', 'Team', 100), eff('healing', 'Team', 100),
    eff('stun', 'Enemy', 0), eff('taunt', 'Enemy', 0), eff('poison', 'Enemy', 20),
  ], 1)], { dps: 10000, effectiveHealth: 100000, statusDamagePercent: 50 }));
  const result = calculateTeamSynergy(many);
  assert.ok(result.score >= 0 && result.score <= 100);
  assert.equal(result.score, Math.round(result.categories.reduce((sum, c) => sum + c.score, 0)));
});


test('conditional on-death ally passive adds limited defensive value', () => {
  const blessing = mkMember('blessing', [], {passives:[{id:'lastBlessing', values:[80], effects:[{stat:'healthRestore', value:80}]}]});
  const result = calculateTeamSynergy([blessing, mkMember('other')]);
  assert.ok(score(result, 'defense') > 0);
  assert.ok(score(result, 'defense') <= 3);
  assert.ok(result.categories.find((c) => c.key === 'defense').details.some((detail) => detail.includes('Last Blessing')));
});


test('unknown percent does not fabricate a buff or shield magnitude', () => {
  const unknown = mkMember('unknown', [mkSkill('unknown', [
    {type:'damageIncrease', target:'Team', durationSeconds:8},
    {type:'shield', target:'Team', durationSeconds:8},
  ])]);
  const result = calculateTeamSynergy([unknown, mkMember('other')]);
  assert.equal(score(result, 'offense'), 0);
  assert.equal(score(result, 'defense'), 0);
});


test('Dungeon locks to 60, leaves equipment alone, and restores the previous level', () => {
  const original = {monsterId:'x',level:110,preDungeonLevel:null,weaponId:'blade',armorId:'armor',inventoryCopyId:'x',mutations:['fairy']};
  const entered = withTeamDungeonLevel(original, true);
  assert.equal(original.level, 110);
  assert.equal(entered.level, 60);
  assert.equal(entered.preDungeonLevel,110);
  assert.equal(entered.weaponId,'blade');
  assert.equal(entered.armorId,'armor');
  assert.equal(entered.inventoryCopyId,'x');
  assert.deepEqual(withTeamDungeonLevel(entered,true), entered);
  const returned = withTeamDungeonLevel(entered,false);
  assert.equal(returned.level,110);
  assert.equal(returned.preDungeonLevel,null);
  assert.equal(returned.weaponId,'blade');
});

test('Dungeon preserves individual level per team member and ignores empty slots', () => {
  const input = [
    {monsterId:'a',level:115,preDungeonLevel:null},
    {monsterId:'b',level:1,preDungeonLevel:null},
    {monsterId:null,level:1,preDungeonLevel:null},
  ];
  const entered = teamForCombatContext(input,'dungeon');
  assert.deepEqual(entered.map((x)=>x.level),[60,60,1]);
  assert.deepEqual(teamForCombatContext(entered,'standard').map((x)=>x.level),[115,1,1]);
  assert.deepEqual(input.map((x)=>x.level),[115,1,1]);
});

test('context-only passive specialization scores only in its active content', () => {
  const trial = mkMember('trial', [], {passives:[{id:'trialPower',effects:[{stat:'dungeonDamage',value:50}]}]});
  const ally = mkMember('ally');
  assert.equal(score(calculateTeamSynergy([trial,ally],'standard'),'passives'),0);
  assert.ok(score(calculateTeamSynergy([trial,ally],'dungeon'),'passives')>0);
  assert.equal(score(calculateTeamSynergy([trial,ally],'boss'),'passives'),0);
});

test('reference team gives substantial credit for vulnerability/stun/self shield and dungeon passives', () => {
  const ids = ['necro-hydra-tortelloni','violetaegis','stellawulf'];
  const members = ids.map((id) => {
    const m=GENERATED_MONSTERS.find((x)=>x.id===id);
    assert.ok(m);
    return mkMember(id,m.skillIds.map((skillId)=>GENERATED_SKILLS[skillId]),{passives:m.passives,dps:id===ids[0]?1502000000000:id===ids[1]?47960000:34020000,soloDps:id===ids[0]?1502000000000:id===ids[1]?47960000:34020000});
  });
  const standard = calculateTeamSynergy(members,'standard');
  const dungeon = calculateTeamSynergy(members,'dungeon');
  assert.ok(standard.score >= 60, `standard score ${standard.score} should reflect real utility`);
  assert.ok(dungeon.score >= 70 && dungeon.score > standard.score, `Dungeon passives should contribute (${standard.score} → ${dungeon.score})`);
  assert.equal(dungeon.score,Math.round(dungeon.categories.reduce((sum,c)=>sum+c.score,0)));
  console.log('Reference team estimated synergy:', standard.score, 'standard,', dungeon.score, 'dungeon');
});
