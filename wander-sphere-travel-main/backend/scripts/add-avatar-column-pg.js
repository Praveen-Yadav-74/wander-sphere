import { Client } from 'pg';

const client = new Client({
  host: 'db.gserzaenfrmrqoffzcxr.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'praveen@742532',
});

async function addAvatarColumn() {
  try {
    await client.connect();
    console.log('Connected to database');

    const query = 'ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT;';
    await client.query(query);
    console.log('Avatar column added successfully');

  } catch (error) {
    console.error('Error adding avatar column:', error);
  } finally {
    await client.end();
  }
}

addAvatarColumn();