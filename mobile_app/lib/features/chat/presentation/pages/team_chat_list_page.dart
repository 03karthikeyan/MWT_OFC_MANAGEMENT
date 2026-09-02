import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/avatar.dart';
import '../../../../shared/widgets/feedback.dart';
import '../../../auth/bloc/auth_bloc.dart';
import '../../../auth/bloc/auth_state.dart';
import 'package:hrms_app/features/chat/bloc/chat_cubit.dart';
import 'package:hrms_app/features/chat/data/models/chat_model.dart';

class TeamChatListPage extends StatefulWidget {
  const TeamChatListPage({super.key});

  @override
  State<TeamChatListPage> createState() => _TeamChatListPageState();
}

class _TeamChatListPageState extends State<TeamChatListPage> {
  String _searchQuery = '';
  String _selectedFilter = 'all'; // 'all', 'unread', 'admin', 'developer'
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  void _loadData() {
    context.read<ChatCubit>().loadChatUsers();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  String _formatMessageTime(DateTime? time) {
    if (time == null) return '';
    final now = DateTime.now();
    final difference = now.difference(time);

    if (difference.inMinutes < 1) {
      return 'Just now';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inHours < 24 && now.day == time.day) {
      return DateFormat('hh:mm a').format(time);
    } else if (difference.inDays == 1 || (difference.inHours < 48 && now.day != time.day)) {
      return 'Yesterday';
    } else {
      return DateFormat('dd MMM').format(time);
    }
  }

  Color _getRoleBadgeColor(String role, String jobRole) {
    final r = role.toLowerCase();
    final j = jobRole.toLowerCase();
    if (r == 'admin') return const Color(0xFFE11D48); // Rose
    if (j.contains('leader') || j.contains('lead') || j.contains('manager')) return const Color(0xFFD97706); // Amber
    if (j.contains('developer') || j.contains('engineer') || j.contains('tech')) return const Color(0xFF4F46E5); // Indigo
    if (j.contains('hr') || j.contains('human')) return const Color(0xFF0D9488); // Teal
    if (j.contains('design') || j.contains('ui')) return const Color(0xFF9333EA); // Purple
    return const Color(0xFF475569); // Slate
  }

  @override
  Widget build(BuildContext context) {
    final authState = context.watch<AuthBloc>().state;
    final currentUser = authState is Authenticated ? authState.user : null;
    final currentUserId = currentUser?.id ?? '';
    final currentUsername = currentUser?.username ?? '';

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: Column(
          children: [
            // Premium Header Bar
            _buildTopAppBar(context),

            // Search Bar & Filter Chips
            _buildSearchAndFilters(),

            // Chat Directory List
            Expanded(
              child: BlocBuilder<ChatCubit, ChatState>(
                builder: (context, state) {
                  if (state.isLoadingUsers && state.users.isEmpty) {
                    return const LoadingState();
                  }

                  if (state.errorMessage != null && state.users.isEmpty) {
                    return ErrorState(
                      message: state.errorMessage!,
                      onRetry: _loadData,
                    );
                  }

                  // 1. Exclude the logged-in user profile
                  final allColleagues = state.users.where((u) {
                    final isCurrentUser = u.id == currentUserId ||
                        (currentUsername.isNotEmpty &&
                            u.username.trim().toLowerCase() == currentUsername.trim().toLowerCase());
                    return !isCurrentUser;
                  }).toList();

                  // 2. Apply search & filter chips
                  final filtered = allColleagues.where((u) {
                    // Category filter
                    if (_selectedFilter == 'unread' && u.unreadCount == 0) return false;
                    if (_selectedFilter == 'admin' && u.role.toLowerCase() != 'admin') return false;
                    if (_selectedFilter == 'developer' &&
                        !u.jobRole.toLowerCase().contains('developer') &&
                        !u.jobRole.toLowerCase().contains('engineer')) {
                      return false;
                    }

                    // Search filter
                    if (_searchQuery.isEmpty) return true;
                    final q = _searchQuery.toLowerCase();
                    final name = u.name.toLowerCase();
                    final role = u.jobRole.toLowerCase();
                    final dept = u.department.toLowerCase();
                    final username = u.username.toLowerCase();
                    return name.contains(q) || role.contains(q) || dept.contains(q) || username.contains(q);
                  }).toList();

                  return RefreshIndicator(
                    onRefresh: () async => _loadData(),
                    color: AppTheme.primary,
                    child: filtered.isEmpty
                        ? _buildEmptyState()
                        : ListView.builder(
                            padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                            itemCount: filtered.length + (_searchQuery.isEmpty && _selectedFilter == 'all' ? 1 : 0),
                            itemBuilder: (context, index) {
                              // Quick team contacts avatar bar at index 0
                              if (_searchQuery.isEmpty && _selectedFilter == 'all') {
                                if (index == 0) {
                                  return _buildQuickTeamBar(allColleagues);
                                }
                                final u = filtered[index - 1];
                                return _buildChatCard(u);
                              }

                              final u = filtered[index];
                              return _buildChatCard(u);
                            },
                          ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTopAppBar(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(8, 8, 16, 12),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: Color(0xFFF1F5F9))),
      ),
      child: Row(
        children: [
          IconButton(
            onPressed: () => Navigator.pop(context),
            icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20, color: AppTheme.textDark),
          ),
          const SizedBox(width: 4),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Text(
                      'Team Messages',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                        color: AppTheme.textDark,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppTheme.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Text(
                        'LIVE',
                        style: TextStyle(
                          color: AppTheme.primary,
                          fontSize: 9.5,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0.8,
                        ),
                      ),
                    ),
                  ],
                ),
                const Text(
                  'Real-time direct messaging with colleagues',
                  style: TextStyle(
                    fontSize: 11.5,
                    color: AppTheme.textLight,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          Material(
            color: const Color(0xFFF1F5F9),
            borderRadius: BorderRadius.circular(12),
            child: InkWell(
              onTap: _loadData,
              borderRadius: BorderRadius.circular(12),
              child: Container(
                padding: const EdgeInsets.all(8),
                child: const Icon(Icons.sync_rounded, color: AppTheme.textDark, size: 20),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchAndFilters() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
      child: Column(
        children: [
          // Search Input Box
          Container(
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: TextField(
              controller: _searchController,
              onChanged: (val) => setState(() => _searchQuery = val.trim()),
              style: const TextStyle(fontSize: 14, color: AppTheme.textDark),
              decoration: InputDecoration(
                hintText: 'Search by name, role, department...',
                hintStyle: const TextStyle(color: AppTheme.textLight, fontSize: 13),
                prefixIcon: const Icon(Icons.search_rounded, color: AppTheme.primary, size: 20),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.cancel_rounded, color: AppTheme.textLight, size: 18),
                        onPressed: () {
                          _searchController.clear();
                          setState(() => _searchQuery = '');
                        },
                      )
                    : null,
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              ),
            ),
          ),
          const SizedBox(height: 10),

          // Filter Category Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildFilterChip('all', 'All Members', Icons.people_outline_rounded),
                const SizedBox(width: 8),
                _buildFilterChip('unread', 'Unread', Icons.mark_chat_unread_outlined),
                const SizedBox(width: 8),
                _buildFilterChip('admin', 'Admins', Icons.shield_outlined),
                const SizedBox(width: 8),
                _buildFilterChip('developer', 'Developers', Icons.code_rounded),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String key, String label, IconData icon) {
    final isSelected = _selectedFilter == key;

    return InkWell(
      onTap: () => setState(() => _selectedFilter = key),
      borderRadius: BorderRadius.circular(20),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primary : const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(20),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: AppTheme.primary.withValues(alpha: 0.25),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  )
                ]
              : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 13,
              color: isSelected ? Colors.white : AppTheme.textLight,
            ),
            const SizedBox(width: 5),
            Text(
              label,
              style: TextStyle(
                fontSize: 11.5,
                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                color: isSelected ? Colors.white : AppTheme.textDark,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickTeamBar(List<ChatUserModel> colleagues) {
    if (colleagues.isEmpty) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.only(bottom: 12, top: 6),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'TEAM DIRECTORY',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              color: AppTheme.textLight,
              letterSpacing: 1.0,
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            height: 78,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: colleagues.length,
              separatorBuilder: (c, i) => const SizedBox(width: 14),
              itemBuilder: (context, index) {
                final u = colleagues[index];
                final firstName = u.name.split(' ').first;

                return GestureDetector(
                  onTap: () {
                    context.push('/chat/${u.id}', extra: u);
                  },
                  child: Column(
                    children: [
                      Stack(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(2),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: u.unreadCount > 0 ? AppTheme.primary : const Color(0xFFE2E8F0),
                                width: 2,
                              ),
                            ),
                            child: Avatar(
                              url: u.profilePicture,
                              name: u.name,
                              size: 46,
                            ),
                          ),
                          Positioned(
                            right: 2,
                            bottom: 2,
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
                      const SizedBox(height: 4),
                      SizedBox(
                        width: 54,
                        child: Text(
                          firstName,
                          style: const TextStyle(
                            fontSize: 10.5,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.textDark,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
          const Divider(color: Color(0xFFE2E8F0), height: 16),
        ],
      ),
    );
  }

  Widget _buildChatCard(ChatUserModel u) {
    final isAdmin = u.role.toLowerCase() == 'admin';
    final hasUnread = u.unreadCount > 0;
    final badgeColor = _getRoleBadgeColor(u.role, u.jobRole);

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: hasUnread ? AppTheme.primary.withValues(alpha: 0.3) : const Color(0xFFF1F5F9),
          width: hasUnread ? 1.5 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: hasUnread ? 0.05 : 0.02),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(18),
        child: InkWell(
          onTap: () {
            context.push('/chat/${u.id}', extra: u);
          },
          borderRadius: BorderRadius.circular(18),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                // Avatar with Badge
                Stack(
                  children: [
                    Avatar(
                      url: u.profilePicture,
                      name: u.name,
                      size: 52,
                    ),
                    if (isAdmin)
                      Positioned(
                        right: 0,
                        bottom: 0,
                        child: Container(
                          padding: const EdgeInsets.all(3),
                          decoration: const BoxDecoration(
                            color: Color(0xFFE11D48),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.shield_rounded,
                            size: 10,
                            color: Colors.white,
                          ),
                        ),
                      )
                    else
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
                const SizedBox(width: 14),

                // Name, Role & Message preview
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              u.name,
                              style: TextStyle(
                                fontWeight: hasUnread ? FontWeight.w900 : FontWeight.w700,
                                fontSize: 15,
                                color: AppTheme.textDark,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          if (u.lastMessageTime != null)
                            Text(
                              _formatMessageTime(u.lastMessageTime),
                              style: TextStyle(
                                fontSize: 11,
                                color: hasUnread ? AppTheme.primary : AppTheme.textLight,
                                fontWeight: hasUnread ? FontWeight.bold : FontWeight.w500,
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 4),

                      // Role Tag & Department
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                            decoration: BoxDecoration(
                              color: badgeColor.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              isAdmin ? 'ADMIN' : u.jobRole.toUpperCase(),
                              style: TextStyle(
                                fontSize: 8.5,
                                fontWeight: FontWeight.w800,
                                color: badgeColor,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            u.department,
                            style: const TextStyle(
                              fontSize: 10.5,
                              color: AppTheme.textLight,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 5),

                      // Last Message
                      Text(
                        u.lastMessage ?? 'Tap to start conversation...',
                        style: TextStyle(
                          fontSize: 12.5,
                          color: hasUnread ? AppTheme.textDark : AppTheme.textLight,
                          fontWeight: hasUnread ? FontWeight.w700 : FontWeight.w400,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),

                // Unread Count Badge
                if (hasUnread) ...[
                  const SizedBox(width: 10),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppTheme.primary,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.primary.withValues(alpha: 0.35),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Text(
                      '${u.unreadCount}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppTheme.primary.withValues(alpha: 0.08),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.chat_bubble_outline_rounded, size: 48, color: AppTheme.primary),
            ),
            const SizedBox(height: 16),
            Text(
              _searchQuery.isNotEmpty ? 'No Members Found' : 'No Messages Yet',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppTheme.textDark),
            ),
            const SizedBox(height: 6),
            Text(
              _searchQuery.isNotEmpty
                  ? 'No colleagues match "$_searchQuery". Try another keyword.'
                  : 'Start a conversation with any team member from the directory above.',
              style: const TextStyle(fontSize: 12.5, color: AppTheme.textLight),
              textAlign: TextAlign.center,
            ),
            if (_searchQuery.isNotEmpty) ...[
              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: () {
                  _searchController.clear();
                  setState(() {
                    _searchQuery = '';
                    _selectedFilter = 'all';
                  });
                },
                icon: const Icon(Icons.clear_rounded, size: 16),
                label: const Text('Clear Filters'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
