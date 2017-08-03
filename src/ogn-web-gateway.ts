import Database from './database';
import OGNClient from './ogn-client';
import {convertRecord, encodeRecord} from './record';

export default class OGNWebGateway {
  private readonly ognClient: OGNClient;
  private readonly db: Database;

  constructor() {
    this.db = new Database();

    this.ognClient = new OGNClient();
    this.ognClient.onRecord = this.onRecord.bind(this);
    this.ognClient.onClose = () => this.ognClient.connect();
  }

  start() {
    this.ognClient.connect();
  }

  async stop() {
    this.ognClient.disconnect();
    await this.db.end();
  }

  onRecord(_record: any) {
    let record = convertRecord(_record);
    if (!record) return;

    if (!record.isReceiver && record.latitude !== null && record.longitude !== null) {
      this.db.saveRecord(record);
    }

    let msg = encodeRecord(record);

    console.log(msg);
  }
}
