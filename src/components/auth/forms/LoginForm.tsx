'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { TextInput, PasswordInput, Alert } from '@mantine/core';
import { Loader } from '@mantine/core';
import { validateLoginForm, validateRegisterForm, validateUsername, validateEmail } from '@/lib/validation';
import { useCountdown } from '@/hooks/useCountdown';
import { register, sendCode } from '@/services/auth';

type LoginType = 'password' | 'code';

interface LoginFormProps {
  onSuccess: () => void;
  onModeChange: (mode: 'resetPassword') => void;
}

export default function LoginForm({ onSuccess, onModeChange }: LoginFormProps) {
  // 表单模式
  const [loginType, setLoginType] = useState<LoginType>('password');
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // 表单值
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [verifyCode, setVerifyCode] = useState('');

  // 状态
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const { countdown, isActive, start: startCountdown } = useCountdown(60);

  // 错误
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [generalError, setGeneralError] = useState('');

  const clearErrors = () => {
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setCodeError('');
    setGeneralError('');
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
    const { ok, status } = await sendCode(email, 1); // type=1 登录
    setIsSendingCode(false);

    if (ok) {
      startCountdown();
    } else {
      setGeneralError(status === 429 ? '发送过于频繁，请稍后再试' : '发送失败，请稍后重试');
    }
  };

  // 密码登录
  const handlePasswordLogin = async () => {
    clearErrors();
    const validation = validateLoginForm(email, password);
    setEmailError(validation.emailError);
    setPasswordError(validation.passwordError);
    if (!validation.isValid) return;

    setIsLoading(true);
    try {
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) {
        setGeneralError('邮箱或密码错误');
      } else {
        onSuccess();
      }
    } catch {
      setGeneralError('登录失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 验证码登录
  const handleCodeLogin = async () => {
    clearErrors();
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setEmailError(emailValidation.message);
      return;
    }
    if (!verifyCode.trim()) {
      setCodeError('请输入验证码');
      return;
    }
    if (verifyCode.length !== 6) {
      setCodeError('验证码为6位数字');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn('code', { email, code: verifyCode, redirect: false });
      if (result?.error) {
        setGeneralError('验证码错误或已过期');
      } else {
        onSuccess();
      }
    } catch {
      setGeneralError('登录失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 注册
  const handleRegister = async () => {
    clearErrors();
    const nameValidation = validateUsername(name);
    setNameError(nameValidation.message);
    const validation = validateRegisterForm(email, password, confirmPassword);
    setEmailError(validation.emailError);
    setPasswordError(validation.passwordError);
    setConfirmPasswordError(validation.confirmPasswordError);
    if (!nameValidation.valid || !validation.isValid) return;

    setIsLoading(true);
    const { ok, status } = await register(email, password, name);
    if (!ok) {
      setGeneralError(status === 409 ? '' : '注册失败，请稍后重试');
      if (status === 409) setEmailError('该邮箱已注册');
      setIsLoading(false);
      return;
    }

    // 自动登录
    const result = await signIn('credentials', { email, password, redirect: false });
    setIsLoading(false);
    if (result?.error) {
      setGeneralError('注册成功，但自动登录失败，请手动登录');
    } else {
      onSuccess();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegisterMode) {
      handleRegister();
    } else if (loginType === 'code') {
      handleCodeLogin();
    } else {
      handlePasswordLogin();
    }
  };

  const getTitle = () => isRegisterMode ? '创建账号' : '欢迎登录';
  const getSubtitle = () => isRegisterMode ? '注册后可同步你的学习进度' : '登录后可同步你的学习进度';

  return (
    <>
      <div className="text-center mb-5">
        <h2 className="text-xl font-bold text-gray-900">{getTitle()}</h2>
        <p className="text-sm text-gray-500 mt-1">{getSubtitle()}</p>
      </div>

      {generalError && (
        <Alert color="red" variant="light" mb="md">{generalError}</Alert>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-3">
          {/* 注册时显示昵称 */}
          {isRegisterMode && (
            <TextInput
              placeholder="昵称（最多20字符）"
              value={name}
              onChange={(e) => { setName(e.target.value.trim()); setNameError(''); }}
              error={nameError}
              maxLength={20}
              radius="xl"
              size="md"
            />
          )}

          {/* 邮箱 */}
          <TextInput
            placeholder="邮箱"
            value={email}
            onChange={(e) => { setEmail(e.target.value.trim()); setEmailError(''); }}
            error={emailError}
            radius="xl"
            size="md"
          />

          {/* 密码模式 */}
          {loginType === 'password' && (
            <>
              <PasswordInput
                placeholder={isRegisterMode ? '密码（8-14位，含大小写+数字+符号三种）' : '密码'}
                value={password}
                onChange={(e) => { setPassword(e.target.value.trim()); setPasswordError(''); }}
                error={passwordError}
                radius="xl"
                size="md"
              />
              {isRegisterMode && (
                <PasswordInput
                  placeholder="确认密码"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value.trim()); setConfirmPasswordError(''); }}
                  error={confirmPasswordError}
                  radius="xl"
                  size="md"
                />
              )}
            </>
          )}

          {/* 验证码模式 */}
          {loginType === 'code' && !isRegisterMode && (
            <div className="flex gap-2">
              <TextInput
                placeholder="6位验证码"
                value={verifyCode}
                onChange={(e) => { setVerifyCode(e.target.value.replace(/\D/g, '')); setCodeError(''); }}
                error={codeError}
                radius="xl"
                size="md"
                className="flex-1"
                maxLength={6}
              />
              <button
                type="button"
                onClick={handleSendCode}
                disabled={isSendingCode || isActive}
                className="btn-gradient-border btn-gradient-primary px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1.5"
              >
                {isSendingCode && <Loader size="xs" />}
                {isActive ? `${countdown}s` : '获取验证码'}
              </button>
            </div>
          )}

          {/* 切换登录方式（仅登录模式） */}
          {!isRegisterMode && (
            <div className="flex items-center gap-2 justify-between">
              <button
                type="button"
                onClick={() => { setLoginType(loginType === 'password' ? 'code' : 'password'); clearErrors(); }}
                className="text-xs text-gray-500 hover:text-purple-600 transition-colors"
              >
                {loginType === 'password' ? '验证码登录' : '密码登录'}
              </button>
              {loginType === 'password' && (
                <button
                  type="button"
                  onClick={() => onModeChange('resetPassword')}
                  className="text-xs text-gray-500 hover:text-purple-600 transition-colors"
                >
                  忘记密码
                </button>
              )}
            </div>
          )}

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-gradient-border btn-gradient-code w-full py-2.5 rounded-full text-sm font-medium transition-all flex items-center justify-center gap-2"
          >
            {isLoading && <Loader size="xs" />}
            {isRegisterMode ? '注册' : '登录'}
          </button>

          {/* 切换登录/注册 */}
          <button
            type="button"
            onClick={() => { setIsRegisterMode(!isRegisterMode); setLoginType('password'); clearErrors(); }}
            className="btn-gradient-border btn-gradient-bagu w-full py-2.5 rounded-full text-sm font-medium transition-all"
          >
            {isRegisterMode ? '已有账号？去登录' : '没有账号？去注册'}
          </button>
        </div>
      </form>
    </>
  );
}
