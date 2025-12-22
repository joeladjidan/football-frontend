
# Build stage
FROM node:20 AS build
WORKDIR /app
COPY package.json angular.json tsconfig.json ./
COPY src ./src
RUN npm install && npm run build

# NGINX stage
FROM nginx:1.27-alpine
COPY --from=build /app/dist/football-frontend /usr/share/nginx/html
# Proxy vers le backend
RUN sed -i 's|#gzip  on;|#gzip on;

    location /api/ {
        proxy_pass http://backend:8080;
    }|g' /etc/nginx/nginx.conf
EXPOSE 80
