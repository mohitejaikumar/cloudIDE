FROM node:16
WORKDIR /cloudIDE

COPY package*.json ./
RUN npm install
COPY ./dist ./dist
COPY ./user ./user

CMD ["npm" , "run" , "start"]

EXPOSE 3000
EXPOSE 8080