FROM node:22-alpine
WORKDIR /app
COPY . .
ENV PORT=4173 LIGHT_MAZE_DATA_DIR=/data
VOLUME ["/data"]
EXPOSE 4173
CMD ["node","standalone/server.mjs"]
