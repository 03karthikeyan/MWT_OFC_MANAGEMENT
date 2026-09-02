import 'dart:async';
import 'dart:convert';
import 'dart:developer';
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../core/network/socket_service.dart';
import '../../../core/services/local_notification_service.dart';
import '../data/models/chat_model.dart';
import '../data/repository/chat_repository.dart';

class ChatState extends Equatable {
  final bool isLoadingUsers;
  final bool isLoadingThread;
  final List<ChatUserModel> users;
  final String? activeThreadUserId;
  final List<ChatMessageModel> activeMessages;
  final bool isOtherTyping;
  final String? errorMessage;

  const ChatState({
    this.isLoadingUsers = false,
    this.isLoadingThread = false,
    this.users = const [],
    this.activeThreadUserId,
    this.activeMessages = const [],
    this.isOtherTyping = false,
    this.errorMessage,
  });

  ChatState copyWith({
    bool? isLoadingUsers,
    bool? isLoadingThread,
    List<ChatUserModel>? users,
    String? activeThreadUserId,
    List<ChatMessageModel>? activeMessages,
    bool? isOtherTyping,
    String? errorMessage,
    bool clearActiveThread = false,
    bool clearError = false,
  }) {
    return ChatState(
      isLoadingUsers: isLoadingUsers ?? this.isLoadingUsers,
      isLoadingThread: isLoadingThread ?? this.isLoadingThread,
      users: users ?? this.users,
      activeThreadUserId: clearActiveThread ? null : (activeThreadUserId ?? this.activeThreadUserId),
      activeMessages: clearActiveThread ? const [] : (activeMessages ?? this.activeMessages),
      isOtherTyping: isOtherTyping ?? this.isOtherTyping,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }

  @override
  List<Object?> get props => [
        isLoadingUsers,
        isLoadingThread,
        users,
        activeThreadUserId,
        activeMessages,
        isOtherTyping,
        errorMessage,
      ];
}

class ChatCubit extends Cubit<ChatState> {
  final ChatRepository _repository;
  final SocketService _socketService = SocketService.instance;
  final LocalNotificationService _notificationService = LocalNotificationService.instance;

  StreamSubscription? _newMessageSub;
  StreamSubscription? _messageSentSub;
  StreamSubscription? _typingSub;
  StreamSubscription? _stopTypingSub;
  StreamSubscription? _notificationSub;

  ChatCubit({ChatRepository? repository})
      : _repository = repository ?? ChatRepository(),
        super(const ChatState()) {
    _initSocketListeners();
  }

  void setActiveChatUserId(String? userId) {
    if (userId == null) {
      emit(state.copyWith(clearActiveThread: true, isOtherTyping: false));
    } else {
      emit(state.copyWith(activeThreadUserId: userId));
    }
  }

  void _initSocketListeners() {
    // 1. Listen for new incoming real-time messages
    _newMessageSub = _socketService.onNewMessage.listen((data) {
      try {
        if (data is! Map) return;
        final msgMap = Map<String, dynamic>.from(data);
        final msg = ChatMessageModel.fromJson(msgMap);
        final senderId = msg.senderId;
        final senderName = msg.sender?.name ?? 'Team Member';

        log("💬 [ChatCubit] Real-time message from: $senderId, Active is: ${state.activeThreadUserId}");

        // If user is currently looking at this conversation
        if (state.activeThreadUserId == senderId) {
          final exists = state.activeMessages.any((m) => m.id == msg.id);
          if (!exists) {
            final updatedMessages = List<ChatMessageModel>.from(state.activeMessages)..add(msg);
            emit(state.copyWith(activeMessages: updatedMessages, isOtherTyping: false));
          }
          _repository.markRead(senderId);
        } else {
          // Outside this conversation: Show Foreground Heads-Up Notification!
          _notificationService.showChatNotification(
            senderId: senderId,
            senderName: senderName,
            messageContent: msg.content,
          );
        }

        // Update last message & unread badge in team directory
        _updateUserInList(
          userId: senderId,
          lastMsg: msg.content,
          time: msg.createdAt,
          incrementUnread: state.activeThreadUserId != senderId,
        );
      } catch (e) {
        log("⚠️ Error handling socket new_message: $e");
      }
    });

    // 2. Sent message confirmation
    _messageSentSub = _socketService.onMessageSent.listen((data) {
      try {
        if (data is! Map) return;
        final msgMap = Map<String, dynamic>.from(data);
        final msg = ChatMessageModel.fromJson(msgMap);

        if (state.activeThreadUserId == msg.receiverId) {
          final existsIndex = state.activeMessages.indexWhere((m) => m.id == msg.id);
          if (existsIndex == -1) {
            final updated = List<ChatMessageModel>.from(state.activeMessages)..add(msg);
            emit(state.copyWith(activeMessages: updated));
          }
        }
      } catch (e) {
        log("⚠️ Error handling message_sent: $e");
      }
    });

    // 3. User is typing
    _typingSub = _socketService.onUserTyping.listen((event) {
      final senderId = event['senderId']?.toString();
      if (senderId != null && senderId == state.activeThreadUserId) {
        emit(state.copyWith(isOtherTyping: true));
      }
    });

    // 4. User stopped typing
    _stopTypingSub = _socketService.onUserStopTyping.listen((event) {
      final senderId = event['senderId']?.toString();
      if (senderId != null && senderId == state.activeThreadUserId) {
        emit(state.copyWith(isOtherTyping: false));
      }
    });

    // 5. General Notification event
    _notificationSub = _socketService.onNotificationEvent.listen((event) {
      try {
        final title = event['title']?.toString() ?? 'HRMS Notification';
        final message = event['message']?.toString() ?? '';
        final id = DateTime.now().millisecondsSinceEpoch ~/ 1000;
        final data = event['data'] is Map ? Map<String, dynamic>.from(event['data']) : <String, dynamic>{};

        _notificationService.showNotification(
          id: id,
          title: title,
          body: message,
          payload: jsonEncode(data),
        );
      } catch (e) {
        log("⚠️ Error handling notification_event: $e");
      }
    });
  }

  void _updateUserInList({
    required String userId,
    required String lastMsg,
    required DateTime time,
    required bool incrementUnread,
  }) {
    final updatedUsers = state.users.map((u) {
      if (u.id == userId) {
        return u.copyWith(
          lastMessage: lastMsg,
          lastMessageTime: time,
          unreadCount: incrementUnread ? u.unreadCount + 1 : 0,
        );
      }
      return u;
    }).toList();

    // Re-sort: recent messages to top
    updatedUsers.sort((a, b) {
      final timeA = a.lastMessageTime != null ? a.lastMessageTime!.millisecondsSinceEpoch : 0;
      final timeB = b.lastMessageTime != null ? b.lastMessageTime!.millisecondsSinceEpoch : 0;
      return timeB.compareTo(timeA);
    });

    emit(state.copyWith(users: updatedUsers));
  }

  Future<void> loadChatUsers() async {
    emit(state.copyWith(isLoadingUsers: true, clearError: true));
    try {
      final list = await _repository.getChatUsers();
      emit(state.copyWith(isLoadingUsers: false, users: list));
    } catch (e) {
      emit(state.copyWith(isLoadingUsers: false, errorMessage: e.toString()));
    }
  }

  Future<void> loadThread(String otherUserId) async {
    emit(state.copyWith(
      isLoadingThread: true,
      activeThreadUserId: otherUserId,
      activeMessages: [],
      isOtherTyping: false,
      clearError: true,
    ));

    try {
      final messages = await _repository.getMessages(otherUserId);
      emit(state.copyWith(
        isLoadingThread: false,
        activeMessages: messages,
      ));

      _repository.markRead(otherUserId);

      // Reset unread count for this user in the directory list
      final updatedUsers = state.users.map((u) {
        if (u.id == otherUserId) {
          return u.copyWith(unreadCount: 0);
        }
        return u;
      }).toList();
      emit(state.copyWith(users: updatedUsers));
    } catch (e) {
      emit(state.copyWith(isLoadingThread: false, errorMessage: e.toString()));
    }
  }

  Future<void> sendMessage({
    required String senderId,
    required String receiverId,
    required String content,
  }) async {
    final cleanContent = content.trim();
    if (cleanContent.isEmpty) return;

    final tempId = 'temp_${DateTime.now().millisecondsSinceEpoch}';
    final tempMsg = ChatMessageModel(
      id: tempId,
      senderId: senderId,
      receiverId: receiverId,
      content: cleanContent,
      read: false,
      createdAt: DateTime.now(),
    );

    // 1. Optimistic append to current thread
    final updatedMessages = List<ChatMessageModel>.from(state.activeMessages)..add(tempMsg);
    emit(state.copyWith(activeMessages: updatedMessages));

    // 2. Update directory list preview immediately
    _updateUserInList(
      userId: receiverId,
      lastMsg: cleanContent,
      time: DateTime.now(),
      incrementUnread: false,
    );

    // 3. Emit real-time over Socket.io
    _socketService.sendPrivateMessage(
      senderId: senderId,
      receiverId: receiverId,
      content: cleanContent,
    );

    // 4. Save to Database via REST API
    try {
      final sentMsg = await _repository.sendMessage(receiverId, cleanContent);
      final replaced = state.activeMessages.map((m) {
        return m.id == tempId ? sentMsg : m;
      }).toList();
      emit(state.copyWith(activeMessages: replaced));
    } catch (e) {
      log("⚠️ Failed to persist message via REST: $e");
    }
  }

  void sendTyping({required String senderId, required String receiverId, required bool isTyping}) {
    if (isTyping) {
      _socketService.sendTyping(senderId: senderId, receiverId: receiverId);
    } else {
      _socketService.sendStopTyping(senderId: senderId, receiverId: receiverId);
    }
  }

  @override
  Future<void> close() {
    _newMessageSub?.cancel();
    _messageSentSub?.cancel();
    _typingSub?.cancel();
    _stopTypingSub?.cancel();
    _notificationSub?.cancel();
    return super.close();
  }
}
