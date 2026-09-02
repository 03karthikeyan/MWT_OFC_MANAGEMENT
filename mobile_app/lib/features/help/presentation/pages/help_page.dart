import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/cards.dart';
import '../../../../shared/widgets/layout.dart';

class HelpPage extends StatelessWidget {
  const HelpPage({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'Help & Support',
      showAppBar: true,
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Need Assistance?',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'Get in touch with the Media Wave Technologies HR administration team.',
              style: TextStyle(color: AppTheme.textLight),
            ),
            const SizedBox(height: 24),

            // Helpline contacts Card
            AppCard(
              child: Column(
                children: [
                  _buildContactItem(
                    context,
                    icon: Icons.email_outlined,
                    title: 'Email HR Desk',
                    value: 'info@mediawavetech.com',
                  ),
                  const Divider(height: 24),
                  _buildContactItem(
                    context,
                    icon: Icons.phone_outlined,
                    title: 'Call Support desk',
                    value: '+91 63691 53235',
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),

            Text(
              'Frequently Asked Questions',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            _buildFaqItem(
              context,
              question: 'How do I submit on-duty expenses?',
              answer: 'Go to More -> On Duty, tap the Add button (+), fill out the travel log fields, enter the expense claim title and amount, and tap submit. Admin will review the ticket.',
            ),
            _buildFaqItem(
              context,
              question: 'My check-in failed, what should I do?',
              answer: 'Verify you have an active network connection. If the issue persists, submit a support ticket via the Support Requests tab, or contact HR directly.',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContactItem(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String value,
  }) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: AppTheme.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: AppTheme.primary, size: 24),
        ),
        const SizedBox(width: 16),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(color: AppTheme.textLight, fontSize: 12)),
            Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppTheme.textDark),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildFaqItem(BuildContext context, {required String question, required String answer}) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 6),
      child: AppCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              question,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppTheme.textDark),
            ),
            const SizedBox(height: 6),
            Text(
              answer,
              style: const TextStyle(color: AppTheme.textLight, fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }
}
