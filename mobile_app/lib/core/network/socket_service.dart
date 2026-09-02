import 'dart:async';
import 'dart:developer';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'api_constants.dart';

class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  SocketService._internal();

  static SocketService get instance => _instance;

  IO.Socket? _socket;
  bool _isConnected = false;
  String? _currentUserId;
  String? _currentUserRole;

  bool get isConnected => _isConnected;
  String? get currentUserId => _currentUserId;

  // Stream Controllers for real-time reactivity
  final _messageStreamController = StreamController<dynamic>.broadcast();
  final _messageSentStreamController = StreamController<dynamic>.broadcast();
  final _typingStreamController = StreamController<Map<String, dynamic>>.broadcast();
  final _stopTypingStreamController = StreamController<Map<String, dynamic>>.broadcast();
  final _notificationStreamController = StreamController<Map<String, dynamic>>.broadcast();

  Stream<dynamic> get onNewMessage => _messageStreamController.stream;
  Stream<dynamic> get onMessageSent => _messageSentStreamController.stream;
  Stream<Map<String, dynamic>> get onUserTyping => _typingStreamController.stream;
  Stream<Map<String, dynamic>> get onUserStopTyping => _stopTypingStreamController.stream;
  Stream<Map<String, dynamic>> get onNotificationEvent => _notificationStreamController.stream;

  void connect({required String userId, required String role}) {
    if (_socket != null && _isConnected && _currentUserId == userId) {
      log("🔌 Socket already connected for user $userId");
      return;
    }

    disconnect();

    _currentUserId = userId;
    _currentUserRole = role;

    log("🔌 Initializing Socket.io connection to: ${ApiConstants.baseUrl}");

    try {
      _socket = IO.io(
        ApiConstants.baseUrl,
        IO.OptionBuilder()
            .setTransports(['websocket', 'polling'])
            .enableAutoConnect()
            .enableReconnection()
            .setReconnectionDelay(1500)
            .setReconnectionAttempts(20)
            .build(),
      );

      _socket!.onConnect((_) {
        _isConnected = true;
        log("🔌 Socket connected! Joining room: $userId, role: $role");
        _socket!.emit('join', {'userId': userId, 'role': role});
      });

      _socket!.onReconnect((_) {
        _isConnected = true;
        log("🔌 Socket reconnected! Re-joining room: $userId");
        _socket!.emit('join', {'userId': _currentUserId, 'role': _currentUserRole});
      });

      _socket!.onDisconnect((_) {
        _isConnected = false;
        log("🔌 Socket disconnected");
      });

      _socket!.onConnectError((err) {
        _isConnected = false;
        log("⚠️ Socket connect error: $err");
      });

      _socket!.onError((err) {
        log("⚠️ Socket error: $err");
      });

      // Register Event Listeners
      _socket!.on('new_message', (data) {
        log("💬 Socket [new_message] received: $data");
        _messageStreamController.add(data);
      });

      _socket!.on('message_sent', (data) {
        log("💬 Socket [message_sent] confirmation: $data");
        _messageSentStreamController.add(data);
      });

      _socket!.on('user_typing', (data) {
        if (data is Map) {
          _typingStreamController.add(Map<String, dynamic>.from(data));
        }
      });

      _socket!.on('user_stop_typing', (data) {
        if (data is Map) {
          _stopTypingStreamController.add(Map<String, dynamic>.from(data));
        }
      });

      _socket!.on('notification_event', (data) {
        log("🔔 Socket [notification_event] received: $data");
        if (data is Map) {
          _notificationStreamController.add(Map<String, dynamic>.from(data));
        }
      });
    } catch (e) {
      log("⚠️ Exception during socket init: $e");
    }
  }

  void sendPrivateMessage({
    required String senderId,
    required String receiverId,
    required String content,
  }) {
    if (_socket != null && _isConnected) {
      log("📤 Emitting private_message to $receiverId");
      _socket!.emit('private_message', {
        'senderId': senderId,
        'receiverId': receiverId,
        'content': content,
      });
    }
  }

  void sendTyping({required String senderId, required String receiverId}) {
    if (_socket != null && _isConnected) {
      _socket!.emit('typing', {
        'senderId': senderId,
        'receiverId': receiverId,
      });
    }
  }

  void sendStopTyping({required String senderId, required String receiverId}) {
    if (_socket != null && _isConnected) {
      _socket!.emit('stop_typing', {
        'senderId': senderId,
        'receiverId': receiverId,
      });
    }
  }

  void disconnect() {
    if (_socket != null) {
      log("🔌 Disconnecting socket");
      _socket!.disconnect();
      _socket!.dispose();
      _socket = null;
      _isConnected = false;
      _currentUserId = null;
      _currentUserRole = null;
    }
  }

  void on(String event, void Function(dynamic data) callback) {
    if (_socket != null) {
      _socket!.on(event, callback);
    }
  }

  void off(String event) {
    if (_socket != null) {
      _socket!.off(event);
    }
  }

  void emit(String event, dynamic data) {
    if (_socket != null) {
      _socket!.emit(event, data);
    }
  }
}
