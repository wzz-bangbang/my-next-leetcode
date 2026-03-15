'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { PasswordInput, Alert } from '@mantine/core';
import { Loader } from '@mantine/core';
import { validatePassword } from '@/lib/validation';
import { changePassword, setPassword as setNewPassword } from '@/services/auth';

interface ChangePasswordFormProps {
  onSuccess: () => void;
}

export default function ChangePasswordForm({ onSuccess }: ChangePasswordFormProps) {
  const { data: session, status, update } = useSession();
  // 从 session 获取 hasPassword，默认 true（走修改流程）
  const hasPassword = session?.user?.hasPassword ?? true;

  // 表单值
  const [oldPassword, setOldPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 状态
  const [isLoading, setIsLoading] = useState(false);

  // 错误和提示
  const [oldPasswordError, setOldPasswordError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const clearErrors = () => {
    setOldPasswordError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setGeneralError('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    // 有密码时才校验原密码
    if (hasPassword && !oldPassword.trim()) {
      setOldPasswordError('请输入原密码');
      return;
    }
    // 校验新密码
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

    // 根据是否有密码调用不同的接口
    const { ok, status } = hasPassword
      ? await changePassword(oldPassword, password)
      : await setNewPassword(password);

    setIsLoading(false);

    if (ok) {
      setSuccessMessage(hasPassword ? '密码修改成功' : '密码设置成功');
      // 如果是首次设置密码，更新 session
      if (!hasPassword) {
        await update({ hasPassword: true });
      }
      setTimeout(() => onSuccess(), 1500);
    } else {
      if (status === 400) {
        setOldPasswordError('原密码错误');
      } else if (status === 401) {
        setGeneralError('请先登录');
      } else {
        setGeneralError(hasPassword ? '修改失败，请稍后重试' : '设置失败，请稍后重试');
      }
    }
  };

  // session 加载中
  if (status === 'loading') {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400">加载中...</div>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-5">
        <h2 className="text-xl font-bold text-gray-900">
          {hasPassword ? '修改密码' : '设置密码'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {hasPassword ? '输入原密码和新密码' : '您通过第三方登录，请设置密码'}
        </p>
      </div>

      {successMessage && (
        <Alert color="green" variant="light" mb="md">{successMessage}</Alert>
      )}
      {generalError && (
        <Alert color="red" variant="light" mb="md">{generalError}</Alert>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-3">
          {hasPassword && (
            <PasswordInput
              placeholder="原密码"
              value={oldPassword}
              onChange={(e) => { setOldPassword(e.target.value.trim()); setOldPasswordError(''); }}
              error={oldPasswordError}
              radius="xl"
              size="md"
            />
          )}

          <PasswordInput
            placeholder="新密码（8-14位，含大小写+数字+符号三种）"
            value={password}
            onChange={(e) => { setPassword(e.target.value.trim()); setPasswordError(''); }}
            error={passwordError}
            radius="xl"
            size="md"
          />

          <PasswordInput
            placeholder="确认新密码"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value.trim()); setConfirmPasswordError(''); }}
            error={confirmPasswordError}
            radius="xl"
            size="md"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="btn-gradient-border btn-gradient-code w-full py-2.5 rounded-full text-sm font-medium transition-all flex items-center justify-center gap-2"
          >
            {isLoading && <Loader size="xs" />}
            {hasPassword ? '确认修改' : '设置密码'}
          </button>
        </div>
      </form>
    </>
  );
}
