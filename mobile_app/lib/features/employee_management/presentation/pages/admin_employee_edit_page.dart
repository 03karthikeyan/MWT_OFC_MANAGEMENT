import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/buttons.dart';
import '../../../../shared/widgets/layout.dart';
import '../../../../shared/widgets/text_fields.dart';
import '../../bloc/employees_cubit.dart';

class AdminEmployeeEditPage extends StatefulWidget {
  final String? employeeId;

  const AdminEmployeeEditPage({super.key, this.employeeId});

  @override
  State<AdminEmployeeEditPage> createState() => _AdminEmployeeEditPageState();
}

class _AdminEmployeeEditPageState extends State<AdminEmployeeEditPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _usernameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _employeeIdController = TextEditingController();
  
  String _selectedRole = 'user';
  String _selectedStatus = 'joined';
  String _jobRole = 'Staff';
  String _department = 'IT';
  DateTime? _dateOfJoining;

  final List<String> _departments = ['IT', 'HR', 'Design', 'Marketing', 'Management', 'Operations', 'Finance', 'Sales'];

  // Bank Info
  final _bankNameController = TextEditingController();
  final _bankAccController = TextEditingController();
  final _ifscController = TextEditingController();

  // Permissions
  bool _canManageInternships = false;
  bool _canManageEnquiries = false;
  bool _canManageLeads = false;

  bool get isEditMode => widget.employeeId != null;

  @override
  void initState() {
    super.initState();
    if (isEditMode) {
      final state = context.read<EmployeesCubit>().state;
      if (state is EmployeesLoaded) {
        final list = state.employees.where((e) => e.id == widget.employeeId);
        if (list.isNotEmpty) {
          final emp = list.first;
          _nameController.text = emp.name;
          _usernameController.text = emp.username;
          _emailController.text = emp.email ?? '';
          _phoneController.text = emp.contact ?? '';
          _employeeIdController.text = emp.employeeId ?? '';
          _selectedRole = emp.role;
          _selectedStatus = emp.status;
          _jobRole = emp.jobRole;
          _department = emp.department;
          _dateOfJoining = emp.dateOfJoining;
          _bankNameController.text = emp.bankName;
          _bankAccController.text = emp.bankAccountNo;
          _ifscController.text = emp.ifscCode;
          _canManageInternships = emp.canManageInternships;
          _canManageEnquiries = emp.canManageEnquiries;
          _canManageLeads = emp.canManageLeads;
        }
      }
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _usernameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _employeeIdController.dispose();
    _bankNameController.dispose();
    _bankAccController.dispose();
    _ifscController.dispose();
    super.dispose();
  }

  void _submit() {
    if (_formKey.currentState!.validate()) {
      final data = {
        'name': _nameController.text.trim(),
        'username': _usernameController.text.trim(),
        'email': _emailController.text.trim(),
        'contact': _phoneController.text.trim(),
        'employeeId': _employeeIdController.text.trim(),
        'role': _selectedRole,
        'status': _selectedStatus,
        'jobRole': _jobRole,
        'department': _department,
        'dateOfJoining': _dateOfJoining?.toIso8601String(),
        'bankName': _bankNameController.text.trim(),
        'bankAccountNo': _bankAccController.text.trim(),
        'ifscCode': _ifscController.text.trim(),
        'canManageInternships': _canManageInternships,
        'canManageEnquiries': _canManageEnquiries,
        'canManageLeads': _canManageLeads,
        if (!isEditMode) 'password': _passwordController.text,
      };

      if (isEditMode) {
        context.read<EmployeesCubit>().editEmployee(widget.employeeId!, data).then((_) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Employee profile updated!'), backgroundColor: AppTheme.success),
          );
          context.pop();
        });
      } else {
        context.read<EmployeesCubit>().createEmployee(data).then((_) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Employee added successfully!'), backgroundColor: AppTheme.success),
          );
          context.pop();
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final pageTitle = isEditMode ? 'Edit Employee Account' : 'Add Team Member';

    return AppScaffold(
      title: pageTitle,
      showAppBar: true,
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              AppTextField(
                label: 'Name',
                hint: 'Enter full name',
                controller: _nameController,
                validator: (val) => val == null || val.trim().isEmpty ? 'Name is required' : null,
              ),
              const SizedBox(height: 16),
              AppTextField(
                label: 'Username',
                hint: 'Enter username',
                controller: _usernameController,
                readOnly: isEditMode,
                validator: (val) => val == null || val.trim().isEmpty ? 'Username is required' : null,
              ),
              const SizedBox(height: 16),
              if (!isEditMode) ...[
                AppTextField(
                  label: 'Password',
                  hint: 'Choose password',
                  controller: _passwordController,
                  isPassword: true,
                  validator: (val) => val == null || val.isEmpty ? 'Password is required' : null,
                ),
                const SizedBox(height: 16),
              ],
              AppTextField(
                label: 'Email Address',
                hint: 'Enter email address',
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 16),
              AppTextField(
                label: 'Contact Phone',
                hint: 'Enter mobile number',
                controller: _phoneController,
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 16),

              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Role', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                        const SizedBox(height: 4),
                        DropdownButtonFormField<String>(
                          value: _selectedRole,
                          items: const [
                            DropdownMenuItem(value: 'user', child: Text('User')),
                            DropdownMenuItem(value: 'admin', child: Text('Admin')),
                          ],
                          onChanged: (val) {
                            if (val != null) {
                              setState(() {
                                _selectedRole = val;
                              });
                            }
                          },
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Status', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                        const SizedBox(height: 4),
                        DropdownButtonFormField<String>(
                          value: _selectedStatus,
                          items: const [
                            DropdownMenuItem(value: 'enquiry', child: Text('Enquiry')),
                            DropdownMenuItem(value: 'joined', child: Text('Joined')),
                            DropdownMenuItem(value: 'rejected', child: Text('Rejected')),
                          ],
                          onChanged: (val) {
                            if (val != null) {
                              setState(() {
                                _selectedStatus = val;
                              });
                            }
                          },
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              Row(
                children: [
                  Expanded(
                    child: AppTextField(
                      label: 'Employee ID',
                      hint: 'e.g. MWT-001',
                      controller: _employeeIdController,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Date of Joining', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                        const SizedBox(height: 6),
                        InkWell(
                          onTap: () async {
                            final picked = await showDatePicker(
                              context: context,
                              initialDate: _dateOfJoining ?? DateTime.now(),
                              firstDate: DateTime(2018),
                              lastDate: DateTime(2030),
                            );
                            if (picked != null) {
                              setState(() => _dateOfJoining = picked);
                            }
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.calendar_today_outlined, size: 16, color: AppTheme.textLight),
                                const SizedBox(width: 8),
                                Text(
                                  _dateOfJoining != null
                                      ? DateFormat('dd MMM yyyy').format(_dateOfJoining!)
                                      : 'Select date',
                                  style: TextStyle(
                                    fontSize: 14,
                                    color: _dateOfJoining != null ? AppTheme.textDark : AppTheme.textLight.withOpacity(0.6),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              AppTextField(
                label: 'Job Title Role',
                hint: 'e.g. Flutter Developer',
                controller: TextEditingController(text: _jobRole)..selection = TextSelection.collapsed(offset: _jobRole.length),
                onTap: () {},
              ),
              const SizedBox(height: 16),

              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Department', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  const SizedBox(height: 4),
                  DropdownButtonFormField<String>(
                    value: _departments.contains(_department) ? _department : 'IT',
                    items: _departments
                        .map((d) => DropdownMenuItem(value: d, child: Text(d)))
                        .toList(),
                    onChanged: (val) {
                      if (val != null) {
                        setState(() => _department = val);
                      }
                    },
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Bank section
              const Text('BANK METADATA', style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.textLight, fontSize: 13)),
              const Divider(height: 16),
              AppTextField(label: 'Bank Name', controller: _bankNameController),
              const SizedBox(height: 16),
              AppTextField(label: 'Account Number', controller: _bankAccController, keyboardType: TextInputType.number),
              const SizedBox(height: 16),
              AppTextField(label: 'IFSC Code', controller: _ifscController),
              const SizedBox(height: 24),

              // Permissions section
              const Text('PERMISSIONS', style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.textLight, fontSize: 13)),
              const Divider(height: 16),
              CheckboxListTile(
                title: const Text('Manage Internships'),
                value: _canManageInternships,
                onChanged: (val) => setState(() => _canManageInternships = val ?? false),
              ),
              CheckboxListTile(
                title: const Text('Manage Enquiries'),
                value: _canManageEnquiries,
                onChanged: (val) => setState(() => _canManageEnquiries = val ?? false),
              ),
              CheckboxListTile(
                title: const Text('Manage Business Leads'),
                value: _canManageLeads,
                onChanged: (val) => setState(() => _canManageLeads = val ?? false),
              ),
              const SizedBox(height: 32),

              PrimaryButton(
                text: isEditMode ? 'Update Profile' : 'Add Employee Account',
                onPressed: _submit,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
