FROM debian:bookworm

RUN apt-get update -yq
RUN apt-get install curl gnupg -yq
RUN curl -sL https://deb.nodesource.com/setup_lts.x | bash
RUN apt-get install nodejs -yq
RUN apt-get clean -y

RUN apt-get update \
	&& apt-get install -y wget gnupg \
	&& wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
	&& sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
	&& apt-get update \
	&& apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
	--no-install-recommends \
	&& rm -rf /var/lib/apt/lists/*

ADD . /app/
WORKDIR /app

RUN npm install --global typescript yarn

WORKDIR /app

COPY package.json ./

COPY . .

RUN yarn install

RUN tsc

EXPOSE 8080

CMD ["npm", "run", "start-with-swagger"]
