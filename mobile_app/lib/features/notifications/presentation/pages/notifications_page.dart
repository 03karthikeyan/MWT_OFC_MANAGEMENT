import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/cards.dart';
import '../../../../shared/widgets/chips.dart';
import '../../../../shared/widgets/feedback.dart';
import '../../../../shared/widgets/layout.dart';
import '../../../../shared/widgets/text_fields.dart';
import '../../bloc/notification_cubit.dart';

class NotificationsPage extends StatefulWidget {
  final bool isAdmin;

  const NotificationsPage({super.key, this.isAdmin = false});

  @override
  State<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends State<NotificationsPage> {
  @override
  void initState() {
    super.initState();
    _loadData();
  }

  void _loadData() {
    if (widget.isAdmin) {
      context.read<NotificationCubit>().loadAllNotifications();
    } else {
      context.read<NotificationCubit>().loadMyNotifications();
    }
  }

  void _showAddNotificationDialog() {
    final formKey = GlobalKey<FormState>();
    final titleController = TextEditingController();
    final messageController = TextEditingController();
    String type = 'info';
    String target = 'all';

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: const Text('Broadcast Notification', style: TextStyle(fontWeight: FontWeight.bold)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              content: SingleChildScrollView(
                child: Form(
                  key: formKey,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      DropdownButtonFormField<String>(
                        value: type,
                        items: const [
                          DropdownMenuItem(value: 'info', child: Text('INFO')),
                          DropdownMenuItem(value: 'warning', child: Text('WARNING')),
                          DropdownMenuItem(value: 'urgent', child: Text('URGENT')),
                        ],
                        onChanged: (val) {
                          if (val != null) {
                            setDialogState(() {
                              type = val;
                            });
                          }
                        },
                      ),
                      const SizedBox(height: 12),
                      AppTextField(
                        label: 'Title',
                        controller: titleController,
                        validator: (val) => val == null || val.trim().isEmpty ? 'Required' : null,
                      ),
                      const SizedBox(height: 12),
                      AppTextField(
                        label: 'Message',
                        controller: messageController,
                        keyboardType: TextInputType.multiline,
                        validator: (val) => val == null || val.trim().isEmpty ? 'Required' : null,
                      ),
                    ],
                  ),
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('Cancel', style: TextStyle(color: AppTheme.textLight)),
                ),
                TextButton(
                  onPressed: () {
                    if (formKey.currentState!.validate()) {
                      context.read<NotificationCubit>().publishNotification({
                        'title': titleController.text.trim(),
                        'message': messageController.text.trim(),
                        'type': type,
                        'target': target,
                      });
                      Navigator.of(context).pop();
                    }
                  },
                  child: const Text('Send', style: TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold)),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'Notifications',
      showAppBar: true,
      floatingActionButton: widget.isAdmin
          ? FloatingActionButton(
              onPressed: _showAddNotificationDialog,
              backgroundColor: AppTheme.secondary,
              child: const Icon(Icons.send, color: Colors.white),
            )
          : null,
      body: BlocBuilder<NotificationCubit, NotificationState>(
        builder: (context, state) {
          if (state is NotificationLoading) {
            return const LoadingState();
          }
          if (state is NotificationFailure) {
            return ErrorState(message: state.message, onRetry: _loadData);
          }
          if (state is NotificationLoaded) {
            final list = state.notifications;

            if (list.isEmpty) {
              return const EmptyState(
                title: 'Inbox Empty',
                message: 'You do not have any notification announcements.',
                icon: Icons.notifications_off_outlined,
              );
            }

            return RefreshIndicator(
              onRefresh: () async => _loadData(),
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: list.length,
                itemBuilder: (context, index) {
                  final notif = list[index];
                  return Container(
                    margin: const EdgeInsets.symmetric(vertical: 4),
                    child: AppCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              StatusChip(label: notif.type, status: notif.type),
                              if (widget.isAdmin)
                                IconButton(
                                  icon: const Icon(Icons.delete_outline, color: AppTheme.error, size: 18),
                                  onPressed: () {
                                    context.read<NotificationCubit>().removeNotification(notif.id, true);
                                  },
                                ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            notif.title,
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            notif.message,
                            style: const TextStyle(color: AppTheme.textLight, fontSize: 13),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            notif.createdAt != null ? DateFormat('dd MMM yyyy, hh:mm a').format(notif.createdAt!) : '',
                            style: const TextStyle(fontSize: 10, color: AppTheme.textLight),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            );
          }
          return const EmptyState();
        },
      ),
    );
  }
}
