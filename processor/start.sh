#!/bin/sh

# Start NGINX in the background
nginx -g 'daemon off;' &

# Start the Node.js application using nodemon
node index.js
