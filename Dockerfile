FROM node:22 AS node_planner
RUN npm install -g pnpm
RUN sudo apt-get install ripgrep jq
WORKDIR /app
COPY twopi-web twopi-web
WORKDIR /app/twopi-web
RUN pnpm install
RUN pnpm run gen:routes

FROM lukemathwalker/cargo-chef:latest-rust-1 AS chef
WORKDIR /app

FROM chef AS rust_planner
WORKDIR /app
COPY twopi-service twopi-service
WORKDIR /app/twopi-service
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS rust_builder
COPY --from=rust_planner /app/twopi-service/recipe.json /app/twopi-service/recipe.json
WORKDIR /app/twopi-service
RUN cargo chef cook --release --recipe-path recipe.json
WORKDIR /app
COPY twopi-service twopi-service
WORKDIR /app/twopi-service
COPY --from=node_planner /app/twopi-service/routes.gen.txt /app/twopi-service/routes.gen.txt
RUN cargo build --release
ENV TWOPI_DATA_DIR=../data
ENV CURRENCY_API_KEY=""
ENV TWOPI_SECRET_KEY=""
RUN cargo run --release -- gen-api openapi.gen.json

FROM node_planner AS node_builder
COPY --from=rust_builder /app/twopi-service/openapi.gen.json /app/twopi-web/openapi.gen.json
WORKDIR /app/twopi-web
RUN pnpm run build

FROM ubuntu:noble AS runtime
COPY --from=node_builder /app/twopi-web/dist /app/twopi-web/dist
COPY --from=rust_builder /app/twopi-service/target/release/twopi-service /app/twopi-service
WORKDIR /app
ENTRYPOINT [ "./twopi-service" ]
