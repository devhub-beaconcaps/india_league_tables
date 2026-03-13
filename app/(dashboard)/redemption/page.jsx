'use client';

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import DetailedTable from '@/components/DetailedTable';
import { fetchSpecificMonthDebtRedemptionData } from '@/features/issuers/services';
import { useRedemptionMonthStore } from '@/lib/store';
import { useEffect, useMemo, useRef, useState } from 'react';

const PAGE_LIMIT = 25;

const allColumns = [
    { header: "ISIN", accessor: "Isin" },
    { header: "Issuer Name", accessor: "IssuerName" },
    { header: "Security Name", accessor: "SecurityName" },
    { header: "Security Type", accessor: "SecurityType" },
    { header: "Mode Of Issue", accessor: "ModeOfIssue" },
    { header: "Issue Size", accessor: "IssueSize" },
    { header: "Face Value", accessor: "FaceValue" },
    { header: "Allotment Date", accessor: "AllotmentDate" },
    { header: "Maturity Date", accessor: "MaturityDate" },
    { header: "Coupon Rate", accessor: "CouponRate" },
    { header: "Credit Rating Agency", accessor: "CreditRatingAgency" },
    { header: "Credit Rating", accessor: "CreditRating" },
    { header: "Debenture Trustee", accessor: "DebentureTrustee" },
    { header: "Registrar", accessor: "Registrar" },
    { header: "Arranger", accessor: "Arranger" },
    { header: "Seniority", accessor: "Seniority" },
    { header: "Tax Free", accessor: "TaxFree" },
    { header: "Secured Flag", accessor: "SecuredFlag" },
    { header: "Listing Status", accessor: "ListingStatus" },
];

const defaultColumns = [
    "Isin",
    "IssuerName",
    "SecurityName",
    "IssueSize",
    "MaturityDate"
];

const formatRedemptionData = (data) => {
    return data?.map(item => ({
        id:Number(item.id),
        Isin: item.isin || '-',
        IssuerName: item.issuerName || '-',
        SecurityName: item.securityName || '-',
        SecurityType: item.securityType || '-',
        ModeOfIssue: item.modeOfIssue || '-',
        IssueSize: item.issueSize || '-',
        FaceValue: item.faceValue || '-',
        AllotmentDate: item.allotmentDate || '-',
        MaturityDate: item.maturityDate || '-',
        CouponRate: item.couponRate || '-',
        CreditRatingAgency: item.creditRatingAgency || '-',
        CreditRating: item.creditRating || '-',
        DebentureTrustee: item.debentureTrustee || '-',
        Registrar: item.registrar || '-',
        Arranger: item.arranger || '-',
        Seniority: item.seniority || '-',
        TaxFree: item.taxFree || '-',
        SecuredFlag: item.securedFlag || '-',
        ListingStatus: item.listingStatus || '-',
    }));
};

export default function RedemptionList() {

    const { redemptionMonthDateRange } = useRedemptionMonthStore();

    const [tableData, setTableData] = useState([]);
    const [visibleColumns, setVisibleColumns] = useState(defaultColumns);

    const [totalEntries, setTotalEntries] = useState(0);

    const [page, setPage] = useState(1);

    const offset = (page - 1) * PAGE_LIMIT;

    const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
    const dropdownRef = useRef(null);

    const redemptionMonthLabel = useMemo(() => {

        if (!redemptionMonthDateRange?.startDate) return "";

        const date = new Date(redemptionMonthDateRange.startDate);

        return date.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric"
        });

    }, [redemptionMonthDateRange]);

    useEffect(() => {

        if (!redemptionMonthDateRange?.startDate || !redemptionMonthDateRange?.endDate) return;

        const fetchData = async () => {

            const query = {
                startDate: redemptionMonthDateRange.startDate,
                endDate: redemptionMonthDateRange.endDate,
                limit: PAGE_LIMIT,
                offset: offset
            };

            const resData = await fetchSpecificMonthDebtRedemptionData(query);

            console.log("resData", resData);


            if (resData?.data?.length > 0) {
                setTableData(formatRedemptionData(resData.data));
                setTotalEntries(resData.total || 0);
            } else {
                setTableData([]);
            }

        };

        fetchData();

    }, [redemptionMonthDateRange, offset]);

    const totalPages = Math.ceil(totalEntries / PAGE_LIMIT);

    const filteredColumns = useMemo(() => {
        return allColumns.filter(col => visibleColumns.includes(col.accessor));
    }, [visibleColumns]);

    const toggleColumn = (accessor) => {
        setVisibleColumns(prev =>
            prev.includes(accessor)
                ? prev.filter(col => col !== accessor)
                : [...prev, accessor]
        );
    };

    useEffect(() => {

        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsColumnMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);

    }, []);

    const startEntry = totalEntries === 0 ? 0 : offset + 1;
    const endEntry = Math.min(offset + PAGE_LIMIT, totalEntries);


    const handleExport = () => {

        if (!tableData?.length) return;

        // keep only visible columns
        const exportData = tableData.map(row => {
            const newRow = {};

            filteredColumns.forEach(col => {
                newRow[col.header] = row[col.accessor];
            });

            return newRow;
        });

        const worksheet = XLSX.utils.json_to_sheet(exportData);

        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "Redemption Data"
        );

        const excelBuffer = XLSX.write(workbook, {
            bookType: "xlsx",
            type: "array"
        });

        const data = new Blob(
            [excelBuffer],
            { type: "application/octet-stream" }
        );

        saveAs(
            data,
            `Redemption_Data_${redemptionMonthLabel}.xlsx`
        );
    };

    return (

        <div className="min-h-full space-y-4 font-sans text-gray-800 dark:text-gray-100">

            <div>
                <h1 className="text-xl font-bold">Redemption List</h1>
                <p className="text-xs text-gray-500 mt-1 mb-6">Redemption List</p>
            </div>

            <SectionCard>

                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">

                    <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                        Redemption Data {redemptionMonthLabel && `- ${redemptionMonthLabel}`}
                    </h2>

                    <div className="flex items-center gap-2">

                        <button
                            onClick={handleExport}
                            className="
                            text-xs
                            border border-gray-300 dark:border-gray-600
                            px-3 py-1.5
                            rounded-md
                            bg-white dark:bg-[#1a1a2e]
                            text-gray-700 dark:text-gray-200
                            hover:bg-gray-100 dark:hover:bg-gray-700
                            transition-colors
                            "
                        >
                            Export
                        </button>

                        <div className="relative" ref={dropdownRef}>

                            <button
                                onClick={() => setIsColumnMenuOpen(prev => !prev)}
                                className="text-xs border border-gray-300 dark:border-gray-600 px-3 py-1.5 rounded-md bg-white dark:bg-[#1a1a2e] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                Columns
                            </button>

                            {isColumnMenuOpen && (

                                <div className="absolute right-0 mt-2 w-60 max-h-72 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] shadow-lg p-3 z-20">

                                    {allColumns.map(col => (

                                        <label
                                            key={col.accessor}
                                            className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-200 py-1 px-1 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                        >

                                            <input
                                                type="checkbox"
                                                checked={visibleColumns.includes(col.accessor)}
                                                onChange={() => toggleColumn(col.accessor)}
                                                className="cursor-pointer accent-violet-500 dark:accent-violet-400"
                                            />

                                            {col.header}

                                        </label>

                                    ))}

                                </div>

                            )}

                        </div>
                    </div>


                </div>

                <div className="overflow-x-auto">

                    <DetailedTable
                        columns={filteredColumns}
                        data={tableData}
                    />

                </div>

                {/* Pagination */}

                <div className="flex items-center justify-between mt-4 flex-wrap gap-3">

                    <div className="text-xs text-gray-600 dark:text-gray-400">
                        Showing {startEntry} to {endEntry} of {totalEntries} entries
                    </div>

                    <div className="flex items-center gap-2">

                        <button
                            disabled={page === 1}
                            onClick={() => setPage(prev => prev - 1)}
                            className="px-3 py-1 text-xs border rounded bg-white dark:bg-[#1a1a2e] border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40"
                        >
                            Prev
                        </button>

                        <span className="text-xs text-gray-700 dark:text-gray-300">
                            Page {page} of {totalPages || 1}
                        </span>

                        <button
                            disabled={page >= totalPages}
                            onClick={() => setPage(prev => prev + 1)}
                            className="px-3 py-1 text-xs border rounded bg-white dark:bg-[#1a1a2e] border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40"
                        >
                            Next
                        </button>

                    </div>

                </div>

            </SectionCard>

        </div>
    );
}

const SectionCard = ({ children, className = '' }) => (
    <div
        className={`bg-white dark:bg-[#1a1a2e] rounded-xl shadow-sm dark:shadow-none border border-gray-100 dark:border-gray-800 px-5 py-3 ${className}`}
    >
        {children}
    </div>
);