var pomelo = window.pomelo;
var username;
var users;
var rid;
var channels;
var base = 1000;
var increase = 25;
var reg = /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/;
var regPassword = /^[^\s]{6,20}$/;
var LOGIN_ERROR = "There is no server to log in, please wait.";
var LENGTH_ERROR = "Name/Password is too long or too short. 20 character max.";
var NAME_ERROR = "Bad character in Name. Can only have letters, numbers, Chinese characters, and '_', 20 character max";
var DUPLICATE_ERROR = "Please change your name to login.";

util = {
    urlRE: /https?:\/\/([-\w\.]+)+(:\d+)?(\/([^\s]*(\?\S+)?)?)?/g,
    //  html sanitizer
    toStaticHTML: function(inputHtml) {
        inputHtml = inputHtml.toString();
        return inputHtml.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    },
    //pads n with zeros on the left,
    //digits is minimum length of output
    //zeroPad(3, 5); returns "005"
    //zeroPad(2, 500); returns "500"
    zeroPad: function(digits, n) {
        n = n.toString();
        while(n.length < digits)
            n = '0' + n;
        return n;
    },
    //it is almost 8 o'clock PM here
    //timeString(new Date); returns "19:49"
    timeString: function(date) {
        var minutes = date.getMinutes().toString();
        var hours = date.getHours().toString();
        return this.zeroPad(2, hours) + ":" + this.zeroPad(2, minutes);
    },

    //does the argument only contain whitespace?
    isBlank: function(text) {
        var blank = /^\s*$/;
        return(text.match(blank) !== null);
    }
};

//always view the most recent message when it is added
function scrollDown(base) {
    window.scrollTo(0, base);
    $("#entry").focus();
};

// add message on board
function addMessage(from, target, text, time) {
    var name = (target == '*' ? 'all' : target);
    if(text === null) return;
    if(time == null) {
        // if the time is null or undefined, use the current time.
        time = new Date();
    } else if((time instanceof Date) === false) {
        // if it's a timestamp, interpret it
        time = new Date(time);
    }
    //every message you see is actually a table with 3 cols:
    //  the time,
    //  the person who caused the event,
    //  and the content
    var messageElement = $(document.createElement("table"));
    messageElement.addClass("message");
    // sanitize
    text = util.toStaticHTML(text);
    var content = '<tr>' + '  <td class="date">' + util.timeString(time) + '</td>' + '  <td class="nick">' + util.toStaticHTML(from) + ' says to ' + name + ': ' + '</td>' + '  <td class="msg-text">' + text + '</td>' + '</tr>';
    messageElement.html(content);
    //the log is the stream that we view
    $("#chatHistory").append(messageElement);
    base += increase;
    scrollDown(base);
};

// show tip
function tip(type, name) {
    var tip,title;
    switch(type){
        case 'online':
            tip = name + ' is online now.';
            title = 'Online Notify';
            break;
        case 'offline':
            tip = name + ' is offline now.';
            title = 'Offline Notify';
            break;
        case 'message':
            tip = name + ' is saying now.'
            title = 'Message Notify';
            break;
    }
    var pop=new Pop(title, tip);
};

// init user list
function initUserList(data) {
    users = data.users;
    for(var i = 0; i < users.length; i++) {
        var slElement = $(document.createElement("option"));
        slElement.attr("value", users[i]);
        slElement.text(users[i]);
        $("#usersList").append(slElement);
    }
};

// set the current room count
function setCount() {
    $("#count").text($("#usersList").find("option").length - 1);
}

// add user in user list
function addUser(user) {
    var slElement = $(document.createElement("option"));
    slElement.attr("value", user);
    slElement.text(user);
    $("#usersList").append(slElement);
    setCount(); // increment the count
};

// remove user from user list
function removeUser(user) {
    $("#usersList option").each(
        function() {
            if($(this).val() === user){
                $(this).remove();
                setCount(); // decrement the count
            }
        });
};

// set your name
function setName() {
    $("#name").text(username);
};

// set your room
function setRoom() {
    $("#room").text(rid);
};

// show error
function showError(content) {
    $("#loginError").text(content);
    $("#loginError").show();
};

// show register hint
function showRegisterHint(content) {
    $("#registerHint").text(content);
    $("#registerHint").show();
}

// show logon hint
function showLogonHint(content) {
    $("#logonHint").text(content);
    $("#logonHint").show();
}

// show create channel hint
function showCreateHint(content) {
    $("#createChannelHint").text(content);
    $("#createChannelHint").show();
}

// show login panel
function showLogin() {
    $("#loginView").show();
    $("#chatHistory").hide();
    $("#toolbar").hide();
    $("#logonHint").hide();
    $("#channel").hide();   // hide the channel
};

// show channel panel
function showChannels() {
    $("#channel").show();
    $("#loginView").hide();
    $("#chatHistory").hide();
    $("#toolbar").hide();
}

// show chat panel
function showChat() {
    $("#loginView").hide();
    $("#loginError").hide();
    $("#toolbar").show();
    $("entry").focus();
    scrollDown(base);
};

// query connector
function queryEntry(uid, callback) {
    var route = 'gate.gateHandler.queryEntry';
    pomelo.init({
        host: window.location.hostname,
        port: 3014,
        log: true
    }, function() {
        pomelo.request(route, {
            uid: uid
        }, function(data) {
            pomelo.disconnect();
            if(data.code === 500) {
                showError(LOGIN_ERROR);
                return;
            }
            callback(data.host, data.port);
        });
    });
};

// initial channels list.
function initChannelList(data) {
    // get the channels.
    channels = data.channels;
    // create <table><tr><td>
    var table = $(document.createElement("table"));
    $("#roomList").append(table);
    var tr = $(document.createElement("tr"));
    table.append(tr);
    table.id = "roomTable";
    var td = $(document.createElement("td"));
    tr.append(td);
    td.text("Room");

    td = $(document.createElement("td"));
    tr.append(td);
    td.text("Online");

    var len = channels.length ;
    if (len > 0 ) {
        for(var i = 0; i < len; i++) {
            tr = $(document.createElement("tr"));
            table.append(tr);
            td = $(document.createElement("td"));
            tr.append(td);
            td.text(channels[i].name);  // set the channel name.

            td = $(document.createElement("td"));
            tr.append(td);
            td.text(channels[i].count); // set the online count.
        }
    }
}

// get all channels
function getAllChannels(username) {
    queryEntry(username, function(host, port) {
        pomelo.init({
            host: host,
            port: port,
            log: true
        }, function() {
            // serverType.fileName.methodName
            var route = "connector.entryHandler.queryChannels";
            pomelo.request(route, function(data) {
                // show and initial channels.
                showChannels();
                initChannelList(data);
            });
        });
    });
}







$(document).ready(function() {
    //when first time into chat room.
    showLogin();

    //wait message from the server.
    pomelo.on('onChat', function(data) {
        addMessage(data.from, data.target, data.msg);
        $("#chatHistory").show();
        if(data.from !== username)
            tip('message', data.from);
    });

    //update user list
    pomelo.on('onAdd', function(data) {
        var user = data.user;
        tip('online', user);
        addUser(user);
    });

    //update user list
    pomelo.on('onLeave', function(data) {
        var user = data.user;
        tip('offline', user);
        removeUser(user);
    });

    //handle disconect message, occours when the client is disconnect with servers
    pomelo.on('disconnect', function(reason) {
        showLogin();
    });

    // deal with register button click.
    $("#register").click(function() {
        // hide the hint info.
        $("#registerHint").hide();
        // get the username and password and detect them.
        username = $("#registerUsername").attr("value");
        var password = $("#registerPassword").val(),
            confirmPassword = $("#confirmPassword").val();
        if(!reg.test(username)) {
            showRegisterHint(NAME_ERROR);
            return false;
        }
        if (!regPassword.test(password)) {
            showRegisterHint("Bad character in PASSWORD, no space 6-20 characters!")
            return false;
        }
        if(password !== confirmPassword){
            showRegisterHint("Passwords are different!");
            return false;
        }

        // post request to web server
        $.post("/", {regUsername: username, regPassword: password}, function(res) {
            // user is already exist.
            if(res === "exist") {
                showRegisterHint("The user is already EXIST!");
            }
            // register success.
            if(res === "registerSuccess"){
                showRegisterHint("Register SUCCESS!");
            }
        })

    });

    // deal with logon button click.
    $("#logon").click(function() {
        // hide the hint info.
        $("#logonHint").hide();
        // get the username and password and detect them.
        username = $("#logonUsername").val();
        var password = $("#logonPassword").val();
        if(username.length == 0 || password.length == 0) {
            showLogonHint("Please input your USERNAME or PASSWORD!");
            return false;
        }

        // post username and password to web server.
        $.post("/", {logUsername: username, logPassword: password}, function(res) {
            // user is not exist.
            if(res === "usernameError") {
                showLogonHint("The user is NOT exist!");
            }
            // password is wrong.
            if (res === "passwordError") {
                showLogonHint("Password is WRONG!");
            }
            // logon success
            if (res === "logonSuccess") {
                // show channels and initial online count.
               getAllChannels(username);
            }
        });
    });

    // deal with create button click.
    $("#createChannel").click(function() {
        // hide the hint info
        $("#createChannelHint").hide();
        // get the rid and detect the rid.
        rid = $("#newChannel").val();
        if(rid.length == 0) {
            showCreateHint("Please input the room id.");
            return false;
        }
        if(!reg.test(rid)) {
            showCreateHint(NAME_ERROR);
            return false;
        }

        //query entry of connection
        queryEntry(username, function(host, port) {
            pomelo.init({
                host: host,
                port: port,
                log: true
            }, function() {
                var route = "connector.entryHandler.enter";
                pomelo.request(route, {
                    username: username,
                    rid: rid
                }, function(data) {
                    if(data.error) {
                        showError(DUPLICATE_ERROR);
                        return;
                    }
                    setName();
                    setRoom();
                    showChat();
                    initUserList(data);
                    setCount(); // update the count.
                });
            });
        });
    });

    //deal with login button click.
    /*$("#login").click(function() {
        username = $("#loginUser").attr("value");
        rid = $('#channelList').val();

        if(username.length > 20 || username.length == 0 || rid.length > 20 || rid.length == 0) {
            showError(LENGTH_ERROR);
            return false;
        }

        if(!reg.test(username) || !reg.test(rid)) {
            showError(NAME_ERROR);
            return false;
        }

        //query entry of connection
        queryEntry(username, function(host, port) {
            pomelo.init({
                host: host,
                port: port,
                log: true
            }, function() {
                var route = "connector.entryHandler.enter";
                pomelo.request(route, {
                    username: username,
                    rid: rid
                }, function(data) {
                    if(data.error) {
                        showError(DUPLICATE_ERROR);
                        return;
                    }
                    setName();
                    setRoom();
                    showChat();
                    initUserList(data);
                });
            });
        });
    });*/

    //deal with chat mode.
    $("#entry").keypress(function(e) {
        var route = "chat.chatHandler.send";
        var target = $("#usersList").val();
        if(e.keyCode != 13 /* Return */ ) return;
        var msg = $("#entry").attr("value").replace("\n", "");
        if(!util.isBlank(msg)) {
            pomelo.request(route, {
                rid: rid,
                content: msg,
                from: username,
                target: target
            }, function(data) {
                $("#entry").attr("value", ""); // clear the entry field.
                if(target != '*' && target != username) {
                    addMessage(username, target, msg);
                    $("#chatHistory").show();
                }
            });
        }
    });
});