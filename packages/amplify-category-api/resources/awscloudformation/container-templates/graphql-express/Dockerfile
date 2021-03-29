FROM public.ecr.aws/bitnami/node:14-prod-debian-10

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3000

CMD ["node", "index.js"]
