
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

//iniciamos variables globales
var userList = new Array();
var io = require('socket.io').listen(8089);
	io.configure(function(){
		io.set('transports', ['websocket', 'flashsocket']);
	});

	io.sockets.on('connection', function(socket)
	{
		console.log("Nuevo Usuario conectado");
		socket.on('message',function(data)
		{
			var user = findUser(userList,socket.id);
			if(user != null)
			{
				
				sendToOthers(userList,user.id,user.nickname,data);
			}
		});

		socket.on('setNickname',function(data)
		{
			var newUser = new User();
			newUser.id = socket.id;
			newUser.nickname = data.nickname;

			userList.push(newUser);

			console.log(userList);

			socket.json.send({type:10,msg:"Nickname establecido"});
			sendToAll(userList,newUser.nickname,userList,11);
		});

		socket.on('sendChat',function(data)
		{
			var user = findUser(userList,socket.id);
			if(user != null)
			{
				console.log("Mensaje recibido objeto: " + data);
				console.log("Mensaje recibido de: " + user.toString());
				sendToAll(userList,user.nickname,data.chatMsg,5);
			}
		});

		socket.on('disconnect',function()
		{
			console.log("Usuario desconectado");
			var user = findUser(userList,socket.id);
			if(user)
				removeUser(userList,user);

			sendToAll(userList,"",userList,11);
		});

		//creamos objeto User
		var User = function()
		{
			this.id = "";
			this.nickname = "";
			this.toString = function(){
				return "Usuario: ID:" + this.id + " Nickname: " + this.nickname;
			};
		};

		var findUser = function(userArray,id)
		{
			var user = null;
			for(var i = 0; i < userArray.length; i++)
			{
				if(userArray[i].id == id)
				{
					return userArray[i];
				}
			}
			return user;
		};
		var sendToOthers = function(userArray,id,nickname,msg)
		{
			for(var i = 0; i < userArray.length; i++)
			{
				if(userArray[i].id != id){
					console.log(id);
					io.sockets.sockets[userArray[i].id].json.send({type:5,chatMsg:msg,sender:nickname});
				}
			}
		};
		var sendToAll = function(userArray,nickname,msg,typeValue)
		{
			for(var i = 0;i < userArray.length; i++)
			{
				io.sockets.sockets[userArray[i].id].json.send({type:typeValue,chatMsg:msg,sender:nickname});
			}
		};
		var removeUser = function(userArray,user)
		{
			for(var i = 0;i < userArray.length; i++)
			{
				if(userArray[i].id === user.id)
				{
					userArray.remove(i);
				}
			}
		};

	});

