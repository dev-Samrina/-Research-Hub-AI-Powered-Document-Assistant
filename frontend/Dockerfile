# frontend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files if they exist, otherwise we will generate them
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of the code
COPY . .

# Expose Vite's default port
EXPOSE 5173

# Run the dev server, allowing it to be accessed from outside the container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
