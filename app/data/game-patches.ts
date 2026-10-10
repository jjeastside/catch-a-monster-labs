export type PatchSection = {
    title: string;
    date?: string;
    changes: string[];
};

export type Patch = {
    version: string;
    date: string;
    label?: string;
    sections: PatchSection[];
};

export const gamePatches: readonly Patch[] = [
    {
        version: "Update 0.52",
        date: "October 9, 2026",
        label: "Latest",
        sections: [
            {
                title: "Shroomvale Rift & Rewards",
                changes: [
                    "Added a new Rift to Shroomvale.",
                    "Updated rewards for various chest rarities.",
                ],
            },
            {
                title: "Events",
                changes: [
                    "The Rift Event is live!",
                    "Admin Abuse will be held twice for different time zones.",
                ],
            },
            {
                title: "New Code",
                changes: ["cernunnos"],
            },
        ],
    },
    {
        version: "Update 0.51",
        date: "October 3, 2026",
        sections: [
            {
                title: "Shroomvale & Evolution",
                changes: [
                    "Added a new boss on Shroomvale.",
                    "A new evolution for Rainimp is now available.",
                ],
            },
            {
                title: "Events",
                changes: [
                    "The Boss Event is live!",
                    "Admin Abuse will be held twice for different time zones.",
                ],
            },
            {
                title: "Codes",
                changes: [
                    "New Code: absbug",
                    "Old Code: thornewarden",
                ],
            },
            {
                title: "Update 0.51.1",
                changes: [
                    "Updated Thornewarden to drop Rainimp's evolution material.",
                ],
            },
        ],
    },
    {
        version: "Update 0.50",
        date: "September 25, 2026",
        sections: [
            {
                title: "Aether Event & Shroomvale",
                changes: [
                    "Added the Aether Event.",
                    "Added a new island: Shroomvale.",
                ],
            },
            {
                title: "Evolution & Berserkor",
                changes: [
                    "A new evolution for Aetherpanther is now available.",
                    "Defeat Berserkor on the new island to receive evolution materials.",
                ],
            },
            {
                title: "PvP",
                changes: [
                    "Fixed a bug where some pet skills did not work in PvP Mode.",
                ],
            },
            {
                title: "Update 0.50.1",
                date: "September 28, 2026",
                changes: [
                    "Fixed the code bug.",
                    "New Code: codebug",
                    "Old Code: toadstool berserker",
                ],
            },
        ],
    },
    {
        version: "Update 0.49",
        date: "September 19, 2026",
        sections: [
            {
                title: "World Boss Event",
                changes: [
                    "The World Boss Event is live!",
                    "Defeat World Bosses to receive Trait Server Buffs.",
                ],
            },
            {
                title: "PvP",
                changes: [
                    "Added the PvP Battle Pass.",
                    "Added PvP Rank Rewards.",
                    "Added PvP Season Leaderboard Rewards.",
                ],
            },
            {
                title: "New Content & Coilwork City",
                changes: [
                    "Added a new Trait.",
                    "Added new Mythic Gear.",
                    "Added achievements for Coilwork City.",
                    "Added quests for Coilwork City.",
                ],
            },
            {
                title: "New Code",
                changes: ["Twirly"],
            },
        ],
    },
    {
        version: "Update 0.48",
        date: "September 11, 2026",
        sections: [
            {
                title: "PvP",
                changes: [
                    "PvP Mode is now live — teleport to PvP Island via the map.",
                ],
            },
            {
                title: "Dungeon & Evolution",
                changes: [
                    "Added a new boss to Dungeon Cataclysm difficulties.",
                    "Beatopus has unlocked a new evolution.",
                ],
            },
            {
                title: "Events",
                changes: [
                    "Super Event Boosts are active during Admin Abuse and scheduled Wednesday time slots.",
                ],
            },
            {
                title: "Update 0.48.1",
                date: "September 11, 2026",
                changes: [
                    "Fixed some bugs.",
                    "New Code: pxpvef",
                    "Old Code: veloros",
                ],
            },
        ],
    },
    {
        version: "Update 0.47",
        date: "September 5, 2026",
        sections: [
            {
                title: "Rift Event",
                changes: [
                    "Added a Rift to Coilwork City.",
                    "The Rift Event is now live.",
                ],
            },
            {
                title: "Rewards & Shop",
                changes: [
                    "Added tiers for the Tower's daily rewards.",
                    "Reduced the prices of some items in the Dungeon Shop.",
                    "Added Roblox Plus to the shop purchase options.",
                ],
            },
            {
                title: "Coming Next & New Code",
                changes: [
                    "PVP Mode is planned for next week, as announced in Update 0.47.",
                    "New Code: stellawolf",
                ],
            },
        ],
    },
    {
        version: "Update 0.46",
        date: "August 28, 2026",
        sections: [
            {
                title: "Boss & Evolution",
                changes: [
                    "Coilwork City now features a brand-new boss.",
                    "Added a new evolution for AbyssalDrake.",
                ],
            },
            {
                title: "Progression & Rewards",
                changes: [
                    "Added time-limited titles for the top 30 players in weekly Index Points.",
                    "Added an exclusive title for Roblox Plus users.",
                ],
            },
            {
                title: "Crafting, Drops & Shop",
                changes: [
                    "Added a crafting recipe for Super Breeding Fruit.",
                    "Normal monsters now drop more items.",
                    "Added Islands 1–5 rifts to the Spire Tower Shop.",
                ],
            },
            {
                title: "Update 0.46.1",
                date: "August 28, 2026",
                changes: [
                    "Fixed some bugs.",
                    "New Code: Achievebug",
                    "Old Code: Turret",
                ],
            },
            {
                title: "Update 0.46.2",
                date: "August 29, 2026",
                changes: [
                    "Fixed some bugs.",
                    "New Code: mutatebug",
                    "Old Codes: achievebug, turret",
                ],
            },
        ],
    },
    {
        version: "Update 0.45",
        date: "August 21, 2026",
        sections: [
            {
                title: "Coilwork City",
                changes: [
                    "New Island: Coilwork City is now available.",
                    "Mechizza — Epic Fire monster obtained as a Natural Spawn on Coilwork City.",
                    "Geariff — Epic Common monster obtained as a Natural Spawn on Coilwork City.",
                    "Lynxgear — Legendary Common monster obtained as a Natural Spawn on Coilwork City.",
                    "Plaguecannon — Mythical Common monster obtained as a Natural Spawn on Coilwork City.",
                ],
            },
            {
                title: "Splash Isle",
                changes: [
                    "Added new map quests for Splash Isle.",
                    "Added a new Splash Isle Pet Quest.",
                    "Added a new Splash Isle Path of Progress quest.",
                ],
            },
            {
                title: "Events & Shop",
                changes: [
                    "The Cog Event is now live.",
                    "The Limited-Time Shop now opens periodically.",
                ],
            },
        ],
    },
];

