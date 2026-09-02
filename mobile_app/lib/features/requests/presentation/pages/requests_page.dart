import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/cards.dart';
import '../../../../shared/widgets/chips.dart';
import '../../../../shared/widgets/feedback.dart';
import '../../../../shared/widgets/layout.dart';
import '../../../../shared/widgets/text_fields.dart';
import '../../bloc/request_cubit.dart';

class RequestsPage extends StatefulWidget {
  final bool isAdmin;

  const RequestsPage({super.key, this.isAdmin = false});

  @override
  State<RequestsPage> createState() => _RequestsPageState();
}

class _RequestsPageState extends State<RequestsPage> {
  @override
  void initState() {
    super.initState();
    _loadData();
  }

  void _loadData() {
    if (widget.isAdmin) {
      context.read<RequestCubit>().loadIncomingRequests();
    } else {
      context.read<RequestCubit>().loadMyRequests();
    }
  }

  void _showAddRequestDialog() {
    final formKey = GlobalKey<FormState>();
    final subjectController = TextEditingController();
    final descController = TextEditingController();
    final linkController = TextEditingController();
    String type = 'Request';

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: const Text('New Support Request', style: TextStyle(fontWeight: FontWeight.bold)),
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
                          DropdownMenuItem(value: 'Request', child: Text('Request')),
                          DropdownMenuItem(value: 'Review', child: Text('Review')),
                          DropdownMenuItem(value: 'Feedback', child: Text('Feedback')),
                          DropdownMenuItem(value: 'Other', child: Text('Other')),
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
                        label: 'Subject',
                        controller: subjectController,
                        validator: (val) => val == null || val.trim().isEmpty ? 'Required' : null,
                      ),
                      const SizedBox(height: 12),
                      AppTextField(
                        label: 'Description',
                        controller: descController,
                        validator: (val) => val == null || val.trim().isEmpty ? 'Required' : null,
                      ),
                      const SizedBox(height: 12),
                      AppTextField(
                        label: 'Optional Web Link',
                        controller: linkController,
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
                      context.read<RequestCubit>().createRequest(
                            subjectController.text.trim(),
                            descController.text.trim(),
                            type,
                            linkController.text.trim(),
                            null,
                          );
                      Navigator.of(context).pop();
                    }
                  },
                  child: const Text('Submit', style: TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold)),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _showReviewDialog(String id, String currentRemarks, String currentStatus) {
    final formKey = GlobalKey<FormState>();
    final remarksController = TextEditingController(text: currentRemarks);
    String status = currentStatus;

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: const Text('Review Support Ticket', style: TextStyle(fontWeight: FontWeight.bold)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              content: Form(
                key: formKey,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    DropdownButtonFormField<String>(
                      value: status,
                      items: const [
                        DropdownMenuItem(value: 'Pending', child: Text('Pending')),
                        DropdownMenuItem(value: 'In Progress', child: Text('In Progress')),
                        DropdownMenuItem(value: 'Resolved', child: Text('Resolved')),
                        DropdownMenuItem(value: 'Rejected', child: Text('Rejected')),
                      ],
                      onChanged: (val) {
                        if (val != null) {
                          setDialogState(() {
                            status = val;
                          });
                        }
                      },
                    ),
                    const SizedBox(height: 16),
                    AppTextField(
                      label: 'Remarks/Response',
                      controller: remarksController,
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('Cancel', style: TextStyle(color: AppTheme.textLight)),
                ),
                TextButton(
                  onPressed: () {
                    context.read<RequestCubit>().reviewRequest(id, {
                      'status': status,
                      'remarks': remarksController.text.trim(),
                    });
                    Navigator.of(context).pop();
                  },
                  child: const Text('Save', style: TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold)),
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
      title: widget.isAdmin ? 'Incoming Requests' : 'My Support Tickets',
      showAppBar: true,
      floatingActionButton: !widget.isAdmin
          ? FloatingActionButton(
              onPressed: _showAddRequestDialog,
              backgroundColor: AppTheme.primary,
              child: const Icon(Icons.add, color: Colors.white),
            )
          : null,
      body: BlocBuilder<RequestCubit, RequestState>(
        builder: (context, state) {
          if (state is RequestLoading) {
            return const LoadingState();
          }
          if (state is RequestFailure) {
            return ErrorState(message: state.message, onRetry: _loadData);
          }
          if (state is RequestLoaded) {
            final list = state.requests;

            if (list.isEmpty) {
              return const EmptyState(
                title: 'No Tickets Found',
                message: 'No support requests registered.',
              );
            }

            return RefreshIndicator(
              onRefresh: () async => _loadData(),
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: list.length,
                itemBuilder: (context, index) {
                  final req = list[index];
                  final isPending = req.status == 'Pending';

                  return Container(
                    margin: const EdgeInsets.symmetric(vertical: 6),
                    child: AppCard(
                      onTap: widget.isAdmin ? () => _showReviewDialog(req.id, req.remarks, req.status) : null,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                req.type.toUpperCase(),
                                style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primary, fontSize: 12),
                              ),
                              StatusChip(label: req.status, status: req.status),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            req.subject,
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                          ),
                          Text(
                            req.description,
                            style: const TextStyle(color: AppTheme.textLight, fontSize: 13),
                          ),
                          if (req.remarks.isNotEmpty) ...[
                            const Divider(height: 16),
                            Text(
                              'Admin Remarks: ${req.remarks}',
                              style: const TextStyle(fontStyle: FontStyle.italic, fontSize: 12, color: AppTheme.secondary),
                            ),
                          ],
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                req.createdAt != null ? DateFormat('dd MMM yyyy').format(req.createdAt!) : '',
                                style: const TextStyle(fontSize: 11, color: AppTheme.textLight),
                              ),
                              if (!widget.isAdmin && isPending)
                                IconButton(
                                  icon: const Icon(Icons.delete_outline, color: AppTheme.error, size: 18),
                                  onPressed: () {
                                    context.read<RequestCubit>().removeRequest(req.id);
                                  },
                                ),
                            ],
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
