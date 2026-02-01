# Build stage (Infisical needed so next build has env vars from Infisical)
FROM node:22-alpine AS builder
WORKDIR /app
ARG INFISICAL_TOKEN
ARG INFISICAL_PROJECT_ID
ARG INFISICAL_ENV
ENV INFISICAL_TOKEN=${INFISICAL_TOKEN}
ENV INFISICAL_PROJECT_ID=${INFISICAL_PROJECT_ID}
ENV INFISICAL_ENV=${INFISICAL_ENV}
RUN npm install -g @infisical/cli
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN infisical run --projectId "$INFISICAL_PROJECT_ID" -- npm run build

# Runtime stage (standalone output = smaller image)
FROM node:22-alpine
RUN npm install -g @infisical/cli
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
ENV NODE_ENV=production
EXPOSE 3000
CMD ["/bin/sh", "-c", "infisical run --projectId \"$INFISICAL_PROJECT_ID\" -- node server.js"]
