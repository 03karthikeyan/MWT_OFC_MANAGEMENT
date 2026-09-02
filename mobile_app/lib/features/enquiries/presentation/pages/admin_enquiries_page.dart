import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import 'package:hrms_app/features/auth/bloc/auth_bloc.dart';
import 'package:hrms_app/features/auth/bloc/auth_state.dart';
import 'package:hrms_app/shared/widgets/text_fields.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/cards.dart';
import '../../../../shared/widgets/chips.dart';
import '../../../../shared/widgets/feedback.dart';
import '../../../../shared/widgets/layout.dart';
import '../../data/repository/enquiry_repository.dart';
import '../../data/models/enquiry_model.dart';

class AdminEnquiriesPage extends StatefulWidget {
  const AdminEnquiriesPage({super.key});

  @override
  State<AdminEnquiriesPage> createState() => _AdminEnquiriesPageState();
}

class _AdminEnquiriesPageState extends State<AdminEnquiriesPage> {
  final _repository = EnquiryRepository();
  List<EnquiryModel> _list = [];
  bool _isLoading = true;
  String? _errorMessage;

  String _searchQuery = '';
  String _selectedStatus = 'All';

  final List<String> _statuses = [
    'All',
    'New',
    'In Progress',
    'Resolved',
    'Closed'
  ];

  final Set<String> _expandedEnquiryIds = {};

  final Map<String, Color> _statusColors = {
    'New': const Color(0xFFF59E0B),
    'In Progress': const Color(0xFF3B82F6),
    'Resolved': const Color(0xFF10B981),
    'Closed': const Color(0xFF64748B),
  };

  final Map<String, IconData> _statusIcons = {
    'New': Icons.fiber_new_rounded,
    'In Progress': Icons.hourglass_top_rounded,
    'Resolved': Icons.check_circle_outline_rounded,
    'Closed': Icons.archive_outlined,
  };

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  void _loadData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final res = await _repository.getEnquiries();
      setState(() {
        _list = res;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = e.toString();
      });
    }
  }

  int _getStatusCount(String status) {
    if (status == 'All') return _list.length;
    return _list.where((e) => e.status == status).length;
  }

  void _showAddEditSheet([EnquiryModel? enq]) {
    final isEditing = enq != null;
    final formKey = GlobalKey<FormState>();
    final nameController = TextEditingController(text: enq?.name);
    final emailController = TextEditingController(text: enq?.email);
    final phoneController = TextEditingController(text: enq?.phone);
    final subjectController = TextEditingController(text: enq?.subject);
    final messageController = TextEditingController(text: enq?.message);
    String selectedStatus = enq?.status ?? 'New';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            return Container(
              constraints: BoxConstraints(
                maxHeight: MediaQuery.of(context).size.height * 0.92,
              ),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    margin: const EdgeInsets.only(top: 12),
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(24, 20, 16, 0),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                const Color(0xFF3B82F6),
                                const Color(0xFF3B82F6).withOpacity(0.7),
                              ],
                            ),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Icon(
                            isEditing ? Icons.edit_rounded : Icons.mail_rounded,
                            color: Colors.white,
                            size: 20,
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                isEditing ? 'EDIT ENQUIRY' : 'NEW ENQUIRY',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w900,
                                  fontSize: 16,
                                  color: AppTheme.textDark,
                                  letterSpacing: 0.5,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                isEditing ? 'Update enquiry details' : 'Record a new client enquiry',
                                style: const TextStyle(color: AppTheme.textLight, fontSize: 12),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          onPressed: () => Navigator.pop(context),
                          icon: const Icon(Icons.close_rounded, color: AppTheme.textLight),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Divider(height: 1),
                  Flexible(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.fromLTRB(24, 20, 24, 32),
                      child: Form(
                        key: formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            AppTextField(
                              label: 'Client Name *',
                              hint: 'Full name',
                              controller: nameController,
                              prefixIcon: Icons.person_outline_rounded,
                              validator: (v) => v == null || v.trim().isEmpty ? 'Name is required' : null,
                            ),
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                Expanded(
                                  child: AppTextField(
                                    label: 'Email',
                                    hint: 'Email address',
                                    controller: emailController,
                                    keyboardType: TextInputType.emailAddress,
                                    prefixIcon: Icons.email_outlined,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: AppTextField(
                                    label: 'Phone',
                                    hint: 'Phone number',
                                    controller: phoneController,
                                    keyboardType: TextInputType.phone,
                                    prefixIcon: Icons.phone_outlined,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            AppTextField(
                              label: 'Subject *',
                              hint: 'Enquiry subject',
                              controller: subjectController,
                              prefixIcon: Icons.subject_rounded,
                              validator: (v) => v == null || v.trim().isEmpty ? 'Subject is required' : null,
                            ),
                            const SizedBox(height: 16),
                            AppTextField(
                              label: 'Message *',
                              hint: 'Detailed message content...',
                              controller: messageController,
                              validator: (v) => v == null || v.trim().isEmpty ? 'Message is required' : null,
                            ),
                            const SizedBox(height: 16),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Status',
                                  style: TextStyle(fontWeight: FontWeight.w500, fontSize: 13, color: AppTheme.textDark),
                                ),
                                const SizedBox(height: 8),
                                Wrap(
                                  spacing: 8,
                                  runSpacing: 8,
                                  children: _statuses.where((s) => s != 'All').map((s) {
                                    final isActive = selectedStatus == s;
                                    final color = _statusColors[s] ?? AppTheme.textLight;
                                    return Material(
                                      color: isActive ? color.withOpacity(0.1) : Colors.grey.shade50,
                                      borderRadius: BorderRadius.circular(10),
                                      child: InkWell(
                                        onTap: () => setSheetState(() => selectedStatus = s),
                                        borderRadius: BorderRadius.circular(10),
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                          decoration: BoxDecoration(
                                            borderRadius: BorderRadius.circular(10),
                                            border: Border.all(
                                              color: isActive ? color : const Color(0xFFE2E8F0),
                                              width: isActive ? 1.5 : 1,
                                            ),
                                          ),
                                          child: Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              Icon(_statusIcons[s], size: 14, color: isActive ? color : AppTheme.textLight),
                                              const SizedBox(width: 6),
                                              Text(
                                                s,
                                                style: TextStyle(
                                                  fontSize: 12,
                                                  fontWeight: FontWeight.w700,
                                                  color: isActive ? color : AppTheme.textLight,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                    );
                                  }).toList(),
                                ),
                              ],
                            ),
                            const SizedBox(height: 28),
                            SizedBox(
                              width: double.infinity,
                              height: 52,
                              child: ElevatedButton(
                                onPressed: () async {
                                  if (formKey.currentState?.validate() ?? false) {
                                    final data = {
                                      'name': nameController.text.trim(),
                                      'email': emailController.text.trim(),
                                      'phone': phoneController.text.trim(),
                                      'subject': subjectController.text.trim(),
                                      'message': messageController.text.trim(),
                                      'status': selectedStatus,
                                    };
                                    final messenger = ScaffoldMessenger.of(context);
                                    Navigator.of(context).pop();
                                    setState(() => _isLoading = true);
                                    try {
                                      if (isEditing) {
                                        await _repository.updateEnquiry(enq.id, data);
                                        messenger.showSnackBar(
                                          const SnackBar(content: Text('Enquiry updated!'), backgroundColor: AppTheme.success),
                                        );
                                      } else {
                                        await _repository.addEnquiry(data);
                                        messenger.showSnackBar(
                                          const SnackBar(content: Text('Enquiry added!'), backgroundColor: AppTheme.success),
                                        );
                                      }
                                      _loadData();
                                    } catch (e) {
                                      messenger.showSnackBar(SnackBar(content: Text('Failed: $e'), backgroundColor: AppTheme.error));
                                      setState(() => _isLoading = false);
                                    }
                                  }
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppTheme.primary,
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                                  elevation: 0,
                                ),
                                child: Text(
                                  isEditing ? 'UPDATE ENQUIRY' : 'SUBMIT ENQUIRY',
                                  style: const TextStyle(fontWeight: FontWeight.w800, letterSpacing: 1, fontSize: 13),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _confirmDelete(String id) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppTheme.error.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.delete_outline_rounded, color: AppTheme.error, size: 20),
              ),
              const SizedBox(width: 12),
              const Text('Delete Enquiry', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
            ],
          ),
          content: const Text(
            'Are you sure you want to delete this enquiry? This action cannot be undone.',
            style: TextStyle(color: AppTheme.textLight, fontSize: 13, height: 1.5),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('CANCEL', style: TextStyle(color: AppTheme.textLight, fontWeight: FontWeight.w700)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.error,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                elevation: 0,
              ),
              onPressed: () async {
                final messenger = ScaffoldMessenger.of(context);
                Navigator.of(context).pop();
                setState(() => _isLoading = true);
                try {
                  await _repository.deleteEnquiry(id);
                  messenger.showSnackBar(
                    const SnackBar(content: Text('Enquiry deleted!'), backgroundColor: AppTheme.success),
                  );
                  _loadData();
                } catch (e) {
                  messenger.showSnackBar(SnackBar(content: Text('Failed: $e'), backgroundColor: AppTheme.error));
                  setState(() => _isLoading = false);
                }
              },
              child: const Text('DELETE', style: TextStyle(fontWeight: FontWeight.w700)),
            ),
          ],
        );
      },
    );
  }

  // ── UI Builders ──────────────────────────────────────────────────────

  Widget _buildHeader(bool hasAccess) {
    final newCount = _getStatusCount('New');
    final inProgressCount = _getStatusCount('In Progress');
    final resolvedCount = _getStatusCount('Resolved');

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF3B82F6), Color(0xFF1D4ED8)],
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF3B82F6).withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'ENQUIRIES',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        fontSize: 20,
                        letterSpacing: 1.5,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Manage website contact forms and enquiries',
                      style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 11, fontWeight: FontWeight.w500),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              if (hasAccess)
                Material(
                  color: Colors.white.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(14),
                  child: InkWell(
                    onTap: () => _showAddEditSheet(),
                    borderRadius: BorderRadius.circular(14),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.add_rounded, color: Colors.white, size: 16),
                          SizedBox(width: 4),
                          Text('NEW', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 11, letterSpacing: 0.5)),
                        ],
                      ),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              _buildStatPill(Icons.fiber_new_rounded, '$newCount', 'New'),
              const SizedBox(width: 6),
              _buildStatPill(Icons.hourglass_top_rounded, '$inProgressCount', 'Progress'),
              const SizedBox(width: 6),
              _buildStatPill(Icons.check_circle_outline_rounded, '$resolvedCount', 'Resolved'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatPill(IconData icon, String value, String label) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.15),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Icon(icon, color: Colors.white.withOpacity(0.9), size: 15),
            const SizedBox(width: 6),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 14), maxLines: 1, overflow: TextOverflow.ellipsis),
                  Text(label, style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 8.5, fontWeight: FontWeight.w600, letterSpacing: 0.2), maxLines: 1, overflow: TextOverflow.ellipsis),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusFilters() {
    return SizedBox(
      height: 42,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: _statuses.length,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemBuilder: (context, index) {
          final status = _statuses[index];
          final isSelected = _selectedStatus == status;
          final count = _getStatusCount(status);
          final color = _statusColors[status] ?? AppTheme.primary;
          return Container(
            margin: const EdgeInsets.only(right: 8),
            child: Material(
              color: isSelected ? AppTheme.primary : Colors.white,
              borderRadius: BorderRadius.circular(22),
              elevation: isSelected ? 2 : 0,
              shadowColor: color.withOpacity(0.3),
              child: InkWell(
                onTap: () => setState(() => _selectedStatus = status),
                borderRadius: BorderRadius.circular(22),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 250),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    border: Border.all(
                      color: isSelected ? AppTheme.primary : const Color(0xFFE2E8F0),
                    ),
                    borderRadius: BorderRadius.circular(22),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        status.toUpperCase(),
                        style: TextStyle(
                          color: isSelected ? Colors.white : AppTheme.textLight,
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.5,
                        ),
                      ),
                      if (count > 0) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: isSelected ? Colors.white.withOpacity(0.25) : color.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            '$count',
                            style: TextStyle(
                              color: isSelected ? Colors.white : color,
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
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
        },
      ),
    );
  }

  Widget _buildEnquiryCard(EnquiryModel enq, bool hasAccess) {
    final isExpanded = _expandedEnquiryIds.contains(enq.id);
    final statusColor = _statusColors[enq.status] ?? AppTheme.textLight;

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 6, horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header row
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 12, 0),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [statusColor.withOpacity(0.15), statusColor.withOpacity(0.05)],
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Center(
                    child: Text(
                      enq.name.isNotEmpty ? enq.name[0].toUpperCase() : '?',
                      style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: statusColor),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        enq.name,
                        style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: AppTheme.textDark),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        enq.subject,
                        style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12, color: statusColor),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                StatusChip(label: enq.status, status: enq.status),
              ],
            ),
          ),
          // Message
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
            child: InkWell(
              onTap: () {
                setState(() {
                  if (isExpanded) {
                    _expandedEnquiryIds.remove(enq.id);
                  } else {
                    _expandedEnquiryIds.add(enq.id);
                  }
                });
              },
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    enq.message,
                    maxLines: isExpanded ? null : 2,
                    overflow: isExpanded ? null : TextOverflow.ellipsis,
                    style: const TextStyle(color: AppTheme.textDark, fontSize: 12, height: 1.5),
                  ),
                  if (enq.message.length > 80)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          Text(
                            isExpanded ? 'Show less' : 'Read more',
                            style: const TextStyle(color: AppTheme.primary, fontSize: 10, fontWeight: FontWeight.w700),
                          ),
                          Icon(
                            isExpanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                            size: 14,
                            color: AppTheme.primary,
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
          ),
          // Footer
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 10, 12, 12),
            child: Row(
              children: [
                if (enq.email != null && enq.email!.isNotEmpty) ...[
                  Icon(Icons.email_outlined, size: 12, color: AppTheme.textLight.withOpacity(0.6)),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      enq.email!,
                      style: TextStyle(color: AppTheme.textLight.withOpacity(0.8), fontSize: 10),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
                if (enq.phone != null && enq.phone!.isNotEmpty) ...[
                  const SizedBox(width: 8),
                  Icon(Icons.phone_outlined, size: 12, color: AppTheme.textLight.withOpacity(0.6)),
                  const SizedBox(width: 4),
                  Text(
                    enq.phone!,
                    style: TextStyle(color: AppTheme.textLight.withOpacity(0.8), fontSize: 10),
                  ),
                ],
                const Spacer(),
                if (hasAccess) ...[
                  _buildSmallAction(Icons.edit_outlined, AppTheme.primary, () => _showAddEditSheet(enq)),
                  const SizedBox(width: 4),
                  _buildSmallAction(Icons.delete_outline_rounded, AppTheme.error, () => _confirmDelete(enq.id)),
                ],
              ],
            ),
          ),
          if (enq.createdAt != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
              child: Text(
                'Received ${DateFormat('dd MMM yyyy, hh:mm a').format(enq.createdAt!)}',
                style: TextStyle(color: AppTheme.textLight.withOpacity(0.5), fontSize: 9, fontStyle: FontStyle.italic),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildSmallAction(IconData icon, Color color, VoidCallback onTap) {
    return Material(
      color: color.withOpacity(0.08),
      borderRadius: BorderRadius.circular(8),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.all(6),
          child: Icon(icon, size: 14, color: color),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authState = context.watch<AuthBloc>().state;
    final user = authState is Authenticated ? authState.user : null;
    final bool hasAccess = user?.isAdmin == true || user?.canManageEnquiries == true;

    final filteredList = _list.where((enq) {
      final matchesStatus = _selectedStatus == 'All' || enq.status.toLowerCase() == _selectedStatus.toLowerCase();
      final matchesSearch = enq.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          enq.subject.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          enq.message.toLowerCase().contains(_searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    }).toList();

    return AppScaffold(
      title: 'Web Enquiries',
      showAppBar: true,
      body: _isLoading
          ? const LoadingState()
          : _errorMessage != null
              ? ErrorState(message: _errorMessage!, onRetry: _loadData)
              : Column(
                  children: [
                    _buildHeader(hasAccess),
                    const SizedBox(height: 16),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: SearchField(
                        hint: 'Search by name, subject, or message...',
                        onChanged: (val) => setState(() => _searchQuery = val),
                      ),
                    ),
                    const SizedBox(height: 12),
                    _buildStatusFilters(),
                    const SizedBox(height: 8),
                    Expanded(
                      child: RefreshIndicator(
                        onRefresh: () async => _loadData(),
                        child: filteredList.isEmpty
                            ? ListView(
                                children: const [
                                  Padding(
                                    padding: EdgeInsets.only(top: 60),
                                    child: EmptyState(
                                      title: 'No Enquiries',
                                      message: 'No client enquiries match your search criteria.',
                                      icon: Icons.mail_outline_rounded,
                                    ),
                                  ),
                                ],
                              )
                            : ListView.builder(
                                padding: const EdgeInsets.only(bottom: 24),
                                itemCount: filteredList.length,
                                itemBuilder: (context, index) {
                                  return _buildEnquiryCard(filteredList[index], hasAccess);
                                },
                              ),
                      ),
                    ),
                  ],
                ),
    );
  }
}
