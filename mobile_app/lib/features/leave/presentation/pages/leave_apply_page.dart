import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/buttons.dart';
import '../../../../shared/widgets/layout.dart';
import '../../../../shared/widgets/text_fields.dart';
import '../../../../shared/widgets/cards.dart';
import '../../bloc/leave_cubit.dart';

class LeaveApplyPage extends StatefulWidget {
  const LeaveApplyPage({super.key});

  @override
  State<LeaveApplyPage> createState() => _LeaveApplyPageState();
}

class _LeaveApplyPageState extends State<LeaveApplyPage> {
  final _formKey = GlobalKey<FormState>();
  final _reasonController = TextEditingController();
  DateTime _startDate = DateTime.now();
  DateTime _endDate = DateTime.now();
  String _selectedLeaveType = 'casual';
  String _selectedSession = 'full_day';

  @override
  void initState() {
    super.initState();
    context.read<LeaveCubit>().loadMyLeaves();
  }

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  double get _calculatedDays {
    if (_selectedSession == 'first_half' || _selectedSession == 'second_half') {
      return 0.5;
    }
    final diff = _endDate.difference(_startDate).inDays;
    return (diff >= 0 ? diff + 1 : 1).toDouble();
  }

  void _submit() {
    if (_formKey.currentState!.validate()) {
      if (_selectedSession == 'full_day' && _endDate.isBefore(_startDate)) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('End date cannot be before start date.'),
            backgroundColor: AppTheme.error,
          ),
        );
        return;
      }

      final effectiveEndDate = (_selectedSession != 'full_day') ? _startDate : _endDate;

      context.read<LeaveCubit>().requestLeave(
            _startDate,
            effectiveEndDate,
            _reasonController.text.trim(),
            leaveType: _selectedLeaveType,
            session: _selectedSession,
          ).then((_) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Leave application submitted successfully!'),
                backgroundColor: AppTheme.success,
              ),
            );
            context.pop();
          });
    }
  }

  Widget _buildBalanceCard(String title, dynamic count, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(
          color: color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Column(
          children: [
            Text(
              '$count',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              title,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: AppTheme.textDark,
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'Apply for Leave',
      showAppBar: true,
      body: BlocBuilder<LeaveCubit, LeaveState>(
        builder: (context, state) {
          final balances = (state is LeaveLoaded)
              ? state.balances
              : {'casual': 12, 'sick': 6, 'earned': 15};

          return SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Balance Header Cards
                  const Text(
                    'Your Leave Quota',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppTheme.textLight),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      _buildBalanceCard('Casual', balances['casual'] ?? 12, AppTheme.primary),
                      const SizedBox(width: 8),
                      _buildBalanceCard('Sick', balances['sick'] ?? 6, const Color(0xFF0D9488)),
                      const SizedBox(width: 8),
                      _buildBalanceCard('Earned', balances['earned'] ?? 15, const Color(0xFF6366F1)),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Leave Type Selector
                  const Text(
                    'Leave Type',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppTheme.textDark),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _buildTypeChip('casual', 'Casual Leave', AppTheme.primary),
                      _buildTypeChip('sick', 'Sick Leave', const Color(0xFF0D9488)),
                      _buildTypeChip('earned', 'Earned Leave', const Color(0xFF6366F1)),
                      _buildTypeChip('unpaid', 'Loss of Pay (LOP)', const Color(0xFFE11D48)),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Session / Duration Selector
                  const Text(
                    'Duration & Session',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppTheme.textDark),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      _buildSessionChip('full_day', 'Full Day'),
                      const SizedBox(width: 8),
                      _buildSessionChip('first_half', 'First Half (0.5)'),
                      const SizedBox(width: 8),
                      _buildSessionChip('second_half', 'Second Half (0.5)'),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Dates
                  DatePickerField(
                    label: _selectedSession == 'full_day' ? 'Start Date' : 'Leave Date',
                    selectedDate: _startDate,
                    onDateSelected: (date) {
                      setState(() {
                        _startDate = date;
                        if (_endDate.isBefore(date)) {
                          _endDate = date;
                        }
                      });
                    },
                  ),
                  if (_selectedSession == 'full_day') ...[
                    const SizedBox(height: 16),
                    DatePickerField(
                      label: 'End Date',
                      selectedDate: _endDate,
                      onDateSelected: (date) {
                        setState(() {
                          _endDate = date;
                        });
                      },
                    ),
                  ],
                  const SizedBox(height: 12),

                  // Computed Duration badge
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: AppTheme.secondary.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.info_outline, size: 16, color: AppTheme.secondary),
                        const SizedBox(width: 6),
                        Text(
                          'Total Duration: $_calculatedDays day(s)',
                          style: const TextStyle(fontWeight: FontWeight.w600, color: AppTheme.secondary, fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Reason
                  AppTextField(
                    label: 'Reason for Leave',
                    hint: 'Briefly explain the reason for your leave...',
                    controller: _reasonController,
                    keyboardType: TextInputType.multiline,
                    validator: (val) {
                      if (val == null || val.trim().isEmpty) {
                        return 'Reason is required';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 32),

                  // Submit Button
                  PrimaryButton(
                    text: 'Submit Application',
                    onPressed: _submit,
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildTypeChip(String value, String label, Color activeColor) {
    final isSelected = _selectedLeaveType == value;
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
      selectedColor: activeColor,
      backgroundColor: const Color(0xFFF1F5F9),
      side: BorderSide(
        color: isSelected ? activeColor : const Color(0xFFCBD5E1),
      ),
      onSelected: (selected) {
        if (selected) {
          setState(() {
            _selectedLeaveType = value;
          });
        }
      },
    );
  }

  Widget _buildSessionChip(String value, String label) {
    final isSelected = _selectedSession == value;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() {
            _selectedSession = value;
          });
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: isSelected ? AppTheme.primary : const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: isSelected ? AppTheme.primary : const Color(0xFFCBD5E1),
            ),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: isSelected ? Colors.white : AppTheme.textDark,
            ),
          ),
        ),
      ),
    );
  }
}
