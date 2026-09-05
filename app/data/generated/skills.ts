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
    "description": "Sprays a stream of balefire forward, strengthening the caster and damaging enemies in front.",
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
    "description": "Forms a protective shield around all pets. This shield does not stack.",
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
    "description": "Releases a bloodthirsty aura that shields and strengthens all pets. These effects do not stack.",
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
    "description": "Throws a candy projectile at the enemy.",
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
    "description": "Strikes the enemy with a close-range claw attack.",
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
    "element": "Common",
    "description": "Creates a dark singularity that damages nearby enemies and briefly reduces their Attack.",
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
    "description": "Gains heavy damage reduction, then dashes forward to damage and knock back enemies in the way.",
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
    "element": "Common",
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
    "element": "Common",
    "description": "Releases hypnotic sonic waves that damage and stun nearby enemies.",
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
    "element": "Common",
    "description": "Gains heavy damage reduction, then forms an energy orb that strikes and stuns enemies within range.",
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
        "durationSeconds": 4
      },
      {
        "type": "stun",
        "target": "Enemy",
        "durationSeconds": 2
      }
    ],
    "notes": "Target: Enemy | Self. Enemy effects: Stun 2 secs Ally effects: 90% damage reduction 4 secs self",
    "validationStatus": "Ready"
  },
  "dragons-breath": {
    "id": "dragons-breath",
    "name": "Dragon's Breath",
    "element": "Fire",
    "description": "Continuously sprays flames forward.",
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
    "description": "Continuously sprays ghostly flames forward.",
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
    "element": "Fire",
    "description": "Sacrifices 40% of the caster's HP to deal 500% Attack damage to the enemy.",
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
    "description": "Smashes the ground to damage, knock back, and stun nearby enemies.",
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
    "description": "Throws an Easter egg and gains one random effect. Every listed effect can occur.",
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
    "description": "Sprays an electric beam forward, damaging enemies in front.",
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
    "element": "Common",
    "description": "Releases an electric ring that stuns and knocks back nearby enemies.",
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
    "description": "Quickly restores 20% HP and grants a Thorn Shield for a short time, reflecting damage to attackers.",
    "damageInstances": [],
    "cooldown": 8,
    "statusEffects": [
      {
        "type": "damageReflection",
        "target": "Self",
        "amountPercent": 60,
        "durationSeconds": 2
      },
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
    "description": "Fires four air bullets at the enemy.",
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
    "description": "Throws several candies at the enemy.",
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
    "description": "Casts four fireballs at the enemy and boosts the caster's Attack.",
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
    "description": "Throws several gifts at the enemy.",
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
    "description": "Gathers icy energy to strike enemies and make them vulnerable.",
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
    "description": "Casts four iceballs at the enemy.",
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
    "description": "Throws several rocks at the enemy.",
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
    "description": "Launches three explosive seeds.",
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
    "description": "Fires four water jets at the enemy.",
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
    "description": "Throws four water shurikens at the enemy.",
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
    "description": "Reduces the target's Attack and forces nearby enemies to target the caster for a short duration.",
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
    "description": "Gains heavy damage reduction, then dashes forward to damage and knock back enemies in the way.",
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
    "description": "Gains heavy damage reduction, then dashes forward to damage and knock back enemies in the way.",
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
    "description": "Launches a fire dragon at the enemy.",
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
    "description": "Casts a fireball at the enemy.",
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
    "description": "Throws several firecrackers at the enemy.",
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
    "description": "Breathes scorching flames forward, damaging enemies in front.",
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
    "description": "Summons a lingering fireball that continuously damages nearby enemies and makes them vulnerable.",
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
    "description": "Sprays an icy beam forward, damaging enemies in front.",
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
    "description": "Fires a freezing atomic beam that damages enemies in front.",
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
    "description": "Casts a fast iceball at the enemy.",
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
    "description": "Unleashes a fan of ice spikes that stuns and slows enemies in the area.",
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
    "description": "Launches several wind blades that slash enemies along their path.",
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
    "description": "Unleashes four wave slashes, gaining a shield and making struck enemies vulnerable.",
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
      }
    ],
    "notes": "Target: Enemy. Enemy effects: Vulnerability (20%) incoming damage for 10 secs; Stagger",
    "validationStatus": "Ready"
  },
  "ghost-fireball": {
    "id": "ghost-fireball",
    "name": "Ghost Fireball",
    "element": "Fire",
    "description": "Casts four netherfire balls and makes the enemy vulnerable.",
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
    "element": "Common",
    "description": "Unleashes a soul impact that strengthens all pets and damages nearby enemies.",
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
    "element": "Common",
    "description": "Unleashes a soul impact that damages nearby enemies and makes them vulnerable.",
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
    "description": "Shields all pets and damages nearby enemies, with a chance to double the shield.",
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
    "description": "Kicks up a swirling leaf cyclone that travels forward.",
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
    "description": "Shoots a burst of stones forward, dealing area damage to enemies hit.",
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
    "description": "Summons two gravel whirlwinds that damage and knock away enemies along their paths.",
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
    "description": "Releases a wave that instantly restores health to all pets within range.",
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
    "description": "Gathers water to heal, then throws shurikens at the enemy.",
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
    "description": "Uses water energy to heal the caster, then attacks with a water ball.",
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
    "description": "Releases a Holy Aura that heals and strengthens all pets. These effects do not stack.",
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
    "description": "Releases a Holy Aura that shields and strengthens all pets.",
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
    "description": "Releases a Holy Aura that shields and strengthens all pets. These effects do not stack.",
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
    "description": "Unleashes continuous water waves forward, damaging enemies and reducing their Attack.",
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
    "description": "Stomps the ground to unleash a timed line of ice spikes forward.",
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
    "description": "Summons a prison of icy spikes that damages and briefly stuns the target.",
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
    "element": "Common",
    "description": "Stuns enemies within the electric field, then fires inferno beams.",
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
    "description": "Bursts with blazing fire, attacking nearby enemies and briefly increasing damage.",
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
    "description": "Stuns enemies within the electric field, then fires ion beams.",
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
    "description": "Launches a red or black card, triggering a different effect based on the result.",
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
    "description": "Launches leaf blades that make enemies vulnerable and heal the caster.",
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
    "description": "Releases a ring of leaf energy that knocks back nearby enemies.",
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
  "lightning-storm-blue": {
    "id": "lightning-storm-blue",
    "name": "Lightning Storm (Blue)",
    "element": "Common",
    "description": "Unleashes continuous lightning forward, damaging enemies and granting the caster a shield.",
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
    "element": "Common",
    "description": "Unleashes continuous lightning forward, damaging enemies and boosting the caster's Attack.",
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
    "element": "Common",
    "description": "Gains heavy damage reduction, then dashes forward to damage and knock back enemies in the way.",
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
    "element": "Common",
    "description": "Gains heavy damage reduction, then dashes forward to damage and knock back enemies in the way.",
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
    "description": "Channels lunar energy to instantly restore 18% of maximum health.",
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
    "element": "Common",
    "description": "Forces all nearby monsters to target the caster for a short duration.",
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
    "description": "Throws several rocks at the enemy, with each rock dealing increased damage.",
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
    "description": "Throws five water shurikens at the enemy.",
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
    "description": "Casts four netherfire balls at the enemy.",
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
    "element": "Common",
    "description": "Fires a devastating dark-energy beam that damages and makes enemies vulnerable.",
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
    "element": "Common",
    "description": "Unleashes a thunderstorm with a 25% chance to Overload and deal double damage.",
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
    "description": "Unleashes the overloaded thunderstorm, dealing double damage.",
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
    "description": "Summons a petal whirlwind that attacks enemies within its range.",
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
    "description": "Casts four poison orbs, with each orb applying a stack of Poison.",
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
    "description": "Howls at the sky, increasing the Attack of all pets.",
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
    "description": "Howls at the sky, increasing the Attack of the caster and all allied pets.",
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
    "description": "Howls at the sky, increasing the Attack of all pets.",
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
    "element": "Common",
    "description": "Unleashes four wave slashes that damage every enemy in their path.",
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
    "element": "Common",
    "description": "Unleashes four wave slashes that damage every enemy in their path.",
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
    "description": "Gathers water to form a protective shield around all pets. This shield does not stack.",
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
    "description": "Stomps the ground to unleash a line of rock spikes forward.",
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
    "description": "Throws a rock at the enemy.",
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
    "description": "Summons root spikes from underground to attack enemies in a straight line.",
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
    "description": "Casts four fireballs, with each fireball applying a stack of Burn.",
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
    "description": "Launches an explosive seed at the enemy.",
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
    "element": "Common",
    "description": "Summons chains that strike and stun enemies.",
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
    "description": "Summons chains that strike enemies and make them vulnerable.",
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
    "element": "Common",
    "description": "Summons chains that strike enemies and apply one stack of Poison.",
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
    "element": "Common",
    "description": "Launches numerous surrounding slashes that damage and make enemies vulnerable.",
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
    "description": "Smashes the ground, launching and taunting nearby enemies.",
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
    "description": "Forces nearby monsters to target the caster and grants temporary damage reduction.",
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
    "element": "Common",
    "description": "Unleashes ringing chimes that damage nearby enemies and lower their Attack.",
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
    "description": "Grants a temporary Thorn Shield that reflects damage to attackers.",
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
    "element": "Common",
    "description": "Releases a lightning burst that strikes and stuns all nearby enemies.",
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
    "description": "Launches an explosive conch at the enemy.",
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
    "description": "Smashes the ground to damage nearby enemies, then shields and strengthens all pets.",
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
    "description": "Launches a toxic explosive seed at the enemy.",
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
    "description": "Hurls a tsunami through the enemy.",
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
    "description": "Targets the ally with the lowest HP and instantly restores 20% of their health.",
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
    "description": "Creates a purple energy orb, gains heavy damage reduction, then explodes to damage nearby enemies.",
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
    "description": "Creates a purple energy orb, taunts nearby enemies, gains heavy damage reduction, then explodes.",
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
    "description": "Twists space ahead, stunning and damaging nearby enemies.",
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
    "element": "Common",
    "description": "Fires a void orb that damages every enemy in a line.",
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
    "element": "Common",
    "description": "Fires a red void orb that damages every enemy in a line.",
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
    "description": "Summons a water vortex that pulls in, damages, and knocks up enemies.",
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
    "description": "Fires a high-pressure water jet that damages enemies in front.",
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
    "description": "Shoots a high-speed water bullet at the enemy.",
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
    "description": "Conjures a spouting water pillar beneath the enemy's feet.",
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
    "description": "Throws a water shuriken at the enemy.",
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
    "description": "Blasts powerful wind that knocks back every enemy hit.",
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
    "description": "Throws a piercing wind disc forward.",
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
