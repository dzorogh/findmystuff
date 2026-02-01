# Build stage (no Infisical — Dokploy does not pass env to build; auth/env are lazy, so build succeeds)
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime stage (standalone output = smaller image)
FROM node:22-alpine
RUN npm install -g @infisical/cli
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/scripts/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh
ENV NODE_ENV=production
EXPOSE 3000
CMD ["/app/entrypoint.sh"]
