import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/avatar.dart';
import '../../../../shared/widgets/buttons.dart';
import '../../../../shared/widgets/layout.dart';
import '../../../../shared/widgets/text_fields.dart';
import '../../../auth/bloc/auth_bloc.dart';
import '../../../auth/bloc/auth_event.dart';
import '../../../auth/bloc/auth_state.dart';

class EditProfilePage extends StatefulWidget {
  const EditProfilePage({super.key});

  @override
  State<EditProfilePage> createState() => _EditProfilePageState();
}

class _EditProfilePageState extends State<EditProfilePage> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _bankNameController = TextEditingController();
  final _bankAccountNoController = TextEditingController();
  final _ifscCodeController = TextEditingController();
  String? _profilePictureBase64;

  @override
  void initState() {
    super.initState();
    final state = context.read<AuthBloc>().state;
    if (state is Authenticated) {
      _nameController.text = state.user.name;
      _emailController.text = state.user.email ?? '';
      _phoneController.text = state.user.contact ?? '';
      _bankNameController.text = state.user.bankName;
      _bankAccountNoController.text = state.user.bankAccountNo;
      _ifscCodeController.text = state.user.ifscCode;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _bankNameController.dispose();
    _bankAccountNoController.dispose();
    _ifscCodeController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    try {
      final picker = ImagePicker();
      final pickedFile = await picker.pickImage(source: ImageSource.gallery, imageQuality: 70);
      if (pickedFile != null) {
        final file = File(pickedFile.path);
        final bytes = await file.readAsBytes();
        final extension = pickedFile.path.split('.').last.toLowerCase();
        final mimeType = extension == 'png' ? 'image/png' : 'image/jpeg';
        setState(() {
          _profilePictureBase64 = 'data:$mimeType;base64,${base64Encode(bytes)}';
        });
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error picking image: $e'), backgroundColor: AppTheme.error),
      );
    }
  }

  void _submit() {
    if (_formKey.currentState!.validate()) {
      final Map<String, dynamic> updateData = {
        'name': _nameController.text.trim(),
        'email': _emailController.text.trim(),
        'contact': _phoneController.text.trim(),
        'bankName': _bankNameController.text.trim(),
        'bankAccountNo': _bankAccountNoController.text.trim(),
        'ifscCode': _ifscCodeController.text.trim(),
      };
      if (_profilePictureBase64 != null) {
        updateData['profilePicture'] = _profilePictureBase64;
      }
      context.read<AuthBloc>().add(UpdateProfileEvent(updateData));
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Profile updated successfully!'), backgroundColor: AppTheme.success),
      );
      context.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'Edit Profile',
      showAppBar: true,
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              // Profile Image Selector
              Center(
                child: Stack(
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: AppTheme.primary.withOpacity(0.2), width: 3),
                      ),
                      child: _profilePictureBase64 != null
                          ? Avatar(url: _profilePictureBase64, name: _nameController.text, size: 100)
                          : BlocBuilder<AuthBloc, AuthState>(
                              builder: (context, state) {
                                final currentUrl = state is Authenticated ? state.user.profilePicture : null;
                                return Avatar(url: currentUrl, name: _nameController.text, size: 100);
                              },
                            ),
                    ),
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: GestureDetector(
                        onTap: _pickImage,
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: const BoxDecoration(
                            color: AppTheme.primary,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.camera_alt,
                            color: Colors.white,
                            size: 20,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              AppTextField(
                label: 'Name',
                controller: _nameController,
                validator: (val) => val == null || val.trim().isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 16),
              AppTextField(
                label: 'Email',
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 16),
              AppTextField(
                label: 'Phone Contact',
                controller: _phoneController,
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 16),
              AppTextField(
                label: 'Bank Name',
                controller: _bankNameController,
              ),
              const SizedBox(height: 16),
              AppTextField(
                label: 'Account Number',
                controller: _bankAccountNoController,
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 16),
              AppTextField(
                label: 'IFSC Code',
                controller: _ifscCodeController,
              ),
              const SizedBox(height: 40),
              PrimaryButton(
                text: 'Save Changes',
                onPressed: _submit,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
