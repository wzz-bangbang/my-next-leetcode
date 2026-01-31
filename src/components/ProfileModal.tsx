'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, Text, Stack, Button } from '@mantine/core';
import { Session } from 'next-auth';
import { signOut } from 'next-auth/react';

interface ProfileModalProps {
  opened: boolean;
  onClose: () => void;
  session: Session | null;
  onLogout: () => void;
}

export default function ProfileModal({ opened, onClose, session, onLogout }: ProfileModalProps) {
  const router = useRouter();
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [deactivateError, setDeactivateError] = useState('');

  const handleDeactivate = async () => {
    setIsDeactivating(true);
    setDeactivateError('');

    try {
      const res = await fetch('/api/auth/deactivate', {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        setDeactivateError(data.error || '注销失败');
        return;
      }

      // 注销成功：先关闭弹窗，再登出并跳转首页
      setShowDeactivateConfirm(false);
      onClose();
      await signOut({ redirect: false });
      router.push('/');
      router.refresh(); // 刷新页面状态
    } catch {
      setDeactivateError('注销失败，请稍后重试');
    } finally {
      setIsDeactivating(false);
    }
  };

  // 关闭弹窗时重置状态
  const handleClose = () => {
    setShowDeactivateConfirm(false);
    setDeactivateError('');
    onClose();
  };

  return (
    <>
      <Modal
        opened={opened}
        onClose={handleClose}
        withCloseButton={false}
        centered
        radius="lg"
        size="sm"
        padding="md"
        styles={{
          body: { padding: '20px' },
        }}
        className="[&_.mantine-Modal-content]:w-[85vw] [&_.mantine-Modal-content]:max-w-[320px] sm:[&_.mantine-Modal-content]:max-w-[360px]"
      >
        {/* 自定义关闭按钮 */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          ✕
        </button>

        <Stack align="center" gap="md">
          {/* 头像 - 移动端小一点 */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20">
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || '用户'}
                className="w-full h-full rounded-full object-cover shadow-md"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xl sm:text-2xl font-medium shadow-md">
                {session?.user?.name?.[0] || '?'}
              </div>
            )}
          </div>

          {/* 用户信息 */}
          <Stack gap={4} align="center">
            <Text size='lg' fw={600}>{session?.user?.name || '未设置昵称'}</Text>
            <Text size="md" c="dimmed">{session?.user?.email || '未绑定邮箱'}</Text>
          </Stack>

          {/* 操作按钮 */}
          <Stack gap="xs" w="100%">
            <Button
              variant="light"
              color="gray"
              fullWidth
              radius="md"
              size="sm"
              onClick={() => {
                // TODO: 实现邮箱换绑功能
              }}
            >
              邮箱换绑
            </Button>
            <Button
              variant="light"
              color="gray"
              fullWidth
              radius="md"
              size="sm"
              onClick={() => {
                // TODO: 实现修改密码功能
              }}
            >
              修改密码
            </Button>
            <Button
              variant="light"
              color="orange"
              fullWidth
              radius="md"
              size="sm"
              onClick={onLogout}
            >
              退出登录
            </Button>
            <Button
              variant="subtle"
              color="red"
              fullWidth
              radius="md"
              size="sm"
              onClick={() => setShowDeactivateConfirm(true)}
            >
              注销账号
            </Button>
          </Stack>
        </Stack>
      </Modal>

      {/* 注销确认弹窗 */}
      <Modal
        opened={showDeactivateConfirm}
        onClose={() => {
          setShowDeactivateConfirm(false);
          setDeactivateError('');
        }}
        centered
        radius="lg"
        size="xs"
        padding="md"
        withCloseButton={false}
      >
        <Stack gap="md">
          <Text size="lg" fw={600} ta="center">确认注销账号？</Text>
          <Text size="sm" c="dimmed" ta="center">
            注销后账号将不可用，此操作不可撤销。
          </Text>
          
          {deactivateError && (
            <Text size="sm" c="red" ta="center">{deactivateError}</Text>
          )}

          <Stack gap="xs">
            <Button
              variant="filled"
              color="red"
              fullWidth
              radius="md"
              size="sm"
              loading={isDeactivating}
              onClick={handleDeactivate}
            >
              确认注销
            </Button>
            <Button
              variant="light"
              color="gray"
              fullWidth
              radius="md"
              size="sm"
              onClick={() => {
                setShowDeactivateConfirm(false);
                setDeactivateError('');
              }}
            >
              取消
            </Button>
          </Stack>
        </Stack>
      </Modal>
    </>
  );
}
