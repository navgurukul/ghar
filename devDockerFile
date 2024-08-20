FROM node:18.14.2-alpine
# Set the working directory in the container
WORKDIR /app
# Copy package.json and package-lock.json to the container
COPY package*.json ./
# Install dependencies
RUN npm install
# Copy the rest of the application code to the container
COPY . .
# Expose the port the app runs on
EXPOSE 3048
# Command to run the application
CMD ["npm", "run", "start"]
