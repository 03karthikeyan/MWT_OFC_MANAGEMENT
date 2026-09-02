import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import 'buttons.dart';

class SuccessBottomSheet extends StatelessWidget {
  final String title;
  final String message;
  final String buttonText;
  final VoidCallback onTap;

  const SuccessBottomSheet({
    super.key,
    required this.title,
    required this.message,
    this.buttonText = 'Awesome',
    required this.onTap,
  });

  static void show(
    BuildContext context, {
    required String title,
    required String message,
    String buttonText = 'Awesome',
    required VoidCallback onTap,
  }) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) => SuccessBottomSheet(
        title: title,
        message: message,
        buttonText: buttonText,
        onTap: onTap,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 32,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.success.withOpacity(0.12),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.check_circle_outline_rounded,
              color: AppTheme.success,
              size: 56,
            ),
          ),
          const SizedBox(height: 24),
          Text(
            title,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            message,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppTheme.textLight,
                ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 32),
          PrimaryButton(
            text: buttonText,
            onPressed: () {
              Navigator.of(context).pop();
              onTap();
            },
          ),
        ],
      ),
    );
  }
}

class FilterBottomSheet extends StatelessWidget {
  final String title;
  final Widget child;
  final VoidCallback onApply;
  final VoidCallback? onClear;

  const FilterBottomSheet({
    super.key,
    required this.title,
    required this.child,
    required this.onApply,
    this.onClear,
  });

  static void show(
    BuildContext context, {
    required String title,
    required Widget child,
    required VoidCallback onApply,
    VoidCallback? onClear,
  }) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) => FilterBottomSheet(
        title: title,
        onApply: onApply,
        onClear: onClear,
        child: child,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 48,
              height: 4,
              decoration: BoxDecoration(
                color: const Color(0xFFE2E8F0),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
              ),
              if (onClear != null)
                TextButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                    onClear!();
                  },
                  child: const Text(
                    'Clear All',
                    style: TextStyle(color: AppTheme.error, fontWeight: FontWeight.w600),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),
          child,
          const SizedBox(height: 24),
          PrimaryButton(
            text: 'Apply Filters',
            onPressed: () {
              Navigator.of(context).pop();
              onApply();
            },
          ),
        ],
      ),
    );
  }
}
