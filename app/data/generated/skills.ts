// Generated from app/data-source/*.csv by app/scripts/import-csv.mjs. Do not edit manually.
import type { Skill } from "../../types/skill";

export const GENERATED_SKILLS = {
  "air-bullet": {
    "id": "air-bullet",
    "name": "Air Bullet",
    "element": "Common",
    "description": "Fires an air bullet forward.",
    "damageInstances": [
      {
        "multiplier": 1.2,
        "hits": 1
      }
    ],
    "cooldown": 3,
    "notes": "Target: Enemy.",
    "validationStatus": "Ready"
  },
  "bale-breath": {
    "id": "bale-breath",
    "name": "Bale Breath",
    "element": "Fire",
    "description": "Sprays a stream of balefire forward, increasing attack and damaging enemies in front.",
    "damageInstances": [
      {
        "multiplier": 0.4,
        "hits": 4
      }
    ],
    "cooldown": 8,
    "statusEffects": [
      {
        "type": "damageIncrease",
        "target": "Team",
        "amountPercent": 50,
        "durationSeconds": 4
      }
    ],
    "notes": "Target: Enemy | Allies. Ally effects: 50% Team Damage for 4 secs",
    "validationStatus": "Ready"
  },
  "barrier": {
    "id": "barrier",
    "name": "Barrier",
    "element": "Common",
    "description": "Forms a protective shield around all pets.(No stack)",
    "damageInstances": [],
    "cooldown": 6,
    "statusEffects": [
      {
        "type": "shield",
        "target": "Team",
        "amountPercent": 25,
        "scaling": "MaxHealth",
        "durationSeconds": 5
      }
    ],
    "notes": "Target: Allies. Ally effects: 25% of Max HP Team shield for 5 secs",
    "validationStatus": "Ready"
  },
  "blaze-blast": {
    "id": "blaze-blast",
    "name": "Blaze Blast",
    "element": "Fire",
    "description": "Bursts flames around the caster, granting a shield and damaging nearby enemies.",
    "damageInstances": [
      {
        "multiplier": 1.5,
        "hits": 1
      }
    ],
    "cooldown": 8,
    "statusEffects": [
      {
        "type": "shield",
        "target": "Self",
        "amountPercent": 15,
        "scaling": "MaxHealth",
        "durationSeconds": 5
      }
    ],
    "notes": "Target: Self. Ally effects: 15% of Max HP for Self shield 5 secs",
    "validationStatus": "Ready"
  },
  "bloodthirsty-aura": {
    "id": "bloodthirsty-aura",
    "name": "Bloodthirsty Aura",
    "element": "Common",
    "description": "Releases a bloodthirsty aura that shields and strengthens all pets. (No stack)",
    "damageInstances": [],
    "cooldown": 8,
    "statusEffects": [
      {
        "type": "damageIncrease",
        "target": "Team",
        "amountPercent": 25,
        "durationSeconds": 6
      },
      {
        "type": "shield",
        "target": "Team",
        "amountPercent": 15,
        "scaling": "MaxHealth",
        "durationSeconds": 6
      }
    ],
    "notes": "Target: Allies. Ally effects: 15% of Max HP Team shield; 25% Team Damage for 6 secs",
    "validationStatus": "Ready"
  },
  "candy-bomb": {
    "id": "candy-bomb",
    "name": "Candy Bomb",
    "element": "Common",
    "description": "Throws a candy at the enemy.",
    "damageInstances": [
      {
        "multiplier": 1.2,
        "hits": 1
      }
    ],
    "cooldown": 6,
    "notes": "Target: Enemy.",
    "validationStatus": "Ready"
  },
  "charming-wind": {
    "id": "charming-wind",
    "name": "Charming Wind",
    "element": "Common",
    "description": "Blows a charming wind that confuses its targets.",
    "damageInstances": [
      {
        "multiplier": 1.2,
        "hits": 1
      }
    ],
    "cooldown": 6,
    "statusEffects": [
      {
        "type": "stun",
        "target": "Enemy",
        "durationSeconds": 2
      }
    ],
    "notes": "Target: Enemy. Enemy effects: Stun 2 secs",
    "validationStatus": "Ready"
  },
  "claw-attack": {
    "id": "claw-attack",
    "name": "Claw Attack",
    "element": "Common",
    "description": "Delivers two forward claw strikes.",
    "damageInstances": [
      {
        "multiplier": 0.6,
        "hits": 2
      }
    ],
    "cooldown": 3,
    "notes": "Target: Enemy.",
    "validationStatus": "Ready"
  },
  "crimson-burst": {
    "id": "crimson-burst",
    "name": "Crimson Burst",
    "element": "Common",
    "description": "Bursts fire from beneath the earth, scorching all nearby enemies.",
    "damageInstances": [
      {
        "multiplier": 0.2,
        "hits": 11
      }
    ],
    "cooldown": 8,
    "statusEffects": [
      {
        "type": "stun",
        "target": "Enemy",
        "durationSeconds": 1.5
      }
    ],
    "notes": "Target: Enemy. Enemy effects: Stun 1.5 secs; Stagger",
    "validationStatus": "Ready"
  },
  "dark-singularity": {
    "id": "dark-singularity",
    "name": "Dark Singularity",
    "element": "Dark",
    "description": "Creates a dark singularity that damages nearby enemies and reduces their Attack (15-25%) for a short duration.",
    "damageInstances": [
      {
        "multiplier": 1.2,
        "hits": 2
      }
    ],
    "cooldown": 6,
    "statusEffects": [
      {
        "type": "damageDecrease",
        "target": "Enemy",
        "amountPercent": 15,
        "maxAmountPercent": 25,
        "durationSeconds": 10
      }
    ],
    "notes": "Target: Enemy. Enemy effects: -15% to -25% damage  for 10 secs",
    "validationStatus": "Ready"
  },
  "dash": {
    "id": "dash",
    "name": "Dash",
    "element": "Common",
    "description": "Gains 95% damage reduction, dashes forward rapidly, damaging and knocking back enemies in the way.",
    "damageInstances": [
      {
        "multiplier": 1.2,
        "hits": 1
      }
    ],
    "cooldown": 8,
    "statusEffects": [
      {
        "type": "damageReduction",
        "target": "Self",
        "amountPercent": 95,
        "durationSeconds": 2
      },
      {
        "type": "knockback",
        "target": "Enemy"
      }
    ],
    "notes": "Target: Enemy | Self. Enemy effects: 95% damage reduction 2 secs + knockback",
    "validationStatus": "Ready"
  },
  "deadly-sonic-wave": {
    "id": "deadly-sonic-wave",
    "name": "Deadly Sonic Wave",
    "element": "Dark",
    "description": "Beats a drum to emit continuous sonic waves that damage and stun surrounding enemies.",
    "damageInstances": [
      {
        "multiplier": 1.2,
        "hits": 2
      }
    ],
    "cooldown": 8,
    "statusEffects": [
      {
        "type": "stun",
        "target": "Enemy",
        "durationSeconds": 2
      }
    ],
    "notes": "Target: Enemy. Enemy effects: Stun 2 secs",
    "validationStatus": "Ready"
  },
  "demonic-lullaby": {
    "id": "demonic-lullaby",
    "name": "Demonic Lullaby",
    "element": "Dark",
    "description": "Releases hypnotic sonic waves, stunning nearby enemies and dealing damage to them.",
    "damageInstances": [
      {
        "multiplier": 0.2,
        "hits": 5
      }
    ],
    "cooldown": 6,
    "statusEffects": [
      {
        "type": "stun",
        "target": "Enemy",
        "durationSeconds": 2
      }
    ],
    "notes": "Target: Enemy. Enemy effects: Stun 2 secs",
    "validationStatus": "Ready"
  },
  "divine-energy-blast": {
    "id": "divine-energy-blast",
    "name": "Divine Energy Blast",
    "element": "Electric",
    "description": "Grants 90% damage reduction for 3s, then gathers energy in front of itself to form an energy orb that strikes and stuns enemies within range.",
    "damageInstances": [
      {
        "multiplier": 3.5,
        "hits": 1
      }
    ],
    "cooldown": 6,
    "statusEffects": [
      {
        "type": "damageReduction",
        "target": "Self",
        "amountPercent": 90,
        "durationSeconds": 3
      },
      {
        "type": "stun",
        "target": "Enemy",
        "durationSeconds": 2
      }
    ],
    "notes": "Target: Enemy | Self. Enemy effects: Stun 2 secs Ally effects: 90% damage reduction 3 secs self",
    "validationStatus": "Ready"
  },
  "dragons-breath": {
    "id": "dragons-breath",
    "name": "Dragon's Breath",
    "element": "Fire",
    "description": "Spry flames continuously forward.",
    "damageInstances": [
      {
        "multiplier": 0.4,
        "hits": 3
      }
    ],
    "cooldown": 6,
    "notes": "Target: Enemy.",
    "validationStatus": "Ready"
  },
  "dragons-breath-ghost": {
    "id": "dragons-breath-ghost",
    "name": "Dragon's Breath (Ghost)",
    "element": "Fire",
    "description": "Spry flames continuously forward.",
    "damageInstances": [
      {
        "multiplier": 0.4,
        "hits": 3
      }
    ],
    "cooldown": 6,
    "notes": "Target: Enemy.",
    "validationStatus": "Ready"
  },
  "dragons-rage": {
    "id": "dragons-rage",
    "name": "Dragon's Rage",
    "element": "Dragon",
    "description": "Sacrifices 40% of the it's own HP to deal 500% Attack damage to the enemy.",
    "damageInstances": [
      {
        "multiplier": 5,
        "hits": 1
      }
    ],
    "cooldown": 3,
    "notes": "Target: Enemy | Self. Ally effects: Sacrifices 40% of Max HP each attack",
    "validationStatus": "Ready"
  },
  "earth-smash": {
    "id": "earth-smash",
    "name": "Earth Smash",
    "element": "Ground",
    "description": "Smashes the ground, launching and damaging all nearby enemies.",
    "damageInstances": [
      {
        "multiplier": 1.2,
        "hits": 1
      }
    ],
    "cooldown": 8,
    "notes": "Target: Enemy.",
    "validationStatus": "Ready"
  },
  "earth-shatter": {
    "id": "earth-shatter",
    "name": "Earthshatter",
    "element": "Ground",
    "description": "Smashes the ground, damaging all nearby enemies, knocking back nearby enemies and stunning them.",
    "damageInstances": [
      {
        "multiplier": 2,
        "hits": 1
      }
    ],
    "cooldown": 8,
    "statusEffects": [
      {
        "type": "stun",
        "target": "Enemy",
        "durationSeconds": 2
      },
      {
        "type": "knockback",
        "target": "Enemy"
      }
    ],
    "notes": "Target: Enemy. Enemy effects: Knockback + Stun for 2 Second",
    "validationStatus": ""
  },
  "egg-blast": {
    "id": "egg-blast",
    "name": "Egg Blast",
    "element": "Common",
    "description": "Throw an Easter egg and gain one random effect. (All effects can appear!)",
    "damageInstances": [
      {
        "multiplier": 1.5,
        "hits": 1
      }
    ],
    "cooldown": 3,
    "statusEffects": [
      {
        "type": "damageIncrease",
        "target": "Self",
        "amountPercent": 25,
        "durationSeconds": 2,
        "condition": "Random Egg Blast result"
      },
      {
        "type": "damageIncrease",
        "target": "Self",
        "amountPercent": 50,
        "durationSeconds": 2,
        "condition": "Random Egg Blast result"
      },
      {
        "type": "damageIncrease",
        "target": "Self",
        "amountPercent": 100,
        "durationSeconds": 2,
        "condition": "Random Egg Blast result"
      },
      {
        "type": "vulnerability",
        "target": "Self",
        "amountPercent": 20,
        "durationSeconds": 2,
        "condition": "Random Egg Blast result"
      },
      {
        "type": "damageReduction",
        "target": "Self",
        "amountPercent": 95,
        "durationSeconds": 2,
        "condition": "Random Egg Blast result"
      },
      {
        "type": "damageReflection",
        "target": "Self",
        "amountPercent": 60,
        "durationSeconds": 2,
        "condition": "Random Egg Blast result"
      },
      {
        "type": "shield",
        "target": "Self",
        "amountPercent": 25,
        "scaling": "MaxHealth",
        "durationSeconds": 2,
        "condition": "Random Egg Blast result"
      },
      {
        "type": "shield",
        "target": "Self",
        "amountPercent": 50,
        "scaling": "MaxHealth",
        "durationSeconds": 2,
        "condition": "Random Egg Blast result"
      }
    ],
    "notes": "Target: Enemy | Self. Ally effects: Chance for one of the following to activate:; 20% vulnerability on self for 2 secs; 25% self damage for 2 secs; 50% self damage for 2 secs; 100% self damage for 2 secs; 25% Max Hp self shield for 2 secs; 50% Max Hp self shield for 2 secs; 60% Damage reflection for 2 secs; 95% Damage reduction for 2 secs",
    "validationStatus": "Ready"
  },
  "electric-beam": {
    "id": "electric-beam",
    "name": "Electric Beam",
    "element": "Common",
    "description": "Sprays an Electric Beam forward, damaging enemies in front.",
    "damageInstances": [
      {
        "multiplier": 0.25,
        "hits": 5
      }
    ],
    "cooldown": 8,
    "notes": "Target: Enemy.",
    "validationStatus": "Ready"
  },
  "electro-nova": {
    "id": "electro-nova",
    "name": "Electro Nova",
    "element": "Electric",
    "description": "Releases an electric ring around, stunning and knocking back nearby enemies.",
    "damageInstances": [
      {
        "multiplier": 1.2,
        "hits": 1
      }
    ],
    "cooldown": 6,
    "statusEffects": [
      {
        "type": "stun",
        "target": "Enemy",
        "durationSeconds": 2
      }
    ],
    "notes": "Target: Enemy. Enemy effects: Stun 2 secs",
    "validationStatus": "Ready"
  },
  "emergency-thorn-shield": {
    "id": "emergency-thorn-shield",
    "name": "Emergency Thorn Shield",
    "element": "Common",
    "description": "Quickly restores 20% HP and grants a Thorn Shield for a short time, reflects damage to attackers.",
    "damageInstances": [],
    "cooldown": 8,
    "statusEffects": [
      {
        "type": "healing",
        "target": "Self",
        "amountPercent": 20,
        "scaling": "MaxHealth"
      }
    ],
    "notes": "Target: Self. Ally effects: 60% self Damage reflection for 2 secs; 20% of Max Health self heal",
    "validationStatus": "Ready"
  },
  "ex-air-bullet": {
    "id": "ex-air-bullet",
    "name": "Ex Air Bullet",
    "element": "Common",
    "description": "Cast four air bullet at the enemy.",
    "damageInstances": [
      {
        "multiplier": 0.3,
        "hits": 4
      }
    ],
    "cooldown": 6,
    "notes": "Target: Enemy.",
    "validationStatus": "Ready"
  },
  "ex-candy-bomb": {
    "id": "ex-candy-bomb",
    "name": "Ex Candy Bomb",
    "element": "Common",
    "description": "Cast several candies at the enemy.",
    "damageInstances": [
      {
        "multiplier": 0.3,
        "hits": 4
      }
    ],
    "cooldown": 6,
    "notes": "Target: Enemy.",
    "validationStatus": "Ready"
  },
  "ex-fireball": {
    "id": "ex-fireball",
    "name": "Ex Fireball",
    "element": "Fire",
    "description": "Casts four fireballs at the enemy and boosts self Attack.",
    "damageInstances": [
      {
        "multiplier": 0.3,
        "hits": 4
      }
    ],
    "cooldown": 6,
    "statusEffects": [
      {
        "type": "damageIncrease",
        "target": "Self",
        "amountPercent": 25,
        "durationSeconds": 6
      }
    ],
    "notes": "Target: Enemy | Self. Ally effects: 25% self Damage for 6 secs",
    "validationStatus": "Ready"
  },
  "ex-gift-delivery": {
    "id": "ex-gift-delivery",
    "name": "Ex Gift Delivery",
    "element": "Common",
    "description": "Cast several gifts at the enemy.",
    "damageInstances": [
      {
        "multiplier": 0.7,
        "hits": 3
      }
    ],
    "cooldown": 8,
    "notes": "Target: Enemy.",
    "validationStatus": "Ready"
  },
  "ex-ice-surge": {
    "id": "ex-ice-surge",
    "name": "Ex Ice Surge",
    "element": "Ice",
    "description": "Gathers icy energy to strike and applies vulnerable to enemies. ",
    "damageInstances": [
      {
        "multiplier": 0.2,
        "hits": 5
      }
    ],
    "cooldown": 6,
    "statusEffects": [
      {
        "type": "vulnerability",
        "target": "Enemy",
        "amountPercent": 20,
        "durationSeconds": 10
      }
    ],
    "notes": "Target: Enemy. Enemy effects: Vulnerability (20%) incoming damage for 10 secs",
    "validationStatus": "Ready"
  },
  "ex-iceball": {
    "id": "ex-iceball",
    "name": "Ex Iceball",
    "element": "Ice",
    "description": "Cast four iceball at the enemy.",
    "damageInstances": [
      {
        "multiplier": 0.3,
        "hits": 4
      }
    ],
    "cooldown": 6,
    "notes": "Target: Enemy.",
    "validationStatus": "Ready"
  },
  "ex-rock-toss": {
    "id": "ex-rock-toss",
    "name": "Ex Rock Toss",
    "element": "Ground",
    "description": "Cast several Rocks at the enemy.",
    "damageInstances": [
      {
        "multiplier": 0.5,
        "hits": 4
      }
    ],
    "cooldown": 6,
    "notes": "Target: Enemy.",
    "validationStatus": "Ready"
  },
  "ex-seed-grenade": {
    "id": "ex-seed-grenade",
    "name": "Ex Seed Grenade",
    "element": "Grass",
    "description": "Launches three explosive seed.",
    "damageInstances": [
      {
        "multiplier": 1.2,
        "hits": 3
      }
    ],
    "cooldown": 3,
    "notes": "Target: Enemy.",
    "validationStatus": "Ready"
  },
  "ex-water-jet": {
    "id": "ex-water-jet",
    "name": "Ex Water Jet",
    "element": "Water",
    "description": "Cast four water jet at the enemy.",
    "damageInstances": [
      {
        "multiplier": 1.2,
        "hits": 4
      }
    ],
    "cooldown": 6,
    "notes": "Target: Enemy.",
    "validationStatus": "Ready"
  },
  "ex-water-shuriken": {
    "id": "ex-water-shuriken",
    "name": "Ex Water Shuriken",
    "element": "Water",
    "description": "Casts four water shurikens at the enemy.",
    "damageInstances": [
      {
        "multiplier": 0.3,
        "hits": 4
      }
    ],
    "cooldown": 6,
    "notes": "Target: Enemy.",
    "validationStatus": "Ready"
  },
  "fear-taunt": {
    "id": "fear-taunt",
    "name": "Fear Taunt",
    "element": "Common",
    "description": "Reduces the target's Attack and forces all nearby enemies to target the pet for a short duration.",
    "damageInstances": [
      {
        "multiplier": 0.5,
        "hits": 1
      }
    ],
    "cooldown": 8,
    "statusEffects": [
      {
        "type": "damageDecrease",
        "target": "Enemy",
        "amountPercent": 15,
        "durationSeconds": 10
      },
      {
        "type": "taunt",
        "target": "Enemy",
        "durationSeconds": 2
      }
    ],
    "notes": "Target: Enemy. Enemy effects: Taunt 2 secs; -15% damage 10 secs",
    "validationStatus": "Ready"
  },
  "fire-dash": {
    "id": "fire-dash",
    "name": "Fire Dash",
    "element": "Fire",
    "description": "Gains 95% damage reduction, dashes forward rapidly, damaging and knocking back enemies in the way.",
    "damageInstances": [
      {
        "multiplier": 1.2,
        "hits": 1
      }
    ],
    "cooldown": 8,
    "statusEffects": [
      {
        "type": "damageReduction",
        "target": "Self",
        "amountPercent": 95,
        "durationSeconds": 2
      },
      {
        "type": "knockback",
        "target": "Enemy"
      }
    ],
    "notes": "Target: Enemy | Self. Enemy effects: 95% damage reduction 2 secs + knockback",
    "validationStatus": "Ready"
  },
  "fire-dash-oblivion-drake": {
    "id": "fire-dash-oblivion-drake",
    "name": "Fire Dash (Oblivion Drake)",
    "element": "Fire",
    "description": "Gains 95% damage reduction, dashes forward rapidly, damaging and knocking back enemies in the way.",
    "damageInstances": [
      {
        "multiplier": 2,
        "hits": 1
      }
    ],
    "cooldown": 8,
    "statusEffects": [
      {
        "type": "damageReduction",
        "target": "Self",
        "amountPercent": 95,
        "durationSeconds": 2
      },
      {
        "type": "knockback",
        "target": "Enemy"
      }
    ],
    "notes": "Target: Enemy | Self. Enemy effects: 95% damage reduction 2 secs + knockback",
    "validationStatus": ""
  },
  "fire-dragon-flame-blast": {
    "id": "fire-dragon-flame-blast",
    "name": "Fire Dragon Flame Blast",
    "element": "Fire",
    "description": "Casts a Fire Dragon at the enemy.",
    "damageInstances": [
      {
        "multiplier": 2.5,
        "hits": 1
      }
    ],
    "cooldown": 6,
    "statusEffects": [
      {
        "type": "knockback",
        "target": "Enemy"
      }
    ],
    "notes": "Target: Enemy. Enemy effects: Knockback",
    "validationStatus": "Ready"
  },
  "fire-tornado": {
    "id": "fire-tornado",
    "name": "Fire Tornado",
    "element": "Fire",
    "description": "Hurls a fire tornado through the enemy.",
    "damageInstances": [
      {
        "multiplier": 1.8,
        "hits": 1
      }
    ],
    "cooldown": 6,
    "statusEffects": [
      {
        "type": "knockback",
        "target": "Enemy"
      }
    ],
    "notes": "Target: Enemy. Enemy effects: Knockback",
    "validationStatus": "Ready"
  },
  "fireball": {
    "id": "fireball",
    "name": "Fireball",
    "element": "Fire",
    "description": "Casts a fireball at the enemy",
    "damageInstances": [
      {
        "multiplier": 1.2,
        "hits": 1
      }
    ],
    "cooldown": 3,
    "notes": "Target: Enemy.",
    "validationStatus": "Ready"
  },
  "fireball-ghost": {
    "id": "fireball-ghost",
    "name": "Fireball (Ghost)",
    "element": "Fire",
    "description": "Casts a ghostly fireball at the enemy.",
    "damageInstances": [
      {
        "multiplier": 1.2,
        "hits": 1
      }
    ],
    "cooldown": 3,
    "notes": "Target: Enemy.",
    "validationStatus": "Ready"
  },
  "firecracker-pop": {
    "id": "firecracker-pop",
    "name": "Firecracker Pop",
    "element": "Fire",
    "description": "Cast several Firecrackers at the enemy",
    "damageInstances": [
      {
        "multiplier": 0.3,
        "hits": 4
      }
    ],
    "cooldown": 6,
    "notes": "Target: Enemy.",
    "validationStatus": "Ready"
  },
  "flame-breath": {
    "id": "flame-breath",
    "name": "Flame Breath",
    "element": "Fire",
    "description": "Fires a scorching flame breath, damaging enemies in front.",
    "damageInstances": [
      {
        "multiplier": 0.4,
        "hits": 5
      }
    ],
    "cooldown": 8,
    "notes": "Target: Enemy. Enemy effects: Stagger",
    "validationStatus": "Ready"
  },
  "flame-detonation": {
    "id": "flame-detonation",
    "name": "Flame Detonation",
    "element": "Fire",
    "description": "Summons a lingering fireball that deals continuous damage to nearby enemies.",
    "damageInstances": [
      {
        "multiplier": 0.2,
        "hits": 7
      },
      {
        "multiplier": 1.5,
        "hits": 1
      }
    ],
    "cooldown": 8,
    "notes": "Target: Enemy.",
    "validationStatus": ""
  },
  "flame-jet": {
    "id": "flame-jet",
    "name": "Flame Jet",
    "element": "Fire",
    "description": "Blasts a focused flame jet forward, damaging enemies in its path.",
    "damageInstances": [
      {
        "multiplier": 0.4,
        "hits": 5
      }
    ],
    "cooldown": 8,
    "notes": "Target: Enemy. Enemy effects: Stagger",
    "validationStatus": "Ready"
  },
  "frost-beam": {
    "id": "frost-beam",
    "name": "Frost Beam",
    "element": "Ice",
    "description": "Sprays an ice Beam forward, damaging enemies in front.",
    "damageInstances": [
      {
        "multiplier": 0.4,
        "hits": 5
      }
    ],
    "cooldown": 8,
    "notes": "Target: Enemy. Enemy effects: Stagger",
    "validationStatus": "Ready"
  },
  "frost-breath": {
    "id": "frost-breath",
    "name": "Frost Breath",
    "element": "Ice",
    "description": "Fires a freezing atomic beam, damaging enemies in front.",
    "damageInstances": [
      {
        "multiplier": 0.4,
        "hits": 5
      }
    ],
    "cooldown": 8,
    "notes": "Target: Enemy.",
    "validationStatus": "Ready"
  },
  "frosty-dart": {
    "id": "frosty-dart",
    "name": "Frosty Dart",
    "element": "Ice",
    "description": "Casts an iceball at the enemy.",
    "damageInstances": [
      {
        "multiplier": 1.2,
        "hits": 1
      }
    ],
    "cooldown": 3,
    "notes": "Target: Enemy.",
    "validationStatus": "Ready"
  },
  "frozen-nova": {
    "id": "frozen-nova",
    "name": "Frozen Nova",
    "element": "Ice",
    "description": "Unleash a fan of ice spikes forward, stuns and slows enemies in the area.",
    "damageInstances": [
      {
        "multiplier": 1.2,
        "hits": 1
      }
    ],
    "cooldown": 8,
    "statusEffects": [
      {
        "type": "stun",
        "target": "Enemy",
        "durationSeconds": 1
      }
    ],
    "notes": "Target: Enemy. Enemy effects: Stun 1 secs",
    "validationStatus": "Ready"
  },
  "galecut": {
    "id": "galecut",
    "name": "Galecut",
    "element": "Grass",
    "description": "Launch several wind blades, slash enemies along the path.",
    "damageInstances": [
      {
        "multiplier": 1,
        "hits": 1
      }
    ],
    "cooldown": 3,
    "notes": "Target: Enemy.",
    "validationStatus": "Ready"
  },
  "galemoon-blade": {
    "id": "galemoon-blade",
    "name": "GaleMoon Blade",
    "element": "Common",
    "description": "Unleashes four wave slash forward, gains shield and inflicts vulnerability on enemies hit.",
    "damageInstances": [
      {
        "multiplier": 0.4,
        "hits": 4
      }
    ],
    "cooldown": 8,
    "statusEffects": [
      {
        "type": "vulnerability",
        "target": "Enemy",
        "amountPercent": 20,
        "durationSeconds": 10
      },
      {
        "type": "shield",
        "target": "Team",
        "amountPercent": 16.67,
        "durationSeconds": 6
      }
    ],
    "notes": "Target: Enemy | Allies. Enemy effects: Vulnerability (20%) incoming damage for 10 secs; Stagger. Ally effects: 16.67% Team Shield for 6 secs.",
    "validationStatus": "Ready"
  },
  "ghost-fireball": {
    "id": "ghost-fireball",
    "name": "Ghost Fireball",
    "element": "Fire",
    "description": "Casts four Netherfire balls at the enemy, and applies vulnerable to the enemy.",
    "damageInstances": [
      {
        "multiplier": 0.3,
        "hits": 4
      }
    ],
    "cooldown": 6,
    "statusEffects": [
      {
        "type": "vulnerability",
        "target": "Enemy",
        "amountPercent": 20,
        "durationSeconds": 10
      }
    ],
    "notes": "Target: Enemy. Enemy effects: Vulnerability (20%) incoming damage for 10 secs",
    "validationStatus": "Ready"
  },
  "ghost-impact": {
    "id": "ghost-impact",
    "name": "Ghost Impact",
    "element": "Dark",
    "description": "Unleash Soul Impact, increasing the attack of all Pets and damaging nearby enemies.",
    "damageInstances": [
      {
        "multiplier": 0.2,
        "hits": 4
      }
    ],
    "cooldown": 6,
    "statusEffects": [
      {
        "type": "damageIncrease",
        "target": "Team",
        "amountPercent": 50,
        "durationSeconds": 4
      }
    ],
    "notes": "Target: Enemy | Allies. Ally effects: 50% Team Damage for 4 secs",
    "validationStatus": "Ready"
  },
  "ghost-impact-vulnerability": {
    "id": "ghost-impact-vulnerability",
    "name": "Ghost Impact (Vulnerability)",
    "element": "Dark",
    "description": "Unleash Soul Impact, applying Vulnerability and damaging nearby enemies.",
    "damageInstances": [
      {
        "multiplier": 0.5,
        "hits": 4
      }
    ],
    "cooldown": 6,
    "statusEffects": [
      {
        "type": "vulnerability",
        "target": "Enemy",
        "amountPercent": 20,
        "durationSeconds": 10
      }
    ],
    "notes": "Target: Enemy. Enemy effects: Vulnerability (20%) incoming damage for 10 secs; Stagger",
    "validationStatus": "Ready"
  },
  "gift-delivery": {
    "id": "gift-delivery",
    "name": "Gift Delivery",
    "element": "Common",
    "description": "Throws a gift at the enemy.",
    "damageInstances": [
      {
        "multiplier": 1,
        "hits": 1
      }
    ],
    "cooldown": 6,
    "notes": "Target: Enemy.",
    "validationStatus": "Ready"
  },
  "glacial-smash": {
    "id": "glacial-smash",
    "name": "Glacial Smash",
    "element": "Ice",
    "description": "Smashes the ground, launching and damaging all nearby enemies.",
    "damageInstances": [
      {
        "multiplier": 1.2,
        "hits": 1
      }
    ],
    "cooldown": 8,
    "statusEffects": [
      {
        "type": "shield",
        "target": "Team",
        "amountPercent": 17.5,
        "durationSeconds": 6
      }
    ],
    "notes": "Target: Enemy | Allies. Ally effects: 17.5% Team Shield for 6 secs",
    "validationStatus": "Ready"
  },
  "glacial-wall": {
    "id": "glacial-wall",
    "name": "Glacial Wall",
    "element": "Ice",
    "description": "Grants all pets a 30% max HP shield for 6s (25% chance to double), and damages nearby enemies.",
    "damageInstances": [
      {
        "multiplier": 1.2,
        "hits": 1
      }
    ],
    "cooldown": 8,
    "statusEffects": [
      {
        "type": "shield",
        "target": "Team",
        "amountPercent": 30,
        "durationSeconds": 6,
        "chancePercent": 75
      },
      {
        "type": "shield",
        "target": "Team",
        "amountPercent": 60,
        "durationSeconds": 6,
        "chancePercent": 25
      }
    ],
    "notes": "Target: Enemy | Allies. Ally effects: 30% Team Shield for 6 secs (75% Chance); 60% Team Shield for 6 secs (25% chance)",
    "validationStatus": "Ready"
  },
  "grass-tornado": {
    "id": "grass-tornado",
    "name": "Grass Tornado",
    "element": "Grass",
    "description": "Kicks up a swirling leaf cyclone forward.",
    "damageInstances": [
      {
        "multiplier": 1.8,
        "hits": 1
      }
    ],
    "cooldown": 8,
    "statusEffects": [
      {
        "type": "knockback",
        "target": "Enemy"
      }
    ],
    "notes": "Target: Enemy. Enemy effects: Knockback",
    "validationStatus": "Ready"
  },
  "gravel-scatter-shot": {
    "id": "gravel-scatter-shot",
    "name": "Gravel Scatter Shot",
    "element": "Ground",
    "description": "Shoots a burst of stones forward, dealing area damage to hit enemies.",
    "damageInstances": [
      {
        "multiplier": 1,
        "hits": 1
      }
    ],
    "cooldown": 3,
    "notes": "Target: Enemy.",
    "validationStatus": "Ready"
  },
  "gravel-whirlwind": {
    "id": "gravel-whirlwind",
    "name": "Gravel Whirlwind",
    "element": "Ground",
    "description": "Summons two gravel whirlwinds, damage and knock away enemies along their path.",
    "damageInstances": [
      {
        "multiplier": 1,
        "hits": 2
      }
    ],
    "cooldown": 8,
    "statusEffects": [
      {
        "type": "knockback",
        "target": "Enemy"
      }
    ],
    "notes": "Target: Enemy. Enemy effects: Knockback",
    "validationStatus": "Ready"
  },
  "healing-pulse": {
    "id": "healing-pulse",
    "name": "Healing Pulse",
    "element": "Grass",
    "description": "Releases a wave, instantly restores health to all pets within range.",
    "damageInstances": [],
    "cooldown": 6,
    "statusEffects": [
      {
        "type": "healing",
        "target": "Team",
        "amountPercent": 80,
        "scaling": "Damage"
      }
    ],
    "notes": "Target: Allies. Ally effects: 80% of damage team heal",
    "validationStatus": "Ready"
  },
  "healing-shuriken": {
    "id": "healing-shuriken",
    "name": "Healing Shuriken",
    "element": "Water",
    "description": "Gathers water flow to heal, then casts shuriken at the enemy.",
    "damageInstances": [
      {
        "multiplier": 0.2,
        "hits": 4
      }
    ],
    "cooldown": 6,
    "statusEffects": [
      {
        "type": "healing",
        "target": "Self",
        "amountPercent": 80,
        "scaling": "Damage"
      }
    ],
    "notes": "Target: Enemy | Self. Ally effects: 80% of damage self heal",
    "validationStatus": "Ready"
  },
  "healing-water-ball": {
    "id": "healing-water-ball",
    "name": "Healing Water Ball",
    "element": "Water",
    "description": "Use water energy to heal self, then attack the enemy with a water ball.",
    "damageInstances": [
      {
        "multiplier": 1,
        "hits": 1
      }
    ],
    "cooldown": 6,
    "statusEffects": [
      {
        "type": "stun",
        "target": "Enemy",
        "durationSeconds": 2
      },
      {
        "type": "healing",
        "target": "Self",
        "amountPercent": 50,
        "scaling": "Damage"
      }
    ],
    "notes": "Target: Enemy | Self. Enemy effects: Stun 2 secs Ally effects: 50% of damage self heal (Instant)",
    "validationStatus": "Ready"
  },
  "holy-aura-djinn-lampyr": {
    "id": "holy-aura-djinn-lampyr",
    "name": "Holy Aura (Djinn Lampyr)",
    "element": "Common",
    "description": "Release Holy Aura, healing and strengthening all Pets. (No Stack)",
    "damageInstances": [],
    "cooldown": 8,
    "statusEffects": [
      {
        "type": "damageIncrease",
        "target": "Team",
        "amountPercent": 25,
        "durationSeconds": 6
      },
      {
        "type": "healing",
        "target": "Team",
        "amountPercent": 160,
        "scaling": "Damage"
      },
      {
        "type": "healing",
        "target": "Team",
        "amountPercent": 5,
        "scaling": "MaxHealth"
      }
    ],
    "notes": "Target: Allies. Ally effects: 25% Team Damage for 6 secs; 160% of damage + 5% of health team heal",
    "validationStatus": "Ready"
  },
  "holy-aura-frostvolf": {
    "id": "holy-aura-frostvolf",
    "name": "Holy Aura (Frostvolf)",
    "element": "Common",
    "description": "Release Holy aura, shielding and stregthening all Pets. (No Stack)",
    "damageInstances": [],
    "cooldown": 8,
    "statusEffects": [
      {
        "type": "damageIncrease",
        "target": "Team",
        "amountPercent": 25,
        "durationSeconds": 6
      },
      {
        "type": "shield",
        "target": "Team",
        "amountPercent": 15,
        "scaling": "MaxHealth",
        "durationSeconds": 6
      }
    ],
    "notes": "Target: Allies. Ally effects: 15% of Max HP Team shield; 25% Team Damage for 6 secs",
    "validationStatus": "Ready"
  },
  "holy-aura-titan-tusk": {
    "id": "holy-aura-titan-tusk",
    "name": "Holy Aura (Titan Tusk)",
    "element": "Common",
    "description": "Release Holy aura, shielding and stregthening all Pets. (No Stack)",
    "damageInstances": [],
    "cooldown": 8,
    "statusEffects": [
      {
        "type": "damageIncrease",
        "target": "Team",
        "amountPercent": 25,
        "durationSeconds": 6
      },
      {
        "type": "shield",
        "target": "Team",
        "amountPercent": 15,
        "scaling": "MaxHealth",
        "durationSeconds": 6
      }
    ],
    "notes": "Target: Allies. Ally effects: 15% of Max HP Team shield; 25% Team Damage for 6 secs",
    "validationStatus": "Ready"
  },
  "hydro-cannon": {
    "id": "hydro-cannon",
    "name": "Hydro Cannon",
    "element": "Water",
    "description": "Unleashes continuous water waves forward, reducing the attack power of hit enemies.",
    "damageInstances": [
      {
        "multiplier": 0.4,
        "hits": 5
      }
    ],
    "cooldown": 8,
    "statusEffects": [
      {
        "type": "damageDecrease",
        "target": "Enemy",
        "amountPercent": 15,
        "durationSeconds": 10
      }
    ],
    "notes": "Target: Enemy. Enemy effects: 15% decreased damage for 10 secs",
    "validationStatus": "Ready"
  },
  "ice-road": {
    "id": "ice-road",
    "name": "Ice Road",
    "element": "Ice",
    "description": "Stomps the ground to unleash a line of ice spikes forward.",
    "damageInstances": [
      {
        "multiplier": 1.5,
        "hits": 1
      }
    ],
    "cooldown": 8,
    "notes": "Target: Enemy.",
    "validationStatus": "Ready"
  },
  "ice-surge": {
    "id": "ice-surge",
    "name": "Ice Surge",
    "element": "Ice",
    "description": "Gathers icy energy and releases a powerful blast.",
    "damageInstances": [
      {
        "multiplier": 0.2,
        "hits": 5
      }
    ],
    "cooldown": 6,
    "notes": "Target: Enemy.",
    "validationStatus": "Ready"
  },
  "iceball": {
    "id": "iceball",
    "name": "Iceball",
    "element": "Ice",
    "description": "Casts an iceball at the enemy.",
    "damageInstances": [
      {
        "multiplier": 1.2,
        "hits": 1
      }
    ],
    "cooldown": 3,
    "notes": "Target: Enemy.",
    "validationStatus": "Ready"
  },
  "icicle-prison": {
    "id": "icicle-prison",
    "name": "Icicle Prison",
    "element": "Ice",
    "description": "Summons a prison of icy spikes to trap the target, dealing damage and stunning them for a short time.",
    "damageInstances": [
      {
        "multiplier": 2,
        "hits": 1
      }
    ],
    "cooldown": 8,
    "statusEffects": [
      {
        "type": "stun",
        "target": "Enemy",
        "durationSeconds": 1
      }
    ],
    "notes": "Target: Enemy. Enemy effects: Stun 1 secs",
    "validationStatus": "Ready"
  },
  "inferno-blast": {
    "id": "inferno-blast",
    "name": "Inferno Blast",
    "element": "Dark",
    "description": "Stuns all enemies within the electric field first, then fires Inferno Beams.",
    "damageInstances": [
      {
        "multiplier": 1.5,
        "hits": 1
      }
    ],
    "cooldown": 8,
    "notes": "Target: Enemy.",
    "validationStatus": "Ready"
  },
  "inferno-maelstrom": {
    "id": "inferno-maelstrom",
    "name": "Inferno Maelstrom",
    "element": "Fire",
    "description": "A burst of blazing fire, attacks nearby enemies and briefly increases damage.",
    "damageInstances": [
      {
        "multiplier": 1.2,
        "hits": 1
      }
    ],
    "cooldown": 6,
    "statusEffects": [
      {
        "type": "damageIncrease",
        "target": "Self",
        "amountPercent": 25,
        "durationSeconds": 6
      },
      {
        "type": "knockback",
        "target": "Enemy"
      }
    ],
    "notes": "Target: Enemy. Enemy effects: Knockback Ally effects: 25% self damage for 6 secs",
    "validationStatus": "Ready"
  },
  "inferno-smash": {
    "id": "inferno-smash",
    "name": "Inferno Smash",
    "element": "Fire",
    "description": "Smashes the ground, launching and damaging all nearby enemies.",
    "damageInstances": [
      {
        "multiplier": 1.2,
        "hits": 1
      }
    ],
    "cooldown": 8,
    "statusEffects": [
      {
        "type": "damageIncrease",
        "target": "Self",
        "amountPercent": 25,
        "durationSeconds": 6
      },
      {
        "type": "knockback",
        "target": "Enemy"
      }
    ],
    "notes": "Target: Enemy. Enemy effects: Knockback Ally effects: 25% self damage for 6 secs",
    "validationStatus": "Ready"
  },
  "ion-blast": {
    "id": "ion-blast",
    "name": "Ion Blast",
    "element": "Common",
    "description": "Stuns all enemies within the electric field first, then fires Ion Beams.",
    "damageInstances": [
      {
        "multiplier": 1,
        "hits": 1
      }
    ],
    "cooldown": 8,
    "statusEffects": [
      {
        "type": "stun",
        "target": "Enemy",
        "durationSeconds": 2
      }
    ],
    "notes": "Target: Enemy. Enemy effects: Stun 2 secs",
    "validationStatus": "Ready"
  },
  "jokers-trick": {
    "id": "jokers-trick",
    "name": "Joker's Trick",
    "element": "Common",
    "description": "Launches red or black cards that trigger different effects.",
    "damageInstances": [
      {
        "multiplier": 1.2,
        "hits": 1
      }
    ],
    "cooldown": 3,
    "statusEffects": [
      {
        "type": "damageIncrease",
        "target": "Self",
        "amountPercent": 25,
        "durationSeconds": 5,
        "condition": "Red Card result"
      },
      {
        "type": "damageDecrease",
        "target": "Enemy",
        "amountPercent": 15,
        "durationSeconds": 5,
        "condition": "Black Card result"
      }
    ],
    "notes": "Target: Enemy | Self. Ally effects: Black Card:; -15% damage for 5 secs; Red Card:; 25% damage for 5 secs",
    "validationStatus": "Ready"
  },
  "leaf-blade": {
    "id": "leaf-blade",
    "name": "Leaf blade",
    "element": "Grass",
    "description": "Launches leaf blades, applying vulnerable to enemies and healing the pet.",
    "damageInstances": [
      {
        "multiplier": 1,
        "hits": 2
      }
    ],
    "cooldown": 3,
    "statusEffects": [
      {
        "type": "vulnerability",
        "target": "Enemy",
        "amountPercent": 20,
        "durationSeconds": 10
      },
      {
        "type": "healing",
        "target": "Self",
        "amountPercent": 13,
        "scaling": "MaxHealth"
      }
    ],
    "notes": "Target: Enemy | Self. Enemy effects: Vulnerability (20%) incoming damage for 10 secs Ally effects: 13% of Max Health self heal",
    "validationStatus": "Ready"
  },
  "leaf-surge": {
    "id": "leaf-surge",
    "name": "Leaf Surge",
    "element": "Grass",
    "description": "Releases a ring of leaf energy to knock back nearby enemies.",
    "damageInstances": [
      {
        "multiplier": 1.2,
        "hits": 1
      }
    ],
    "cooldown": 6,
    "statusEffects": [
      {
        "type": "knockback",
        "target": "Enemy"
      }
    ],
    "notes": "Target: Enemy. Enemy effects: Knockback ",
    "validationStatus": "Ready"
  },
  "lightning-storm-blue": {
    "id": "lightning-storm-blue",
    "name": "Lightning Storm (Blue)",
    "element": "Electric",
    "description": "Unleashes continuous lightning in front, damaging enemies and granting a shield.",
    "damageInstances": [
      {
        "multiplier": 0.28,
        "hits": 11
      }
    ],
    "cooldown": 8,
    "statusEffects": [
      {
        "type": "shield",
        "target": "Self",
        "amountPercent": 16.67,
        "scaling": "MaxHealth",
        "durationSeconds": 6
      }
    ],
    "notes": "Target: Enemy | Self. Enemy effects: Stagger Ally effects: 16.67% of Max HP self shield for 6 secs",
    "validationStatus": "Ready"
  },
  "lightning-storm-purple": {
    "id": "lightning-storm-purple",
    "name": "Lightning Storm (Purple)",
    "element": "Electric",
    "description": "Unleashes continuous lightning in front, damaging enemies and boosting self attack.",
    "damageInstances": [
      {
        "multiplier": 0.2,
        "hits": 11
      }
    ],
    "cooldown": 8,
    "statusEffects": [
      {
        "type": "damageIncrease",
        "target": "Self",
        "amountPercent": 25,
        "durationSeconds": 6
      },
      {
        "type": "stun",
        "target": "Enemy",
        "durationSeconds": 2
      }
    ],
    "notes": "Target: Enemy | Self. Enemy effects: Stun 2 secs Ally effects: 25% self damage for 6 secs",
    "validationStatus": "Ready"
  },
  "lightning-thrust": {
    "id": "lightning-thrust",
    "name": "Lightning Thrust",
    "element": "Electric",
    "description": "Gains 95% damage reduction, dashes forward rapidly, damaging and knocking back enemies in the way.",
    "damageInstances": [
      {
        "multiplier": 1.5,
        "hits": 1
      }
    ],
    "cooldown": 8,
    "statusEffects": [
      {
        "type": "damageReduction",
        "target": "Self",
        "amountPercent": 95,
        "durationSeconds": 2
      }
    ],
    "notes": "Target: Enemy | Self. Ally effects: 95% damage reduction for 2 secs",
    "validationStatus": "Ready"
  },
  "lightning-thrust-psyberion-x": {
    "id": "lightning-thrust-psyberion-x",
    "name": "Lightning Thrust (Psyberion X)",
    "element": "Electric",
    "description": "Gains 95% damage reduction, dashes forward rapidly, damaging and knocking back enemies in the way.",
    "damageInstances": [
      {
        "multiplier": 2,
        "hits": 1
      }
    ],
    "cooldown": 8,
    "statusEffects": [
      {
        "type": "damageReduction",
        "target": "Self",
        "amountPercent": 95,
        "durationSeconds": 2
      },
      {
        "type": "knockback",
        "target": "Enemy"
      }
    ],
    "notes": "Target: Enemy | Self. Enemy effects: Knockback Ally effects: 95% damage reduction for 2 secs",
    "validationStatus": "Ready"
  },
  "lunar-heal": {
    "id": "lunar-heal",
    "name": "Lunar Heal",
    "element": "Common",
    "description": "Channels lunar energy, instantly restores 18% of maximum health.",
    "damageInstances": [],
    "cooldown": 8,
    "statusEffects": [
      {
        "type": "healing",
        "target": "Team",
        "amountPercent": 18,
        "scaling": "MaxHealth"
      }
    ],
    "notes": "Target: Allies. Ally effects: Heal each ally for 18% of their Max HP",
    "validationStatus": "Ready"
  },
  "lunar-taunt": {
    "id": "lunar-taunt",
    "name": "Lunar Taunt",
    "element": "Dark",
    "description": "Forces all nearby monsters to target the pet for a short duration.",
    "damageInstances": [
      {
        "multiplier": 0.75,
        "hits": 1
      }
    ],
    "cooldown": 8,
    "statusEffects": [
      {
        "type": "taunt",
        "target": "Enemy",
        "durationSeconds": 3
      }
    ],
    "notes": "Target: Enemy. Enemy effects: Taunt for 3 secs",
    "validationStatus": "Ready"
  },
  "mighty-rock-toss": {
    "id": "mighty-rock-toss",
    "name": "Mighty Rock Toss",
    "element": "Ground",
    "description": "Casts several Rocks at the enemy, every rock deals increased damage.",
    "damageInstances": [
      {
        "multiplier": 0.5,
        "hits": 1
      },
      {
        "multiplier": 1,
        "hits": 1
      },
      {
        "multiplier": 1.5,
        "hits": 1
      },
      {
        "multiplier": 2,
        "hits": 1
      }
    ],
    "cooldown": 6,
    "notes": "Damage increases per hit Target: Enemy.",
    "validationStatus": "Ready"
  },
  "mighty-water-shuriken": {
    "id": "mighty-water-shuriken",
    "name": "Mighty Water Shuriken",
    "element": "Water",
    "description": "Casts five water Shruikens at the enemy.",
    "damageInstances": [
      {
        "multiplier": 2,
        "hits": 1
      },
      {
        "multiplier": 0.3,
        "hits": 4
      }
    ],
    "cooldown": 8,
    "notes": "Target: Enemy.",
    "validationStatus": "Ready"
  },
  "nether-fireball": {
    "id": "nether-fireball",
    "name": "Nether Fireball",
    "element": "Fire",
    "description": "Casts four Netherfire balls at the enemy.",
    "damageInstances": [
      {
        "multiplier": 0.3,
        "hits": 4
      }
    ],
    "cooldown": 6,
    "notes": "Target: Enemy.",
    "validationStatus": "Ready"
  },
  "oblivion-beam": {
    "id": "oblivion-beam",
    "name": "Oblivion Beam",
    "element": "Dark",
    "description": "Fires a devastating beam of dark energy, dealing damage and inflicting Vulnerable on enemies hit.",
    "damageInstances": [
      {
        "multiplier": 0.4,
        "hits": 5
      }
    ],
    "cooldown": 6,
    "statusEffects": [
      {
        "type": "vulnerability",
        "target": "Enemy",
        "amountPercent": 20,
        "durationSeconds": 10
      }
    ],
    "notes": "Target: Enemy. Enemy effects: Vulnerability (20%) incoming damage for 10 secs",
    "validationStatus": "Ready"
  },
  "overvolt-tempest": {
    "id": "overvolt-tempest",
    "name": "Overvolt Tempest",
    "element": "Electric",
    "description": "Unleash a thunderstorm, with a 25% chance to Overload and deal double damage.",
    "damageInstances": [
      {
        "multiplier": 0.2,
        "hits": 11
      }
    ],
    "cooldown": 6,
    "notes": "Target: Enemy. Enemy effects: Stagger Ally effects: 25% chance to trigger overvolt tempest overload deal 100% damage",
    "validationStatus": "Ready"
  },
  "overvolt-tempest-overload": {
    "id": "overvolt-tempest-overload",
    "name": "Overvolt Tempest (Overload)",
    "element": "Common",
    "description": "Unleash a thunderstorm, with a 25% chance to Overload and deal double damage.",
    "damageInstances": [
      {
        "multiplier": 0.4,
        "hits": 11
      }
    ],
    "cooldown": 6,
    "notes": "Alternate version of Overvolt Tempest. The same 11-hit attack at 40% of Attack per hit.",
    "validationStatus": "Ready"
  },
  "petal-dance": {
    "id": "petal-dance",
    "name": "Petal Dance",
    "element": "Grass",
    "description": "Summon a Petal Whirlwind to attack enemies within its range.",
    "damageInstances": [
      {
        "multiplier": 0.3,
        "hits": 3
      }
    ],
    "cooldown": 6,
    "notes": "Target: Enemy. Enemy effects: Stagger",
    "validationStatus": "Ready"
  },
  "poison-volley": {
    "id": "poison-volley",
    "name": "Poison Volley",
    "element": "Fire",
    "description": "Casts four poison orbs at the enemy, each orb applies a stack of Poison to enemies. ",
    "damageInstances": [
      {
        "multiplier": 0.3,
        "hits": 4
      }
    ],
    "cooldown": 6,
    "statusEffects": [
      {
        "type": "poison",
        "target": "Enemy",
        "amountPercent": 0.4,
        "durationSeconds": 20,
        "stacks": 4,
        "maxStacks": 10,
        "attackReductionPercent": 4
      }
    ],
    "notes": "Target: Enemy. Enemy effects: Cast four poison orbs at the enemy, each orb applies a stack of Poison. Each stack of Poison deals 0.4% of current HP per second and reduces enemy Attack by 4%, up to 10 stacks",
    "validationStatus": "Ready"
  },
  "rallying-war-cry-3-sec-50": {
    "id": "rallying-war-cry-3-sec-50",
    "name": "Rallying War Cry (3 sec 50%)",
    "element": "Fire",
    "description": "Howl at the sky, increasing the Attack of all pets.",
    "damageInstances": [],
    "cooldown": 3,
    "statusEffects": [
      {
        "type": "damageIncrease",
        "target": "Team",
        "amountPercent": 50,
        "durationSeconds": 3
      }
    ],
    "notes": "Target: Allies. Ally effects: 50% team damage for 3 secs",
    "validationStatus": "Ready"
  },
  "rallying-war-cry-6-sec-40-self-70": {
    "id": "rallying-war-cry-6-sec-40-self-70",
    "name": "Rallying War Cry (6 sec 40% self 70%)",
    "element": "Ground",
    "description": "Howl at the sky, increasing the Attack of all pets.",
    "damageInstances": [],
    "cooldown": 6,
    "statusEffects": [
      {
        "type": "damageIncrease",
        "target": "Team",
        "amountPercent": 40,
        "durationSeconds": 6
      },
      {
        "type": "damageIncrease",
        "target": "Self",
        "amountPercent": 70,
        "durationSeconds": 6
      }
    ],
    "notes": "Target: Allies | Self. Ally effects: 40% team damage for 6 secs; 70% self damage for 6 secs",
    "validationStatus": "Ready"
  },
  "rallying-war-cry-6-sec-50": {
    "id": "rallying-war-cry-6-sec-50",
    "name": "Rallying War Cry (6 sec 50%)",
    "element": "Fire",
    "description": "Howl at the sky, increasing the Attack of all pets.",
    "damageInstances": [],
    "cooldown": 6,
    "statusEffects": [
      {
        "type": "damageIncrease",
        "target": "Team",
        "amountPercent": 50,
        "durationSeconds": 6
      }
    ],
    "notes": "Target: Allies. Ally effects: 50% team damage for 6 secs",
    "validationStatus": "Ready"
  },
  "reapers-crescents": {
    "id": "reapers-crescents",
    "name": "Reaper's Crescents",
    "element": "Dark",
    "description": "Unleashes four waves of slashes forward, damaging all enemies in the path.",
    "damageInstances": [
      {
        "multiplier": 0.3,
        "hits": 4
      }
    ],
    "cooldown": 6,
    "notes": "Target: Enemy.",
    "validationStatus": "Ready"
  },
  "reapers-crescents-scareharvest": {
    "id": "reapers-crescents-scareharvest",
    "name": "Reaper's Crescents (Scareharvest)",
    "element": "Dark",
    "description": "Unleashes four waves of slashes forward, with each wave dealing increasing damage to all enemies in its path.",
    "damageInstances": [
      {
        "multiplier": 0.5,
        "hits": 1
      },
      {
        "multiplier": 0.6,
        "hits": 1
      },
      {
        "multiplier": 0.7,
        "hits": 1
      },
      {
        "multiplier": 0.8,
        "hits": 1
      }
    ],
    "cooldown": 6,
    "notes": "Target: Enemy.",
    "validationStatus": ""
  },
  "ripple-guard": {
    "id": "ripple-guard",
    "name": "Ripple Guard",
    "element": "Common",
    "description": "Gathers water to form a protective shield around all pets. (No stack).",
    "damageInstances": [],
    "cooldown": 6,
    "statusEffects": [
      {
        "type": "shield",
        "target": "Team",
        "amountPercent": 25,
        "scaling": "MaxHealth",
        "durationSeconds": 4
      }
    ],
    "notes": "Target: Allies. Ally effects: 25% max hp shield 4 secs",
    "validationStatus": "Ready"
  },
  "rock-road": {
    "id": "rock-road",
    "name": "Rock Road",
    "element": "Ground",
    "description": "Stomp the ground to unleash a line of rock spikes forward.",
    "damageInstances": [
      {
        "multiplier": 3,
        "hits": 1
      }
    ],
    "cooldown": 8,
    "notes": "Target: Enemy.",
    "validationStatus": "Ready"
  },
  "rock-toss": {
    "id": "rock-toss",
    "name": "Rock Toss",
    "element": "Ground",
    "description": "Casts a Rock at the enemy.",
    "damageInstances": [
      {
        "multiplier": 1.2,
        "hits": 1
      }
    ],
    "cooldown": 3,
    "statusEffects": [
      {
        "type": "stun",
        "target": "Enemy",
        "durationSeconds": 2
      }
    ],
    "notes": "Target: Enemy. Enemy effects: Stun 2 secs",
    "validationStatus": "Ready"
  },
  "root-slam": {
    "id": "root-slam",
    "name": "Root Slam",
    "element": "Grass",
    "description": "Smashes the ground, launching and damaging all nearby enemies.",
    "damageInstances": [
      {
        "multiplier": 1.2,
        "hits": 1
      }
    ],
    "cooldown": 8,
    "statusEffects": [
      {
        "type": "knockback",
        "target": "Enemy"
      },
      {
        "type": "healing",
        "target": "Self",
        "amountPercent": 100,
        "scaling": "Damage"
      }
    ],
    "notes": "Target: Enemy | Self. Enemy effects: Knockback Ally effects: 100% of damage self heal",
    "validationStatus": "Ready"
  },
  "root-spike": {
    "id": "root-spike",
    "name": "Root Spike",
    "element": "Grass",
    "description": "Summons root spikes from underground to attack enemies in a straight line ahead.",
    "damageInstances": [
      {
        "multiplier": 3,
        "hits": 1
      }
    ],
    "cooldown": 8,
    "notes": "Target: Enemy.",
    "validationStatus": "Ready"
  },
  "scorching-fireball": {
    "id": "scorching-fireball",
    "name": "Scorching Fireball",
    "element": "Fire",
    "description": "Casts four fireballs at the enemy, each fireball applies a stack of Burn to enemies. ",
    "damageInstances": [
      {
        "multiplier": 0.3,
        "hits": 4
      }
    ],
    "cooldown": 6,
    "statusEffects": [
      {
        "type": "burn",
        "target": "Enemy",
        "amountPercent": 0.5,
        "durationSeconds": 8,
        "stacks": 4,
        "maxStacks": 10
      }
    ],
    "notes": "Target: Enemy. Enemy effects: Burn 4 times; Burn deals 0.5% of the target's Max HP per second for 8 seconds, up to 10 stacks",
    "validationStatus": "Ready"
  },
  "seed-grenade": {
    "id": "seed-grenade",
    "name": "Seed Grenade",
    "element": "Grass",
    "description": "Launches an explosive seed.",
    "damageInstances": [
      {
        "multiplier": 1.2,
        "hits": 1
      }
    ],
    "cooldown": 3,
    "notes": "Target: Enemy.",
    "validationStatus": "Ready"
  },
  "solar-beam": {
    "id": "solar-beam",
    "name": "Solar Beam",
    "element": "Grass",
    "description": "Absorbs solar energy and unleashes a powerful beam forward.",
    "damageInstances": [
      {
        "multiplier": 2,
        "hits": 1
      }
    ],
    "cooldown": 6,
    "notes": "Target: Enemy.",
    "validationStatus": "Ready"
  },
  "solar-breath": {
    "id": "solar-breath",
    "name": "Solar Breath",
    "element": "Grass",
    "description": "Fires a concentrated solar beam, damaging enemies in front.",
    "damageInstances": [
      {
        "multiplier": 0.4,
        "hits": 5
      }
    ],
    "cooldown": 8,
    "statusEffects": [
      {
        "type": "knockback",
        "target": "Enemy"
      }
    ],
    "notes": "Target: Enemy. Enemy effects: Knockback",
    "validationStatus": "Ready"
  },
  "soul-reap-chain": {
    "id": "soul-reap-chain",
    "name": "Soul Reap Chain",
    "element": "Dark",
    "description": "Summon chains to strike enemies and apply one stack of Poison to enemies.",
    "damageInstances": [
      {
        "multiplier": 1.5,
        "hits": 1
      }
    ],
    "cooldown": 6,
    "statusEffects": [
      {
        "type": "stun",
        "target": "Enemy",
        "durationSeconds": 2
      }
    ],
    "notes": "Target: Enemy. Enemy effects: Stun 2 secs;",
    "validationStatus": "Ready"
  },
  "soul-reap-chain-vulnerability": {
    "id": "soul-reap-chain-vulnerability",
    "name": "Soul Reap Chain (Vulnerability)",
    "element": "Common",
    "description": "Summon chains to strike, stun and applies vulnerable to enemies.",
    "damageInstances": [
      {
        "multiplier": 1.5,
        "hits": 1
      }
    ],
    "cooldown": 6,
    "statusEffects": [
      {
        "type": "vulnerability",
        "target": "Enemy",
        "amountPercent": 20,
        "durationSeconds": 10
      },
      {
        "type": "stun",
        "target": "Enemy",
        "durationSeconds": 2
      }
    ],
    "notes": "Target: Enemy. Enemy effects: Stun 2 secs; Vulnerability (20%) incoming damage for 10 secs",
    "validationStatus": ""
  },
  "soul-reap-chain-scareharvest": {
    "id": "soul-reap-chain-scareharvest",
    "name": "Soul Reap Chain (Scareharvest)",
    "element": "Dark",
    "description": "Summons chains to strike enemies and apply one stack of Poison to enemies.",
    "damageInstances": [
      {
        "multiplier": 2.5,
        "hits": 1
      }
    ],
    "cooldown": 6,
    "statusEffects": [
      {
        "type": "poison",
        "target": "Enemy",
        "amountPercent": 0.4,
        "durationSeconds": 20,
        "stacks": 1,
        "maxStacks": 10,
        "attackReductionPercent": 4
      }
    ],
    "notes": "Target: Enemy. Enemy effects: 1 stack of Poison",
    "validationStatus": "Ready"
  },
  "soul-slash": {
    "id": "soul-slash",
    "name": "Soul Slash",
    "element": "Dark",
    "description": "Luanch numerous surrounding slashes, deal damage to enemies.",
    "damageInstances": [
      {
        "multiplier": 0.2,
        "hits": 11
      }
    ],
    "cooldown": 8,
    "notes": "Target: Enemy. Enemy effects: Stagger",
    "validationStatus": "Ready"
  },
  "sunder-taunt": {
    "id": "sunder-taunt",
    "name": "Sunder Taunt",
    "element": "Ground",
    "description": "Smashes the ground, lauch and taunt nearby enemies.",
    "damageInstances": [
      {
        "multiplier": 1.2,
        "hits": 1
      }
    ],
    "cooldown": 8,
    "statusEffects": [
      {
        "type": "knockback",
        "target": "Enemy"
      },
      {
        "type": "taunt",
        "target": "Enemy",
        "durationSeconds": 2
      }
    ],
    "notes": "Target: Enemy. Enemy effects: Taunt for 2 secs Knockback",
    "validationStatus": "Ready"
  },
  "taunt": {
    "id": "taunt",
    "name": "Taunt",
    "element": "Common",
    "description": "Forcing all nearby monsters to target the pet for a short duration, and gains 35% damage reduction for 10 seconds.",
    "damageInstances": [
      {
        "multiplier": 0.5,
        "hits": 1
      }
    ],
    "cooldown": 8,
    "statusEffects": [
      {
        "type": "damageReduction",
        "target": "Self",
        "amountPercent": 35,
        "durationSeconds": 10
      },
      {
        "type": "taunt",
        "target": "Enemy",
        "durationSeconds": 2
      }
    ],
    "notes": "Target: Enemy | Self. Enemy effects: Taunt for 2 secs Ally effects: 35% damage reduction for 10 secs",
    "validationStatus": "Ready"
  },
  "the-ring": {
    "id": "the-ring",
    "name": "The Ring",
    "element": "Dark",
    "description": "Unleash ringing chimes, damaging nearby enemies and lowering their attack.",
    "damageInstances": [
      {
        "multiplier": 0.3,
        "hits": 3
      }
    ],
    "cooldown": 6,
    "statusEffects": [
      {
        "type": "damageDecrease",
        "target": "Enemy",
        "amountPercent": 15,
        "durationSeconds": 10
      }
    ],
    "notes": "Target: Enemy. Enemy effects: 15% decreased damage for 10 secs",
    "validationStatus": "Ready"
  },
  "thorn-shield": {
    "id": "thorn-shield",
    "name": "Thorn Shield",
    "element": "Common",
    "description": "Grants a Thorn Shield for a short time, reflects damage to attackers.",
    "damageInstances": [],
    "cooldown": 8,
    "statusEffects": [
      {
        "type": "damageReflection",
        "target": "Self",
        "amountPercent": 60,
        "durationSeconds": 6
      }
    ],
    "notes": "Target: Self. Ally effects: 60% Damage reflection for 6 secs",
    "validationStatus": "Ready"
  },
  "thunder-stun": {
    "id": "thunder-stun",
    "name": "Thunder Stun",
    "element": "Electric",
    "description": "Releases a lightning burst, striking all nearby enemies and stunning them.",
    "damageInstances": [
      {
        "multiplier": 1,
        "hits": 1
      }
    ],
    "cooldown": 8,
    "statusEffects": [
      {
        "type": "stun",
        "target": "Enemy",
        "durationSeconds": 2
      }
    ],
    "notes": "Target: Enemy. Enemy effects: Stun 2 secs",
    "validationStatus": "Ready"
  },
  "tidal-conch": {
    "id": "tidal-conch",
    "name": "Tidal Conch",
    "element": "Water",
    "description": "Launches an explosive conch.",
    "damageInstances": [
      {
        "multiplier": 1.2,
        "hits": 1
      }
    ],
    "cooldown": 3,
    "notes": "Target: Enemy.",
    "validationStatus": "Ready"
  },
  "titan-slam": {
    "id": "titan-slam",
    "name": "Titan Slam",
    "element": "Ground",
    "description": "Smashes the ground, damaging all nearby enemies, knocking back nearby enemies and stunning them. (No Stack)",
    "damageInstances": [
      {
        "multiplier": 1.2,
        "hits": 1
      }
    ],
    "cooldown": 8,
    "statusEffects": [
      {
        "type": "damageIncrease",
        "target": "Team",
        "amountPercent": 25,
        "durationSeconds": 6
      },
      {
        "type": "shield",
        "target": "Team",
        "amountPercent": 15,
        "durationSeconds": 6
      }
    ],
    "notes": "Target: Enemy | Allies. Ally effects: 25% team damage for 6 secs; 15% team shield for 6 secs",
    "validationStatus": "Ready"
  },
  "toxic-grenade": {
    "id": "toxic-grenade",
    "name": "Toxic Grenade",
    "element": "Grass",
    "description": "Launches a Toxic explosive seed.",
    "damageInstances": [
      {
        "multiplier": 1,
        "hits": 1
      }
    ],
    "cooldown": 6,
    "statusEffects": [
      {
        "type": "stun",
        "target": "Enemy",
        "durationSeconds": 2
      }
    ],
    "notes": "Target: Enemy. Enemy effects: Stun 2 secs",
    "validationStatus": "Ready"
  },
  "tsunami": {
    "id": "tsunami",
    "name": "Tsunami",
    "element": "Water",
    "description": "Hurls a Tsunami through the enemy.",
    "damageInstances": [
      {
        "multiplier": 1,
        "hits": 1
      }
    ],
    "cooldown": 6,
    "statusEffects": [
      {
        "type": "knockback",
        "target": "Enemy"
      }
    ],
    "notes": "Target: Enemy. Enemy effects: Knockback",
    "validationStatus": "Ready"
  },
  "urgent-aid": {
    "id": "urgent-aid",
    "name": "Urgent Aid",
    "element": "Common",
    "description": "Targets the ally with the lowest HP, instantly restores 20% of his health.",
    "damageInstances": [],
    "cooldown": 6,
    "statusEffects": [
      {
        "type": "healing",
        "target": "Team",
        "amountPercent": 20,
        "scaling": "MaxHealth"
      }
    ],
    "notes": "Target: Ally. Ally effects: Targets ally with lowest hp and restore 20% of ally's Max HP",
    "validationStatus": "Ready"
  },
  "violet-core-burst": {
    "id": "violet-core-burst",
    "name": "Violet Core Burst",
    "element": "Common",
    "description": "Creates a purple energy orb, taunts nearby enemies, gains 95% damage reduction, then explodes to damage nearby enemies.",
    "damageInstances": [
      {
        "multiplier": 0.2,
        "hits": 1
      },
      {
        "multiplier": 2,
        "hits": 1
      }
    ],
    "cooldown": 8,
    "statusEffects": [
      {
        "type": "damageReduction",
        "target": "Self",
        "amountPercent": 95,
        "durationSeconds": 2
      },
      {
        "type": "knockback",
        "target": "Enemy"
      }
    ],
    "notes": "Target: Enemy | Self. Enemy effects: Knockback Ally effects: 95% damage reduction for self for 2 secs",
    "validationStatus": "Ready"
  },
  "violet-core-burst-psyberion-x": {
    "id": "violet-core-burst-psyberion-x",
    "name": "Violet Core Burst (Psyberion X)",
    "element": "Common",
    "description": "Creates a purple energy orb, gains 95% damage reduction, then explodes to damage nearby enemies.",
    "damageInstances": [
      {
        "multiplier": 0.5,
        "hits": 2
      }
    ],
    "cooldown": 8,
    "statusEffects": [
      {
        "type": "damageReduction",
        "target": "Self",
        "amountPercent": 95,
        "durationSeconds": 2
      },
      {
        "type": "knockback",
        "target": "Enemy"
      },
      {
        "type": "taunt",
        "target": "Self",
        "durationSeconds": 2
      }
    ],
    "notes": "Target: Enemy | Self. Enemy effects: Knockback Ally effects: 95% damage reduction for 2 secs; Taunt for 2 secs",
    "validationStatus": "Review"
  },
  "void-collapse": {
    "id": "void-collapse",
    "name": "Void Collapse",
    "element": "Common",
    "description": "Twists the space in front, stunning and damaging nearby enemies.",
    "damageInstances": [
      {
        "multiplier": 1.2,
        "hits": 2
      }
    ],
    "cooldown": 6,
    "statusEffects": [
      {
        "type": "stun",
        "target": "Enemy",
        "durationSeconds": 2
      }
    ],
    "notes": "Target: Enemy. Enemy effects: Stun 2 secs",
    "validationStatus": "Ready"
  },
  "void-orb": {
    "id": "void-orb",
    "name": "Void Orb",
    "element": "Electric",
    "description": "Fires a void orb and damages all enemies in a line.",
    "damageInstances": [
      {
        "multiplier": 1.25,
        "hits": 1
      }
    ],
    "cooldown": 6,
    "statusEffects": [
      {
        "type": "knockback",
        "target": "Enemy"
      }
    ],
    "notes": "Target: Enemy. Enemy effects: Knockback",
    "validationStatus": "Ready"
  },
  "void-orb-red": {
    "id": "void-orb-red",
    "name": "Void Orb (Red)",
    "element": "Dark",
    "description": "Fires a red void orb and damages all enemies in a line.",
    "damageInstances": [
      {
        "multiplier": 1.25,
        "hits": 1
      }
    ],
    "cooldown": 6,
    "statusEffects": [
      {
        "type": "knockback",
        "target": "Enemy"
      }
    ],
    "notes": "Target: Enemy. Enemy effects: Knockback",
    "validationStatus": "Ready"
  },
  "vortex-nova": {
    "id": "vortex-nova",
    "name": "Vortex Nova",
    "element": "Water",
    "description": "Summon a water vortex to pull enemies, attack and knock them up.",
    "damageInstances": [
      {
        "multiplier": 0.2,
        "hits": 4
      },
      {
        "multiplier": 0.5,
        "hits": 1
      }
    ],
    "cooldown": 6,
    "statusEffects": [
      {
        "type": "knockback",
        "target": "Enemy"
      }
    ],
    "notes": "Target: Enemy. Enemy effects: Knockback + Stagger + Lift",
    "validationStatus": "Ready"
  },
  "water-breath": {
    "id": "water-breath",
    "name": "Water Breath",
    "element": "Water",
    "description": "Fires a high-pressure water jet, damaging enemies in front.",
    "damageInstances": [
      {
        "multiplier": 0.4,
        "hits": 5
      }
    ],
    "cooldown": 8,
    "notes": "Target: Enemy.",
    "validationStatus": "Ready"
  },
  "water-cannon": {
    "id": "water-cannon",
    "name": "Water Cannon",
    "element": "Water",
    "description": "Sprays a stream of water forward, damaging enemies in front.",
    "damageInstances": [
      {
        "multiplier": 0.4,
        "hits": 5
      }
    ],
    "cooldown": 8,
    "notes": "Target: Enemy.",
    "validationStatus": "Ready"
  },
  "water-jet": {
    "id": "water-jet",
    "name": "Water Jet",
    "element": "Water",
    "description": "Shoots a high-speed Water Bullet at the enemy.",
    "damageInstances": [
      {
        "multiplier": 1.2,
        "hits": 1
      }
    ],
    "cooldown": 3,
    "notes": "Target: Enemy.",
    "validationStatus": "Ready"
  },
  "water-pillar-blast": {
    "id": "water-pillar-blast",
    "name": "Water Pillar Blast",
    "element": "Water",
    "description": "Conjures a spouting water pillar under the enemy's feet.",
    "damageInstances": [
      {
        "multiplier": 1.8,
        "hits": 1
      }
    ],
    "cooldown": 6,
    "statusEffects": [
      {
        "type": "knockback",
        "target": "Enemy"
      }
    ],
    "notes": "Target: Enemy. Enemy effects: Knockback + Stagger + Lift",
    "validationStatus": "Ready"
  },
  "water-shuriken": {
    "id": "water-shuriken",
    "name": "Water Shuriken",
    "element": "Water",
    "description": "Throw a Water Shuriken at the enemy.",
    "damageInstances": [
      {
        "multiplier": 1.2,
        "hits": 1
      }
    ],
    "cooldown": 6,
    "notes": "Target: Enemy.",
    "validationStatus": "Ready"
  },
  "wind-blast": {
    "id": "wind-blast",
    "name": "Wind Blast",
    "element": "Common",
    "description": "Blasts with powerful wind, knocking back all hit enemies.",
    "damageInstances": [
      {
        "multiplier": 1,
        "hits": 1
      }
    ],
    "cooldown": 6,
    "statusEffects": [
      {
        "type": "stun",
        "target": "Enemy",
        "durationSeconds": 1
      },
      {
        "type": "knockback",
        "target": "Enemy"
      }
    ],
    "notes": "Target: Enemy. Enemy effects: Knockback + Stun for 1 Second",
    "validationStatus": "Ready"
  },
  "wind-disc": {
    "id": "wind-disc",
    "name": "Wind Disc",
    "element": "Common",
    "description": "Throw a piercing wind disc forward.",
    "damageInstances": [
      {
        "multiplier": 1,
        "hits": 1
      }
    ],
    "cooldown": 3,
    "notes": "Target: Enemy.",
    "validationStatus": "Ready"
  },
  "wind-disc-purple": {
    "id": "wind-disc-purple",
    "name": "Wind Disc (Purple)",
    "element": "Common",
    "description": "Throws a piercing purple wind disc forward.",
    "damageInstances": [
      {
        "multiplier": 1,
        "hits": 1
      }
    ],
    "cooldown": 3,
    "notes": "Target: Enemy.",
    "validationStatus": "Ready"
  }
} as const satisfies Record<string, Skill>;
