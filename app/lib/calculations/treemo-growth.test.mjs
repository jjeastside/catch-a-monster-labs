import test from 'node:test';
import assert from 'node:assert/strict';
import { standardGrowth, standardStatGrowth, dragonCannelloniGrowth } from './growth.ts';
import { GENERATED_MONSTERS } from '../../data/generated/monsters.ts';
const near = (a,b,tol=1e-8) => assert.ok(Math.abs(a-b)<tol, `${a} differs from ${b}`);
const monster = id => GENERATED_MONSTERS.find(m=>m.id===id);

test('Treemo imports as Standard and retains its PvE and PvP Level 1 bases',()=>{
 const treemo = monster('treemo');
 assert.equal(treemo.growthType,'standard');
 assert.equal(treemo.baseDamageELevel1,15.24);
 assert.equal(treemo.baseHealthELevel1,163.1);
 assert.equal(treemo.pvpBaseDamageELevel1,346676);
});

test('Quantized Standard growth is shared across all monsters',()=>{
 near(standardGrowth(1),1);
 near(standardGrowth(10),2.1714);
 near(standardGrowth(65),96.3582);
 near(standardGrowth(66),101.8078);
 for(const id of ['treemo','wattoad','leafet','skedeer'])assert.equal(monster(id).growthType,'standard');
});

test('Level increases use PvE base coefficients floored to multiples of 0.05',()=>{
 const samples=[
  ['treemo',15.2,163.1],['wattoad',10.5,63.05],
  ['leafet',7.25,43.5],['skedeer',67.35,720.95],
 ];
 for(const [id,atkCoefficient,hpCoefficient] of samples){
  const m=monster(id);
  for(const level of [1,2,10,26,50,65,66,85]){
   near(m.baseDamageELevel1*standardStatGrowth(level,m.baseDamageELevel1),m.baseDamageELevel1+atkCoefficient*(standardGrowth(level)-1),1e-6);
   near(m.baseHealthELevel1*standardStatGrowth(level,m.baseHealthELevel1),m.baseHealthELevel1+hpCoefficient*(standardGrowth(level)-1),1e-6);
  }
 }
});

test('PvP growth normalizes by PvE base rather than PvP Level 1 stat',()=>{
 const m=monster('treemo');
 for(const level of [1,10,65,80,115]){
  const expected=m.pvpBaseDamageELevel1*(1+(standardGrowth(level)-1)*15.2/15.24);
  near(m.pvpBaseDamageELevel1*standardStatGrowth(level,m.baseDamageELevel1),expected,1e-4);
 }
});

test('Other special growth types are unchanged',()=>{
 assert.deepEqual(dragonCannelloniGrowth(1),{health:1,damage:1});
 assert.equal(monster('dummee').growthType,'dummee');
 assert.equal(monster('dragon-cannelloni').growthType,'dragon-cannelloni');
});
