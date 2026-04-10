import type { PoolClient } from 'pg'

export async function up(client: PoolClient) {
  await client.query(`DROP TABLE IF EXISTS "todo" CASCADE`)
}
