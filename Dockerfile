FROM node:22-bookworm-slim AS deps

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build

ARG NEXT_PUBLIC_GORTEX_URL=https://gortex.take3tech.dev
ENV NEXT_PUBLIC_GORTEX_URL=${NEXT_PUBLIC_GORTEX_URL}
ENV NEXT_TELEMETRY_DISABLED=1

COPY . .
RUN npm run typecheck \
    && npm run build \
    && npm run check:browser-secrets

FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN groupadd --gid 65532 gortexweb \
    && useradd --uid 65532 --gid 65532 --home-dir /app --no-create-home --shell /usr/sbin/nologin gortexweb

COPY --from=build --chown=65532:65532 /app/public ./public
COPY --from=build --chown=65532:65532 /app/.next/standalone ./
COPY --from=build --chown=65532:65532 /app/.next/static ./.next/static

USER 65532:65532

EXPOSE 3000

CMD ["node", "server.js"]
