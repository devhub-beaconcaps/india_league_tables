'use client';

import { EntityPage } from '../../../components/EntityPage';
import { agenciesData } from '../../../lib/data';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type' },
  { key: 'ratingScale', label: 'Rating Scale' },
  { key: 'coverage', label: 'Coverage' },
];

const stats = [
  { label: 'Total Agencies', value: '34', change: '4%', trend: 'up' },
  { label: 'Credit Rating', value: '28', change: '6%', trend: 'up' },
  { label: 'Global Reach', value: '12', change: '2%', trend: 'up' },
  { label: 'Regional', value: '22', change: '5%', trend: 'up' },
];

export default function AgenciesPage() {
  return (
    <EntityPage
      title="Agencies"
      description="Credit rating and regulatory agencies"
      data={agenciesData}
      columns={columns}
      stats={stats}
    />
  );
}
