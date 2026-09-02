import 'package:flutter_test/flutter_test.dart';
import 'package:hrms_app/app/app.dart';

void main() {
  testWidgets('Smoke test for HrmsApp bootstrap', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const HrmsApp());
    expect(find.byType(HrmsApp), findsOneWidget);
  });
}
