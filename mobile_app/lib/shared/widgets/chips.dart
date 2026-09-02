import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

class StatusChip extends StatelessWidget {
  final String label;
  final String status;

  const StatusChip({
    super.key,
    required this.label,
    required this.status,
  });

  @override
  Widget build(BuildContext context) {
    final statusColor = _getStatusColor(status);
    final bgColor = statusColor.withOpacity(0.12);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(100),
      ),
      child: Text(
        label.toUpperCase(),
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: statusColor,
              fontWeight: FontWeight.bold,
              fontSize: 11,
              letterSpacing: 0.5,
            ),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase().replaceAll(' ', '').replaceAll('-', '')) {
      case 'approved':
      case 'completed':
      case 'present':
      case 'active':
      case 'won':
      case 'resolved':
      case 'paid':
      case 'joined':
        return AppTheme.success;
      case 'pending':
      case 'inprogress':
      case 'contacted':
      case 'proposalsent':
      case 'partial':
      case 'qualified':
      case 'onhold':
      case 'planned':
      case 'new':
      case 'halfday':
      case 'working':
      case 'activenow':
        return AppTheme.warning;
      case 'rejected':
      case 'absent':
      case 'blocked':
      case 'lost':
      case 'failed':
      case 'missedcheckout':
        return AppTheme.error;
      case 'checkedout':
      case 'closed':
      default:
        return AppTheme.textLight;
    }
  }
}
