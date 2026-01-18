FROM docker.io/node:lts-alpine

# Container-to-container: kafka:9094 | Host access: localhost:9092
ENV KAFKA_BROKERS=kafka:9094

WORKDIR /app

COPY dist ./dist
COPY package.json ./

RUN corepack enable && corepack prepare pnpm@latest --activate && pnpm install --prod

CMD [ "node", "dist/index.js" ]
