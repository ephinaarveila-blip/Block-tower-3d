const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: { origin: "*" } // Mengizinkan koneksi dari APK Android / Cross-Origin
});

// Menyajikan file statis dari folder public
app.use(express.static('public'));

const players = {};

io.on('connection', (socket) => {
  console.log('Player terhubung:', socket.id);

  // Inisialisasi data pemain
  players[socket.id] = {
    x: 0,
    y: 0,
    z: 0,
    score: 0,
    name: "PLAYER"
  };

  // Kirim data semua pemain ke pemain yang baru masuk
  socket.emit('currentPlayers', players);

  // Beritahu pemain lain bahwa ada pemain baru
  socket.broadcast.emit('newPlayer', { id: socket.id, playerInfo: players[socket.id] });

  // Menerima pembaruan data gerakan/posisi balok dari pemain
  socket.on('playerMovement', (data) => {
    if (players[socket.id]) {
      players[socket.id].x = data.x || 0;
      players[socket.id].y = data.y || 0;
      players[socket.id].z = data.z || 0;
      players[socket.id].score = data.score || 0;
      players[socket.id].name = data.name || "PLAYER";

      // Re-broadcast ke pemain lain
      socket.broadcast.emit('playerMoved', {
        id: socket.id,
        x: players[socket.id].x,
        y: players[socket.id].y,
        z: players[socket.id].z,
        score: players[socket.id].score,
        name: players[socket.id].name
      });
    }
  });

  // Saat ada pemain terputus / keluar
  socket.on('disconnect', () => {
    console.log('Player keluar:', socket.id);
    delete players[socket.id];
    io.emit('disconnectPlayer', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server game berjalan pada port ${PORT}`);
});
