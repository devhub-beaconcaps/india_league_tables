'use client'

import DebtSnapshotReport from '@/components/DebtSnapshotReport';
import { getMonthlyReportData } from '@/features/admin/services';
import React, { useEffect, useState, useCallback } from 'react';

const MonthlyReportpage = () => {
    const [monthlyData, setMonthlyData] = useState<any>(null);

    const getMonthStartAndEnd = (month: number, year: number = new Date().getFullYear()) => {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0); 

        const formatDate = (date: Date): string => {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        };

        return {
            startDate: formatDate(startDate),
            endDate: formatDate(endDate)
        };
    };

    const fetchData = useCallback(async () => {
        const { startDate, endDate } = getMonthStartAndEnd(7, 2026);
        const payload = { startDate, endDate };

        try {
            const res = await getMonthlyReportData(payload);
            console.log('monthly data logs', res);
            setMonthlyData(res);
        } catch (error) {
            console.error(error);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Show loading state while waiting for data
    if (!monthlyData) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <p className="text-gray-500 font-medium animate-pulse">Loading monthly report...</p>
            </div>
        );
    }

    return <DebtSnapshotReport data={monthlyData} />;
};

export default MonthlyReportpage;