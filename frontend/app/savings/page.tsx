"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SavingsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/wallets?tab=savings');
  }, [router]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-light)', fontWeight: '600' }}>
      Đang chuyển hướng đến Ví tiết kiệm...
    </div>
  );
}
