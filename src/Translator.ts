import * as puppeteer from 'puppeteer';
import Server from './Server';

export class Translator {
	private translatorName: string;
	private ready: boolean;
	private page: puppeteer.Page = null;
	private _server: Server;


	constructor(server: Server, translatorName: string) {
		this.translatorName = translatorName;
		this.ready = false;
		this._server = server;
	}

	public async init() {
		if (this.ready) {
			return;
		}

		console.log("Translator " + this.translatorName + " is starting...");

		let url: string = "https://lingojam.com/" + this.translatorName;
		console.log("URL is " + url);

		this.page = await this._server.browser.newPage();

		await this.page.goto(url);

		this.ready = true;
		console.log("Translator " + this.translatorName + " is ready!");

		console.log("Running test on " + this.translatorName);
		let test = await this.translate("Hello world!");
		console.log("(Hello World! test): " + test + " from " + this.translatorName);
	}

	public isReady(): boolean {
		return this.ready;
	}

	public getTranslatorName(): string {
		return this.translatorName;
	}

	public async translate(text: string): Promise<string> {
		let result = await this.page.evaluate((textToTranslate) => {
			return eval("translate(\"" + textToTranslate.replace(/"/g, '\\"').replace(/[\r\n]+/g,"\\n") + "\");");
		}, text);

		return result;
	}
}