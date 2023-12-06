import net from 'net';
import { NEW_LINE } from './globals.js';

const server = net.createServer();

const clients = [];
const nicknames = [];
let clientCount = 1;
// { time: '', sender: '', message: '' }
const messages = [];

server.on('connection', (socket) => {
  console.log('connection established');
  const client = {
    id: clientCount++,
    socket,
  };
  clients.push(client);
  client.socket.write(
    'Welcome to my chat server! What is your nickname?' + NEW_LINE
  );

  socket.on('data', (data) => {
    handleInput(data.toString().trim(), client);
  });

  socket.on('close', () => {
    // system message
    sendSystemMessageToAllClients(
      `*${client.nickname} has left the chat*`
    );
    const index = clients.findIndex(
      (connectedClient) => client.id === connectedClient.id
    );
    clients.splice(index, 1);
    const nameIndex = nicknames.indexOf(client.nickname);
    nicknames.splice(nameIndex, 1);
  });
});

server.listen(3000);

const handleInput = (data, sender) => {
  if (sender.nickname) {
    sendMessageToClients(data, sender);
    storeMessage(sender, data);
  } else {
    if (isNicknameUnique(data)) {
      const names = nicknames.join(', ');
      sender.socket.write(
        `You are connected with ${nicknames.length} other users: [${names}].` +
          NEW_LINE
      );
      nicknames.push(data);
      sender.nickname = data;
      showChannelHistory(sender);
      sendSystemMessageToAllClients(`*${data} has joined the chat*`);
    } else {
      sender.socket.write(
        'Nickname must be unique, please try again' + NEW_LINE
      );
    }
  }
};

const sendMessageToClients = (data, sender) => {
  clients.forEach((client) => {
    if (client.id !== sender.id && client.nickname) {
      client.socket.write(formatMessage(data, sender));
    }
  });
};

const sendSystemMessageToAllClients = (data) => {
  clients.forEach((client) => {
    if (client.nickname) {
      client.socket.write(data + NEW_LINE);
    }
  });
};

const formatMessage = (message, sender, date) => {
  return `[${date}] <${sender.nickname}> ${message}` + NEW_LINE;
};

const isNicknameUnique = (data) => {
  if (nicknames.includes(data)) {
    return false;
  }

  return true;
};

const showChannelHistory = (client) => {
  messages.forEach((message) => {
    client.socket.write(
      formatMessage(message.message, message.sender, message.time)
    );
  });
};

const storeMessage = (sender, data) => {
  const now = new Date();
  const time = now.toString();
  messages.push({ time, message: data, sender });
};
