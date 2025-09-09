FROM node:20-alpine

ENV NODE_ENV=production
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Create and use an unprivileged user
RUN addgroup -S app && adduser -S app -G app
USER app

CMD ["node", "index.js"]
