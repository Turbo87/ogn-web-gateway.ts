import { Server } from 'http';

import Database from './database';
import OGNClient from './ogn-client';
import {convertRecord, encodeRecord} from './record';

import Koa = require('koa');

export default class OGNWebGateway {
  private readonly db: Database;
  private readonly ognClient: OGNClient;
  private readonly app: Koa;
  private server: Server | null = null;

  private cleanupTimer: NodeJS.Timer;
  private readonly cleanupInterval = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.db = new Database();

    this.ognClient = new OGNClient();
    this.ognClient.onRecord = this.onRecord.bind(this);
    this.ognClient.onClose = () => this.ognClient.connect();

    this.app = new Koa();
    this.app.use(async ctx => {
      if (ctx.originalUrl === '/history') {
        ctx.type = 'application/json';

        let records = await this.db.getRecordsForId('FLRDDF9E9');
        ctx.body = JSON.stringify(records);

      } else {
        ctx.throw(404, 'Not found');
      }
    });
  }

  start() {
    this.ognClient.connect();

    this.scheduleCleanup();

    this.server = this.app.listen(3000);
  }

  async stop() {
    if (this.server) {
      await new Promise(resolve => this.server!.close(resolve));
      this.server = null;
    }

    this.ognClient.disconnect();
    await this.db.end();
  }

  private scheduleCleanup() {
    this.cleanupTimer = setTimeout(async () => {
      await this.db.cleanup();
      this.scheduleCleanup();
    }, this.cleanupInterval);
  }

  private onRecord(_record: any) {
    let record = convertRecord(_record);
    if (!record) return;

    if (!record.isReceiver && record.latitude !== null && record.longitude !== null) {
      this.db.saveRecord(record);
    }

    let msg = encodeRecord(record);

    console.log(msg);
  }
}
