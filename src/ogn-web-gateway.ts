import { Server } from 'http';

import Database from './database';
import OGNClient from './ogn-client';
import {convertRecord, encodeRecord} from './record';

import Koa = require('koa');
import route = require('koa-route');
import websockify = require('koa-websocket');
import WebSocket = require('ws');

export default class OGNWebGateway {
  private readonly db: Database;
  private readonly ognClient: OGNClient;
  private readonly app: Koa;
  private server: Server | null = null;

  private clients: WebSocket[] = [];
  private cleanupTimer: NodeJS.Timer;
  private readonly cleanupInterval = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.db = new Database();

    this.ognClient = new OGNClient();
    this.ognClient.onRecord = this.onRecord.bind(this);
    this.ognClient.onClose = () => this.ognClient.connect();

    let app = this.app = websockify(new Koa());

    app.use(route.get('/history', async ctx => {
      ctx.type = 'application/json';

      let records = await this.db.getRecordsForId('FLRDDF9E9');
      ctx.body = JSON.stringify(records);
    }));

    app.ws.use(route.get('/live', async ctx => {
      let websocket = (ctx as any).websocket as WebSocket;

      this.clients.push(websocket);

      websocket.onclose = () => this.removeClient(websocket);
    }));

    app.ws.use(async ctx => {
      let websocket = (ctx as any).websocket as WebSocket;
      websocket.terminate();
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

    for (let client of this.clients) {
      client.send(msg);
    }
  }

  private removeClient(websocket: WebSocket) {
    let index = this.clients.indexOf(websocket);
    if (index !== -1) {
      this.clients.splice(index, 1);
    }
  }
}
