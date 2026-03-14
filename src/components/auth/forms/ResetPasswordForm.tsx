'use client';

import { useState } from 'react';
import { TextInput, PasswordInput, Button, Alert } from '@mantine/core';
import { validateEmail, validatePassword } from '@/lib/validation';
import { useCountdown } from '@/hooks/useCountdown';
import { sendCode, resetPassword } from '@/services/auth';

interface ResetPasswordFormProps {
  onSuccess: () => void;
  onBack: () => void;
}

export default function ResetPasswordForm({ onSuccess, onBack }: ResetPasswordFormProps) {
  // 表单值
  const [email, setEmail] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 状态
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const { countdown, isActive, start: startCountdown } = useCountdown(60);

  // 错误和提示
  const [emailError, setEmailError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const clearErrors = () => {
    setEmailError('');
    setCodeError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setGeneralError('');
    setSuccessMessage('');
  };

  // 发送验证码
  const handleSendCode = async () => {
    clearErrors();
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setEmailError(emailValidation.message);
      return;
    }

    setIsSendingCode(true);
    const { ok, status } = await sendCode(email, 2); // type=2 重置密码
    setIsSendingCode(false);

    if (ok) {
      startCountdown();
      setSuccessMessage('验证码已发送，请查收邮件');
    } else {
      setGeneralError(status === 429 ? '发送过于频繁，请稍后再试' : '发送失败，请稍后重试');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    // 校验邮箱
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setEmailError(emailValidation.message);
      return;
    }
    // 校验验证码
    if (!verifyCode.trim()) {
      setCodeError('请输入验证码');
      return;
    }
    if (verifyCode.length !== 6) {
      setCodeError('验证码为6位数字');
      return;
    }
    // 校验密码
    const pwdValidation = validatePassword(password);
    if (!pwdValidation.valid) {
      setPasswordError(pwdValidation.message);
      return;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError('两次密码不一致');
      return;
    }

    setIsLoading(true);
    const { ok } = await resetPassword(email, verifyCode, password);
    setIsLoading(false);

    if (ok) {
      setSuccessMessage('密码重置成功，请使用新密码登录');
      setTimeout(() => onSuccess(), 1500);
    } else {
      setGeneralError('重置失败，请检查验证码是否正确');
    }
  };

  return (
    <>
      <div className="text-center mb-5">
        <h2 className="text-xl font-bold text-gray-900">重置密码</h2>
        <p className="text-sm text-gray-500 mt-1">输入邮箱验证码和新密码</p>
      </div>

      {successMessage && (
        <Alert color="green" variant="light" mb="md">{successMessage}</Alert>
      )}
      {generalError && (
        <Alert color="red" variant="light" mb="md">{generalError}</Alert>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-3">
          <TextInput
            placeholder="邮箱"
            value={email}
            onChange={(e) => { setEmail(e.target.value.trim()); setEmailError(''); }}
            error={emailError}
            radius="md"
            size="md"
          />

          <div className="flex gap-2">
            <TextInput
              placeholder="6位验证码"
              value={verifyCode}
              onChange={(e) => { setVerifyCode(e.target.value.replace(/\D/g, '')); setCodeError(''); }}
              error={codeError}
              radius="md"
              size="md"
              className="flex-1"
              maxLength={6}
            />
            <Button
              type="button"
              variant="light"
              color="gray"
              radius="md"
              size="md"
              loading={isSendingCode}
              disabled={isActive}
              onClick={handleSendCode}
              className="whitespace-nowrap"
            >
              {isActive ? `${countdown}s` : '获取验证码'}
            </Button>
          </div>

          <PasswordInput
            placeholder="新密码（8-14位，含大小写+数字+符号三种）"
            value={password}
            onChange={(e) => { setPassword(e.target.value.trim()); setPasswordError(''); }}
            error={passwordError}
            radius="md"
            size="md"
          />

          <PasswordInput
            placeholder="确认新密码"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value.trim()); setConfirmPasswordError(''); }}
            error={confirmPasswordError}
            radius="md"
            size="md"
          />

          <button
            type="button"
            onClick={onBack}
            className="text-xs text-gray-500 hover:text-purple-600 transition-colors"
          >
            ← 返回登录
          </button>

          <Button
            fullWidth
            type="submit"
            loading={isLoading}
            radius="md"
            size="md"
            variant="light"
            color="cyan"
            className="!bg-gradient-to-r !from-sky-100 !to-teal-100 !text-sky-700 hover:!from-sky-200 hover:!to-teal-200 !border !border-sky-200/50"
          >
            重置密码
          </Button>
        </div>
      </form>
    </>
  );
}
