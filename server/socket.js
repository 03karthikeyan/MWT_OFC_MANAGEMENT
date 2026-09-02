const { Server } = require("socket.io");
const Message = require('./models/Message');
const { sendNotification } = require('./services/pushNotification');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("🔌 User connected:", socket.id);

    socket.on("join", ({ userId, role }) => {
      if (userId) {
        socket.join(userId.toString());
        console.log(`👤 User ${userId} joined private socket room`);
      }
      if (role === 'admin') {
        socket.join('admin');
        console.log(`🛡️ Admin ${userId} joined admin socket room`);
      }
    });

    // Real-time private message socket listener
    socket.on("private_message", async ({ senderId, receiverId, content }) => {
      try {
        if (!senderId || !receiverId || !content) return;
        const msg = await Message.create({
          senderId,
          receiverId,
          content: content.trim(),
        });

        const populated = await Message.findById(msg._id)
          .populate('senderId', 'name profilePicture jobRole')
          .populate('receiverId', 'name profilePicture jobRole');

        io.to(receiverId.toString()).emit("new_message", populated);
        io.to(senderId.toString()).emit("message_sent", populated);

        // Send Push Notification alert to receiver
        const senderName = populated.senderId && populated.senderId.name ? populated.senderId.name : 'Team Member';
        sendNotification({
          recipientId: receiverId,
          title: `Message from ${senderName}`,
          message: content.trim(),
          data: { type: 'chat', senderId: senderId.toString() },
        });
      } catch (err) {
        console.error('Socket message error:', err.message);
      }
    });

    socket.on("typing", ({ senderId, receiverId }) => {
      if (receiverId) {
        io.to(receiverId.toString()).emit("user_typing", { senderId });
      }
    });

    socket.on("stop_typing", ({ senderId, receiverId }) => {
      if (receiverId) {
        io.to(receiverId.toString()).emit("user_stop_typing", { senderId });
      }
    });

    socket.on("disconnect", () => {
      console.log("🔌 User disconnected:", socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

module.exports = { initSocket, getIO };
