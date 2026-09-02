import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/avatar.dart';
import '../../../../shared/widgets/feedback.dart';
import '../../../auth/bloc/auth_bloc.dart';
import '../../../auth/bloc/auth_state.dart';
import 'package:hrms_app/features/chat/bloc/chat_cubit.dart';
import 'package:hrms_app/features/chat/data/models/chat_model.dart';

class ChatConversationPage extends StatefulWidget {
  final String otherUserId;
  final ChatUserModel? targetUser;

  const ChatConversationPage({
    super.key,
    required this.otherUserId,
    this.targetUser,
  });

  @override
  State<ChatConversationPage> createState() => _ChatConversationPageState();
}

class _ChatConversationPageState extends State<ChatConversationPage> with TickerProviderStateMixin {
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();
  Timer? _typingDebounce;
  bool _isLocalTyping = false;

  ChatUserModel? _user;

  @override
  void initState() {
    super.initState();
    _user = widget.targetUser;
    _loadMessages();
  }

  void _loadMessages() {
    final cubit = context.read<ChatCubit>();
    cubit.loadThread(widget.otherUserId);
  }

  @override
  void dispose() {
    _typingDebounce?.cancel();
    _messageController.dispose();
    _scrollController.dispose();

    // Clear active chat ID when leaving conversation so team directory stays active
    if (mounted) {
      context.read<ChatCubit>().setActiveChatUserId(null);
    }
    super.dispose();
  }

  void _onTextChanged(String text, String currentUserId) {
    final cubit = context.read<ChatCubit>();

    if (text.trim().isNotEmpty) {
      if (!_isLocalTyping) {
        _isLocalTyping = true;
        cubit.sendTyping(
          senderId: currentUserId,
          receiverId: widget.otherUserId,
          isTyping: true,
        );
      }

      _typingDebounce?.cancel();
      _typingDebounce = Timer(const Duration(milliseconds: 1500), () {
        _isLocalTyping = false;
        cubit.sendTyping(
          senderId: currentUserId,
          receiverId: widget.otherUserId,
          isTyping: false,
        );
      });
    } else {
      if (_isLocalTyping) {
        _isLocalTyping = false;
        _typingDebounce?.cancel();
        cubit.sendTyping(
          senderId: currentUserId,
          receiverId: widget.otherUserId,
          isTyping: false,
        );
      }
    }
  }

  void _sendMessage(String currentUserId) {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;

    _messageController.clear();
    _typingDebounce?.cancel();
    _isLocalTyping = false;

    final cubit = context.read<ChatCubit>();
    cubit.sendTyping(
      senderId: currentUserId,
      receiverId: widget.otherUserId,
      isTyping: false,
    );

    cubit.sendMessage(
      senderId: currentUserId,
      receiverId: widget.otherUserId,
      content: text,
    );

    _scrollToBottom();
  }

  void _sendQuickMessage(String text, String currentUserId) {
    _messageController.text = text;
    _sendMessage(currentUserId);
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent + 120,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOutCubic,
        );
      }
    });
  }

  String _formatDateHeader(DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final target = DateTime(date.year, date.month, date.day);

    if (target == today) {
      return 'Today';
    } else if (target == today.subtract(const Duration(days: 1))) {
      return 'Yesterday';
    } else {
      return DateFormat('EEEE, MMM d').format(date);
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = context.watch<AuthBloc>().state;
    final currentUser = authState is Authenticated ? authState.user : null;
    final currentUserId = currentUser?.id ?? '';

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9), // Slate light background
      body: SafeArea(
        child: Column(
          children: [
            // Custom App Header
            _buildHeader(context),

            // Message Thread Area
            Expanded(
              child: BlocConsumer<ChatCubit, ChatState>(
                listener: (context, state) {
                  if (state.activeMessages.isNotEmpty) {
                    _scrollToBottom();
                  }
                },
                builder: (context, state) {
                  if (state.isLoadingThread && state.activeMessages.isEmpty) {
                    return const LoadingState();
                  }

                  if (state.errorMessage != null && state.activeMessages.isEmpty) {
                    return ErrorState(
                      message: state.errorMessage!,
                      onRetry: _loadMessages,
                    );
                  }

                  final messages = state.activeMessages;
                  final isTyping = state.isOtherTyping;

                  if (messages.isEmpty && !isTyping) {
                    return _buildEmptyConversation(currentUserId);
                  }

                  return Container(
                    decoration: const BoxDecoration(
                      color: Color(0xFFF8FAFC),
                    ),
                    child: ListView.builder(
                      controller: _scrollController,
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                      itemCount: messages.length + (isTyping ? 1 : 0),
                      itemBuilder: (context, index) {
                        if (index == messages.length && isTyping) {
                          return _buildTypingBubble();
                        }

                        final msg = messages[index];
                        final isMe = msg.senderId == currentUserId ||
                            (currentUserId.isNotEmpty && msg.senderId.contains(currentUserId));

                        // Date group divider
                        bool showDateHeader = false;
                        if (index == 0) {
                          showDateHeader = true;
                        } else {
                          final prevMsg = messages[index - 1];
                          final prevDate = DateTime(
                            prevMsg.createdAt.year,
                            prevMsg.createdAt.month,
                            prevMsg.createdAt.day,
                          );
                          final curDate = DateTime(
                            msg.createdAt.year,
                            msg.createdAt.month,
                            msg.createdAt.day,
                          );
                          if (prevDate != curDate) {
                            showDateHeader = true;
                          }
                        }

                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            if (showDateHeader) _buildDateHeader(msg.createdAt),
                            _buildBubble(msg, isMe),
                          ],
                        );
                      },
                    ),
                  );
                },
              ),
            ),

            // Quick Reply Chips
            _buildQuickReplies(currentUserId),

            // Floating Input Bar
            _buildInputBar(currentUserId),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return BlocBuilder<ChatCubit, ChatState>(
      builder: (context, state) {
        final isOtherTyping = state.isOtherTyping;

        return Container(
          padding: const EdgeInsets.fromLTRB(8, 8, 16, 10),
          decoration: const BoxDecoration(
            color: Colors.white,
            border: Border(bottom: BorderSide(color: Color(0xFFE2E8F0))),
          ),
          child: Row(
            children: [
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20, color: AppTheme.textDark),
              ),
              Stack(
                children: [
                  Avatar(
                    url: _user?.profilePicture,
                    name: _user?.name ?? 'User',
                    size: 42,
                  ),
                  Positioned(
                    right: 0,
                    bottom: 0,
                    child: Container(
                      width: 12,
                      height: 12,
                      decoration: BoxDecoration(
                        color: const Color(0xFF10B981),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _user?.name ?? 'Team Member',
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 15.5,
                        color: AppTheme.textDark,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        if (isOtherTyping) ...[
                          Container(
                            width: 6,
                            height: 6,
                            decoration: const BoxDecoration(
                              color: AppTheme.primary,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 5),
                          const Text(
                            'typing...',
                            style: TextStyle(
                              fontSize: 11.5,
                              color: AppTheme.primary,
                              fontWeight: FontWeight.w700,
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                        ] else ...[
                          Text(
                            _user != null ? '${_user!.jobRole} • ${_user!.department}' : 'Online',
                            style: const TextStyle(
                              fontSize: 11.5,
                              color: AppTheme.textLight,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildDateHeader(DateTime date) {
    return Center(
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 14),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
        decoration: BoxDecoration(
          color: const Color(0xFFE2E8F0),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(
          _formatDateHeader(date),
          style: const TextStyle(
            color: Color(0xFF475569),
            fontSize: 11,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }

  Widget _buildBubble(ChatMessageModel msg, bool isMe) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isMe) ...[
            Avatar(
              url: _user?.profilePicture,
              name: _user?.name ?? 'User',
              size: 28,
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Container(
              constraints: BoxConstraints(
                maxWidth: MediaQuery.of(context).size.width * 0.74,
              ),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 11),
              decoration: BoxDecoration(
                gradient: isMe
                    ? const LinearGradient(
                        colors: [Color(0xFF4F46E5), Color(0xFF6366F1)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      )
                    : null,
                color: isMe ? null : Colors.white,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(18),
                  topRight: const Radius.circular(18),
                  bottomLeft: Radius.circular(isMe ? 18 : 4),
                  bottomRight: Radius.circular(isMe ? 4 : 18),
                ),
                border: isMe ? null : Border.all(color: const Color(0xFFE2E8F0)),
                boxShadow: [
                  BoxShadow(
                    color: isMe
                        ? const Color(0xFF4F46E5).withValues(alpha: 0.2)
                        : Colors.black.withValues(alpha: 0.03),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                children: [
                  Text(
                    msg.content,
                    style: TextStyle(
                      color: isMe ? Colors.white : AppTheme.textDark,
                      fontSize: 14.5,
                      fontWeight: isMe ? FontWeight.w500 : FontWeight.w400,
                      height: 1.35,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        DateFormat('hh:mm a').format(msg.createdAt),
                        style: TextStyle(
                          color: isMe ? Colors.white.withValues(alpha: 0.8) : AppTheme.textLight,
                          fontSize: 9.5,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      if (isMe) ...[
                        const SizedBox(width: 4),
                        Icon(
                          msg.read ? Icons.done_all_rounded : Icons.check_rounded,
                          size: 13,
                          color: msg.read ? const Color(0xFF93C5FD) : Colors.white70,
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTypingBubble() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Avatar(
            url: _user?.profilePicture,
            name: _user?.name ?? 'User',
            size: 28,
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.04),
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildBouncingDot(0),
                const SizedBox(width: 4),
                _buildBouncingDot(150),
                const SizedBox(width: 4),
                _buildBouncingDot(300),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBouncingDot(int delay) {
    return Container(
      width: 6,
      height: 6,
      decoration: const BoxDecoration(
        color: AppTheme.primary,
        shape: BoxShape.circle,
      ),
    );
  }

  Widget _buildEmptyConversation(String currentUserId) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(
                color: AppTheme.primary.withValues(alpha: 0.08),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.chat_bubble_outline_rounded,
                size: 46,
                color: AppTheme.primary,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Start conversation with ${_user?.name ?? 'colleague'}',
              style: const TextStyle(
                fontSize: 16.5,
                fontWeight: FontWeight.w800,
                color: AppTheme.textDark,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            const Text(
              'All messages are secure, private, and synced across team devices in real time.',
              style: TextStyle(
                fontSize: 12.5,
                color: AppTheme.textLight,
                height: 1.4,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickReplies(String currentUserId) {
    final quicks = ['👋 Hi there!', '👍 Got it!', '📅 Can we connect?', '🚀 Working on it!', 'Thanks!'];

    return Container(
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(16, 6, 16, 6),
      child: SizedBox(
        height: 32,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          itemCount: quicks.length,
          separatorBuilder: (context, index) => const SizedBox(width: 8),
          itemBuilder: (context, index) {
            return ActionChip(
              label: Text(
                quicks[index],
                style: const TextStyle(
                  fontSize: 11.5,
                  color: AppTheme.textDark,
                  fontWeight: FontWeight.w700,
                ),
              ),
              backgroundColor: const Color(0xFFF1F5F9),
              side: BorderSide.none,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 0),
              onPressed: () => _sendQuickMessage(quicks[index], currentUserId),
            );
          },
        ),
      ),
    );
  }

  Widget _buildInputBar(String currentUserId) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 6, 16, 14),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: Container(
              constraints: const BoxConstraints(maxHeight: 120),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: const Color(0xFFCBD5E1)),
              ),
              child: TextField(
                controller: _messageController,
                maxLines: null,
                textInputAction: TextInputAction.send,
                keyboardType: TextInputType.multiline,
                style: const TextStyle(fontSize: 14, color: AppTheme.textDark),
                decoration: const InputDecoration(
                  hintText: 'Type your message...',
                  hintStyle: TextStyle(color: AppTheme.textLight, fontSize: 13),
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                ),
                onChanged: (text) => _onTextChanged(text, currentUserId),
                onSubmitted: (_) => _sendMessage(currentUserId),
              ),
            ),
          ),
          const SizedBox(width: 10),
          Container(
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF4F46E5), Color(0xFF6366F1)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.primary.withValues(alpha: 0.35),
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Material(
              color: Colors.transparent,
              borderRadius: BorderRadius.circular(24),
              child: InkWell(
                onTap: () => _sendMessage(currentUserId),
                borderRadius: BorderRadius.circular(24),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  child: const Icon(
                    Icons.send_rounded,
                    color: Colors.white,
                    size: 20,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
