FROM public.ecr.aws/bitnami/node:14.15.1-debian-10-r8

WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 8080

CMD ["node", "index.js"]
