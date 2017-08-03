import OGNClient from './ogn-client';
import {convertRecord, encodeRecord} from './record';

export default class OGNWebGateway {
  private readonly ognClient: OGNClient;

  constructor() {
    this.ognClient = new OGNClient();
    this.ognClient.onRecord = this.onRecord.bind(this);
    this.ognClient.onClose = () => this.ognClient.connect();
  }

  start() {
    this.ognClient.connect();
  }

  stop() {
    this.ognClient.disconnect();
  }

  onRecord(_record: any) {
    let record = convertRecord(_record);
    if (!record) return;

    let msg = encodeRecord(record);

    console.log(msg);
  }
}
