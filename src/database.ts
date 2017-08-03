import {Pool} from 'pg';

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

  async saveRecord(record: Record) {
    let query = `
      INSERT INTO public.records (sender, time, longitude, latitude, altitude)
      VALUES ($1, to_timestamp(div($2, 1000)), $3, $4, round($5))
      ON CONFLICT DO NOTHING
    `;

    let values = [record.from, record.time, record.longitude, record.latitude, record.altitude];

    await this.pool.query(query, values);
  }
}
