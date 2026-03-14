'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { TextInput, Button, Alert } from '@mantine/core';
import { validateEmail } from '@/lib/validation';
import { useCountdown } from '@/hooks/useCountdown';
import { sendCode, verifyEmail, changeEmail } from '@/services/auth';

interface ChangeEmailFormProps {
  onSuccess: () => void;
}

// 邮箱脱敏显示
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (local.length <= 2) return email;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

export default function ChangeEmailForm({ onSuccess }: ChangeEmailFormProps) {
  const { data: session } = useSession();
  const currentEmail = session?.user?.email || '';

  // 步骤：1=验证旧邮箱，2=绑定新邮箱
  const [step, setStep] = useState<1 | 2>(1);

  // 表单值
  const [oldCode, setOldCode] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCode, setNewCode] = useState('');

  // 状态
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const { countdown, isActive, start: startCountdown, reset: resetCountdown } = useCountdown(60);

  // 错误和提示
  const [codeError, setCodeError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const clearErrors = () => {
    setCodeError('');
    setEmailError('');
    setGeneralError('');
    setSuccessMessage('');
  };

  // Step 1: 发送验证码到旧邮箱
  const handleSendOldCode = async () => {
    clearErrors();
    setIsSendingCode(true);
    const { ok, status } = await sendCode(currentEmail, 1); // type=1 登录验证码
    setIsSendingCode(false);

    if (ok) {
      startCountdown();
      setSuccessMessage('验证码已发送到当前邮箱');
    } else {
      setGeneralError(status === 429 ? '发送过于频繁，请稍后再试' : '发送失败，请稍后重试');
    }
  };

  // Step 1: 验证旧邮箱
  const handleVerifyOldEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    if (!oldCode.trim()) {
      setCodeError('请输入验证码');
      return;
    }
    if (oldCode.length !== 6) {
      setCodeError('验证码为6位数字');
      return;
    }

    setIsLoading(true);
    const { ok } = await verifyEmail(currentEmail, oldCode);
    setIsLoading(false);

    if (ok) {
      setStep(2);
      setSuccessMessage('验证成功，请输入新邮箱');
      resetCountdown();
    } else {
      setGeneralError('验证码错误或已过期');
    }
  };

  // Step 2: 发送验证码到新邮箱
  const handleSendNewCode = async () => {
    clearErrors();
    const emailValidation = validateEmail(newEmail);
    if (!emailValidation.valid) {
      setEmailError(emailValidation.message);
      return;
    }

    setIsSendingCode(true);
    const { ok, status } = await sendCode(newEmail, 3); // type=3 换绑邮箱
    setIsSendingCode(false);

    if (ok) {
      startCountdown();
      setSuccessMessage('验证码已发送到新邮箱');
    } else {
      setGeneralError(status === 429 ? '发送过于频繁，请稍后再试' : '发送失败，请稍后重试');
    }
  };

  // Step 2: 完成换绑
  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    const emailValidation = validateEmail(newEmail);
    if (!emailValidation.valid) {
      setEmailError(emailValidation.message);
      return;
    }
    if (!newCode.trim()) {
      setCodeError('请输入验证码');
      return;
    }
    if (newCode.length !== 6) {
      setCodeError('验证码为6位数字');
      return;
    }

    setIsLoading(true);
    const { ok, status } = await changeEmail(newEmail, newCode);
    setIsLoading(false);

    if (ok) {
      setSuccessMessage('邮箱换绑成功');
      setTimeout(() => {
        onSuccess();
        window.location.reload();
      }, 1500);
    } else {
      if (status === 409) {
        setEmailError('该邮箱已被使用');
      } else {
        setGeneralError('换绑失败，请检查验证码是否正确');
      }
    }
  };

  return (
    <>
      <div className="text-center mb-5">
        <h2 className="text-xl font-bold text-gray-900">换绑邮箱</h2>
        <p className="text-sm text-gray-500 mt-1">
          {step === 1 ? '第一步：验证当前邮箱' : '第二步：绑定新邮箱'}
        </p>
      </div>

      {successMessage && (
        <Alert color="green" variant="light" mb="md">{successMessage}</Alert>
      )}
      {generalError && (
        <Alert color="red" variant="light" mb="md">{generalError}</Alert>
      )}

      {/* Step 1: 验证旧邮箱 */}
      {step === 1 && (
        <form onSubmit={handleVerifyOldEmail} noValidate>
          <div className="space-y-3">
            <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
              当前邮箱：<span className="font-medium">{maskEmail(currentEmail)}</span>
            </div>

            <div className="flex gap-2">
              <TextInput
                placeholder="6位验证码"
                value={oldCode}
                onChange={(e) => { setOldCode(e.target.value.replace(/\D/g, '')); setCodeError(''); }}
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
                onClick={handleSendOldCode}
                className="whitespace-nowrap"
              >
                {isActive ? `${countdown}s` : '获取验证码'}
              </Button>
            </div>

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
              下一步
            </Button>
          </div>
        </form>
      )}

      {/* Step 2: 绑定新邮箱 */}
      {step === 2 && (
        <form onSubmit={handleChangeEmail} noValidate>
          <div className="space-y-3">
            <TextInput
              placeholder="新邮箱"
              value={newEmail}
              onChange={(e) => { setNewEmail(e.target.value.trim()); setEmailError(''); }}
              error={emailError}
              radius="md"
              size="md"
            />

            <div className="flex gap-2">
              <TextInput
                placeholder="6位验证码"
                value={newCode}
                onChange={(e) => { setNewCode(e.target.value.replace(/\D/g, '')); setCodeError(''); }}
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
                onClick={handleSendNewCode}
                className="whitespace-nowrap"
              >
                {isActive ? `${countdown}s` : '获取验证码'}
              </Button>
            </div>

            <button
              type="button"
              onClick={() => { setStep(1); clearErrors(); resetCountdown(); }}
              className="text-xs text-gray-500 hover:text-purple-600 transition-colors"
            >
              ← 返回上一步
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
              确认换绑
            </Button>
          </div>
        </form>
      )}
    </>
  );
}
