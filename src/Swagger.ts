import consoleStamp from 'console-stamp';
import swaggerAutogen from 'swagger-autogen';

consoleStamp(console);

const server = {
  url: 'http://127.0.0.1:8080',
  description: 'Primary'
};

if (process.env["SWAGGER_URL"] != null) {
  server.url = process.env["SWAGGER_URL"];
}

const doc = {
  info: {
    version: 'v1.0.0',
    title: 'Weird translator API',
    description: 'API for using translators from lingojam.com'
  },
  servers: [server],
  components: {
  },
  tags: [
    {
      name: "Translator",
      description: "API for translator"
    },
  ]
};

const outputFile = '../swagger.json';
const endpointFiles = [
  './src/Server.ts',
];

swaggerAutogen({ openapi: '3.0.0' })(outputFile, endpointFiles, doc);
