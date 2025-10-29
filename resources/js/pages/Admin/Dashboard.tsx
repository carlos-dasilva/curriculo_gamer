import React from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';

type Props = {};

export default function AdminDashboard(_: Props) {
  return (
    <AdminLayout title="Dashboard">
      <div className="text-sm text-gray-700">
        Selecione um serviço no menu à esquerda.
      </div>
    </AdminLayout>
  );
}

