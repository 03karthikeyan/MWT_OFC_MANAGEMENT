import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/buttons.dart';
import '../../../../shared/widgets/cards.dart';
import '../../../../shared/widgets/layout.dart';
import '../../../../shared/widgets/text_fields.dart';
import '../../../../core/network/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/storage/secure_storage_service.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  final _serverController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _serverController.text = ApiConstants.baseUrl;
  }

  @override
  void dispose() {
    _serverController.dispose();
    super.dispose();
  }

  void _saveSettings() async {
    final serverUrl = _serverController.text.trim();
    if (serverUrl.isNotEmpty) {
      final storage = SecureStorageService();
      await storage.saveServerUrl(serverUrl);
      ApiConstants.setBaseUrl(serverUrl);
      ApiClient().updateBaseUrl(serverUrl);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Server endpoint saved: $serverUrl'),
            backgroundColor: AppTheme.success,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'App Settings',
      showAppBar: true,
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Server Configuration',
              style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),
            AppCard(
              child: Column(
                children: [
                  AppTextField(
                    label: 'Backend URL endpoint',
                    controller: _serverController,
                    hint: 'e.g. http://10.0.2.2:5000',
                  ),
                  const SizedBox(height: 16),
                  PrimaryButton(
                    text: 'Save Server URL',
                    onPressed: _saveSettings,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Notifications',
              style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),
            AppCard(
              child: SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Push Notifications', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                subtitle: const Text('Notify me of task status and attendance corrections'),
                value: true,
                onChanged: (val) {},
              ),
            ),
          ],
        ),
      ),
    );
  }
}
