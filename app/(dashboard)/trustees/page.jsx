'use client';

import { EntityPage } from '../../../components/EntityPage';
import { trusteesData } from '../../../lib/data';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'assetsUnderTrust', label: 'Assets Under Trust' },
  { key: 'clients', label: 'Clients' },
  { key: 'status', label: 'Status' },
];

const stats = [
  { label: 'Total Trustees', value: '67', change: '8%', trend: 'up' },
  { label: 'Total Assets', value: '$487B', change: '12%', trend: 'up' },
  { label: 'Avg per Trustee', value: '$7.3B', change: '4%', trend: 'up' },
  { label: 'Active', value: '62', change: '6%', trend: 'up' },
];

export default function TrusteesPage() {
  return (
    <EntityPage
      title="Trustees"
      description="Trustee services and asset management"
      data={trusteesData}
      columns={columns}
      stats={stats}
    />
  );
}
