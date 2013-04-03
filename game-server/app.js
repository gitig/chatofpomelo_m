// get the pomelo from 'node_modules'.
var pomelo = require('pomelo');
// get the file module from relative path.
var routeUtil = require('./app/util/routeUtil');

/**
 * Init app for client.
 * create the app and set the app's name
 */
var app = pomelo.createApp();
app.set('name', 'chatofpomelo');


// app configure
app.configure('production|development', function() {
	// route configures
	app.route('chat', routeUtil.chat);

	// filter configures
	app.filter(pomelo.timeout());
});

// start app
app.start();

process.on('uncaughtException', function(err) {
	console.error(' Caught exception: ' + err.stack);
});