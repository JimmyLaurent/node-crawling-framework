const { spawn } = require('child_process');
const path = require('path');
console.log(path.join(path.dirname(__filename), '/staticServer.js'));
const proc = spawn(
  'node',
  [`${path.join(path.dirname(__filename), '/mock-server/staticServer.js')}`],
  { cwd: path.join(path.dirname(__filename), '/mock-server/') }
);
//setInterval(() => 1000)

console.log('toto');
