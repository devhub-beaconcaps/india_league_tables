'use client';

import { EntityPage } from '../../../components/EntityPage';
import { registrarsData } from '../../../lib/data';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'registeredEntities', label: 'Registered Entities' },
  { key: 'region', label: 'Region' },
  { key: 'status', label: 'Status' },
];

const stats = [
  { label: 'Total Registrars', value: '45', change: '5%', trend: 'up' },
  { label: 'Total Entities', value: '60.2K', change: '18%', trend: 'up' },
  { label: 'Global Coverage', value: '89%', change: '3%', trend: 'up' },
  { label: 'Active', value: '42', change: '7%', trend: 'up' },
];

export default function RegistrarsPage() {
  return (
    <EntityPage
      title="Registrars"
      description="Entity registration and management services"
      data={registrarsData}
      columns={columns}
      stats={stats}
    />
  );
}
