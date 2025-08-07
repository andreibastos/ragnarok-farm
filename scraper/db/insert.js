const pool = require('./db');

async function insertMob(mob) {
    const { id, name, image, mode } = mob;

    const query = `
    INSERT INTO mobs (id, name, image, mode)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (id) DO NOTHING;
  `;

    await pool.query(query, [id, name, image, mode || []]);
}

async function insertItem(item) {
    const { dropId, name, image } = item;

    const query = `
    INSERT INTO items (id, name, image)
    VALUES ($1, $2, $3)
    ON CONFLICT (id) DO NOTHING;
  `;

    await pool.query(query, [
        parseInt(dropId),
        name,
        image,
    ]);
}

async function insertMobDrop(mobId, item) {
    const query = `
    INSERT INTO mob_drops (mob_id, item_id, name, image, rate)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT DO NOTHING;
  `;

    await pool.query(query, [
        mobId,
        parseInt(item.dropId),
        item.name,
        item.image,
        item.rate
    ]);
}

async function insertMobRespawns(mob) {
    const query = `
    INSERT INTO mob_respawns (mob_id, map, count, respawn_rules)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT DO NOTHING;
  `;

    for (const spawn of mob.respawn || []) {
        const rules = spawn.respawnRules;
        const formattedRules = rules?.type === "dynamic"
            ? { type: "dynamic", count: rules.count, min: rules.min, max: rules.max }
            : { type: "fixed" };

        await pool.query(query, [
            mob.id,
            spawn.map,
            spawn.count,
            formattedRules
        ]);
    }
}

async function insertMobSkills(mob) {
    const query = `
    INSERT INTO mob_skills (mob_id, name, link)
    VALUES ($1, $2, $3)
    ON CONFLICT DO NOTHING;
  `;

    for (const skill of mob.skills || []) {
        await pool.query(query, [
            mob.id,
            skill.name,
            skill.link
        ]);
    }
}

async function insertMobStats(mob) {
    const s = mob.stats || {};
    const query = `
    INSERT INTO mob_stats (
      mob_id, hp, level, base_exp, job_exp, attack, defense,
      magic_def, flee_95, hit_100, atk_delay, atk_range, delay_after_hit,
      str, agi, vit, int_stat, dex, luk
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7,
      $8, $9, $10, $11, $12, $13,
      $14, $15, $16, $17, $18, $19
    )
    ON CONFLICT (mob_id) DO NOTHING;
  `;

  console.log(s);
  

    await pool.query(query, [
        mob.id,
        parseInt(s.HP),
        parseInt(s.Level),
        parseInt(s["Base Exp"]),
        parseInt(s["Job Exp"]),
        s.Attack,
        parseInt(s.Def),
        parseInt(s["Magic Def"]),
        s["Flee(95%)"],
        s["Hit(100%)"],
        s["Atk Delay"],
        s["Atk Range"],
        s["Delay After Hit"],
        parseInt(s.Str),
        parseInt(s.Agi),
        parseInt(s.Vit),
        parseInt(s.Int),
        parseInt(s.Dex),
        parseInt(s.Luk)
    ]);
}

async function insertMobElements(mob) {
    const query = `
    INSERT INTO mob_elements (mob_id, element, value)
    VALUES ($1, $2, $3)
    ON CONFLICT DO NOTHING;
  `;

    const elements = mob.elements || {};
    for (const [element, value] of Object.entries(elements)) {
        await pool.query(query, [
            mob.id,
            element,
            parseInt(value)
        ]);
    }
}

async function insertCompleteMob(mob) {
    await insertMob(mob);

    for (const item of mob.drops || []) {
        await insertItem(item);
        await insertMobDrop(mob.id, item);
    }

    await insertMobRespawns(mob);
    await insertMobSkills(mob);
    await insertMobStats(mob);
    await insertMobElements(mob);

    console.log(`✅ Mob ${mob.name} inserido com sucesso.`);
}

module.exports = {
    insertCompleteMob,
    insertMob,
    insertItem,
    insertMobDrop,
    insertMobRespawns,
    insertMobSkills,
    insertMobStats,
    insertMobElements
};
