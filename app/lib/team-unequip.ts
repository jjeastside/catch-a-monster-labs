import type { Build } from "../types/build";

export type OwnedEquipmentCopy = { id: string; equipmentId: string; attributeIds: string[]; equippedTo?: string };

/** Release physical copies and clear every active representation of their owners. */
export function unequipMonsterGear(
    copies: readonly OwnedEquipmentCopy[], team: readonly Build[],
    inventory: Record<string, Build>, owners: ReadonlySet<string>,
) {
    const clear = (build: Build): Build => ({
        ...build, weaponId: null, armorId: null,
        weaponAttributeIds: [], armorAttributeIds: [], rudeAwakeningActive: false,
    });
    return {
        copies: copies.map(copy => copy.equippedTo && owners.has(copy.equippedTo)
            ? { ...copy, equippedTo: undefined } : copy),
        team: team.map((build, index) => owners.has(build.inventoryCopyId ? `inventory:${build.inventoryCopyId}` : `team:${index}`) ? clear(build) : build),
        inventory: Object.fromEntries(Object.entries(inventory).map(([id, build]) => [id, owners.has(`inventory:${id}`) ? clear(build) : build])),
        releasedCount: copies.filter(copy => copy.equippedTo && owners.has(copy.equippedTo)).length,
    };
}
