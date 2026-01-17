FROM node:18-alpine AS build
WORKDIR /app
# Context is root, so we copy from checkout-page directory
COPY checkout-page/package*.json ./
RUN npm install
COPY checkout-page/ .
RUN npm run build

# Build SDK
WORKDIR /app/sdk
# Copy from checkout-widget directory (sibling in root)
COPY checkout-widget/package*.json ./
RUN npm install
COPY checkout-widget/ .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Copy SDK bundle
COPY --from=build /app/sdk/dist/checkout.js /usr/share/nginx/html/checkout.js
COPY checkout-page/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
