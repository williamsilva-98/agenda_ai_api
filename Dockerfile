FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY src ./src
COPY docker/entrypoint.sh ./docker/entrypoint.sh
RUN chmod +x docker/entrypoint.sh

ENV NODE_ENV=production
EXPOSE 3000
ENTRYPOINT ["docker/entrypoint.sh"]
