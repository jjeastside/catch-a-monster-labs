import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(
    import.meta.dirname,
    "../..",
);

const monstersCsvPath = path.join(
    projectRoot,
    "app",
    "data-source",
    "monsters.csv",
);

const artworkDirectory = path.join(
    projectRoot,
    "public",
    "monster-artwork",
);

if (!fs.existsSync(monstersCsvPath)) {
    throw new Error(
        `Monsters CSV not found:\n${monstersCsvPath}`,
    );
}

if (!fs.existsSync(artworkDirectory)) {
    throw new Error(
        `Monster artwork folder not found:\n${artworkDirectory}`,
    );
}

function parseCsv(input) {
    const rows = [];
    let row = [];
    let field = "";
    let quoted = false;

    for (let index = 0; index < input.length; index += 1) {
        const character = input[index];

        if (quoted) {
            if (
                character === '"' &&
                input[index + 1] === '"'
            ) {
                field += '"';
                index += 1;
            } else if (character === '"') {
                quoted = false;
            } else {
                field += character;
            }
        } else if (character === '"') {
            quoted = true;
        } else if (character === ",") {
            row.push(field);
            field = "";
        } else if (character === "\n") {
            row.push(field.replace(/\r$/, ""));
            rows.push(row);
            row = [];
            field = "";
        } else {
            field += character;
        }
    }

    if (field || row.length) {
        row.push(field.replace(/\r$/, ""));
        rows.push(row);
    }

    return rows.filter((values) =>
        values.some((value) => value.trim()),
    );
}

function slug(value) {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/['’]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

const csvText = fs
    .readFileSync(monstersCsvPath, "utf8")
    .replace(/^\uFEFF/, "");

const rows = parseCsv(csvText);

const headers =
    rows.shift()?.map((header) => header.trim()) ?? [];

const monsterIdColumn =
    headers.indexOf("monster_id");

const monsterNameColumn =
    headers.findIndex((header) =>
        ["monster", "name"].includes(
            header.toLowerCase(),
        ),
    );

if (
    monsterIdColumn === -1 &&
    monsterNameColumn === -1
) {
    throw new Error(
        'The CSV must contain a "monster_id", "Monster", or "name" column.',
    );
}

const monsterIds = rows
    .map((columns) => {
        if (monsterIdColumn !== -1) {
            return columns[
                monsterIdColumn
                ]?.trim();
        }

        return slug(
            columns[monsterNameColumn],
        );
    })
    .filter(Boolean);

const artworkFiles = new Set(
    fs
        .readdirSync(artworkDirectory)
        .map((fileName) =>
            fileName.toLowerCase(),
        ),
);

const missingImages =
    monsterIds.filter((monsterId) => {
        const expectedFile =
            `${monsterId}.png`.toLowerCase();

        return !artworkFiles.has(
            expectedFile,
        );
    });

const existingImages =
    monsterIds.length -
    missingImages.length;

console.log("");
console.log("Monster Artwork Report");
console.log("======================");

console.log(
    `Total monsters:   ${monsterIds.length}`,
);

console.log(
    `Images found:     ${existingImages}`,
);

console.log(
    `Images missing:   ${missingImages.length}`,
);

if (missingImages.length > 0) {
    console.log("");
    console.log("Missing image files:");
    console.log("--------------------");

    for (const monsterId of missingImages) {
        console.log(
            `${monsterId}.png`,
        );
    }

    const reportPath = path.join(
        projectRoot,
        "missing-monster-images.txt",
    );

    fs.writeFileSync(
        reportPath,
        missingImages
            .map(
                (monsterId) =>
                    `${monsterId}.png`,
            )
            .join("\n") + "\n",
    );

    console.log("");

    console.log(
        `Saved missing-image list to:\n${reportPath}`,
    );
} else {
    console.log("");
    console.log(
        "Every monster has an image!",
    );
}