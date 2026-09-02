import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/buttons.dart';
import '../../../../shared/widgets/layout.dart';
import '../../../../shared/widgets/text_fields.dart';
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

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  void _submit() {
    if (_formKey.currentState!.validate()) {
      if (_endDate.isBefore(_startDate)) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('End date cannot be before start date.'),
            backgroundColor: AppTheme.error,
          ),
        );
        return;
      }

      context.read<LeaveCubit>().requestLeave(
            _startDate,
            _endDate,
            _reasonController.text.trim(),
          ).then((_) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Leave application submitted!'),
                backgroundColor: AppTheme.success,
              ),
            );
            context.pop();
          });
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'Apply for Leave',
      showAppBar: true,
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              DatePickerField(
                label: 'Start Date',
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
              const SizedBox(height: 20),
              DatePickerField(
                label: 'End Date',
                selectedDate: _endDate,
                onDateSelected: (date) {
                  setState(() {
                    _endDate = date;
                  });
                },
              ),
              const SizedBox(height: 20),
              AppTextField(
                label: 'Reason',
                hint: 'Describe why you are taking leave...',
                controller: _reasonController,
                keyboardType: TextInputType.multiline,
                validator: (val) {
                  if (val == null || val.trim().isEmpty) {
                    return 'Reason is required';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 40),
              PrimaryButton(
                text: 'Submit Application',
                onPressed: _submit,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
