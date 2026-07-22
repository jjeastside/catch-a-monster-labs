import type { Skill } from "../types/skill";



export const SKILLS = {
    "air-bullet": {
        id: "air-bullet",
        name: "Air Bullet",
        element: "Common",
        damageInstances: [{ multiplier: 1.1875, hits: 1 }],
        cooldown: 3,
        listedTotalMultiplier: 1.1875,
    },

    "bale-breath": {
        id: "bale-breath",
        name: "Bale Breath",
        element: "Fire",
        damageInstances: [{ multiplier: 0.4, hits: 4 }],
        cooldown: 8,
        listedTotalMultiplier: 1.6,
    },

    barrier: {
        id: "barrier",
        name: "Barrier",
        element: "Common",
        damageInstances: [],
        cooldown: 6,
        listedTotalMultiplier: 0,
        notes: "Non-damaging barrier skill.",
    },

    "blaze-blast": {
        id: "blaze-blast",
        name: "Blaze Blast",
        element: "Fire",
        damageInstances: [{ multiplier: 1.5, hits: 1 }],
        cooldown: 8,
        listedTotalMultiplier: 1.5,
    },

    "bloodthirsty-aura": {
        id: "bloodthirsty-aura",
        name: "Bloodthirsty Aura",
        element: "Common",
        damageInstances: [],
        cooldown: 8,
        listedTotalMultiplier: 0,
        notes: "Non-damaging aura skill.",
    },

    "candy-bomb": {
        id: "candy-bomb",
        name: "Candy Bomb",
        element: "Common",
        damageInstances: [{ multiplier: 1.2, hits: 1 }],
        cooldown: 6,
        listedTotalMultiplier: 1.2,
    },

    "charming-wind": {
        id: "charming-wind",
        name: "Charming Wind",
        element: "Common",
        damageInstances: [{ multiplier: 1.2, hits: 1 }],
        cooldown: 6,
        listedTotalMultiplier: 1.2,
    },

    "claw-attack": {
        id: "claw-attack",
        name: "Claw Attack",
        element: "Common",
        damageInstances: [{ multiplier: 0.6, hits: 2 }],
        cooldown: 3,
        listedTotalMultiplier: 1.2,
    },

    "crimson-burst": {
        id: "crimson-burst",
        name: "Crimson Burst",
        element: "Common",
        damageInstances: [{ multiplier: 0.2, hits: 11 }],
        cooldown: 8,
        listedTotalMultiplier: 2.2,
    },

    "dark-singularity": {
        id: "dark-singularity",
        name: "Dark Singularity",
        element: "Common",
        damageInstances: [{ multiplier: 1.2, hits: 2 }],
        cooldown: 6,
        listedTotalMultiplier: 1.2,
        notes:
            "Data conflict: 1.2 × 2 calculates to 2.4, but the supplied total is 1.2.",
    },

    dash: {
        id: "dash",
        name: "Dash",
        element: "Common",
        damageInstances: [{ multiplier: 1.2, hits: 1 }],
        cooldown: 8,
        listedTotalMultiplier: 1.2,
    },

    "deadly-sonic-wave": {
        id: "deadly-sonic-wave",
        name: "Deadly Sonic Wave",
        element: "Common",
        damageInstances: [{ multiplier: 1.2, hits: 2 }],
        cooldown: 8,
        listedTotalMultiplier: 2.4,
    },

    "demonic-lullaby": {
        id: "demonic-lullaby",
        name: "Demonic Lullaby",
        element: "Common",
        damageInstances: [{ multiplier: 0.2, hits: 5 }],
        cooldown: 6,
        listedTotalMultiplier: 1,
    },

    "divine-energy-blast": {
        id: "divine-energy-blast",
        name: "Divine Energy Blast",
        element: "Common",
        damageInstances: [{ multiplier: 3.5, hits: 1 }],
        cooldown: 6,
        listedTotalMultiplier: 3.5,
    },

    "dragons-breath": {
        id: "dragons-breath",
        name: "Dragon's Breath",
        element: "Fire",
        damageInstances: [{ multiplier: 0.4, hits: 3 }],
        cooldown: 6,
        listedTotalMultiplier: 1.2,
    },

    "dragons-breath-ghost": {
        id: "dragons-breath-ghost",
        name: "Dragon's Breath (Ghost)",
        element: "Fire",
        damageInstances: [{ multiplier: 0.4, hits: 3 }],
        cooldown: 6,
        listedTotalMultiplier: 1.2,
    },

    "earth-smash": {
        id: "earth-smash",
        name: "Earth Smash",
        element: "Ground",
        damageInstances: [{ multiplier: 1.2, hits: 1 }],
        cooldown: 8,
        listedTotalMultiplier: 1.2,
    },

    "egg-blast": {
        id: "egg-blast",
        name: "Egg Blast",
        element: "Common",
        damageInstances: [{ multiplier: 1.5, hits: 1 }],
        cooldown: 3,
        listedTotalMultiplier: 1.5,
    },

    "electric-beam": {
        id: "electric-beam",
        name: "Electric Beam",
        element: "Common",
        damageInstances: [{ multiplier: 0.25, hits: 5 }],
        cooldown: 8,
        listedTotalMultiplier: 1.25,
    },

    "electro-nova": {
        id: "electro-nova",
        name: "Electro Nova",
        element: "Common",
        damageInstances: [{ multiplier: 1.2, hits: 1 }],
        cooldown: 6,
        listedTotalMultiplier: 1.2,
    },

    "emergency-thorn-shield": {
        id: "emergency-thorn-shield",
        name: "Emergency Thorn Shield",
        element: "Common",
        damageInstances: [],
        cooldown: 0,
        listedTotalMultiplier: 0,
        notes: "Non-damaging emergency shield.",
    },

    "ex-air-bullet": {
        id: "ex-air-bullet",
        name: "Ex Air Bullet",
        element: "Common",
        damageInstances: [{ multiplier: 0.3, hits: 4 }],
        cooldown: 6,
        listedTotalMultiplier: 1.2,
    },

    "ex-candy-bomb": {
        id: "ex-candy-bomb",
        name: "Ex Candy Bomb",
        element: "Common",
        damageInstances: [{ multiplier: 0.3, hits: 4 }],
        cooldown: 6,
        listedTotalMultiplier: 1.2,
    },

    "ex-fireball": {
        id: "ex-fireball",
        name: "Ex Fireball",
        element: "Fire",
        damageInstances: [{ multiplier: 0.3, hits: 4 }],
        cooldown: 6,
        listedTotalMultiplier: 1.2,
    },

    "ex-gift-delivery": {
        id: "ex-gift-delivery",
        name: "Ex Gift Delivery",
        element: "Common",
        damageInstances: [{ multiplier: 0.7, hits: 3 }],
        cooldown: 8,
        listedTotalMultiplier: 2.1,
    },

    "ex-ice-surge": {
        id: "ex-ice-surge",
        name: "Ex Ice Surge",
        element: "Ice",
        damageInstances: [{ multiplier: 0.2, hits: 5 }],
        cooldown: 6,
        listedTotalMultiplier: 1,
    },

    "ex-iceball": {
        id: "ex-iceball",
        name: "Ex Iceball",
        element: "Ice",
        damageInstances: [{ multiplier: 0.3, hits: 4 }],
        cooldown: 6,
        listedTotalMultiplier: 1.2,
    },

    "ex-rock-toss": {
        id: "ex-rock-toss",
        name: "Ex Rock Toss",
        element: "Ground",
        damageInstances: [{ multiplier: 0.5, hits: 4 }],
        cooldown: 6,
        listedTotalMultiplier: 2,
    },

    "ex-seed-grenade": {
        id: "ex-seed-grenade",
        name: "Ex Seed Grenade",
        element: "Grass",
        damageInstances: [{ multiplier: 1.2, hits: 3 }],
        cooldown: 3,
        listedTotalMultiplier: 3.6,
    },

    "ex-water-jet": {
        id: "ex-water-jet",
        name: "Ex Water Jet",
        element: "Water",
        damageInstances: [{ multiplier: 0.4, hits: 4 }],
        cooldown: 6,
        listedTotalMultiplier: 1.6,
    },

    "ex-water-shuriken": {
        id: "ex-water-shuriken",
        name: "Ex Water Shuriken",
        element: "Water",
        damageInstances: [{ multiplier: 0.3, hits: 4 }],
        cooldown: 6,
        listedTotalMultiplier: 1.2,
    },

    "fear-taunt": {
        id: "fear-taunt",
        name: "Fear Taunt",
        element: "Common",
        damageInstances: [{ multiplier: 0.5, hits: 1 }],
        cooldown: 8,
        listedTotalMultiplier: 0.5,
    },

    "fire-dash": {
        id: "fire-dash",
        name: "Fire Dash",
        element: "Fire",
        damageInstances: [{ multiplier: 1.2, hits: 1 }],
        cooldown: 8,
        listedTotalMultiplier: 1.2,
    },

    "fire-dragon-flame-blast": {
        id: "fire-dragon-flame-blast",
        name: "Fire Dragon Flame Blast",
        element: "Fire",
        damageInstances: [{ multiplier: 2.5, hits: 1 }],
        cooldown: 6,
        listedTotalMultiplier: 2.5,
    },

    "fire-tornado": {
        id: "fire-tornado",
        name: "Fire Tornado",
        element: "Fire",
        damageInstances: [{ multiplier: 1.8, hits: 1 }],
        cooldown: 6,
        listedTotalMultiplier: 1.8,
    },

    fireball: {
        id: "fireball",
        name: "Fireball",
        element: "Fire",
        damageInstances: [{ multiplier: 1.2, hits: 1 }],
        cooldown: 3,
        listedTotalMultiplier: 1.2,
    },

    "fireball-ghost": {
        id: "fireball-ghost",
        name: "Fireball (Ghost)",
        element: "Fire",
        damageInstances: [{ multiplier: 1.2, hits: 1 }],
        cooldown: 3,
        listedTotalMultiplier: 1.2,
    },

    "firecracker-pop": {
        id: "firecracker-pop",
        name: "Firecracker Pop",
        element: "Fire",
        damageInstances: [{ multiplier: 0.3, hits: 4 }],
        cooldown: 6,
        listedTotalMultiplier: 1.2,
    },

    "flame-breath": {
        id: "flame-breath",
        name: "Flame Breath",
        element: "Fire",
        damageInstances: [{ multiplier: 0.4, hits: 5 }],
        cooldown: 8,
        listedTotalMultiplier: 2,
    },

    "flame-jet": {
        id: "flame-jet",
        name: "Flame Jet",
        element: "Fire",
        damageInstances: [{ multiplier: 0.4, hits: 5 }],
        cooldown: 8,
        listedTotalMultiplier: 2,
    },

    "frost-beam": {
        id: "frost-beam",
        name: "Frost Beam",
        element: "Ice",
        damageInstances: [{ multiplier: 0.4, hits: 5 }],
        cooldown: 8,
        listedTotalMultiplier: 2,
    },

    "frost-breath": {
        id: "frost-breath",
        name: "Frost Breath",
        element: "Ice",
        damageInstances: [{ multiplier: 0.4, hits: 5 }],
        cooldown: 8,
        listedTotalMultiplier: 2,
    },

    "frosty-dart": {
        id: "frosty-dart",
        name: "Frosty Dart",
        element: "Ice",
        damageInstances: [{ multiplier: 1.2, hits: 1 }],
        cooldown: 3,
        listedTotalMultiplier: 1.2,
    },

    "frozen-nova": {
        id: "frozen-nova",
        name: "Frozen Nova",
        element: "Ice",
        damageInstances: [{ multiplier: 1.2, hits: 1 }],
        cooldown: 8,
        listedTotalMultiplier: 1.2,
    },

    galecut: {
        id: "galecut",
        name: "Galecut",
        element: "Grass",
        damageInstances: [{ multiplier: 1, hits: 1 }],
        cooldown: 3,
        listedTotalMultiplier: 1,
    },

    "galemoon-blade": {
        id: "galemoon-blade",
        name: "GaleMoon Blade",
        element: "Common",
        damageInstances: [{ multiplier: 0.4, hits: 4 }],
        cooldown: 8,
        listedTotalMultiplier: 1.6,
    },

    "ghost-fireball": {
        id: "ghost-fireball",
        name: "Ghost Fireball",
        element: "Fire",
        damageInstances: [{ multiplier: 0.3, hits: 4 }],
        cooldown: 6,
        listedTotalMultiplier: 1.2,
    },

    "ghost-impact": {
        id: "ghost-impact",
        name: "Ghost Impact",
        element: "Common",
        damageInstances: [{ multiplier: 0.2, hits: 4 }],
        cooldown: 6,
        listedTotalMultiplier: 0.9,
        notes:
            "Data conflict: 0.2 × 4 calculates to 0.8, but the supplied total is 0.9.",
    },

    "gift-delivery": {
        id: "gift-delivery",
        name: "Gift Delivery",
        element: "Common",
        damageInstances: [{ multiplier: 1, hits: 1 }],
        cooldown: 6,
        listedTotalMultiplier: 1,
    },

    "glacial-smash": {
        id: "glacial-smash",
        name: "Glacial Smash",
        element: "Ice",
        damageInstances: [{ multiplier: 1.2, hits: 1 }],
        cooldown: 8,
        listedTotalMultiplier: 1.2,
    },

    "glacial-wall": {
        id: "glacial-wall",
        name: "Glacial Wall",
        element: "Ice",
        damageInstances: [{ multiplier: 1.2, hits: 1 }],
        cooldown: 8,
        listedTotalMultiplier: 1.2,
    },

    "grass-tornado": {
        id: "grass-tornado",
        name: "Grass Tornado",
        element: "Grass",
        damageInstances: [{ multiplier: 1.8, hits: 1 }],
        cooldown: 8,
        listedTotalMultiplier: 1.8,
    },

    "gravel-scatter-shot": {
        id: "gravel-scatter-shot",
        name: "Gravel Scatter Shot",
        element: "Ground",
        damageInstances: [{ multiplier: 1, hits: 1 }],
        cooldown: 3,
        listedTotalMultiplier: 1,
    },

    "gravel-whirlwind": {
        id: "gravel-whirlwind",
        name: "Gravel Whirlwind",
        element: "Ground",
        damageInstances: [{ multiplier: 1, hits: 2 }],
        cooldown: 8,
        listedTotalMultiplier: 2,
    },

    "healing-pulse": {
        id: "healing-pulse",
        name: "Healing Pulse",
        element: "Grass",
        damageInstances: [],
        cooldown: 6,
        listedTotalMultiplier: 0,
        notes: "Healing skill. Healing calculation will be handled separately.",
    },

    "healing-water-ball": {
        id: "healing-water-ball",
        name: "Healing Water Ball",
        element: "Water",
        damageInstances: [{ multiplier: 1, hits: 1 }],
        cooldown: 6,
        listedTotalMultiplier: 1,
        notes: "May include healing behavior in addition to damage.",
    },

    "holy-aura-djinn-lampyr": {
        id: "holy-aura-djinn-lampyr",
        name: "Holy Aura (Djinn Lampyr)",
        element: "Common",
        damageInstances: [],
        cooldown: 8,
        listedTotalMultiplier: 0,
        notes: "Non-damaging aura.",
    },

    "holy-aura-icevolf": {
        id: "holy-aura-icevolf",
        name: "Holy Aura (Icevolf)",
        element: "Common",
        damageInstances: [],
        cooldown: 8,
        listedTotalMultiplier: 0,
        notes: "Non-damaging aura.",
    },

    "holy-aura-titan-tusk": {
        id: "holy-aura-titan-tusk",
        name: "Holy Aura (Titan Tusk)",
        element: "Common",
        damageInstances: [],
        cooldown: 8,
        listedTotalMultiplier: 0,
        notes: "Non-damaging aura.",
    },

    "hydro-cannon": {
        id: "hydro-cannon",
        name: "Hydro Cannon",
        element: "Water",
        damageInstances: [{ multiplier: 0.5, hits: 4 }],
        cooldown: 8,
        listedTotalMultiplier: 2,
        notes: "Enemy has 15% increased damage for 10 seconds"
    },

    "ice-road": {
        id: "ice-road",
        name: "Ice Road",
        element: "Ice",
        damageInstances: [{ multiplier: 1.5, hits: 1 }],
        cooldown: 8,
        listedTotalMultiplier: 1.5,
    },

    "ice-surge": {
        id: "ice-surge",
        name: "Ice Surge",
        element: "Ice",
        damageInstances: [{ multiplier: 0.2, hits: 5 }],
        cooldown: 6,
        listedTotalMultiplier: 1,
    },

    iceball: {
        id: "iceball",
        name: "Iceball",
        element: "Ice",
        damageInstances: [{ multiplier: 1.2, hits: 1 }],
        cooldown: 3,
        listedTotalMultiplier: 1.2,
    },

    "icicle-prison": {
        id: "icicle-prison",
        name: "Icicle Prison",
        element: "Ice",
        damageInstances: [{ multiplier: 2, hits: 1 }],
        cooldown: 8,
        listedTotalMultiplier: 2,
    },

    "inferno-blast": {
        id: "inferno-blast",
        name: "Inferno Blast",
        element: "Common",
        damageInstances: [{ multiplier: 1.5, hits: 1 }],
        cooldown: 8,
        listedTotalMultiplier: 1.5,
    },

    "inferno-maelstrom": {
        id: "inferno-maelstrom",
        name: "Inferno Maelstrom",
        element: "Fire",
        damageInstances: [{ multiplier: 1.2, hits: 1 }],
        cooldown: 6,
        listedTotalMultiplier: 1.2,
    },

    "inferno-smash": {
        id: "inferno-smash",
        name: "Inferno Smash",
        element: "Fire",
        damageInstances: [{ multiplier: 1.2, hits: 1 }],
        cooldown: 8,
        listedTotalMultiplier: 1.2,
    },

    "ion-blast": {
        id: "ion-blast",
        name: "Ion Blast",
        element: "Common",
        damageInstances: [{ multiplier: 1, hits: 1 }],
        cooldown: 8,
        listedTotalMultiplier: 1,
    },

    "jokers-trick": {
        id: "jokers-trick",
        name: "Joker's Trick",
        element: "Common",
        damageInstances: [{ multiplier: 1.2, hits: 1 }],
        cooldown: 3,
        listedTotalMultiplier: 1.2,
    },

    "leaf-blade": {
        id: "leaf-blade",
        name: "Leaf Blade",
        element: "Grass",
        damageInstances: [{ multiplier: 1, hits: 2 }],
        cooldown: 3,
        listedTotalMultiplier: 2,
    },

    "leaf-surge": {
        id: "leaf-surge",
        name: "Leaf Surge",
        element: "Grass",
        damageInstances: [{ multiplier: 1.2, hits: 1 }],
        cooldown: 6,
        listedTotalMultiplier: 1.2,
    },

    "lightning-storm-blue": {
        id: "lightning-storm-blue",
        name: "Lightning Storm (Blue)",
        element: "Common",
        damageInstances: [{ multiplier: 0.28, hits: 11 }],
        cooldown: 8,
        listedTotalMultiplier: 3.08,
    },

    "lightning-storm-purple": {
        id: "lightning-storm-purple",
        name: "Lightning Storm (Purple)",
        element: "Common",
        damageInstances: [{ multiplier: 0.2, hits: 11 }],
        cooldown: 8,
        listedTotalMultiplier: 2.2,
    },

    "lightning-thrust": {
        id: "lightning-thrust",
        name: "Lightning Thrust",
        element: "Common",
        damageInstances: [{ multiplier: 1.5, hits: 1 }],
        cooldown: 8,
        listedTotalMultiplier: 1.5,
    },

    "lunar-heal": {
        id: "lunar-heal",
        name: "Lunar Heal",
        element: "Common",
        damageInstances: [],
        cooldown: 8,
        listedTotalMultiplier: 0,
        notes: "Healing skill. Healing calculation will be handled separately.",
    },

    "lunar-taunt": {
        id: "lunar-taunt",
        name: "Lunar Taunt",
        element: "Common",
        damageInstances: [{ multiplier: 0.75, hits: 1 }],
        cooldown: 8,
        listedTotalMultiplier: 0.75,
    },

    "mighty-rock-toss": {
        id: "mighty-rock-toss",
        name: "Mighty Rock Toss",
        element: "Ground",
        damageInstances: [
            { multiplier: 0.5, hits: 1 },
            { multiplier: 1, hits: 1 },
            { multiplier: 1.5, hits: 1 },
            { multiplier: 2, hits: 1 },
        ],
        cooldown: 6,
        listedTotalMultiplier: 5,
        notes: "Damage increases per hit",
    },

    "mighty-water-shuriken": {
        id: "mighty-water-shuriken",
        name: "Mighty Water Shuriken",
        element: "Water",
        damageInstances: [
            { multiplier: 2, hits: 1 },
            { multiplier: 0.3, hits: 4 },
        ],
        cooldown: 8,
        listedTotalMultiplier: 2.2,
        notes:
            "Data conflict: the supplied stages calculate to 3.2 total, but the supplied total is 2.2.",
    },

    "nether-fireball": {
        id: "nether-fireball",
        name: "Nether Fireball",
        element: "Fire",
        damageInstances: [{ multiplier: 0.3, hits: 4 }],
        cooldown: 6,
        listedTotalMultiplier: 1.2,
    },

    "oblivion-beam": {
        id: "oblivion-beam",
        name: "Oblivion Beam",
        element: "Common",
        damageInstances: [{ multiplier: 0.4, hits: 5 }],
        cooldown: 6,
        listedTotalMultiplier: 2,
    },

    "overvolt-tempest-blue": {
        id: "overvolt-tempest-blue",
        name: "Overvolt Tempest (Blue)",
        element: "Common",
        damageInstances: [{ multiplier: 0.2, hits: 11 }],
        cooldown: 6,
        listedTotalMultiplier: 2.2,
    },

    "overvolt-tempest-overload": {
        id: "overvolt-tempest-overload",
        name: "Overvolt Tempest (Overload)",
        element: "Common",
        damageInstances: [{ multiplier: 0.4, hits: 11 }],
        cooldown: 6,
        listedTotalMultiplier: 4.4,
    },

    "petal-dance": {
        id: "petal-dance",
        name: "Petal Dance",
        element: "Grass",
        damageInstances: [{ multiplier: 0.3, hits: 3 }],
        cooldown: 6,
        listedTotalMultiplier: 0.9,
    },

    "rallying-war-cry-3-second-50": {
        id: "rallying-war-cry-3-second-50",
        name: "Rallying War Cry (3 sec 50%)",
        element: "Fire",
        damageInstances: [],
        cooldown: 3,
        listedTotalMultiplier: 0,
        notes: "Non-damaging buff skill.",
    },

    "rallying-war-cry-6-second-40-self-70": {
        id: "rallying-war-cry-6-second-40-self-70",
        name: "Rallying War Cry (6 sec 40% self 70%)",
        element: "Ground",
        damageInstances: [],
        cooldown: 6,
        listedTotalMultiplier: 0,
        notes: "Non-damaging buff skill.",
    },

    "rallying-war-cry-6-second-50": {
        id: "rallying-war-cry-6-second-50",
        name: "Rallying War Cry (6 sec 50%)",
        element: "Fire",
        damageInstances: [],
        cooldown: 6,
        listedTotalMultiplier: 0,
        notes: "Non-damaging buff skill.",
    },

    "reapers-crescents": {
        id: "reapers-crescents",
        name: "Reaper's Crescents",
        element: "Common",
        damageInstances: [{ multiplier: 0.3, hits: 4 }],
        cooldown: 6,
        listedTotalMultiplier: 1.2,
    },

    "ripple-guard": {
        id: "ripple-guard",
        name: "Ripple Guard",
        element: "Common",
        damageInstances: [],
        cooldown: 6,
        listedTotalMultiplier: 0,
        notes: "Non-damaging guard skill.",
    },

    "rock-road": {
        id: "rock-road",
        name: "Rock Road",
        element: "Ground",
        damageInstances: [{ multiplier: 3, hits: 1 }],
        cooldown: 8,
        listedTotalMultiplier: 3,
    },

    "rock-toss": {
        id: "rock-toss",
        name: "Rock Toss",
        element: "Ground",
        damageInstances: [{ multiplier: 1.2, hits: 1 }],
        cooldown: 3,
        listedTotalMultiplier: 1.2,
    },

    "root-slam": {
        id: "root-slam",
        name: "Root Slam",
        element: "Grass",
        damageInstances: [{ multiplier: 1.2, hits: 1 }],
        cooldown: 8,
        listedTotalMultiplier: 1.2,
    },

    "root-spike": {
        id: "root-spike",
        name: "Root Spike",
        element: "Grass",
        damageInstances: [{ multiplier: 3, hits: 1 }],
        cooldown: 8,
        listedTotalMultiplier: 3,
    },

    "scorching-fireball": {
        id: "scorching-fireball",
        name: "Scorching Fireball",
        element: "Fire",
        damageInstances: [{ multiplier: 0.3, hits: 3 }],
        cooldown: 6,
        listedTotalMultiplier: 0.9,
    },

    "seed-grenade": {
        id: "seed-grenade",
        name: "Seed Grenade",
        element: "Grass",
        damageInstances: [{ multiplier: 1.2, hits: 1 }],
        cooldown: 3,
        listedTotalMultiplier: 1.2,
    },

    "solar-beam": {
        id: "solar-beam",
        name: "Solar Beam",
        element: "Grass",
        damageInstances: [{ multiplier: 2, hits: 1 }],
        cooldown: 6,
        listedTotalMultiplier: 2,
    },

    "solar-breath": {
        id: "solar-breath",
        name: "Solar Breath",
        element: "Grass",
        damageInstances: [{ multiplier: 0.4, hits: 5 }],
        cooldown: 8,
        listedTotalMultiplier: 2,
    },

    "soul-reap-chain": {
        id: "soul-reap-chain",
        name: "Soul Reap Chain",
        element: "Common",
        damageInstances: [{ multiplier: 1.5, hits: 1 }],
        cooldown: 6,
        listedTotalMultiplier: 1.5,
    },

    "soul-slash": {
        id: "soul-slash",
        name: "Soul Slash",
        element: "Common",
        damageInstances: [{ multiplier: 0.2, hits: 11 }],
        cooldown: 8,
        listedTotalMultiplier: 2.2,
    },

    "sunder-taunt": {
        id: "sunder-taunt",
        name: "Sunder Taunt",
        element: "Ground",
        damageInstances: [{ multiplier: 1.2, hits: 1 }],
        cooldown: 8,
        listedTotalMultiplier: 1.2,
    },

    taunt: {
        id: "taunt",
        name: "Taunt",
        element: "Common",
        damageInstances: [{ multiplier: 0.5, hits: 1 }],
        cooldown: 8,
        listedTotalMultiplier: 0.5,
    },

    "the-ring": {
        id: "the-ring",
        name: "The Ring",
        element: "Common",
        damageInstances: [{ multiplier: 0.3, hits: 3 }],
        cooldown: 6,
        listedTotalMultiplier: 0.9,
    },

    "thorn-shield": {
        id: "thorn-shield",
        name: "Thorn Shield",
        element: "Common",
        damageInstances: [],
        cooldown: 8,
        listedTotalMultiplier: 0,
        notes: "Non-damaging shield skill.",
    },

    "thunder-stun": {
        id: "thunder-stun",
        name: "Thunder Stun",
        element: "Common",
        damageInstances: [{ multiplier: 1, hits: 1 }],
        cooldown: 8,
        listedTotalMultiplier: 1,
    },

    "tidal-conch": {
        id: "tidal-conch",
        name: "Tidal Conch",
        element: "Water",
        damageInstances: [{ multiplier: 1.2, hits: 1 }],
        cooldown: 3,
        listedTotalMultiplier: 1.2,
    },

    "titan-slam": {
        id: "titan-slam",
        name: "Titan Slam",
        element: "Ground",
        damageInstances: [{ multiplier: 1.2, hits: 1 }],
        cooldown: 8,
        listedTotalMultiplier: 1.2,
    },

    "toxic-grenade": {
        id: "toxic-grenade",
        name: "Toxic Grenade",
        element: "Grass",
        damageInstances: [{ multiplier: 1, hits: 1 }],
        cooldown: 6,
        listedTotalMultiplier: 1,
    },

    tsunami: {
        id: "tsunami",
        name: "Tsunami",
        element: "Water",
        damageInstances: [{ multiplier: 1, hits: 1 }],
        cooldown: 6,
        listedTotalMultiplier: 1,
    },

    "urgent-aid": {
        id: "urgent-aid",
        name: "Urgent Aid",
        element: "Common",
        damageInstances: [],
        cooldown: 6,
        listedTotalMultiplier: 0,
        notes: "Non-damaging support skill.",
    },

    "violet-core-burst": {
        id: "violet-core-burst",
        name: "Violet Core Burst",
        element: "Common",
        damageInstances: [
            { multiplier: 0.2, hits: 1 },
            { multiplier: 2, hits: 1 },
        ],
        cooldown: 8,
        listedTotalMultiplier: 2.2,
    },

    "void-collapse": {
        id: "void-collapse",
        name: "Void Collapse",
        element: "Common",
        damageInstances: [{ multiplier: 1.2, hits: 2 }],
        cooldown: 6,
        listedTotalMultiplier: 2.4,
    },

    "void-orb-grey": {
        id: "void-orb-grey",
        name: "Void Orb (Grey)",
        element: "Common",
        damageInstances: [{ multiplier: 1.25, hits: 1 }],
        cooldown: 6,
        listedTotalMultiplier: 1.25,
    },

    "void-orb-red": {
        id: "void-orb-red",
        name: "Void Orb (Red)",
        element: "Common",
        damageInstances: [{ multiplier: 1.25, hits: 1 }],
        cooldown: 6,
        listedTotalMultiplier: 1.25,
    },

    "vortex-nova": {
        id: "vortex-nova",
        name: "Vortex Nova",
        element: "Water",
        damageInstances: [
            { multiplier: 0.2, hits: 4 },
            { multiplier: 0.5, hits: 1 },
        ],
        cooldown: 6,
        listedTotalMultiplier: 1.3,
    },

    "water-breath": {
        id: "water-breath",
        name: "Water Breath",
        element: "Water",
        damageInstances: [{ multiplier: 0.4, hits: 5 }],
        cooldown: 8,
        listedTotalMultiplier: 2,
    },

    "water-cannon": {
        id: "water-cannon",
        name: "Water Cannon",
        element: "Water",
        damageInstances: [{ multiplier: 0.4, hits: 5 }],
        cooldown: 8,
        listedTotalMultiplier: 2,
    },

    "water-jet": {
        id: "water-jet",
        name: "Water Jet",
        element: "Water",
        damageInstances: [{ multiplier: 1.2, hits: 1 }],
        cooldown: 3,
        listedTotalMultiplier: 1.2,
    },

    "water-pillar-blast": {
        id: "water-pillar-blast",
        name: "Water Pillar Blast",
        element: "Water",
        damageInstances: [{ multiplier: 1.8, hits: 1 }],
        cooldown: 6,
        listedTotalMultiplier: 1.8,
    },

    "water-shuriken": {
        id: "water-shuriken",
        name: "Water Shuriken",
        element: "Water",
        damageInstances: [{ multiplier: 1.2, hits: 1 }],
        cooldown: 6,
        listedTotalMultiplier: 1.2,
    },

    "wind-blast": {
        id: "wind-blast",
        name: "Wind Blast",
        element: "Common",
        damageInstances: [{ multiplier: 1, hits: 6 }],
        cooldown: 6,
        listedTotalMultiplier: 6,
    },

    "wind-disc": {
        id: "wind-disc",
        name: "Wind Disc",
        element: "Common",
        damageInstances: [{ multiplier: 1, hits: 1 }],
        cooldown: 3,
        listedTotalMultiplier: 1,
    },

    "wind-disc-purple": {
        id: "wind-disc-purple",
        name: "Wind Disc (Purple)",
        element: "Common",
        damageInstances: [{ multiplier: 1, hits: 1 }],
        cooldown: 3,
        listedTotalMultiplier: 1,
    },
} as const satisfies Record<string, Skill>;

export type SkillId = keyof typeof SKILLS;

export function getSkill(skillId: string | null | undefined): Skill | null {
    if (!skillId) {
        return null;
    }

    return SKILLS[skillId as SkillId] ?? null;
}

export function getSkillTotalMultiplier(skill: Skill): number {
    return skill.damageInstances.reduce(
        (total, instance) => total + instance.multiplier * instance.hits,
        0,
    );
}

export function getSkillTotalHits(skill: Skill): number {
    return skill.damageInstances.reduce(
        (total, instance) => total + instance.hits,
        0,
    );
}

export const SKILL_LIST: Skill[] = Object.values(SKILLS);