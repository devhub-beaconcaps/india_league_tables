'use client';

import { EntityPage } from '../../../components/EntityPage';
import { issuersData } from '../../../lib/data';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type' },
  { key: 'country', label: 'Country' },
  { key: 'totalIssuances', label: 'Total Issuances' },
  { key: 'status', label: 'Status' },
];

const stats = [
  { label: 'Total Issuers', value: '156', change: '12%', trend: 'up' },
  { label: 'Active', value: '142', change: '8%', trend: 'up' },
  { label: 'Pending', value: '14', change: '2%', trend: 'down' },
  { label: 'Countries', value: '48', change: '5%', trend: 'up' },
];

export default function IssuersPage() {
  return (
    <EntityPage
      title="Issuers"
      description="Manage and track all bond issuers in the system"
      data={issuersData}
      columns={columns}
      stats={stats}
    />
  );
}
