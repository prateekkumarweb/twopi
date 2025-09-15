FROM node:22 AS node_planner
RUN npm install -g pnpm
RUN apt-get update && apt-get install -y ripgrep jq
WORKDIR /app
COPY khata-ui khata-ui
WORKDIR /app/khata-ui
RUN pnpm install
RUN mkdir -p ../khata-service
RUN pnpm run gen:routes

FROM lukemathwalker/cargo-chef:latest-rust-1 AS chef
WORKDIR /app

FROM chef AS rust_planner
WORKDIR /app
COPY khata-service khata-service
WORKDIR /app/khata-service
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS rust_builder
COPY --from=rust_planner /app/khata-service/recipe.json /app/khata-service/recipe.json
WORKDIR /app/khata-service
RUN cargo chef cook --release --recipe-path recipe.json
WORKDIR /app
COPY khata-service khata-service
WORKDIR /app/khata-service
COPY --from=node_planner /app/khata-service/routes.gen.txt /app/khata-service/routes.gen.txt
RUN cargo build --release
ENV KHATA_DATA_DIR=../data
RUN CURRENCY_API_KEY="" KHATA_SECRET_KEY="" cargo run --release -- gen-api openapi.gen.json

FROM node_planner AS node_builder
COPY --from=rust_builder /app/khata-service/openapi.gen.json /app/khata-ui/openapi.gen.json
WORKDIR /app/khata-ui
RUN pnpm run build-only

FROM ubuntu:noble AS runtime
COPY --from=node_builder /app/khata-ui/dist /app/khata-ui/dist
COPY --from=rust_builder /app/khata-service/target/release/khata-service /app/khata-service
WORKDIR /app
ENTRYPOINT [ "./khata-service" ]
