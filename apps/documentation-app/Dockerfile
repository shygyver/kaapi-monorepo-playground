FROM docker.io/node:lts-alpine

ENV HOST=0.0.0.0
ENV PORT=3000

RUN corepack enable

WORKDIR /app

COPY dist .
COPY package.json .


RUN pnpm install

CMD [ "node", "dist/index.js" ]
