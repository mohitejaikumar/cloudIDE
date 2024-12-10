# Use official NGINX RTMP image as base
FROM tiangolo/nginx-rtmp

# Install dependencies: curl, Node.js, ffmpeg
RUN apt-get update && \
    apt-get install -y curl && \
    apt-get install -y lsof && \
    curl -sL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y nodejs ffmpeg

# Set working directory for Node.js application
WORKDIR /home/app

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Install nodemon globally
RUN npm install -g nodemon

# Copy all application files
COPY . .

# Expose necessary ports
EXPOSE 8081
EXPOSE 8082
EXPOSE 8083
EXPOSE 1935

# Command to start both NGINX and Node.js
CMD ["./start.sh"]
