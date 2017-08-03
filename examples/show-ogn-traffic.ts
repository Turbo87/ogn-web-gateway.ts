import OGNClient from '../src/ogn-client';

if (process.argv.length < 2) {
  console.log('Usage: ts-node examples/show-ogn-traffic.ts');
  process.exit(1);
}

console.log('Connecting');
let client = new OGNClient();

client.on('ready', () => {
  console.log('Connected');
});

client.on('record', (record: any) => {
  let from = record.from;
  if (!from) return;

  let isAircraft = from.call.startsWith('FLR') || from.call.startsWith('ICA') || from.call.startsWith('OGN');
  if (!isAircraft) return;

  let data = record.data;
  if (!data) return;

  printRecord(from.call, data);
});

client.on('close', () => {
  console.log('Connection closed');
});

client.connect();

function printRecord(from: string, data: any) {
  console.log(data.timestamp, from, data.longitude, data.latitude, Math.round(data.altitude) + 'm');
}
