# ======================
# Dependencies
# ======================
FROM node:20-alpine AS deps

WORKDIR /app

RUN apk add --no-cache ffmpeg

COPY package*.json ./

RUN npm ci

# ======================
# Builder
# ======================
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"

RUN npx prisma generate
RUN npm run build

# ======================
# Runner
# ======================
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache ffmpeg

ENV NODE_ENV=production

COPY --from=builder /app ./

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:all"]