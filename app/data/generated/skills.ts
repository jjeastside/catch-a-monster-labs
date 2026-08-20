// Generated from app/data-source/*.csv by app/scripts/import-csv.mjs. Do not edit manually.
import type { Skill } from "../../types/skill";

export const GENERATED_SKILLS = {
  "air-bullet": {
    "id": "air-bullet",
    "name": "Air Bullet",
    "element": "Common",
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
    "damageInstances": [
      {
        "multiplier": 0.4,
        "hits": 4
      }
    ],
    "cooldown": 8,
    "notes": "Target: Enemy | Allies. Ally effects: 50% Team Damage for 4 secs",
    "validationStatus": "Ready"
  },
  "barrier": {
    "id": "barrier",
    "name": "Barrier",
    "element": "Common",
    "damageInstances": [],
    "cooldown": 6,
    "notes": "Target: Allies. Ally effects: 25% of Max HP Team shield for 5 secs",
    "validationStatus": "Ready"
  },
  "blaze-blast": {
    "id": "blaze-blast",
    "name": "Blaze Blast",
    "element": "Fire",
    "damageInstances": [
      {
        "multiplier": 1.5,
        "hits": 1
      }
    ],
    "cooldown": 8,
    "notes": "Target: Self. Ally effects: 15% of Max HP for Self shield",
    "validationStatus": "Ready"
  },
  "bloodthirsty-aura": {
    "id": "bloodthirsty-aura",
    "name": "Bloodthirsty Aura",
    "element": "Common",
    "damageInstances": [],
    "cooldown": 8,
    "notes": "Target: Allies. Ally effects: 15% of Max HP Team shield; 25% Team Damage for 6 secs",
    "validationStatus": "Ready"
  },
  "candy-bomb": {
    "id": "candy-bomb",
    "name": "Candy Bomb",
    "element": "Common",
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
    "damageInstances": [
      {
        "multiplier": 1.2,
        "hits": 1
      }
    ],
    "cooldown": 6,
    "notes": "Target: Enemy. Enemy effects: Stun 2 secs",
    "validationStatus": "Ready"
  },
  "claw-attack": {
    "id": "claw-attack",
    "name": "Claw Attack",
    "element": "Common",
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
    "damageInstances": [
      {
        "multiplier": 0.2,
        "hits": 11
      }
    ],
    "cooldown": 8,
    "notes": "Target: Enemy. Enemy effects: Stun 1.5 secs; Stagger",
    "validationStatus": "Ready"
  },
  "dark-singularity": {
    "id": "dark-singularity",
    "name": "Dark Singularity",
    "element": "Common",
    "damageInstances": [
      {
        "multiplier": 1.2,
        "hits": 2
      }
    ],
    "cooldown": 6,
    "notes": "Target: Enemy. Enemy effects: -15% to -25% damage  for 10 s",
    "validationStatus": "Ready"
  },
  "dash": {
    "id": "dash",
    "name": "Dash",
    "element": "Common",
    "damageInstances": [
      {
        "multiplier": 1.2,
        "hits": 1
      }
    ],
    "cooldown": 8,
    "notes": "Target: Enemy | Self. Enemy effects: 95% damage reduction + knockback",
    "validationStatus": "Ready"
  },
  "deadly-sonic-wave": {
    "id": "deadly-sonic-wave",
    "name": "Deadly Sonic Wave",
    "element": "Common",
    "damageInstances": [
      {
        "multiplier": 1.2,
        "hits": 2
      }
    ],
    "cooldown": 8,
    "notes": "Target: Enemy. Enemy effects: Stun 2 secs",
    "validationStatus": "Ready"
  },
  "demonic-lullaby": {
    "id": "demonic-lullaby",
    "name": "Demonic Lullaby",
    "element": "Common",
    "damageInstances": [
      {
        "multiplier": 0.2,
        "hits": 5
      }
    ],
    "cooldown": 6,
    "notes": "Target: Enemy. Enemy effects: Stun 2 secs",
    "validationStatus": "Ready"
  },
  "divine-energy-blast": {
    "id": "divine-energy-blast",
    "name": "Divine Energy Blast",
    "element": "Common",
    "damageInstances": [
      {
        "multiplier": 3.5,
        "hits": 1
      }
    ],
    "cooldown": 6,
    "notes": "Target: Enemy | Self. Enemy effects: Stun 2 secs Ally effects: 90% damage reduction self",
    "validationStatus": "Ready"
  },
  "dragons-breath": {
    "id": "dragons-breath",
    "name": "Dragon's Breath",
    "element": "Fire",
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
  "egg-blast": {
    "id": "egg-blast",
    "name": "Egg Blast",
    "element": "Common",
    "damageInstances": [
      {
        "multiplier": 1.5,
        "hits": 1
      }
    ],
    "cooldown": 3,
    "notes": "Target: Enemy | Self. Ally effects: Chance for one of the following to activate:; 20% vulnerability on self for 3 secs; 100% self damage for 2 secs; 50% self damage for 2 secs; 25% self damage for 2 secs; 25% Max Hp self shield for 2 secs; 60% Damage reflection for 2 secs",
    "validationStatus": "Ready"
  },
  "electric-beam": {
    "id": "electric-beam",
    "name": "Electric Beam",
    "element": "Common",
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
    "damageInstances": [
      {
        "multiplier": 1.2,
        "hits": 1
      }
    ],
    "cooldown": 6,
    "notes": "Target: Enemy. Enemy effects: Stun 2 secs",
    "validationStatus": "Ready"
  },
  "emergency-thorn-shield": {
    "id": "emergency-thorn-shield",
    "name": "Emergency Thorn Shield",
    "element": "Common",
    "damageInstances": [],
    "cooldown": 0,
    "notes": "Target: Ally | Self. Ally effects: 60% Damage reflection for 2 secs",
    "validationStatus": "Ready"
  },
  "ex-air-bullet": {
    "id": "ex-air-bullet",
    "name": "Ex Air Bullet",
    "element": "Common",
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
    "damageInstances": [
      {
        "multiplier": 0.3,
        "hits": 4
      }
    ],
    "cooldown": 6,
    "notes": "Target: Enemy | Self. Ally effects: 25% self Damage for 6 secs",
    "validationStatus": "Ready"
  },
  "ex-gift-delivery": {
    "id": "ex-gift-delivery",
    "name": "Ex Gift Delivery",
    "element": "Common",
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
    "damageInstances": [
      {
        "multiplier": 0.2,
        "hits": 5
      }
    ],
    "cooldown": 6,
    "notes": "Target: Enemy. Enemy effects: Vulnerability (20%) incoming damage for 10 secs",
    "validationStatus": "Ready"
  },
  "ex-iceball": {
    "id": "ex-iceball",
    "name": "Ex Iceball",
    "element": "Ice",
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
    "damageInstances": [
      {
        "multiplier": 0.5,
        "hits": 1
      }
    ],
    "cooldown": 8,
    "notes": "Target: Enemy. Enemy effects: Taunt 2 secs; -15% damage 10 secs",
    "validationStatus": "Ready"
  },
  "fire-dash": {
    "id": "fire-dash",
    "name": "Fire Dash",
    "element": "Fire",
    "damageInstances": [
      {
        "multiplier": 1.2,
        "hits": 1
      }
    ],
    "cooldown": 8,
    "notes": "Target: Enemy | Self. Enemy effects: 95% damage reduction + knockback",
    "validationStatus": "Ready"
  },
  "fire-dragon-flame-blast": {
    "id": "fire-dragon-flame-blast",
    "name": "Fire Dragon Flame Blast",
    "element": "Fire",
    "damageInstances": [
      {
        "multiplier": 2.5,
        "hits": 1
      }
    ],
    "cooldown": 6,
    "notes": "Target: Enemy. Enemy effects: Knockback",
    "validationStatus": "Ready"
  },
  "fire-tornado": {
    "id": "fire-tornado",
    "name": "Fire Tornado",
    "element": "Fire",
    "damageInstances": [
      {
        "multiplier": 1.8,
        "hits": 1
      }
    ],
    "cooldown": 6,
    "notes": "Target: Enemy. Enemy effects: Knockback",
    "validationStatus": "Ready"
  },
  "fireball": {
    "id": "fireball",
    "name": "Fireball",
    "element": "Fire",
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
  "flame-jet": {
    "id": "flame-jet",
    "name": "Flame Jet",
    "element": "Fire",
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
    "damageInstances": [
      {
        "multiplier": 1.2,
        "hits": 1
      }
    ],
    "cooldown": 8,
    "notes": "Target: Enemy. Enemy effects: Stun 1 secs",
    "validationStatus": "Ready"
  },
  "galecut": {
    "id": "galecut",
    "name": "Galecut",
    "element": "Grass",
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
    "damageInstances": [
      {
        "multiplier": 0.4,
        "hits": 4
      }
    ],
    "cooldown": 8,
    "notes": "Target: Enemy. Enemy effects: Vulnerability (20%) incoming damage for 10 secs; Stagger",
    "validationStatus": "Ready"
  },
  "ghost-fireball": {
    "id": "ghost-fireball",
    "name": "Ghost Fireball",
    "element": "Fire",
    "damageInstances": [
      {
        "multiplier": 0.3,
        "hits": 4
      }
    ],
    "cooldown": 6,
    "notes": "Target: Enemy. Enemy effects: Vulnerability (20%) incoming damage for 10 secs",
    "validationStatus": "Ready"
  },
  "ghost-impact": {
    "id": "ghost-impact",
    "name": "Ghost Impact",
    "element": "Common",
    "damageInstances": [
      {
        "multiplier": 0.2,
        "hits": 4
      }
    ],
    "cooldown": 6,
    "notes": "Target: Enemy | Allies. Ally effects: 50% Team Damage for 4 secs",
    "validationStatus": "Ready"
  },
  "gift-delivery": {
    "id": "gift-delivery",
    "name": "Gift Delivery",
    "element": "Common",
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
    "damageInstances": [
      {
        "multiplier": 1.2,
        "hits": 1
      }
    ],
    "cooldown": 8,
    "notes": "Target: Enemy | Allies. Ally effects: 17.5% Team Shield for 6 secs",
    "validationStatus": "Ready"
  },
  "glacial-wall": {
    "id": "glacial-wall",
    "name": "Glacial Wall",
    "element": "Ice",
    "damageInstances": [
      {
        "multiplier": 1.2,
        "hits": 1
      }
    ],
    "cooldown": 8,
    "notes": "Target: Enemy | Allies. Ally effects: 30% Team Shield for 6 secs (75% Chance); 60% Team Shield for 6 secs (25% chance)",
    "validationStatus": "Ready"
  },
  "grass-tornado": {
    "id": "grass-tornado",
    "name": "Grass Tornado",
    "element": "Grass",
    "damageInstances": [
      {
        "multiplier": 1.8,
        "hits": 1
      }
    ],
    "cooldown": 8,
    "notes": "Target: Enemy. Enemy effects: Knockback",
    "validationStatus": "Ready"
  },
  "gravel-scatter-shot": {
    "id": "gravel-scatter-shot",
    "name": "Gravel Scatter Shot",
    "element": "Ground",
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
    "damageInstances": [
      {
        "multiplier": 1,
        "hits": 2
      }
    ],
    "cooldown": 8,
    "notes": "Target: Enemy. Enemy effects: Knockback",
    "validationStatus": "Ready"
  },
  "healing-pulse": {
    "id": "healing-pulse",
    "name": "Healing Pulse",
    "element": "Grass",
    "damageInstances": [],
    "cooldown": 6,
    "notes": "Target: Allies. Ally effects: 80% of damage team heal",
    "validationStatus": "Ready"
  },
  "healing-shuriken": {
    "id": "healing-shuriken",
    "name": "Healing Shuriken",
    "element": "Water",
    "damageInstances": [
      {
        "multiplier": 0.2,
        "hits": 4
      }
    ],
    "cooldown": 6,
    "notes": "Target: Enemy | Self. Ally effects: 80% of damage self heal",
    "validationStatus": "Ready"
  },
  "healing-water-ball": {
    "id": "healing-water-ball",
    "name": "Healing Water Ball",
    "element": "Water",
    "damageInstances": [
      {
        "multiplier": 1,
        "hits": 1
      }
    ],
    "cooldown": 6,
    "notes": "Target: Enemy | Self. Enemy effects: Stun 2 secs Ally effects: 50% of damage self heal (Instant)",
    "validationStatus": "Ready"
  },
  "holy-aura-djinn-lampyr": {
    "id": "holy-aura-djinn-lampyr",
    "name": "Holy Aura (Djinn Lampyr)",
    "element": "Common",
    "damageInstances": [],
    "cooldown": 8,
    "notes": "Target: Allies. Ally effects: 25% Team Damage for 6 secs; 160% of damage + 5% of health team heal",
    "validationStatus": "Ready"
  },
  "holy-aura-frostvolf": {
    "id": "holy-aura-frostvolf",
    "name": "Holy Aura (Frostvolf)",
    "element": "Common",
    "damageInstances": [],
    "cooldown": 8,
    "notes": "Target: Allies. Ally effects: 15% of Max HP Team shield; 25% Team Damage for 6 secs",
    "validationStatus": "Ready"
  },
  "holy-aura-titan-tusk": {
    "id": "holy-aura-titan-tusk",
    "name": "Holy Aura (Titan Tusk)",
    "element": "Common",
    "damageInstances": [],
    "cooldown": 8,
    "notes": "Target: Allies. Ally effects: 15% of Max HP Team shield; 25% Team Damage for 6 secs",
    "validationStatus": "Ready"
  },
  "hydro-cannon": {
    "id": "hydro-cannon",
    "name": "Hydro Cannon",
    "element": "Water",
    "damageInstances": [
      {
        "multiplier": 0.4,
        "hits": 5
      }
    ],
    "cooldown": 8,
    "notes": "Target: Enemy. Enemy effects: 15% decreased damage for 10 secs",
    "validationStatus": "Ready"
  },
  "ice-road": {
    "id": "ice-road",
    "name": "Ice Road",
    "element": "Ice",
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
    "damageInstances": [
      {
        "multiplier": 2,
        "hits": 1
      }
    ],
    "cooldown": 8,
    "notes": "Target: Enemy. Enemy effects: Stun 1 secs",
    "validationStatus": "Ready"
  },
  "inferno-blast": {
    "id": "inferno-blast",
    "name": "Inferno Blast",
    "element": "Common",
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
    "damageInstances": [
      {
        "multiplier": 1.2,
        "hits": 1
      }
    ],
    "cooldown": 6,
    "notes": "Target: Enemy. Enemy effects: Knockback Ally effects: 25% self damage for 6 secs",
    "validationStatus": "Ready"
  },
  "inferno-smash": {
    "id": "inferno-smash",
    "name": "Inferno Smash",
    "element": "Fire",
    "damageInstances": [
      {
        "multiplier": 1.2,
        "hits": 1
      }
    ],
    "cooldown": 8,
    "notes": "Target: Enemy. Enemy effects: Knockback Ally effects: 25% self damage for 6 secs",
    "validationStatus": "Ready"
  },
  "ion-blast": {
    "id": "ion-blast",
    "name": "Ion Blast",
    "element": "Common",
    "damageInstances": [
      {
        "multiplier": 1,
        "hits": 1
      }
    ],
    "cooldown": 8,
    "notes": "Target: Enemy. Enemy effects: Stun 2 secs",
    "validationStatus": "Ready"
  },
  "jokers-trick": {
    "id": "jokers-trick",
    "name": "Joker's Trick",
    "element": "Common",
    "damageInstances": [
      {
        "multiplier": 1.2,
        "hits": 1
      }
    ],
    "cooldown": 3,
    "notes": "Target: Enemy | Self. Ally effects: Black Card:; -15% damage for 5 secs; Red Card:; 25% damage for 5 secs",
    "validationStatus": "Ready"
  },
  "leaf-blade": {
    "id": "leaf-blade",
    "name": "Leaf blade",
    "element": "Grass",
    "damageInstances": [
      {
        "multiplier": 1,
        "hits": 2
      }
    ],
    "cooldown": 3,
    "notes": "Target: Enemy | Self. Enemy effects: Vulnerability (20%) incoming damage for 10 secs Ally effects: 13% of Max Health self heal",
    "validationStatus": "Ready"
  },
  "leaf-surge": {
    "id": "leaf-surge",
    "name": "Leaf Surge",
    "element": "Grass",
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
    "damageInstances": [
      {
        "multiplier": 0.28,
        "hits": 11
      }
    ],
    "cooldown": 8,
    "notes": "Target: Enemy. Enemy effects: Stagger",
    "validationStatus": "Ready"
  },
  "lightning-storm-purple": {
    "id": "lightning-storm-purple",
    "name": "Lightning Storm (Purple)",
    "element": "Common",
    "damageInstances": [
      {
        "multiplier": 0.2,
        "hits": 11
      }
    ],
    "cooldown": 8,
    "notes": "Target: Enemy | Self. Enemy effects: Stun 2 secs Ally effects: 25% self damage for 6 secs",
    "validationStatus": "Ready"
  },
  "lightning-thrust": {
    "id": "lightning-thrust",
    "name": "Lightning Thrust",
    "element": "Common",
    "damageInstances": [
      {
        "multiplier": 1.5,
        "hits": 1
      }
    ],
    "cooldown": 8,
    "notes": "Target: Enemy | Self. Ally effects: 95% damage reduction for 2 secs",
    "validationStatus": "Ready"
  },
  "lightning-thrust-psyberion-x": {
    "id": "lightning-thrust-psyberion-x",
    "name": "Lightning Thrust (Psyberion X)",
    "element": "Common",
    "damageInstances": [
      {
        "multiplier": 2,
        "hits": 1
      }
    ],
    "cooldown": 8,
    "notes": "Target: Enemy | Self. Enemy effects: Knockback Ally effects: 95% damage reduction for 2 secs",
    "validationStatus": "Ready"
  },
  "lunar-heal": {
    "id": "lunar-heal",
    "name": "Lunar Heal",
    "element": "Common",
    "damageInstances": [],
    "cooldown": 8,
    "notes": "Target: Allies. Ally effects: Heal each ally for 20% of their Max HP",
    "validationStatus": "Ready"
  },
  "lunar-taunt": {
    "id": "lunar-taunt",
    "name": "Lunar Taunt",
    "element": "Common",
    "damageInstances": [
      {
        "multiplier": 0.75,
        "hits": 1
      }
    ],
    "cooldown": 8,
    "notes": "Target: Enemy. Enemy effects: Taunt for 3 secs",
    "validationStatus": "Ready"
  },
  "mighty-rock-toss": {
    "id": "mighty-rock-toss",
    "name": "Mighty Rock Toss",
    "element": "Ground",
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
    "damageInstances": [
      {
        "multiplier": 0.4,
        "hits": 5
      }
    ],
    "cooldown": 6,
    "notes": "Target: Enemy. Enemy effects: Vulnerability (20%) incoming damage for 10 secs",
    "validationStatus": "Ready"
  },
  "overvolt-tempest": {
    "id": "overvolt-tempest",
    "name": "Overvolt Tempest",
    "element": "Common",
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
    "damageInstances": [
      {
        "multiplier": 0.3,
        "hits": 4
      }
    ],
    "cooldown": 6,
    "notes": "Target: Enemy. Enemy effects: Cast four poison orbs at the enemy, each orb applies a stack of Poison. Each stack of Poison deals 0.4% of current HP per second and reduces enemy Attack by 4%, up to 10 stacks",
    "validationStatus": "Ready"
  },
  "rallying-war-cry-3-sec-50": {
    "id": "rallying-war-cry-3-sec-50",
    "name": "Rallying War Cry (3 sec 50%)",
    "element": "Fire",
    "damageInstances": [],
    "cooldown": 3,
    "notes": "Target: Allies. Ally effects: 50% team damage for 3 secs",
    "validationStatus": "Ready"
  },
  "rallying-war-cry-6-sec-40-self-70": {
    "id": "rallying-war-cry-6-sec-40-self-70",
    "name": "Rallying War Cry (6 sec 40% self 70%)",
    "element": "Ground",
    "damageInstances": [],
    "cooldown": 6,
    "notes": "Target: Allies | Self. Ally effects: 40% team damage for 6 secs; 70% self damage for 6 secs",
    "validationStatus": "Ready"
  },
  "rallying-war-cry-6-sec-50": {
    "id": "rallying-war-cry-6-sec-50",
    "name": "Rallying War Cry (6 sec 50%)",
    "element": "Fire",
    "damageInstances": [],
    "cooldown": 6,
    "notes": "Target: Allies. Ally effects: 50% team damage for 6 secs",
    "validationStatus": "Ready"
  },
  "reapers-crescents": {
    "id": "reapers-crescents",
    "name": "Reaper's Crescents",
    "element": "Common",
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
    "damageInstances": [],
    "cooldown": 6,
    "notes": "Target: Allies. Ally effects: 25% max hp shield",
    "validationStatus": "Ready"
  },
  "rock-road": {
    "id": "rock-road",
    "name": "Rock Road",
    "element": "Ground",
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
    "damageInstances": [
      {
        "multiplier": 1.2,
        "hits": 1
      }
    ],
    "cooldown": 3,
    "notes": "Target: Enemy. Enemy effects: Stun 2 secs",
    "validationStatus": "Ready"
  },
  "root-slam": {
    "id": "root-slam",
    "name": "Root Slam",
    "element": "Grass",
    "damageInstances": [
      {
        "multiplier": 1.2,
        "hits": 1
      }
    ],
    "cooldown": 8,
    "notes": "Target: Enemy | Self. Enemy effects: Knockback Ally effects: 100% of damage self heal",
    "validationStatus": "Ready"
  },
  "root-spike": {
    "id": "root-spike",
    "name": "Root Spike",
    "element": "Grass",
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
    "damageInstances": [
      {
        "multiplier": 0.3,
        "hits": 3
      }
    ],
    "cooldown": 6,
    "notes": "Target: Enemy. Enemy effects: Burn 3 times; Burn deals 0.5% of the target's Max HP per second for 8 seconds, up to 10 stacks",
    "validationStatus": "Ready"
  },
  "seed-grenade": {
    "id": "seed-grenade",
    "name": "Seed Grenade",
    "element": "Grass",
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
    "damageInstances": [
      {
        "multiplier": 0.4,
        "hits": 5
      }
    ],
    "cooldown": 8,
    "notes": "Target: Enemy. Enemy effects: Knockback",
    "validationStatus": "Ready"
  },
  "soul-reap-chain": {
    "id": "soul-reap-chain",
    "name": "Soul Reap Chain",
    "element": "Common",
    "damageInstances": [
      {
        "multiplier": 1.5,
        "hits": 1
      }
    ],
    "cooldown": 6,
    "notes": "Target: Enemy. Enemy effects: Stun 2 secs; Vulnerability (20%) incoming damage for 10 secs",
    "validationStatus": "Ready"
  },
  "soul-reap-chain-scareharvest": {
    "id": "soul-reap-chain-scareharvest",
    "name": "Soul Reap Chain (Scareharvest)",
    "element": "Common",
    "damageInstances": [
      {
        "multiplier": 2.5,
        "hits": 1
      }
    ],
    "cooldown": 6,
    "notes": "Target: Enemy. Enemy effects: 1 stack of Poison",
    "validationStatus": "Ready"
  },
  "soul-slash": {
    "id": "soul-slash",
    "name": "Soul Slash",
    "element": "Common",
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
    "damageInstances": [
      {
        "multiplier": 1.2,
        "hits": 1
      }
    ],
    "cooldown": 8,
    "notes": "Target: Enemy. Enemy effects: Taunt for 2 secs Knockback",
    "validationStatus": "Ready"
  },
  "taunt": {
    "id": "taunt",
    "name": "Taunt",
    "element": "Common",
    "damageInstances": [
      {
        "multiplier": 0.5,
        "hits": 1
      }
    ],
    "cooldown": 8,
    "notes": "Target: Enemy | Self. Enemy effects: Taunt for 2 secs Ally effects: 35% damage reduction for 10 secs",
    "validationStatus": "Ready"
  },
  "the-ring": {
    "id": "the-ring",
    "name": "The Ring",
    "element": "Common",
    "damageInstances": [
      {
        "multiplier": 0.3,
        "hits": 3
      }
    ],
    "cooldown": 6,
    "notes": "Target: Enemy. Enemy effects: 15% decreased damage for 10 secs",
    "validationStatus": "Ready"
  },
  "thorn-shield": {
    "id": "thorn-shield",
    "name": "Thorn Shield",
    "element": "Common",
    "damageInstances": [],
    "cooldown": 8,
    "notes": "Target: Self. Ally effects: 60% Damage reflection for 6 secs",
    "validationStatus": "Ready"
  },
  "thunder-stun": {
    "id": "thunder-stun",
    "name": "Thunder Stun",
    "element": "Common",
    "damageInstances": [
      {
        "multiplier": 1,
        "hits": 1
      }
    ],
    "cooldown": 8,
    "notes": "Target: Enemy. Enemy effects: Stun 2 secs",
    "validationStatus": "Ready"
  },
  "tidal-conch": {
    "id": "tidal-conch",
    "name": "Tidal Conch",
    "element": "Water",
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
    "damageInstances": [
      {
        "multiplier": 1.2,
        "hits": 1
      }
    ],
    "cooldown": 8,
    "notes": "Target: Enemy | Allies. Ally effects: 25% team damage for 6 secs; 15% team shield for 6 secs",
    "validationStatus": "Ready"
  },
  "toxic-grenade": {
    "id": "toxic-grenade",
    "name": "Toxic Grenade",
    "element": "Grass",
    "damageInstances": [
      {
        "multiplier": 1,
        "hits": 1
      }
    ],
    "cooldown": 6,
    "notes": "Target: Enemy. Enemy effects: Stun 2 secs",
    "validationStatus": "Ready"
  },
  "tsunami": {
    "id": "tsunami",
    "name": "Tsunami",
    "element": "Water",
    "damageInstances": [
      {
        "multiplier": 1,
        "hits": 1
      }
    ],
    "cooldown": 6,
    "notes": "Target: Enemy. Enemy effects: Knockback",
    "validationStatus": "Ready"
  },
  "urgent-aid": {
    "id": "urgent-aid",
    "name": "Urgent Aid",
    "element": "Common",
    "damageInstances": [],
    "cooldown": 6,
    "notes": "Target: Ally. Ally effects: Targets ally with lowest hp and restore 20% of ally's Max HP",
    "validationStatus": "Ready"
  },
  "violet-core-burst": {
    "id": "violet-core-burst",
    "name": "Violet Core Burst",
    "element": "Common",
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
    "notes": "Target: Enemy | Self. Enemy effects: Knockback Ally effects: 95% damage reduction for self for 2 secs",
    "validationStatus": "Ready"
  },
  "violet-core-burst-psyberion-x": {
    "id": "violet-core-burst-psyberion-x",
    "name": "Violet Core Burst (Psyberion X)",
    "element": "Common",
    "damageInstances": [
      {
        "multiplier": 0.5,
        "hits": 2
      }
    ],
    "cooldown": 8,
    "notes": "Target: Enemy | Self. Enemy effects: Knockback Ally effects: 95% damage reduction for 2 secs; Taunt for 2 secs",
    "validationStatus": "Review"
  },
  "void-collapse": {
    "id": "void-collapse",
    "name": "Void Collapse",
    "element": "Common",
    "damageInstances": [
      {
        "multiplier": 1.2,
        "hits": 2
      }
    ],
    "cooldown": 6,
    "notes": "Target: Enemy. Enemy effects: Stun 2 secs",
    "validationStatus": "Ready"
  },
  "void-orb": {
    "id": "void-orb",
    "name": "Void Orb",
    "element": "Common",
    "damageInstances": [
      {
        "multiplier": 1.25,
        "hits": 1
      }
    ],
    "cooldown": 6,
    "notes": "Target: Enemy. Enemy effects: Knockback",
    "validationStatus": "Ready"
  },
  "void-orb-red": {
    "id": "void-orb-red",
    "name": "Void Orb (Red)",
    "element": "Common",
    "damageInstances": [
      {
        "multiplier": 1.25,
        "hits": 1
      }
    ],
    "cooldown": 6,
    "notes": "Target: Enemy. Enemy effects: Knockback",
    "validationStatus": "Ready"
  },
  "vortex-nova": {
    "id": "vortex-nova",
    "name": "Vortex Nova",
    "element": "Water",
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
    "notes": "Target: Enemy. Enemy effects: Knockback + Stagger + Lift",
    "validationStatus": "Ready"
  },
  "water-breath": {
    "id": "water-breath",
    "name": "Water Breath",
    "element": "Water",
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
    "damageInstances": [
      {
        "multiplier": 1.8,
        "hits": 1
      }
    ],
    "cooldown": 6,
    "notes": "Target: Enemy. Enemy effects: Knockback + Stagger + Lift",
    "validationStatus": "Ready"
  },
  "water-shuriken": {
    "id": "water-shuriken",
    "name": "Water Shuriken",
    "element": "Water",
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
    "damageInstances": [
      {
        "multiplier": 1,
        "hits": 1
      }
    ],
    "cooldown": 6,
    "notes": "Target: Enemy. Enemy effects: Knockback + Stun for 1 Second",
    "validationStatus": "Ready"
  },
  "wind-disc": {
    "id": "wind-disc",
    "name": "Wind Disc",
    "element": "Common",
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
