import { describe, expect, it } from "vitest";
import { createDefaultBuild } from "../types/build";
import { unequipMonsterGear, type OwnedEquipmentCopy } from "./team-unequip";

const build = (id: string) => ({ ...createDefaultBuild({ monsterId: "dummee" }), inventoryCopyId: id, weaponId: "block-buster", weaponAttributeIds: ["all-damage-1"], armorId: "fusion-core", armorAttributeIds: ["reinforced-shield-1"], rudeAwakeningActive: true });
const setup = () => {
    const inventory = { a: build("a"), b: build("b") };
    const team = [inventory.a, { ...build("unused"), inventoryCopyId: undefined }, inventory.b];
    const copies: OwnedEquipmentCopy[] = [
        { id: "weapon-a", equipmentId: "block-buster", attributeIds: ["all-damage-1"], equippedTo: "inventory:a" },
        { id: "armor-a", equipmentId: "fusion-core", attributeIds: ["reinforced-shield-1"], equippedTo: "inventory:a" },
        { id: "weapon-b", equipmentId: "block-buster", attributeIds: [], equippedTo: "inventory:b" },
        { id: "temp", equipmentId: "fusion-core", attributeIds: [], equippedTo: "team:1" },
        { id: "free", equipmentId: "nectar-heart", attributeIds: ["reinforced-shield-1"] },
    ];
    return { inventory, team, copies };
};

describe("Team Builder unequip gear", () => {
    it("releases selected owners without deleting gear or attributes", () => {
        const { copies, team, inventory } = setup();
        const result = unequipMonsterGear(copies, team, inventory, new Set(["inventory:a"]));
        expect(result.releasedCount).toBe(2);
        expect(result.copies).toHaveLength(copies.length);
        expect(result.copies.filter(copy => copy.equippedTo === "inventory:a")).toHaveLength(0);
        expect(result.copies.find(copy => copy.id === "weapon-b")?.equippedTo).toBe("inventory:b");
        expect(result.copies.map(({ id, equipmentId, attributeIds }) => ({ id, equipmentId, attributeIds }))).toEqual(copies.map(({ id, equipmentId, attributeIds }) => ({ id, equipmentId, attributeIds })));
        expect(result.team[0]).toMatchObject({ weaponId: null, armorId: null, weaponAttributeIds: [], armorAttributeIds: [], rudeAwakeningActive: false });
        expect(result.inventory.a).toEqual(result.team[0]);
        expect(result.inventory.b).toBe(inventory.b);
        expect(result.team[2]).toBe(team[2]);
    });
    it("releases all owners including temporary slots and remains unequipped after serialization", () => {
        const { copies, team, inventory } = setup();
        const owners = new Set(copies.flatMap(copy => copy.equippedTo ? [copy.equippedTo] : []));
        const result = unequipMonsterGear(copies, team, inventory, owners);
        expect(result.releasedCount).toBe(4);
        expect(result.copies.every(copy => !copy.equippedTo)).toBe(true);
        expect(result.team.every(build => !build.weaponId && !build.armorId)).toBe(true);
        const restored = JSON.parse(JSON.stringify(result)) as typeof result;
        expect(restored.copies.every(copy => !copy.equippedTo)).toBe(true);
        expect(restored.inventory.a.weaponAttributeIds).toEqual([]);
    });
    it("does not affect a second copy of the same monster and supports multiple selected owners", () => {
        const { copies, team, inventory } = setup();
        const result = unequipMonsterGear(copies, team, inventory, new Set(["inventory:a", "team:1"]));
        expect(result.releasedCount).toBe(3);
        expect(result.inventory.b.weaponId).toBe("block-buster");
        expect(result.team[1].armorId).toBeNull();
        expect(result.inventory.a.monsterId).toBe("dummee");
    });
    it("makes no changes for an empty selection and does not mutate its inputs", () => {
        const input = setup();
        const before = JSON.stringify(input);
        const result = unequipMonsterGear(input.copies, input.team, input.inventory, new Set());
        expect(result.releasedCount).toBe(0);
        expect(result.copies).toEqual(input.copies);
        expect(result.team).toEqual(input.team);
        unequipMonsterGear(input.copies, input.team, input.inventory, new Set(["inventory:a"]));
        expect(JSON.stringify(input)).toBe(before);
    });
});
