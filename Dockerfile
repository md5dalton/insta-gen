FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

RUN npm run build
RUN npx prisma generate

ENV NODE_ENV=production

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]