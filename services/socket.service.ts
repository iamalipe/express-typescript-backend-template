import { Server } from 'socket.io';
import { db } from './db.services';

let socketInstance: Server | null = null;

export const socketService = (io: Server) => {
  socketInstance = io;
  // Implement your socket service logic here
  io.on('connection', async (socket) => {
    const user = socket.request.user;
    if (user.id) {
      await db.user.findByIdAndUpdate(user.id, {
        $set: {
          connectState: 'ONLINE',
        },
      });
      io.emit(`user-status:${user.id}`, { connectState: 'ONLINE' });
    }
    socket.on('disconnect', async () => {
      if (user.id) {
        await db.user.findByIdAndUpdate(user.id, {
          $set: {
            connectState: 'OFFLINE',
          },
        });
        io.emit(`user-status${user.id}`, { connectState: 'OFFLINE' });
      }
    });
  });
};

export const getSocketInstance = () => {
  if (!socketInstance) {
    throw new Error('Socket.IO instance is not initialized');
  }
  return socketInstance;
};
