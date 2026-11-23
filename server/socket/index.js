let io = null;

export function initSocket(serverIo) {
  io = serverIo;
  io.on('connection', (socket) => {
    socket.on('watch:queue', (id) => {
      if (id) socket.join(`customer:${id}`);
    });
    socket.on('watch:barber', (id) => {
      if (id) socket.join(`barber:${id}`);
    });
    socket.on('watch:staff', () => socket.join('staff'));
    socket.on('watch:display', () => socket.join('display'));
  });
  return io;
}

export function getIo() {
  return io;
}

export function broadcast(event, payload = {}) {
  if (!io) return;
  const safe = {
    event,
    entryId: payload.entryId || null,
    token: payload.token || null,
    status: payload.status || null,
    barberId: payload.barberId || null,
    barberName: payload.barberName || null,
    at: Date.now(),
  };
  io.to('staff').to('display').emit(event, safe);
  io.emit('queue:updated', safe);
  if (safe.entryId) io.to(`customer:${safe.entryId}`).emit(event, safe);
  if (safe.barberId) io.to(`barber:${safe.barberId}`).emit(event, safe);
}
