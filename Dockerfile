FROM rust AS rust_builder
WORKDIR /app
COPY twopi-service twopi-service
WORKDIR /app/twopi-service
RUN cargo build --release
ENV TWOPI_DATA_DIR=../data
RUN cargo run --release -- --gen-api openapi.gen.json

FROM node:22 AS node_builder
RUN npm install -g pnpm
WORKDIR /app
COPY twopi-web twopi-web
COPY --from=rust_builder /app/twopi-service/openapi.gen.json /app/twopi-web
WORKDIR /app/twopi-web
RUN pnpm install
RUN pnpm run build

FROM node:22 AS node_runtime
RUN npm install -g pnpm
WORKDIR /app
COPY --from=node_builder /app/twopi-web/dist /app/twopi-web/dist
COPY --from=rust_builder /app/twopi-service/target/release/twopi-service /app/twopi-service
WORKDIR /app
ENTRYPOINT [ "./twopi-service" ]
