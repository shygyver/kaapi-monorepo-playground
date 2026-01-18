FROM docker.io/node:lts-alpine

ENV HOST=0.0.0.0
ENV PORT=3000
ENV EXTERNAL_URI=http://localhost:8005

# Container-to-container: kafka:9094 | Host access: localhost:9092
ENV KAFKA_BROKERS=kafka:9094

WORKDIR /app

COPY dist ./dist
COPY package.json ./

RUN corepack enable && corepack prepare pnpm@latest --activate && pnpm install --prod

EXPOSE 3000
CMD [ "node", "dist/index.js" ]
