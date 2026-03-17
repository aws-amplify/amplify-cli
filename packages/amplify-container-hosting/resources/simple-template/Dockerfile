# Build the App using node
FROM public.ecr.aws/docker/library/node:22-slim AS builder
WORKDIR /app
COPY . .
RUN yarn install && yarn build

# Host the App using nginx
EXPOSE 80
FROM public.ecr.aws/nginx/nginx:stable
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY --from=builder /app/build .
ENTRYPOINT ["nginx", "-g", "daemon off;"]
