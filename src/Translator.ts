import * as puppeteer from 'puppeteer';
import Server from './Server';
import { cyan } from 'colors';

export class Translator {
  private _name: string;
  private _ready: boolean;
  private page: puppeteer.Page | null = null;
  private _server: Server;

  constructor(server: Server, translatorName: string) {
    this._name = translatorName;
    this._ready = false;
    this._server = server;
  }

  public async init() {
    if (this.ready) {
      return;
    }

    console.log("Translator " + cyan(this.name) + " is starting...");

    const url: string = "https://lingojam.com/" + this.name;
    console.log("URL is " + url);

    this.page = await this._server.browser.newPage();

    await this.page.goto(url);

    this._ready = true;
    console.log("Translator " + cyan(this.name) + " is ready!");

    console.log("Running test on " + cyan(this.name));
    const test = await this.translate("Hello world!");
    console.log("(Hello World! test): " + cyan(test) + " from " + cyan(this.name));
  }

  public get ready(): boolean {
    return this._ready;
  }

  public get name(): string {
    return this._name;
  }

  public async translate(text: string): Promise<string> {
    if (!this.ready) {
      return text;
    }

    const result = await this.page!.evaluate((textToTranslate) => {
      return eval("translate(\"" + textToTranslate.replace(/"/g, '\\"').replace(/[\r\n]+/g, "\\n") + "\");");
    }, text);

    return result;
  }
}
