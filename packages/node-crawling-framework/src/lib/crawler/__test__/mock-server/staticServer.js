const StaticServer = require('static-server');
const server = new StaticServer({
  rootPath: './static',
  port: 8082
});

server.start(() => {
  console.log('Server listening to', server.port);
});