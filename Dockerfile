FROM node:alpine
WORKDIR /usr/src/app
COPY package*.json .
RUN npm ci
ENV NODE_ENV production
COPY . .
ENV PORT 5000
EXPOSE $PORT
CMD ["npm", "start"]


