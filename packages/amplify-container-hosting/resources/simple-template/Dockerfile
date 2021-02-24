# Build the App using node
FROM public.ecr.aws/bitnami/node:14.15.1-debian-10-r8 AS builder
WORKDIR /app
COPY . .
RUN yarn install && yarn build

# Host the App using nginx
EXPOSE 80
FROM public.ecr.aws/nginx/nginx:1.19.5
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY --from=builder /app/build .
ENTRYPOINT ["nginx", "-g", "daemon off;"]