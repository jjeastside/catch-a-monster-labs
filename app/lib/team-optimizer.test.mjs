import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseUniqueGear, rankTeamCandidates } from './team-optimizer.ts';
const candidate = (id, dps, memberHp, synergy) => ({
  id, totalDps:dps, totalEffectiveHealth:memberHp.reduce((a,b)=>a+b,0),
  weakestEffectiveHp:Math.min(...memberHp), synergyScore:synergy,
});
test('weak supports lower survival-focused ranking without imposing a minimum HP',()=>{
  const flimsy=candidate('flimsy',1e12,[1e12,1e6,1e6],100);
  const viable=candidate('viable',0.8e12,[8e11,8e10,7e10],55);
  assert.equal(rankTeamCandidates([flimsy,viable],'balanced')[0].id,'viable');
  assert.equal(rankTeamCandidates([flimsy,viable],'survivability')[0].id,'viable');
});
test('every goal evaluates the same synergy score, not a second public optimizer rating',()=>{
  const a=candidate('a',1000,[1000,900,800],80);
  const b=candidate('b',1000,[1000,900,800],20);
  for (const goal of ['damage','balanced','survivability','support']) {
    assert.equal(rankTeamCandidates([b,a],goal)[0].id,'a');
  }
});
test('weakest member breaks total-HP illusion without a threshold',()=>{
  const shaky=candidate('shaky',1000,[1e12,501,501],50);
  const evenly=candidate('evenly',1000,[1e12,800,800],50);
  assert.equal(rankTeamCandidates([shaky,evenly],'balanced')[0].id,'evenly');
});
test('damage-led teams may win even when they have a weak teammate',()=>{
  const dps=candidate('dps',2000,[800,1,1],30);
  const tank=candidate('tank',1000,[800,800,800],30);
  assert.equal(rankTeamCandidates([dps,tank],'damage')[0].id,'dps');
});
test('a better DPS and synergy can win with no hidden readiness gate',()=>{
  const one=candidate('one',10000,[1e12,1,1],80);
  const two=candidate('two',10,[500,600,1],10);
  assert.equal(rankTeamCandidates([one,two],'damage')[0].id,'one');
});
test('does not mutate candidate ordering',()=>{
  const a=candidate('a',100,[500,500,500],15), b=candidate('b',200,[500,500,500],20);
  const input=[a,b];rankTeamCandidates(input,'balanced');assert.deepEqual(input,[a,b]);
});


test('unique gear allocation solves a conflict greedy cannot',()=>{
  const choices=[
    {memberIndex:0,copyId:'a',gain:100},{memberIndex:0,copyId:'b',gain:90},
    {memberIndex:1,copyId:'a',gain:99},{memberIndex:1,copyId:'b',gain:1},
    {memberIndex:2,copyId:'c',gain:50},
  ];
  const assigned=chooseUniqueGear(choices,3);
  assert.equal(assigned.reduce((sum,x)=>sum+x.gain,0),239);
  assert.deepEqual(new Set(assigned.map(x=>x.copyId)),new Set(['a','b','c']));
  assert.deepEqual(assigned.map(x=>x.memberIndex).sort(),[0,1,2]);
});
test('gear allocation cannot reuse a copy or force a harmful item',()=>{
  const chosen=chooseUniqueGear([
    {memberIndex:0,copyId:'only',gain:20},
    {memberIndex:1,copyId:'only',gain:10},
    {memberIndex:2,copyId:'bad',gain:-15},
  ],3);
  assert.deepEqual(chosen.map(x=>x.memberIndex),[0]);
});
