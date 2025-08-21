FROM node:18-alpine

ENV NODE_ENV=production
WORKDIR /usr/src/app

# Install dependencies with clean layer caching
COPY package*.json ./
RUN npm ci --only=production

# Copy the rest of the app
COPY . .

# Create and use an unprivileged user
RUN addgroup -S app && adduser -S app -G app
USER app


CMD ["node", "index.js"]
