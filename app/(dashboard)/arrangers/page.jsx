'use client';

import { EntityPage } from '../../../components/EntityPage';
import { arrangersData } from '../../../lib/data';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'dealsArranged', label: 'Deals Arranged' },
  { key: 'volume', label: 'Volume' },
  { key: 'rating', label: 'Rating' },
];

const stats = [
  { label: 'Total Arrangers', value: '89', change: '6%', trend: 'up' },
  { label: 'Total Volume', value: '$2.4T', change: '15%', trend: 'up' },
  { label: 'Avg Deal Size', value: '$450M', change: '3%', trend: 'up' },
  { label: 'Top Rated', value: '24', change: '4%', trend: 'up' },
];

export default function ArrangersPage() {
  return (
    <EntityPage
      title="Arrangers"
      description="Financial institutions arranging bond issuances"
      data={arrangersData}
      columns={columns}
      stats={stats}
    />
  );
}
