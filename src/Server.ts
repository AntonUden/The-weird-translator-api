import * as express from "express";
import * as puppeteer from 'puppeteer';
import { Translator } from "./Translator";

export default class Server {
	public languages: string[] = [];
	private app;
	private http;

	public translators: Translator[] = [];

	public browser: puppeteer.Browser;


	constructor(port: number, languages: string[]) {
		this.languages = languages;

		this.app = express();
		this.app.set("port", port);

		this.app.use(require('body-parser').text({ type: "*/*" }));
		this.app.use(require('cors')());
		this.app.use(require('helmet')())

		this.app.disable('x-powered-by');

		this.http = require("http").Server(this.app);
		this.app.use('/', express.static(__dirname + '/../index'));

		this.app.get("/get_translators", async(req: any, res: any) => {
			let result: string[] = [];
			this.translators.forEach(translator => {
				if(translator.isReady()) {
					result.push(translator.getTranslatorName());
				}
			});
			res.json(result);
		});

		this.app.get("/:translator/is_ready", async(req, res) => {
			let translator: Translator = null;
			if(req.params.translator != null) {
				this.translators.forEach(t => {
					if(t.getTranslatorName() == req.params.translator) {
						translator = t;
					}
				});
			}

			if(translator == null) {
				res.sendStatus(404);
				return;
			}

			res.json({is_ready: translator.isReady()});
		});

		this.app.post('/:translator/translate', async (req, res) => {
			let translator: Translator = null;

			if(req.params.translator != null) {
				this.translators.forEach(t => {
					if(t.getTranslatorName() == req.params.translator) {
						translator = t;
					}
				});
			}

			if(translator == null) {
				res.sendStatus(404);
				return;
			}

			let result = {};

			if(translator.isReady()) {
				let text = "" + req.body;
				
				if(text.length > 0) {
					if(text.length > 65535) {
						result = {
							success: false,
							error: "Text is too long"
						}
					} else {
						try {
							let textResult = await translator.translate(text);

							if(req.query.plaintext != undefined) {
								return;
							}

							result = {
								success: true,
								result: textResult
							}
						} catch(err) {
							console.error("Failed to translate text using translator " + translator.getTranslatorName());
							console.error(err);
							result = {
								success: false,
								result: "An internal exception occured"
							}
						}
					}
				} else {
					result = {
						success: true,
						result: ""
					}
				}
			} else {
				result = {
					success: false,
					result: "Translator not ready"
				}
			}

			res.json(result);
		});

		languages.forEach(lang => {
			this.translators.push(new Translator(this, lang));
		});

		this.app.set("port", port);
		this.http.listen(port, function () {
			console.log("Listening on port " + port);
		});

		this.init();
	}

	private async init() {
		console.log("Initialising");
		console.log("Launching puppeteer...");
		this.browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
		console.log("Puppeteer launched!");


		console.log("Initialising translators");
		this.translators.forEach(async (translator) => {
			await translator.init();
		});
	}
}