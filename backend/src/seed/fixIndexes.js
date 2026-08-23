const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const db = mongoose.connection.db;
  const col = db.collection('books');

  // List all indexes
  const indexes = await col.indexes();
  console.log('Current indexes:', indexes.map(i => i.name));

  // Drop ALL non-_id indexes
  for (const idx of indexes) {
    if (idx.name !== '_id_') {
      try {
        await col.dropIndex(idx.name);
        console.log('Dropped index:', idx.name);
      } catch (e) {
        console.log('Skip:', idx.name, e.message);
      }
    }
  }

  // Fix all docs that have language as empty string — unset them
  const result = await col.updateMany({ language: '' }, { $unset: { language: '' } });
  console.log('Fixed docs with empty language string:', result.modifiedCount);

  console.log('Done! Restart the backend now.');
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
