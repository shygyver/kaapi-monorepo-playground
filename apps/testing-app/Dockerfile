FROM docker.io/node:lts-alpine

ENV HOST=0.0.0.0
ENV PORT=3000

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json ./
RUN pnpm install --prod

COPY dist ./dist

EXPOSE 3000

CMD [ "node", "dist/index.js" ]
