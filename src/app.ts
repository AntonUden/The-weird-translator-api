import Server from "./Server";

require('console-stamp')(console, '[HH:MM:ss.l]');

let languages: string[] = require("../translators.json");

let port: any = process.env.PORT || 8080;

new Server(port, languages);