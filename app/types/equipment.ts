export type EquipmentType = "weapon" | "armor";

export type EquipmentRarity =
    | "Rare"
    | "Epic"
    | "Legendary"
    | "Mythical"
    | "Secret";

export type Equipment = {
    id: string;
    name: string;
    type: EquipmentType;
    rarity: EquipmentRarity;
    percentage: number;
    attributes: string[];
};