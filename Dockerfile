# STRONG Company Website — Production Dockerfile
# Build:  docker build -t strong-website .
# Run:    docker run -d -p 3000:3000 \
#           -v $(pwd)/data:/app/data \
#           -v $(pwd)/public/images:/app/public/images \
#           --name strong strong-website

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# ---------- Dependencies ----------
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ---------- Build ----------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build

# ---------- Runtime ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -S app && adduser -S app -G app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.js ./next.config.js
# Data store (settings, products, messages) — mounted as a volume at runtime
COPY --from=builder /app/data ./data

USER app
EXPOSE 3000

CMD ["pnpm", "run", "start"]
