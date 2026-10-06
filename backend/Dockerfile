FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src
ENV NODE_ENV=production
# Cloud Run injects PORT (default 8080); our server reads process.env.PORT
EXPOSE 8080
CMD ["node", "src/index.js"]
