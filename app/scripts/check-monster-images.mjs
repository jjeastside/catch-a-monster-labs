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

const csvText = fs
    .readFileSync(monstersCsvPath, "utf8")
    .replace(/^\uFEFF/, "");

const lines = csvText
    .split(/\r?\n/)
    .filter((line) => line.trim());

const headers = lines[0]
    .split(",")
    .map((header) => header.trim());

const monsterIdColumn =
    headers.indexOf("monster_id");

if (monsterIdColumn === -1) {
    throw new Error(
        'The CSV is missing the "monster_id" column.',
    );
}

const monsterIds = lines
    .slice(1)
    .map((line) => {
        const columns = line.split(",");

        return columns[
            monsterIdColumn
            ]?.trim();
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