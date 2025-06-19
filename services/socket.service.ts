import { Server, Socket } from 'socket.io';

let socketInstance: Server | null = null;

export const socketService = (io: Server) => {
  socketInstance = io;
  // Implement your socket service logic here
  io.on('connection', (socket: Socket) => {
    console.log('A user connected:', socket.id, socket);

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      // You might want to update the user's connectState to OFFLINE here
      // This would require mapping socket.id to userId, which is a more advanced topic (e.g., using a map or Redis)
      // For simplicity, we'll focus on the HTTP route for state updates.
    });

    // You can still have other socket listeners here if needed
  });
};

export const getSocketInstance = () => {
  if (!socketInstance) {
    throw new Error('Socket.IO instance is not initialized');
  }
  return socketInstance;
};
