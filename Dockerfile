FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache ffmpeg

COPY package*.json ./
RUN npm ci

COPY . .

ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"

RUN npx prisma generate
RUN npm run build

ENV NODE_ENV=production

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:all"]