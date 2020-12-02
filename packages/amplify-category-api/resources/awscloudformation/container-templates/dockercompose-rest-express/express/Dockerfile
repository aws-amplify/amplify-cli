FROM public.ecr.aws/bitnami/node:14.15.1-debian-10-r8

ENV PORT=8080
EXPOSE 8080

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install
COPY . .

CMD [ "node", "index.js" ]
    