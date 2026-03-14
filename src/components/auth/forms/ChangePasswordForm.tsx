'use client';

import { useState, useEffect } from 'react';
import { PasswordInput, Button, Alert } from '@mantine/core';
import { validatePassword } from '@/lib/validation';
import { changePassword, setPassword as setNewPassword, checkHasPassword } from '@/services/auth';

interface ChangePasswordFormProps {
  onSuccess: () => void;
}

export default function ChangePasswordForm({ onSuccess }: ChangePasswordFormProps) {
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);

  useEffect(() => {
    checkHasPassword().then(setHasPassword);
  }, []);

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

  // 加载中
  if (hasPassword === null) {
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
              radius="md"
              size="md"
            />
          )}

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
            {hasPassword ? '确认修改' : '设置密码'}
          </Button>
        </div>
      </form>
    </>
  );
}
