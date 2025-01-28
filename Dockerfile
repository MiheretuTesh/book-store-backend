# Use the official Node.js image as the base
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install dependencies with --legacy-peer-deps flag
RUN npm install --legacy-peer-deps

# Rebuild native modules
RUN npm rebuild bcrypt --build-from-source

# Copy the rest of the application code to the container
COPY . .

# Build the NestJS application
RUN npm run build

# Expose the port your app will run on
EXPOSE 8080

# Command to start the application in production mode
CMD ["npm", "run", "start:dev"]