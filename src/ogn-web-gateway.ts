import Database from './database';
import OGNClient from './ogn-client';
import {convertRecord, encodeRecord} from './record';

export default class OGNWebGateway {
  private readonly ognClient: OGNClient;
  private readonly db: Database;

  private cleanupTimer: NodeJS.Timer;
  private readonly cleanupInterval = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.db = new Database();

    this.ognClient = new OGNClient();
    this.ognClient.onRecord = this.onRecord.bind(this);
    this.ognClient.onClose = () => this.ognClient.connect();
  }

  start() {
    this.ognClient.connect();

    this.scheduleCleanup();
  }

  async stop() {
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
