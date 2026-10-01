import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/avatar.dart';
import '../../../../shared/widgets/cards.dart';
import '../../../../shared/widgets/feedback.dart';
import '../../../../shared/widgets/layout.dart';
import '../../../../shared/widgets/buttons.dart';
import '../../../../shared/widgets/text_fields.dart';
import '../../bloc/expense_cubit.dart';
import '../../data/models/expense_model.dart';

class ExpensesPage extends StatefulWidget {
  final bool isAdmin;
  const ExpensesPage({super.key, this.isAdmin = false});

  @override
  State<ExpensesPage> createState() => _ExpensesPageState();
}

class _ExpensesPageState extends State<ExpensesPage> {
  String _selectedFilter = 'all';

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    context.read<ExpenseCubit>().loadExpenses(
      isAdmin: widget.isAdmin,
      status: _selectedFilter == 'all' ? null : _selectedFilter,
    );
  }

  void _openApplyDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _ApplyExpenseBottomSheet(onSubmitted: _load),
    );
  }

  void _showReviewDialog(ExpenseModel expense) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('Review Claim: ${expense.title}'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Employee: ${expense.user?.name ?? 'Employee'}', style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text('Amount: ₹${expense.amount.toStringAsFixed(2)}', style: const TextStyle(fontSize: 16, color: AppTheme.primary, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text('Category: ${expense.category}'),
            if (expense.description.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text('Description: ${expense.description}', style: const TextStyle(color: AppTheme.textLight, fontSize: 13)),
            ],
          ],
        ),
        actions: [
          TextButton(
            child: const Text('Reject', style: TextStyle(color: AppTheme.error)),
            onPressed: () {
              Navigator.pop(ctx);
              context.read<ExpenseCubit>().updateStatus(expense.id, 'rejected', isAdmin: true).then((_) => _load());
            },
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.success),
            child: const Text('Approve', style: TextStyle(color: Colors.white)),
            onPressed: () {
              Navigator.pop(ctx);
              context.read<ExpenseCubit>().updateStatus(expense.id, 'approved', isAdmin: true).then((_) => _load());
            },
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
            child: const Text('Mark Reimbursed', style: TextStyle(color: Colors.white)),
            onPressed: () {
              Navigator.pop(ctx);
              context.read<ExpenseCubit>().updateStatus(expense.id, 'reimbursed', isAdmin: true).then((_) => _load());
            },
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'approved':
        return AppTheme.success;
      case 'reimbursed':
        return const Color(0xFF0D9488);
      case 'rejected':
        return AppTheme.error;
      case 'pending':
      default:
        return const Color(0xFFF59E0B);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: widget.isAdmin ? 'Expense Claims Review' : 'My Reimbursements',
      showAppBar: true,
      floatingActionButton: !widget.isAdmin
          ? FloatingActionButton.extended(
              onPressed: _openApplyDialog,
              backgroundColor: AppTheme.primary,
              icon: const Icon(Icons.receipt_long, color: Colors.white),
              label: const Text('Claim Expense', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            )
          : null,
      body: Column(
        children: [
          // Filter Tabs
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                _buildFilterChip('all', 'All Claims'),
                const SizedBox(width: 8),
                _buildFilterChip('pending', 'Pending'),
                const SizedBox(width: 8),
                _buildFilterChip('approved', 'Approved'),
                const SizedBox(width: 8),
                _buildFilterChip('reimbursed', 'Reimbursed'),
                const SizedBox(width: 8),
                _buildFilterChip('rejected', 'Rejected'),
              ],
            ),
          ),

          // Claims List
          Expanded(
            child: BlocBuilder<ExpenseCubit, ExpenseState>(
              builder: (context, state) {
                if (state is ExpenseLoading) {
                  return const LoadingState();
                }
                if (state is ExpenseFailure) {
                  return ErrorState(message: state.message, onRetry: _load);
                }
                if (state is ExpenseLoaded) {
                  if (state.expenses.isEmpty) {
                    return const EmptyState(
                      title: 'No Expense Claims',
                      message: 'No expense records found for the selected filter.',
                    );
                  }

                  return RefreshIndicator(
                    onRefresh: () async => _load(),
                    child: ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      itemCount: state.expenses.length,
                      itemBuilder: (context, index) {
                        final expense = state.expenses[index];
                        final statusColor = _getStatusColor(expense.status);

                        return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          child: AppCard(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            expense.title,
                                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            '${expense.category} • ${DateFormat('dd MMM yyyy').format(expense.date)}',
                                            style: const TextStyle(color: AppTheme.textLight, fontSize: 12),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Text(
                                      '₹${expense.amount.toStringAsFixed(2)}',
                                      style: const TextStyle(
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                        color: AppTheme.primary,
                                      ),
                                    ),
                                  ],
                                ),
                                if (expense.description.isNotEmpty) ...[
                                  const SizedBox(height: 8),
                                  Text(
                                    expense.description,
                                    style: const TextStyle(color: AppTheme.textDark, fontSize: 13),
                                  ),
                                ],
                                const SizedBox(height: 12),
                                const Divider(color: Color(0xFFF1F5F9), height: 1),
                                const SizedBox(height: 10),

                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    if (widget.isAdmin && expense.user != null)
                                      Row(
                                        children: [
                                          Avatar(
                                            url: expense.user?.profilePicture,
                                            name: expense.user?.name ?? 'Staff',
                                            size: 24,
                                          ),
                                          const SizedBox(width: 6),
                                          Text(
                                            expense.user?.name ?? 'Staff',
                                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                                          ),
                                        ],
                                      )
                                    else
                                      const SizedBox.shrink(),
                                    Row(
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: statusColor.withOpacity(0.12),
                                            borderRadius: BorderRadius.circular(20),
                                            border: Border.all(color: statusColor.withOpacity(0.4)),
                                          ),
                                          child: Text(
                                            expense.status.toUpperCase(),
                                            style: TextStyle(
                                              color: statusColor,
                                              fontWeight: FontWeight.bold,
                                              fontSize: 11,
                                            ),
                                          ),
                                        ),
                                        if (widget.isAdmin && expense.status == 'pending') ...[
                                          const SizedBox(width: 8),
                                          IconButton(
                                            icon: const Icon(Icons.rate_review_outlined, color: AppTheme.primary),
                                            onPressed: () => _showReviewDialog(expense),
                                          ),
                                        ],
                                      ],
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
                return const SizedBox.shrink();
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String value, String label) {
    final isSelected = _selectedFilter == value;
    return ChoiceChip(
      label: Text(
        label,
        style: TextStyle(
          color: isSelected ? Colors.white : AppTheme.textDark,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          fontSize: 12,
        ),
      ),
      selected: isSelected,
      selectedColor: AppTheme.primary,
      backgroundColor: Colors.white,
      side: BorderSide(
        color: isSelected ? AppTheme.primary : const Color(0xFFCBD5E1),
      ),
      onSelected: (selected) {
        if (selected) {
          setState(() {
            _selectedFilter = value;
          });
          _load();
        }
      },
    );
  }
}

class _ApplyExpenseBottomSheet extends StatefulWidget {
  final VoidCallback onSubmitted;
  const _ApplyExpenseBottomSheet({required this.onSubmitted});

  @override
  State<_ApplyExpenseBottomSheet> createState() => _ApplyExpenseBottomSheetState();
}

class _ApplyExpenseBottomSheetState extends State<_ApplyExpenseBottomSheet> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _amountController = TextEditingController();
  final _descController = TextEditingController();
  String _category = 'Travel';
  DateTime _expenseDate = DateTime.now();

  @override
  void dispose() {
    _titleController.dispose();
    _amountController.dispose();
    _descController.dispose();
    super.dispose();
  }

  void _submit() {
    if (_formKey.currentState!.validate()) {
      final amount = double.tryParse(_amountController.text.trim()) ?? 0;
      context.read<ExpenseCubit>().submitExpense(
            title: _titleController.text.trim(),
            category: _category,
            amount: amount,
            date: _expenseDate,
            description: _descController.text.trim(),
          ).then((_) {
        widget.onSubmitted();
        Navigator.pop(context);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.8,
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Submit Expense Claim', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
                ],
              ),
              const SizedBox(height: 16),
              AppTextField(
                label: 'Expense Title',
                hint: 'e.g., Client Visit Cab Fare',
                controller: _titleController,
                validator: (val) => (val == null || val.trim().isEmpty) ? 'Title is required' : null,
              ),
              const SizedBox(height: 16),
              AppTextField(
                label: 'Amount (₹)',
                hint: 'e.g., 450.00',
                controller: _amountController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                validator: (val) => (val == null || double.tryParse(val.trim()) == null) ? 'Valid amount is required' : null,
              ),
              const SizedBox(height: 16),

              // Category
              const Text('Category', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              const SizedBox(height: 6),
              DropdownButtonFormField<String>(
                value: _category,
                decoration: InputDecoration(
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                ),
                items: const [
                  DropdownMenuItem(value: 'Travel', child: Text('🚗 Travel / Fuel')),
                  DropdownMenuItem(value: 'Food & Meals', child: Text('🍔 Food & Meals')),
                  DropdownMenuItem(value: 'Office Supplies', child: Text('📦 Office Supplies')),
                  DropdownMenuItem(value: 'Client Meeting', child: Text('🤝 Client Meeting')),
                  DropdownMenuItem(value: 'Internet/Phone', child: Text('📶 Internet / Phone')),
                  DropdownMenuItem(value: 'Hardware/Equipment', child: Text('💻 Hardware / Equipment')),
                  DropdownMenuItem(value: 'Other', child: Text('🏷️ Other')),
                ],
                onChanged: (val) => setState(() => _category = val ?? 'Travel'),
              ),
              const SizedBox(height: 16),

              DatePickerField(
                label: 'Expense Date',
                selectedDate: _expenseDate,
                onDateSelected: (date) => setState(() => _expenseDate = date),
              ),
              const SizedBox(height: 16),
              AppTextField(
                label: 'Description / Bill Reference',
                hint: 'Invoice #, purpose of meeting, etc.',
                controller: _descController,
                keyboardType: TextInputType.multiline,
              ),
              const SizedBox(height: 32),
              PrimaryButton(text: 'Submit Expense Claim', onPressed: _submit),
            ],
          ),
        ),
      ),
    );
  }
}
