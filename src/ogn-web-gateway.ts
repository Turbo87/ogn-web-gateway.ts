import OGNClient from './ogn-client';

const FPM_TO_MPS = 0.00507999983744;

export interface Record {
  from: string;
  to: string | null;
  time: number;
  longitude: number | null;
  latitude: number | null;
  altitude: number | null;
  verticalSpeed: number | null;
  heading: number | null;
  degreePerSecond: number | null;
  speed: number | null;
  symbol: string | null;
  isReceiver: boolean;
}

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
    let record = OGNWebGateway.convertRecord(_record);
    if (!record) return;

    let msg = OGNWebGateway.encodeRecord(record);

    console.log(msg);
  }

  static convertRecord(record: any): Record | null {
    let from = record.from && record.from.call as (string | undefined);
    if (!from) return null;

    let data = record.data;
    if (!data || data.constructor.name !== 'Position' || !data.timestamp) return null;

    let degreePerSecond: number | null = null;
    let verticalSpeed: number | null = null;

    let match = data.comment && data.comment.match(/(?:([-+]\d+)fpm).*(?:([-+][0-9]*\.?[0-9]+)rot)/);
    if (match) {
      verticalSpeed = parseFloat(match[1]) * FPM_TO_MPS;
      degreePerSecond = parseFloat(match[2]);
    }

    let to = (record.via && record.via.length && record.via.pop().call) || null;
    let time = Date.parse(data.timestamp);
    let longitude = (data.longitude !== undefined) ? data.longitude : null;
    let latitude = (data.latitude !== undefined) ? data.latitude : null;
    let altitude = data.altitude ? data.altitude : null;
    let heading = data.extension && data.extension.courseDeg !== undefined ? data.extension.courseDeg : null;
    let speed = data.extension && data.extension.speedMPerS !== undefined ? data.extension.speedMPerS : null;
    let symbol = data.symbol || null;
    let isReceiver = symbol === 'I&';

    return {
      from, to, time, longitude, latitude, altitude, verticalSpeed,
      heading, degreePerSecond, speed, symbol, isReceiver,
    };
  }

  static encodeRecord(record: Record): string {
    return [
      record.from,
      record.to,
      record.time,
      (record.longitude !== null) ? Math.round(record.longitude * 100000) / 100000 : null,
      (record.latitude !== null) ? Math.round(record.latitude * 100000) / 100000 : null,
      (record.altitude !== null) ? Math.round(record.altitude) : null,
      (record.verticalSpeed !== null) ? Math.round(record.verticalSpeed * 100) / 100 : null,
      record.heading,
      record.degreePerSecond,
      (record.speed !== null) ? Math.round(record.speed * 100) / 100 : null,
      record.symbol,
    ].map(it => (it === null) ? '' : it).join('|');
  }
}
