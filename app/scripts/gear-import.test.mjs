import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

test('CSV gear imports are deterministic and reject invalid references before writing', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cam-gear-'));
    try {
        fs.mkdirSync(path.join(root, 'scripts'));
        fs.copyFileSync(new URL('./import-csv.mjs', import.meta.url), path.join(root, 'scripts/import-csv.mjs'));
        fs.cpSync(new URL('../data-source', import.meta.url), path.join(root, 'data-source'), { recursive: true });
        const run = () => execFileSync(process.execPath, [path.join(root, 'scripts/import-csv.mjs')]);
        run();
        const read = (name) => fs.readFileSync(path.join(root, 'data/generated', name), 'utf8');
        const gear = read('equipments.ts');
        assert.match(gear, /"name": "Block Buster"/);
        assert.match(gear, /"rude-awakening"/);
        assert.match(read('attributes.ts'), /"effectType": "damage_double"/);
        assert.match(read('attributes.ts'), /"effectType": "max_hp_regen"/);
        run();
        assert.equal(read('equipments.ts'), gear);
        const source = path.join(root, 'data-source/gear.csv');
        fs.appendFileSync(source, '\nnew-weapon,Secret,New Weapon,dmg,42,rude-awakening | random');
        run();
        assert.match(read('equipments.ts'), /"name": "New Weapon"/);
        const validOutput = read('equipments.ts');
        fs.appendFileSync(source, '\nbad-weapon,Secret,Bad Weapon,dmg,30,not-an-attribute');
        assert.throws(run, /unknown or incompatible attribute/);
        assert.equal(read('equipments.ts'), validOutput);
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
