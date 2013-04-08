var express = require('express'),
// load the 'crypto' and 'mysql' module.
    crypto = require('crypto'),
    mysql = require('mysql');

var app = express.createServer();
var onlineUsers = [];   // an array to store the online users.

app.configure(function () {
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(app.router);
    app.set('view engine', 'jade');
    app.set('views', __dirname + '/public');
    app.set('view options', {layout: false});
    app.set('basepath', __dirname + '/public');
});

app.configure('development', function () {
    app.use(express.static(__dirname + '/public'));
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function () {
    var oneYear = 31557600000;
    app.use(express.static(__dirname + '/public', { maxAge: oneYear }));
    app.use(express.errorHandler());
});


// listen 'post' request from the client!
app.post('/', function (req, res) {
    // create the connection with the user and password of the database.
    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root'
    });

    // use the 'db_chat' database.
    connection.query('use db_chat', function (err) {
        if (err) {
            connection.end();
            res.end('dbError');
            console.log("Unknown database 'db_chat'!");
        }
    });

    // get the username and password from register.
    var regUsername = req.body.regUsername,
        regPassword = req.body.regPassword;

    // get the username and password from logon.
    var logUsername = req.body.logUsername,
        logPassword = req.body.logPassword;

    // process the register request.
    if (regUsername != null && regPassword != null) {
        // if the user is already exist then return back else register it.
        connection.query("select userId from info_user where userName = ?", regUsername, function (err, rows) {
            if (err) throw err;

            if (rows.length > 0) {
                // the user is already exist, send back and end the connection.
                connection.end();
                res.send('exist');
            } else {
                // encrypt the password use md5.
                // create a new 'md5' object for every time!
                var md5 = crypto.createHash('md5');
                md5.update(regPassword);

                // get the value use the hexadecimal.
                var result = md5.digest('hex');

                // register: insert info into the database 'info_user'.
                connection.query('insert into info_user (userName, userPassword) values (?, ?)', [regUsername, result], function (err) {
                    if (err) throw err;
                });

                // return the message and end the connection!
                connection.end();
                res.send('registerSuccess');
            }
        });
    }

    // process the logon request.
    if (logUsername != null && logPassword != null) {
        // detect the username
        connection.query("select userId from info_user where userName = ?", logUsername, function (err, rows) {
            if (err) throw err;

            if (rows.length <= 0) {
                // username is not exist.
                connection.end();
                res.send('usernameError');
            } else {
                // detect the password.
                // get the encrypt password.
                var md5 = crypto.createHash('md5');
                md5.update(logPassword);
                var result = md5.digest('hex');

                // get the password in the `info_user` based on logUsername.
                connection.query('select userPassword from info_user where userName = ?', [logUsername], function (err, rows) {
                    if (err) throw err;

                    // detect the password is right or not.
                    if (rows[0].userPassword === result) {
                        connection.end();
                        // detect whether the user has logged on.
                        var index = onlineUsers.indexOf(logUsername);
                        if (index < 0) {
                            // add current user to online user list.
                            onlineUsers.push(logUsername);
                            res.send('logonSuccess');
                        } else {
                            // logon repeat!
                            res.send('reLogon');
                        }

                    } else {
                        connection.end();
                        res.send('passwordError');
                    }
                });
            }
        });
    }

    // process the offline user.
    var loggedName = req.body.loggedName;
    // remove the username from onlineUsers when user leave.
    if (loggedName != null) {
        var index = onlineUsers.indexOf(loggedName);
        onlineUsers.splice(index, 1);
    }
});


console.log("Web server has started.\nPlease log on http://127.0.0.1:3001/index.html");
app.listen(3001);
