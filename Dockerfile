FROM node:22 AS node_builder
RUN npm install -g pnpm
WORKDIR /app
COPY twopi-web twopi-web
WORKDIR /app/twopi-web
RUN pnpm install
RUN pnpm run build

FROM rust AS rust_builder
WORKDIR /app
COPY twopi-service twopi-service
WORKDIR /app/twopi-service
RUN cargo build --release

FROM node:22 AS node_runtime
RUN npm install -g pnpm
WORKDIR /app
COPY --from=node_builder /app/twopi-web /app/twopi-web
COPY --from=rust_builder /app/twopi-service/target/release/twopi-service /app/twopi-service
WORKDIR /app/twopi-web
ENTRYPOINT [ "./entrypoint.sh" ]
