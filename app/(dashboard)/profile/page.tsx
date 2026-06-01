'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProfileFormData {
    name: string;
    email: string;
    companyName: string;
    designation: string;
    mobileNumber: string;
}

interface FormErrors {
    name?: string;
    email?: string;
    companyName?: string;
    designation?: string;
    mobileNumber?: string;
}

// ─── Skeleton Components ─────────────────────────────────────────────────────

function ProfileSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton height={14} width={80} />
                        <Skeleton height={44} borderRadius="0.5rem" />
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(2)].map((_, i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton height={14} width={80} />
                        <Skeleton height={44} borderRadius="0.5rem" />
                    </div>
                ))}
            </div>
            <div className="flex items-center gap-3 pt-4">
                <Skeleton height={36} width={100} borderRadius="9999px" />
                <Skeleton height={36} width={100} borderRadius="9999px" />
            </div>
        </div>
    );
}

// ─── Form Input Component ────────────────────────────────────────────────────

interface FormInputProps {
    label: string;
    name: string;
    type?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    error?: string;
    required?: boolean;
    placeholder?: string;
}

const FormInput = ({
    label,
    name,
    type = 'text',
    value,
    onChange,
    error,
    required = false,
    placeholder,
}: FormInputProps) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={`
                w-full h-11 px-4 rounded-lg border text-sm
                bg-white dark:bg-[#1a1a2e]
                text-gray-800 dark:text-gray-100
                placeholder:text-gray-400 dark:placeholder:text-gray-500
                focus:outline-none focus:ring-2 focus:ring-[#423CAB]/50 focus:border-[#423CAB]
                transition-all duration-200
                ${error
                    ? 'border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }
            `}
        />
        {error && (
            <span className="text-[11px] text-red-500 dark:text-red-400">{error}</span>
        )}
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProfilePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});

    const [formData, setFormData] = useState<ProfileFormData>({
        name: 'Gauri',
        email: 'cvcvc@dsff.gmail.com',
        companyName: '9999999999',
        designation: 'lxfbn',
        mobileNumber: '43545657676',
    });

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user starts typing
        if (errors[name as keyof FormErrors]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    }, [errors]);

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!formData.companyName.trim()) {
            newErrors.companyName = 'Company name is required';
        }

        if (!formData.designation.trim()) {
            newErrors.designation = 'Designation is required';
        }

        if (!formData.mobileNumber.trim()) {
            newErrors.mobileNumber = 'Mobile number is required';
        } else if (!/^\d{10,15}$/.test(formData.mobileNumber.replace(/\s/g, ''))) {
            newErrors.mobileNumber = 'Please enter a valid mobile number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSaving(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            console.log('Profile updated:', formData);
            // Show success toast or notification here
        } catch (error) {
            console.error('Failed to update profile:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        router.back();
    };

    return (
        <SkeletonTheme enableAnimation={true} baseColor="#1F2937" highlightColor="#90969bff" borderRadius="0.5rem">
            <div className="min-h-full space-y-4 font-sans text-gray-800 dark:text-gray-100">

                {/* ── Page Title ── */}
                <div>
                    <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                        Profile Information
                    </h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 mt-1">
                        Update your account&apos;s profile information and email address.
                    </p>
                </div>

                {/* ── Profile Form Card ── */}
                <div className="bg-white dark:bg-[#1a1a2e] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 px-6 py-6">
                    {isLoading ? (
                        <ProfileSkeleton />
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Row 1: Name, Email, Company Name */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <FormInput
                                    label="Name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    error={errors.name}
                                    required
                                    placeholder="Enter your name"
                                />
                                <FormInput
                                    label="Email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    error={errors.email}
                                    required
                                    placeholder="Enter your email"
                                />
                                <FormInput
                                    label="Company Name"
                                    name="companyName"
                                    value={formData.companyName}
                                    onChange={handleChange}
                                    error={errors.companyName}
                                    required
                                    placeholder="Enter company name"
                                />
                            </div>

                            {/* Row 2: Designation, Mobile Number */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormInput
                                    label="Designation"
                                    name="designation"
                                    value={formData.designation}
                                    onChange={handleChange}
                                    error={errors.designation}
                                    required
                                    placeholder="Enter your designation"
                                />
                                <FormInput
                                    label="Mobile Number"
                                    name="mobileNumber"
                                    type="tel"
                                    value={formData.mobileNumber}
                                    onChange={handleChange}
                                    error={errors.mobileNumber}
                                    required
                                    placeholder="Enter mobile number"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="
                                        flex items-center justify-center gap-2
                                        bg-gradient-to-r from-[#423CAB] to-[#653FD8]
                                        hover:from-[#3a3599] hover:to-[#5a37c4]
                                        text-white rounded-full px-6 h-9
                                        text-xs font-medium
                                        transition-all duration-200
                                        disabled:opacity-60 disabled:cursor-not-allowed
                                        cursor-pointer
                                        shadow-sm hover:shadow-md
                                    "
                                >
                                    {isSaving ? (
                                        <>
                                            <svg
                                                className="animate-spin h-3.5 w-3.5"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                />
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                />
                                            </svg>
                                            Saving...
                                        </>
                                    ) : (
                                        'Save'
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="
                                        flex items-center justify-center
                                        bg-gray-100 dark:bg-gray-800
                                        hover:bg-gray-200 dark:hover:bg-gray-700
                                        text-gray-600 dark:text-gray-300
                                        rounded-full px-6 h-9
                                        text-xs font-medium
                                        transition-all duration-200
                                        cursor-pointer
                                        border border-gray-200 dark:border-gray-700
                                    "
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </SkeletonTheme>
    );
}