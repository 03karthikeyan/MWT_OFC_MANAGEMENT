import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/buttons.dart';
import '../../../../shared/widgets/layout.dart';
import '../../../../shared/widgets/text_fields.dart';
import '../../../employee_management/bloc/employees_cubit.dart';
import '../../bloc/payslip_cubit.dart';

class AdminPayslipManagementPage extends StatefulWidget {
  const AdminPayslipManagementPage({super.key});

  @override
  State<AdminPayslipManagementPage> createState() => _AdminPayslipManagementPageState();
}

class _AdminPayslipManagementPageState extends State<AdminPayslipManagementPage> {
  final _formKey = GlobalKey<FormState>();
  final _monthController = TextEditingController(text: 'January 2026');
  final _basicSalaryController = TextEditingController(text: '30000');
  final _hraController = TextEditingController(text: '12000');
  final _medicalController = TextEditingController(text: '1250');
  final _specialController = TextEditingController(text: '5000');
  final _ltaController = TextEditingController(text: '2000');

  final _tdsController = TextEditingController(text: '0');
  final _ptaxController = TextEditingController(text: '200');
  final _pfController = TextEditingController(text: '1800');
  final _esicController = TextEditingController(text: '0');
  final _deductionController = TextEditingController(text: '0');

  String? _selectedUserId;

  @override
  void initState() {
    super.initState();
    context.read<EmployeesCubit>().loadEmployees();
  }

  @override
  void dispose() {
    _monthController.dispose();
    _basicSalaryController.dispose();
    _hraController.dispose();
    _medicalController.dispose();
    _specialController.dispose();
    _ltaController.dispose();
    _tdsController.dispose();
    _ptaxController.dispose();
    _pfController.dispose();
    _esicController.dispose();
    _deductionController.dispose();
    super.dispose();
  }

  void _submit() {
    if (_selectedUserId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select an employee first.'),
          backgroundColor: AppTheme.error,
        ),
      );
      return;
    }

    if (_formKey.currentState!.validate()) {
      final data = {
        'month': _monthController.text.trim(),
        'earnings': {
          'basicSalary': double.tryParse(_basicSalaryController.text) ?? 0,
          'houseRentAllowance': double.tryParse(_hraController.text) ?? 0,
          'specialAllowance': double.tryParse(_specialController.text) ?? 0,
          'leaveTravelAllowance': double.tryParse(_ltaController.text) ?? 0,
          'medicalAllowance': double.tryParse(_medicalController.text) ?? 0,
        },
        'deductions': {
          'tds': double.tryParse(_tdsController.text) ?? 0,
          'professionalTax': double.tryParse(_ptaxController.text) ?? 0,
          'pfEmployerContribution': double.tryParse(_pfController.text) ?? 0,
          'esicEmployerContribution': double.tryParse(_esicController.text) ?? 0,
          'salaryDeduction': double.tryParse(_deductionController.text) ?? 0,
        }
      };

      context.read<PayslipCubit>().createPayslip(_selectedUserId!, data).then((_) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Payslip generated successfully!'),
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
      title: 'Generate Payslip',
      showAppBar: true,
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Employee Select dropdown
              Text(
                'Select Employee',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 6),
              BlocBuilder<EmployeesCubit, EmployeesState>(
                builder: (context, state) {
                  List<DropdownMenuItem<String>> items = [];
                  if (state is EmployeesLoaded) {
                    items = state.employees.map((emp) {
                      return DropdownMenuItem(
                        value: emp.id,
                        child: Text('${emp.name} (${emp.employeeId ?? 'No ID'})'),
                      );
                    }).toList();
                  }

                  return DropdownButtonFormField<String>(
                    value: _selectedUserId,
                    hint: const Text('Select Employee Account'),
                    onChanged: (val) {
                      setState(() {
                        _selectedUserId = val;
                      });
                    },
                    items: items,
                  );
                },
              ),
              const SizedBox(height: 20),

              AppTextField(
                label: 'Pay Month',
                hint: 'e.g. January 2026',
                controller: _monthController,
                validator: (val) {
                  if (val == null || val.trim().isEmpty) {
                    return 'Month is required';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 28),

              // Earnings section
              const Text(
                'EARNINGS VALUES (₹)',
                style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primary, fontSize: 14),
              ),
              const Divider(color: AppTheme.primary, height: 16),
              AppTextField(label: 'Basic Salary', controller: _basicSalaryController, keyboardType: TextInputType.number),
              const SizedBox(height: 16),
              AppTextField(label: 'House Rent Allowance (HRA)', controller: _hraController, keyboardType: TextInputType.number),
              const SizedBox(height: 16),
              AppTextField(label: 'Medical Allowance', controller: _medicalController, keyboardType: TextInputType.number),
              const SizedBox(height: 16),
              AppTextField(label: 'Special Allowance', controller: _specialController, keyboardType: TextInputType.number),
              const SizedBox(height: 16),
              AppTextField(label: 'Leave Travel Allowance', controller: _ltaController, keyboardType: TextInputType.number),
              const SizedBox(height: 28),

              // Deductions section
              const Text(
                'DEDUCTIONS VALUES (₹)',
                style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.error, fontSize: 14),
              ),
              const Divider(color: AppTheme.error, height: 16),
              AppTextField(label: 'TDS (Income Tax)', controller: _tdsController, keyboardType: TextInputType.number),
              const SizedBox(height: 16),
              AppTextField(label: 'Professional Tax', controller: _ptaxController, keyboardType: TextInputType.number),
              const SizedBox(height: 16),
              AppTextField(label: 'PF Contribution', controller: _pfController, keyboardType: TextInputType.number),
              const SizedBox(height: 16),
              AppTextField(label: 'ESIC Contribution', controller: _esicController, keyboardType: TextInputType.number),
              const SizedBox(height: 16),
              AppTextField(label: 'Leave Salary Deductions', controller: _deductionController, keyboardType: TextInputType.number),
              const SizedBox(height: 40),

              PrimaryButton(
                text: 'Generate Payslip Report',
                onPressed: _submit,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
