FROM node:20

WORKDIR /app

RUN npm install -g npm@10.8.2

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]