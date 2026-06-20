# Stage 1: build the Vite/React app
FROM node:22-slim AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: serve the built static assets with nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
