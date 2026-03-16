# ---------- Dependencies stage ----------
FROM node:22-slim AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci


# ---------- Build stage ----------
FROM node:22-slim AS builder
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl

COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY tsconfig*.json ./
COPY prisma ./prisma
COPY src ./src

RUN npx prisma generate
RUN npm run build

# ---------- Production stage ----------
FROM node:22-slim

ENV NODE_ENV=production
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl

COPY package*.json ./

# Install production deps
RUN npm ci --omit=dev

# Copy prisma schema
COPY prisma ./prisma

# Generate Prisma client HERE (important)
RUN npx prisma generate

# Copy built app
COPY --from=builder /app/dist ./dist

USER node

EXPOSE 3000

CMD ["node", "dist/src/main.js"]