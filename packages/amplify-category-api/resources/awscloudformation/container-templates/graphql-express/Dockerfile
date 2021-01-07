FROM public.ecr.aws/bitnami/node:14.15.1-debian-10-r8

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3000

CMD ["node", "index.js"]
