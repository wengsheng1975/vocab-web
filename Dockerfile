FROM node:20-bookworm-slim

WORKDIR /app

# Build frontend
COPY client/package*.json ./client/
RUN npm --prefix client ci
COPY client ./client
RUN npm --prefix client run build

# Install backend deps
COPY server/package*.json ./server/
RUN npm --prefix server ci --omit=dev
COPY server ./server

ENV NODE_ENV=production

WORKDIR /app/server
EXPOSE 3000

CMD ["npm", "start"]
