# Multi-stage Dockerfile for PulseOps Monitor
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev || true
COPY . .
RUN mkdir -p node_modules || true
RUN if [ -f package.json ] && grep -q "build" package.json; then npm run build; fi

FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app .
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
EXPOSE 3000
CMD ["node", "src/index.js"]
