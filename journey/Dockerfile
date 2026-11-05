FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY server/package.json server/package-lock.json server/
RUN npm ci --omit=dev --prefix server
COPY server/src server/src
COPY server/migrations server/migrations
COPY server/public server/public
COPY server/scripts server/scripts
COPY index.html ./index.html
COPY app ./app
COPY cases ./cases
COPY assets ./assets
COPY design-system ./design-system
ENV STATIC_ROOT=/app
EXPOSE 8080
CMD ["node", "server/src/index.js"]
