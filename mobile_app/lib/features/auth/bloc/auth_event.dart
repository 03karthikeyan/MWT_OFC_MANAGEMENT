import 'package:equatable/equatable.dart';

abstract class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object?> get props => [];
}

class CheckAuthEvent extends AuthEvent {}

class LoginEvent extends AuthEvent {
  final String username;
  final String password;

  const LoginEvent({required this.username, required this.password});

  @override
  List<Object?> get props => [username, password];
}

class RegisterEvent extends AuthEvent {
  final Map<String, dynamic> data;

  const RegisterEvent(this.data);

  @override
  List<Object?> get props => [data];
}

class UpdateProfileEvent extends AuthEvent {
  final Map<String, dynamic> profileData;

  const UpdateProfileEvent(this.profileData);

  @override
  List<Object?> get props => [profileData];
}

class LogoutEvent extends AuthEvent {}
