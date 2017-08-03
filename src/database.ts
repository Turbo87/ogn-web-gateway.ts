import {Pool, QueryConfig, QueryResult} from 'pg';

import Record from './record';

export default class Database {
  private readonly pool: Pool;

  constructor() {
    this.pool = new Pool({
      database: 'ogn-web-gateway',
    });
  }

  async end() {
    await this.pool.end();
  }

  async getRecordsForId(id: string): Promise<any[]> {
    let text = `
      SELECT sender, NULL, extract(EPOCH FROM time::timestamptz) AS time, longitude, latitude, altitude
      FROM records
      WHERE sender = $1
      ORDER BY time ASC
    `;

    let result = await this.pool.query({ text, values: [id], rowMode: 'array' } as QueryConfig);
    return result.rows.map(row => row.map((it: any) => (it === null) ? '' : it).join('|'));
  }

  async saveRecord(record: Record) {
    let query = `
      INSERT INTO public.records (sender, time, longitude, latitude, altitude)
      VALUES ($1, to_timestamp(div($2, 1000)), $3, $4, round($5))
      ON CONFLICT DO NOTHING
    `;

    let values = [record.from, record.time, record.longitude, record.latitude, record.altitude];

    await this.pool.query(query, values);
  }

  /**
   * Deletes all records older than 24 hours
   */
  async cleanup() {
    let threshold = Date.now() - 24 * 60 * 60 * 1000;
    await this.pool.query('DELETE FROM records WHERE time < to_timestamp(div($1, 1000))', [threshold]);
    await this.pool.query('VACUUM');
  }
}
