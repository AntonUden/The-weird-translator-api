import express, { Request, Response } from "express";
import * as puppeteer from 'puppeteer';
import cors from 'cors';
import { Translator } from "./Translator";
import bodyParser from "body-parser";
import { existsSync } from "fs";
import swaggerUi from "swagger-ui-express";
import { green } from "colors";

export default class Server {
  public languages: string[] = [];
  private app;

  public translators: Translator[] = [];

  public browser: puppeteer.Browser;

  constructor(port: number, languages: string[]) {
    this.languages = languages;

    this.app = express();
    this.app.set("port", port);

    this.app.use(cors());

    this.app.disable('x-powered-by');

    this.app.get("/get_translators", async (_: Request, res: Response) => {
      /*
      #swagger.path = '/get_translators'
      #swagger.tags = ['Translator'],
      #swagger.description = "Get a list of all ready translator names"
      #swagger.responses[200] = { description: "Ok" }
      */
      res.json(this.translators.filter(t => t.ready).map(t => t.name));
    });

    this.app.get("/:translator/is_ready", async (req: Request, res: Response) => {
      /*
      #swagger.path = '/{translator}/is_ready'
      #swagger.tags = ['Translator'],
      #swagger.description = "Check if a translator is ready"
      #swagger.responses[200] = { description: "Ok" }
      #swagger.responses[404] = { description: "Translator not found" }
      */
      const name = String(req.params.translator);
      const translator = this.translators.find(t => t.name == name);

      if (translator == null) {
        res.status(404).send({ message: "Translator not found" });
        return;
      }

      res.json({ is_ready: translator.ready });
    });

    this.app.post('/:translator/translate', [bodyParser.text({ type: '*/*' })], async (req: Request, res: Response) => {
      /*
      #swagger.path = '/{translator}/translate'
      #swagger.tags = ['Translator'],
      #swagger.description = "Translate the text provided in the post body. At the moment there seem to be a bug where if you try this endpoint is swagger it returns [object object] instead"
      #swagger.responses[200] = { description: "Ok" }
      #swagger.responses[404] = { description: "Translator not found" }
      #swagger.responses[413] = { description: "Content too long. Max length is 65535" }
      #swagger.responses[425] = { description: "Translator is not ready" }

      #swagger.parameters['plaintext'] = {
        in: 'query',
        description: 'Send data as plain text instead of json',
        required: false,
        type: 'boolean'
      }

      #swagger.parameters['body'] = {
        in: 'body',
        description: 'The text to translate',
        schema: "Hello World!"
      }
      */
      const name = String(req.params.translator);
      const translator = this.translators.find(t => t.name == name);

      if (translator == null) {
        res.status(404).send({ message: "Translator not found" });
        return;
      }

      if (translator.ready) {
        const text = String(req.body);

        if (text.length > 0) {
          if (text.length > 65535) {
            res.status(413).send({ message: "Text too long" });
          } else {
            try {
              const textResult = await translator.translate(text);

              if (String(req.query.plaintext).toLocaleLowerCase() === "true") {
                return res.send(textResult);
              }

              res.json({
                result: textResult
              });
            } catch (err) {
              console.error("Failed to translate text using translator " + translator.name);
              console.error(err);
              res.status(500).send({ message: "An internal exception occured" });
            }
          }
        } else {
          res.json({ result: "" });
        }
      } else {
        res.status(425).send({ message: "Translator not ready" });
      }
    });

    if (existsSync("./swagger.json")) { // Path is relative to where the npm command runns from here
      const swaggerOutput = require("../swagger.json"); // But relative to the Server.ts file here
      this.app.use("/", swaggerUi.serve, swaggerUi.setup(swaggerOutput));
    } else {
      console.error("Could not find swagger.json. Make sure to run \"npm run swagger\" before starting the server");
      console.warn("Swagger documentation will not be available until this is resolved");
      this.app.get("/", (_: Request, res: Response) => {
        /*
        #swagger.ignore = true
        */
        res.send("Could not find swagger.json. Make sure to run \"npm run swagger\" before starting the server");
      });
    }

    languages.forEach(lang => {
      this.translators.push(new Translator(this, lang));
    });

    this.app.set("port", port);
    this.app.listen(port, () => {
      console.log("Listening on port " + green(String(port)));
    });

    this.init();
  }

  private async init() {
    console.log("Initialising");
    console.log("Launching puppeteer...");
    this.browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    console.log(green("Puppeteer launched!"));


    console.log("Initialising translators");
    for (let i = 0; i < this.translators.length; i++) {
      const translator = this.translators[i];
      await translator.init();
    }
  }
}
