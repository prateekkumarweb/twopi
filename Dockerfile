FROM node:23 AS node_builder
RUN npm install -g pnpm
WORKDIR /app
COPY twopi-web twopi-web
WORKDIR /app/twopi-web
RUN pnpm install
RUN pnpm run build

FROM rust AS rust_builder
WORKDIR /app
COPY currency-cache currency-cache
WORKDIR /app/currency-cache
RUN cargo build --release

FROM node:23-alpine AS node_runtime
COPY --from=node_builder /app/twopi-web/.output /app/twopi-web
COPY --from=rust_builder /app/currency-cache/target/release/currency-cache /app/currency-cache
CMD [ "/app/twopi-web/server/index.mjs" ]
