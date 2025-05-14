# Multistage Dockerfile for Koflix-A

# 1. Build stage
FROM node:24-alpine AS builder

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory, better for caching
# This allows Docker to cache the npm install step if package.json hasn't changed
COPY package.json package-lock.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Run prisma generate
RUN npx prisma generate

# Run the build command
RUN npm run build

# 2. Production stage
FROM node:24-alpine AS production

WORKDIR /app

# Copy only the necessary files from the builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start"]