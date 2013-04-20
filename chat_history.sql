create table chat_history
(
	id int not null primary key auto_increment,
	roomId text not null,
	time varchar(20) not null,
	user_from text not null,
	target text not null,
	message text not null
);