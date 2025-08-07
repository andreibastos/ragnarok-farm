const fs = require('fs');
const pool = require('./db/db'); // conexão com pg

async function exportToJson() {
  const mobs = await pool.query('SELECT * FROM mobs');
  const items = await pool.query('SELECT * FROM items');
  const mob_drops = await pool.query('SELECT * FROM mob_drops');
  const mob_respawns = await pool.query('SELECT * FROM mob_respawns');
  const mob_skills = await pool.query('SELECT * FROM mob_skills');
  const mob_stats = await pool.query('SELECT * FROM mob_stats');
  const mob_elements = await pool.query('SELECT * FROM mob_elements');

  const data = {
    mobs: mobs.rows.map(mob => ({
      ...mob,
      name: mob.name.split('(')[0].trim() // remove depois do (
    })),
    items: items.rows,
    mob_drops: mob_drops.rows,
    mob_respawns: mob_respawns.rows,
    mob_skills: mob_skills.rows,
    mob_stats: mob_stats.rows,
    mob_elements: mob_elements.rows
  };

  fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
  console.log('✅ Exportado para data.json com sucesso!');
}

exportToJson().catch(err => console.error('Erro ao exportar:', err));
