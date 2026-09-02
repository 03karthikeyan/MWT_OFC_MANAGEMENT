import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/buttons.dart';
import '../../../../shared/widgets/cards.dart';
import '../../../../shared/widgets/chips.dart';
import '../../../../shared/widgets/feedback.dart';
import '../../../../shared/widgets/layout.dart';
import '../../../../shared/widgets/text_fields.dart';
import '../../bloc/on_duty_cubit.dart';

class OnDutyPage extends StatefulWidget {
  const OnDutyPage({super.key});

  @override
  State<OnDutyPage> createState() => _OnDutyPageState();
}

class _OnDutyPageState extends State<OnDutyPage> {
  @override
  void initState() {
    super.initState();
    _loadData();
  }

  void _loadData() {
    context.read<OnDutyCubit>().loadMyOnDuty();
  }

  void _showApplyOnDutyDialog() {
    final formKey = GlobalKey<FormState>();
    final reasonController = TextEditingController();
    final expTitleController = TextEditingController();
    final expPriceController = TextEditingController();
    DateTime selectedDate = DateTime.now();

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: const Text('Request On Duty', style: TextStyle(fontWeight: FontWeight.bold)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              content: SingleChildScrollView(
                child: Form(
                  key: formKey,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      DatePickerField(
                        label: 'Date',
                        selectedDate: selectedDate,
                        onDateSelected: (date) {
                          setDialogState(() {
                            selectedDate = date;
                          });
                        },
                      ),
                      const SizedBox(height: 16),
                      AppTextField(
                        label: 'Reason',
                        hint: 'e.g. Client visit at Media Wave offices',
                        controller: reasonController,
                        validator: (val) {
                          if (val == null || val.trim().isEmpty) {
                            return 'Reason is required';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      AppTextField(
                        label: 'Expense Claim Title (Optional)',
                        hint: 'e.g. Travel/Fuel allowance',
                        controller: expTitleController,
                      ),
                      const SizedBox(height: 16),
                      AppTextField(
                        label: 'Expense Claim Cost (Optional)',
                        hint: 'e.g. 500',
                        controller: expPriceController,
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
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
                      final expPrice = double.tryParse(expPriceController.text) ?? 0.0;
                      this.context.read<OnDutyCubit>().requestOnDuty(
                            selectedDate,
                            reasonController.text.trim(),
                            expTitleController.text.trim(),
                            expPrice,
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

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'My On-Duty Log',
      showAppBar: true,
      floatingActionButton: FloatingActionButton(
        onPressed: _showApplyOnDutyDialog,
        backgroundColor: AppTheme.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
      body: BlocBuilder<OnDutyCubit, OnDutyState>(
        builder: (context, state) {
          if (state is OnDutyLoading) {
            return const LoadingState();
          }
          if (state is OnDutyFailure) {
            return ErrorState(
              message: state.message,
              onRetry: _loadData,
            );
          }
          if (state is OnDutyLoaded) {
            final list = state.requests;

            if (list.isEmpty) {
              return const EmptyState(
                title: 'No On-Duty Logs',
                message: 'You have not filed any on-duty travel logs.',
              );
            }

            return RefreshIndicator(
              onRefresh: () async => _loadData(),
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: list.length,
                itemBuilder: (context, index) {
                  final req = list[index];
                  final hasExpense = req.expenses != null && req.expenses!.price > 0;

                  return Container(
                    margin: const EdgeInsets.symmetric(vertical: 6),
                    child: AppCard(
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Date: ${DateFormat('dd MMM yyyy').format(req.date)}',
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Reason: ${req.reason}',
                                  style: const TextStyle(color: AppTheme.textLight, fontSize: 13),
                                ),
                                if (hasExpense) ...[
                                  const SizedBox(height: 6),
                                  Text(
                                    'Expense claim: ${req.expenses!.title} (₹${req.expenses!.price.toStringAsFixed(0)})',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: AppTheme.primary,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              StatusChip(label: req.status, status: req.status),
                              if (req.status == 'pending') ...[
                                const SizedBox(height: 8),
                                IconButton(
                                  icon: const Icon(Icons.delete_outline, color: AppTheme.error, size: 20),
                                  onPressed: () {
                                    context.read<OnDutyCubit>().cancelOnDuty(req.id);
                                  },
                                ),
                              ],
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
