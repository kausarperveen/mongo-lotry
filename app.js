#!/usr/bin/env node

/**
 * Module dependencies.
 */
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
  }
  
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const userRoutes = require('./routes/users');
const indexRoutes = require('./routes/index');
const debug = require('debug')('lottery:server');
const http = require('http');
const path = require('path');

/**
 * Get port from environment and store in Express.
 */

const port = normalizePort(process.env.PORT || '3000');

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
  const port = parseInt(val, 10);
  if (isNaN(port)) {
    // named pipe
    return val;
  }
  if (port >= 0) {
    // port number
    return port;
  }
  return false;
}

/**
 * Create Express app.
 */
const app = express();

/**
 * Set up middleware.
 */
app.use(bodyParser.json());
app.use('/users', userRoutes);
app.use('/', indexRoutes);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.post('*', (req, res, next) => {
  // Retrieve data from req.body
  const postData = req.body;

  // Perform necessary operations with postData
  console.log('POST request intercepted with data:', postData);

  next();
});


/**
 * Connect to MongoDB.
 */
mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('db connected');

  /**
   * Create HTTP server.
   */
  const server = http.createServer(app);

  /**
   * Event listener for HTTP server "error" event.
   */
  function onError(error) {
    if (error.syscall !== 'listen') {
      throw error;
    }

    const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        console.error(bind + ' requires elevated privileges');
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error(bind + ' is already in use');
        process.exit(1);
        break;
      default:
        throw error;
    }
  }

  /**
   * Event listener for HTTP server "listening" event.
   */
  function onListening() {
    const addr = server.address();
    const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
    debug('Listening on ' + bind);
  }

  /**
   * Listen on provided port, on all network interfaces.
   */
  server.listen(port);
  server.on('error', onError);
  server.on('listening', onListening);

  console.log(`Server listening on port ${port}`);
}).catch((error) => {
  console.log(error);
  process.exit(1);
});
