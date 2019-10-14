FROM node:12-alpine
WORKDIR /src
COPY ./package*.json ./
RUN npm install --production
COPY . .
ENTRYPOINT ["node", "/src/index.js"]