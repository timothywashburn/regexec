FROM node:18-alpine
WORKDIR /app

# Copy server package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy server source
COPY . .

# Build the server
RUN npm run build

# Remove devDependencies to reduce image size
RUN npm prune --production

EXPOSE 3001
CMD ["npm", "start"]