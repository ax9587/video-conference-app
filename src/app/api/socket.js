import { Server } from 'socket.io';

const SocketHandler = async (req, res) => {
  if (!res.socket.server.io) {
    console.log('Initializing Socket.io');
    const io = new Server(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
    });
    
    res.socket.server.io = io;

    io.on('connection', socket => {
      console.log('Client connected');
      
        socket.on('join-room', (roomId, userId) => {
        socket.join(roomId);
        socket.to(roomId).emit('user-connected', userId);

        socket.on('disconnect', () => {
          socket.to(roomId).emit('user-disconnected', userId);
        });
        });
    });
  }

  res.end();
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default SocketHandler;