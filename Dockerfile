FROM node:22 AS node_builder
RUN npm install -g pnpm
WORKDIR /app
COPY twopi-web twopi-web
WORKDIR /app/twopi-web
RUN pnpm install
RUN pnpm run db:gen
RUN pnpm run build

FROM rust AS rust_builder
WORKDIR /app
COPY currency-cache currency-cache
WORKDIR /app/currency-cache
RUN cargo build --release

FROM node:22 AS node_runtime
RUN npm install -g pnpm
WORKDIR /app
COPY --from=node_builder /app/twopi-web /app/twopi-web
COPY --from=rust_builder /app/currency-cache/target/release/currency-cache /app/currency-cache
WORKDIR /app/twopi-web
CMD [ "./entrypoint.sh" ]
