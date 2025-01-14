const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer();
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

io.on("connection", (socket) => {
  console.log(`Socket Connected`, socket.id);
  socket.on("join-room", (data) => {
    console.log("join-room", data, socket.id);
    const { email, room } = data;
    io.to(room).emit("user-joined", { email, id: socket.id });
    socket.join(room);
    io.to(socket.id).emit("join-room", data);
  });

  socket.on("start-call", ({ to, offer }) => {
    io.to(to).emit("offer", { from: socket.id, offer });
  });

  socket.on("answer", ({ to, ans }) => {
    io.to(to).emit("answer", { from: socket.id, ans });
  });

  socket.on("peer-nego-needed", ({ to, offer }) => {
    //console.log("peer-nego-needed", offer);
    io.to(to).emit("peer-nego-needed", { from: socket.id, offer });
  });

  socket.on("peer-nego-done", ({ to, ans }) => {
    //console.log("peer-nego-done", ans);
    io.to(to).emit("peer-nego-final", { from: socket.id, ans });
  });
});

server.listen(8000, () => {
  console.log('Socket.IO server listening on port 8000');
});