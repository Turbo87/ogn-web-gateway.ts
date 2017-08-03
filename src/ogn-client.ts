import {Socket} from 'net';
import readline = require('readline');
import {ReadLine} from 'readline';

const aprs = require('aprs-parser');

export default class OGNClient {
  readonly host = 'aprs.glidernet.org';
  readonly port = 10152;

  readonly user = 'test';
  readonly pass = '-1';
  readonly appName = 'test';
  readonly appVersion = '1.0';

  private socket: Socket | undefined;
  private reader: ReadLine | undefined;
  private readonly parser = new aprs.APRSParser();
  private _timer: any;

  onReady = () => {};
  onLine = (line: string) => {};
  onRecord = (record: any) => {};
  onClose = () => {};

  connect() {
    let socket = this.socket = new Socket();
    let reader = this.reader = readline.createInterface({ input: socket as NodeJS.ReadableStream });

    socket.connect(this.port, this.host, () => {
      socket.write(`user ${this.user} pass ${this.pass} vers ${this.appName} ${this.appVersion}\n`);
      this.onReady();
    });

    socket.on('close', () => {
      if (this._timer) {
        clearTimeout(this._timer);
        this._timer = undefined;
      }
      this.onClose();
    });

    reader.on('line', line => this.handleLine(line));

    this._timer = setTimeout(() => this.sendKeepAlive(), 30000);
  }

  disconnect() {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = undefined;
    }

    if (this.socket) {
      this.socket.destroy();
      this.socket = undefined;
    }
  }

  handleLine(line: string) {
    this.onLine(line);

    let record = this.parser.parse(line);
    this.onRecord(record);
  }

  scheduleKeepAlive() {
    this._timer = setTimeout(() => {
      this.sendKeepAlive();
      this.scheduleKeepAlive();
    }, 30000);
  }

  sendKeepAlive() {
    if (this.socket)
      this.socket.write('# keep alive');
  }
}
