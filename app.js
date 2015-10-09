"use strict";

var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var cors = require('cors');
var consoleLogger = require('./modules/consoleLogger');

var routes = {
	index: require('./routes/index'),
	v1: {
		livefyre: require('./routes/v1/livefyre')
	}
};


if (process.env.LOGGER_LEVEL) {
	consoleLogger.setLevel(process.env.LOGGER_LEVEL);
}

if (process.env.LOGGER_FILTER) {
	var filters = process.env.LOGGER_FILTER.split(',').map(function (item) {return item.trim();});

	consoleLogger.addFilter(filters);
}


consoleLogger.enable();
consoleLogger.setLevel('log');


var app = express();

var corsOptions = {
	origin: function(origin, callback) {
		if (origin) {
			var allowed = 'ft.com';
			var hostname = origin.parse(origin).hostname;

			callback(null, hostname.indexOf(allowed, hostname.length - allowed.length) !== -1);

			return;
		}

		callback(null, false);
	}
};

app.use(cors(corsOptions));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes.index);
app.use('/v1/livefyre', routes.v1.livefyre);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
