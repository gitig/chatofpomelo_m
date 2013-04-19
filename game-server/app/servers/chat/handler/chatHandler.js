var chatRemote = require('../remote/chatRemote'),
    mysql = require('mysql');

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

var handler = Handler.prototype;

/**
 * Send messages to users
 *
 * @param {Object} msg message from client
 * @param {Object} session
 * @param  {Function} next next stemp callback
 *
 */
handler.send = function (msg, session, next) {
    var rid = session.get('rid');
    var username = session.uid.split('*')[0];
    var channelService = this.app.get('channelService');
    var param = {
        route: 'onChat',
        msg: msg.content,
        from: username,
        target: msg.target
    };
    channel = channelService.getChannel(rid, false);

    //the target is all users
    if (msg.target == '*') {
        channel.pushMessage(param);
    }
    //the target is specific user
    else {
        var tuid = msg.target + '*' + rid;
        var tsid = channel.getMember(tuid)['sid'];
        channelService.pushMessageByUids(param, [
            {
                uid: tuid,
                sid: tsid
            }
        ]);
    }

    // save the content
    var date = new Date(),
        hour = date.getHours().toString(),
        min = date.getMinutes().toString();

    hour = hour.length < 2 ? '0' + hour : hour;
    min = min.length < 2 ? '0' + min : min;
    date = hour + ':' + min;

    // create a connection to mysql
    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root'
    });
    // use 'db_chat' database
    connection.query('use db_chat', function (err) {
        if (err) throw err;
    });
    // insert info to database
    connection.query('insert into chat_history (roomId, time, user_from, target, message) values (?, ?, ?, ?, ?)', [rid, date, username, msg.target, msg.content], function (err) {
        if (err) throw err;
    });
    connection.end();

    next(null, {
        route: msg.route
    });
};