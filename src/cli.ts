import OGNWebGateway from './ogn-web-gateway';

if (process.argv.length < 2) {
  console.log('Usage: ts-node src/cli.ts');
  process.exit(1);
}

let gateway = new OGNWebGateway();

gateway.start();
