'use client';

import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge, EmptyState } from './ui/Table';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Search, Plus, Filter, Download, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export function EntityPage({ title, description, data, columns, stats }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filteredData = data.filter((item) =>
    Object.values(item).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'inactive':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-foreground)] tracking-tight">
            {title}
          </h1>
          <p className="text-[var(--color-muted)] mt-1">{description}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" leftIcon={<Download className="w-4 h-4" />}>
            Export
          </Button>
          <Button leftIcon={<Plus className="w-4 h-4" />}>
            Add New
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <Card key={i} hover>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-[var(--color-muted)] uppercase tracking-wider">
                  {stat.label}
                </p>
                <div className="flex items-end justify-between mt-2">
                  <p className="text-3xl font-bold text-[var(--color-foreground)]">
                    {stat.value}
                  </p>
                  {stat.change && (
                    <span className={cn(
                      'text-sm font-semibold px-2 py-1 rounded-lg',
                      stat.trend === 'up' 
                        ? 'text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30' 
                        : 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30'
                    )}>
                      {stat.trend === 'up' ? '+' : ''}{stat.change}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters Card */}
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted-foreground)]" />
              <input
                type="text"
                placeholder={`Search ${title.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-accent)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-500)]/10 transition-all duration-200"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" leftIcon={<Filter className="w-4 h-4" />}>
                Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className="overflow-hidden">
        <CardHeader 
          title={`All ${title}`} 
          subtitle={`${filteredData.length} total records`}
        />
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key}>{column.label}</TableHead>
                ))}
                <TableHead className="w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length > 0 ? (
                paginatedData.map((item, index) => (
                  <TableRow key={item.id || index} className="group">
                    {columns.map((column) => (
                      <TableCell key={column.key}>
                        {column.key === 'status' ? (
                          <Badge variant={getStatusVariant(item[column.key])}>
                            {item[column.key]}
                          </Badge>
                        ) : column.render ? (
                          column.render(item[column.key], item)
                        ) : (
                          <span className="text-[var(--color-foreground)]">
                            {item[column.key]}
                          </span>
                        )}
                      </TableCell>
                    ))}
                    <TableCell>
                      <button className="p-2 hover:bg-[var(--color-accent)] rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="w-4 h-4 text-[var(--color-muted)]" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} className="text-center py-12">
                    <EmptyState
                      title="No results found"
                      description={`No ${title.toLowerCase()} match your search criteria.`}
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-accent)]/30">
            <p className="text-sm text-[var(--color-muted)]">
              Showing <span className="font-medium text-[var(--color-foreground)]">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-medium text-[var(--color-foreground)]">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> of{' '}
              <span className="font-medium text-[var(--color-foreground)]">{filteredData.length}</span> entries
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                leftIcon={<ChevronLeft className="w-4 h-4" />}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        'w-9 h-9 rounded-lg text-sm font-medium transition-colors',
                        currentPage === page
                          ? 'bg-[var(--color-primary-500)] text-white'
                          : 'hover:bg-[var(--color-accent)] text-[var(--color-muted)]'
                      )}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

import { cn } from '../lib/utils';
