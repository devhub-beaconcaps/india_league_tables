'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

// ─── Types ───────────────────────────────────────────────────────────────────

interface NotificationSettings {
    emailNotifications: boolean;
    pushNotifications: boolean;
    weeklyDigest: boolean;
    marketAlerts: boolean;
    redemptionAlerts: boolean;
    creditRatingChanges: boolean;
}

interface SecuritySettings {
    twoFactorAuth: boolean;
    loginNotifications: boolean;
    sessionTimeout: string;
}

interface PreferenceSettings {
    language: string;
    timezone: string;
    dateFormat: string;
    currency: string;
}

interface SettingsFormData {
    notifications: NotificationSettings;
    security: SecuritySettings;
    preferences: PreferenceSettings;
}

// ─── Skeleton Components ─────────────────────────────────────────────────────

function SettingsSkeleton() {
    return (
        <div className="space-y-8">
            {[...Array(3)].map((_, sectionIdx) => (
                <div key={sectionIdx} className="space-y-4">
                    <Skeleton height={20} width={180} />
                    <div className="bg-white dark:bg-[#1a1a2e] rounded-xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
                        {[...Array(4)].map((_, itemIdx) => (
                            <div key={itemIdx} className="flex items-center justify-between">
                                <div className="space-y-1.5">
                                    <Skeleton height={14} width={140} />
                                    <Skeleton height={12} width={200} />
                                </div>
                                <Skeleton height={24} width={44} borderRadius="9999px" />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
            <div className="flex items-center gap-3 pt-4">
                <Skeleton height={36} width={100} borderRadius="9999px" />
                <Skeleton height={36} width={100} borderRadius="9999px" />
            </div>
        </div>
    );
}

// ─── Toggle Switch Component ─────────────────────────────────────────────────

interface ToggleSwitchProps {
    enabled: boolean;
    onChange: () => void;
    label?: string;
}

const ToggleSwitch = ({ enabled, onChange, label }: ToggleSwitchProps) => (
    <button
        type="button"
        onClick={onChange}
        className={`
            relative inline-flex h-6 w-11 items-center rounded-full
            transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#423CAB]/50 focus:ring-offset-2 dark:focus:ring-offset-[#1a1a2e]
            ${enabled 
                ? 'bg-gradient-to-r from-[#423CAB] to-[#653FD8]' 
                : 'bg-gray-200 dark:bg-gray-700'
            }
        `}
        aria-label={label || 'Toggle setting'}
    >
        <span
            className={`
                inline-block h-4 w-4 transform rounded-full bg-white shadow-sm
                transition-transform duration-200
                ${enabled ? 'translate-x-6' : 'translate-x-1'}
            `}
        />
    </button>
);

// ─── Select Dropdown Component ───────────────────────────────────────────────

interface SelectOption {
    value: string;
    label: string;
}

interface SelectFieldProps {
    label: string;
    value: string;
    options: SelectOption[];
    onChange: (value: string) => void;
}

const SelectField = ({ label, value, options, onChange }: SelectFieldProps) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {label}
        </label>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="
                w-full h-11 px-4 rounded-lg border text-sm
                bg-white dark:bg-[#1a1a2e]
                text-gray-800 dark:text-gray-100
                border-gray-200 dark:border-gray-700
                hover:border-gray-300 dark:hover:border-gray-600
                focus:outline-none focus:ring-2 focus:ring-[#423CAB]/50 focus:border-[#423CAB]
                transition-all duration-200
                cursor-pointer
                appearance-none
                bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')]
                bg-[length:1.25rem_1.25rem]
                bg-[right_0.75rem_center]
                bg-no-repeat
                pr-10
            "
        >
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    </div>
);

// ─── Setting Item Component ──────────────────────────────────────────────────

interface SettingItemProps {
    title: string;
    description: string;
    children: React.ReactNode;
    isLast?: boolean;
}

const SettingItem = ({ title, description, children, isLast = false }: SettingItemProps) => (
    <div className={`flex items-center justify-between py-4 ${!isLast ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}>
        <div className="flex-1 pr-4">
            <h3 className="text-sm font-medium text-gray-800 dark:text-gray-100">
                {title}
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                {description}
            </p>
        </div>
        <div className="flex-shrink-0">
            {children}
        </div>
    </div>
);

// ─── Section Card Component ──────────────────────────────────────────────────

interface SectionCardProps {
    title: string;
    description?: string;
    children: React.ReactNode;
}

const SectionCard = ({ title, description, children }: SectionCardProps) => (
    <div className="bg-white dark:bg-[#1a1a2e] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                {title}
            </h2>
            {description && (
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                    {description}
                </p>
            )}
        </div>
        <div className="px-6">
            {children}
        </div>
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SettingsPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [settings, setSettings] = useState<SettingsFormData>({
        notifications: {
            emailNotifications: true,
            pushNotifications: false,
            weeklyDigest: true,
            marketAlerts: true,
            redemptionAlerts: false,
            creditRatingChanges: true,
        },
        security: {
            twoFactorAuth: false,
            loginNotifications: true,
            sessionTimeout: '30',
        },
        preferences: {
            language: 'en',
            timezone: 'IST',
            dateFormat: 'DD/MM/YYYY',
            currency: 'INR',
        },
    });

    const toggleNotification = useCallback((key: keyof NotificationSettings) => {
        setSettings(prev => ({
            ...prev,
            notifications: {
                ...prev.notifications,
                [key]: !prev.notifications[key],
            },
        }));
    }, []);

    const toggleSecurity = useCallback((key: keyof SecuritySettings) => {
        if (key === 'sessionTimeout') return;
        setSettings(prev => ({
            ...prev,
            security: {
                ...prev.security,
                [key]: !prev.security[key],
            },
        }));
    }, []);

    const updatePreference = useCallback((key: keyof PreferenceSettings, value: string) => {
        setSettings(prev => ({
            ...prev,
            preferences: {
                ...prev.preferences,
                [key]: value,
            },
        }));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            console.log('Settings saved:', settings);
        } catch (error) {
            console.error('Failed to save settings:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        router.back();
    };

    const notificationItems: { key: keyof NotificationSettings; title: string; description: string }[] = [
        { key: 'emailNotifications', title: 'Email Notifications', description: 'Receive updates and alerts via email' },
        { key: 'pushNotifications', title: 'Push Notifications', description: 'Get real-time push notifications in browser' },
        { key: 'weeklyDigest', title: 'Weekly Digest', description: 'Receive a weekly summary of market activity' },
        { key: 'marketAlerts', title: 'Market Alerts', description: 'Get notified about significant market movements' },
        { key: 'redemptionAlerts', title: 'Redemption Alerts', description: 'Alerts when bonds are approaching redemption' },
        { key: 'creditRatingChanges', title: 'Credit Rating Changes', description: 'Notifications for any credit rating updates' },
    ];

    const sessionTimeoutOptions: SelectOption[] = [
        { value: '15', label: '15 minutes' },
        { value: '30', label: '30 minutes' },
        { value: '60', label: '1 hour' },
        { value: '120', label: '2 hours' },
        { value: '240', label: '4 hours' },
    ];

    const languageOptions: SelectOption[] = [
        { value: 'en', label: 'English' },
        { value: 'hi', label: 'Hindi' },
        { value: 'mr', label: 'Marathi' },
        { value: 'gu', label: 'Gujarati' },
    ];

    const timezoneOptions: SelectOption[] = [
        { value: 'IST', label: 'India Standard Time (IST)' },
        { value: 'UTC', label: 'Universal Time (UTC)' },
        { value: 'EST', label: 'Eastern Standard Time (EST)' },
        { value: 'GMT', label: 'Greenwich Mean Time (GMT)' },
    ];

    const dateFormatOptions: SelectOption[] = [
        { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
        { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
        { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
    ];

    const currencyOptions: SelectOption[] = [
        { value: 'INR', label: 'Indian Rupee (₹)' },
        { value: 'USD', label: 'US Dollar ($)' },
        { value: 'EUR', label: 'Euro (€)' },
        { value: 'GBP', label: 'British Pound (£)' },
    ];

    return (
        <SkeletonTheme enableAnimation={true} baseColor="#1F2937" highlightColor="#90969bff" borderRadius="0.5rem">
            <div className="min-h-full space-y-4 font-sans text-gray-800 dark:text-gray-100">

                {/* ── Page Title ── */}
                <div>
                    <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                        Settings
                    </h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 mt-1">
                        Manage your notification preferences, security settings, and application preferences.
                    </p>
                </div>

                {isLoading ? (
                    <SettingsSkeleton />
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* ── Notifications Section ── */}
                        <SectionCard 
                            title="Notifications" 
                            description="Control how and when you receive updates from the platform"
                        >
                            {notificationItems.map((item, index) => (
                                <SettingItem
                                    key={item.key}
                                    title={item.title}
                                    description={item.description}
                                    isLast={index === notificationItems.length - 1}
                                >
                                    <ToggleSwitch
                                        enabled={settings.notifications[item.key]}
                                        onChange={() => toggleNotification(item.key)}
                                        label={item.title}
                                    />
                                </SettingItem>
                            ))}
                        </SectionCard>

                        {/* ── Security Section ── */}
                        <SectionCard 
                            title="Security" 
                            description="Protect your account with advanced security features"
                        >
                            <SettingItem
                                title="Two-Factor Authentication"
                                description="Add an extra layer of security to your account"
                            >
                                <ToggleSwitch
                                    enabled={settings.security.twoFactorAuth}
                                    onChange={() => toggleSecurity('twoFactorAuth')}
                                    label="Two-Factor Authentication"
                                />
                            </SettingItem>

                            <SettingItem
                                title="Login Notifications"
                                description="Get notified when someone logs into your account"
                                isLast={!settings.security.twoFactorAuth}
                            >
                                <ToggleSwitch
                                    enabled={settings.security.loginNotifications}
                                    onChange={() => toggleSecurity('loginNotifications')}
                                    label="Login Notifications"
                                />
                            </SettingItem>

                            {settings.security.twoFactorAuth && (
                                <div className="py-4">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <svg 
                                                className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" 
                                                fill="none" 
                                                stroke="currentColor" 
                                                viewBox="0 0 24 24"
                                            >
                                                <path 
                                                    strokeLinecap="round" 
                                                    strokeLinejoin="round" 
                                                    strokeWidth={2} 
                                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                                                />
                                            </svg>
                                            <div>
                                                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                                                    Two-Factor Authentication Enabled
                                                </h4>
                                                <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-1">
                                                    You will be prompted to enter a verification code sent to your registered mobile number during login.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="py-4 border-t border-gray-100 dark:border-gray-800">
                                <SelectField
                                    label="Session Timeout"
                                    value={settings.security.sessionTimeout}
                                    options={sessionTimeoutOptions}
                                    onChange={(value) => setSettings(prev => ({
                                        ...prev,
                                        security: { ...prev.security, sessionTimeout: value }
                                    }))}
                                />
                            </div>
                        </SectionCard>

                        {/* ── Preferences Section ── */}
                        <SectionCard 
                            title="Preferences" 
                            description="Customize your application experience"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                                <SelectField
                                    label="Language"
                                    value={settings.preferences.language}
                                    options={languageOptions}
                                    onChange={(value) => updatePreference('language', value)}
                                />
                                <SelectField
                                    label="Timezone"
                                    value={settings.preferences.timezone}
                                    options={timezoneOptions}
                                    onChange={(value) => updatePreference('timezone', value)}
                                />
                                <SelectField
                                    label="Date Format"
                                    value={settings.preferences.dateFormat}
                                    options={dateFormatOptions}
                                    onChange={(value) => updatePreference('dateFormat', value)}
                                />
                                <SelectField
                                    label="Default Currency"
                                    value={settings.preferences.currency}
                                    options={currencyOptions}
                                    onChange={(value) => updatePreference('currency', value)}
                                />
                            </div>
                        </SectionCard>

                        {/* ── Danger Zone ── */}
                        <SectionCard 
                            title="Danger Zone" 
                            description="Irreversible actions for your account"
                        >
                            <div className="py-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-800 dark:text-gray-100">
                                            Export Account Data
                                        </h3>
                                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                            Download all your data including reports and preferences
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        className="
                                            flex items-center justify-center gap-2
                                            bg-white dark:bg-[#1a1a2e]
                                            border border-gray-300 dark:border-gray-600
                                            hover:bg-gray-50 dark:hover:bg-gray-800
                                            text-gray-700 dark:text-gray-300
                                            rounded-lg px-4 h-9
                                            text-xs font-medium
                                            transition-all duration-200
                                            cursor-pointer
                                        "
                                    >
                                        <svg 
                                            className="w-4 h-4" 
                                            fill="none" 
                                            stroke="currentColor" 
                                            viewBox="0 0 24 24"
                                        >
                                            <path 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round" 
                                                strokeWidth={2} 
                                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" 
                                            />
                                        </svg>
                                        Export
                                    </button>
                                </div>

                                <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-sm font-medium text-red-600 dark:text-red-400">
                                                Delete Account
                                            </h3>
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                                Permanently delete your account and all associated data
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            className="
                                                flex items-center justify-center gap-2
                                                bg-red-50 dark:bg-red-900/20
                                                border border-red-200 dark:border-red-800
                                                hover:bg-red-100 dark:hover:bg-red-900/30
                                                text-red-600 dark:text-red-400
                                                rounded-lg px-4 h-9
                                                text-xs font-medium
                                                transition-all duration-200
                                                cursor-pointer
                                            "
                                        >
                                            <svg 
                                                className="w-4 h-4" 
                                                fill="none" 
                                                stroke="currentColor" 
                                                viewBox="0 0 24 24"
                                            >
                                                <path 
                                                    strokeLinecap="round" 
                                                    strokeLinejoin="round" 
                                                    strokeWidth={2} 
                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                                                />
                                            </svg>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </SectionCard>

                        {/* ── Action Buttons ── */}
                        <div className="flex items-center gap-3 pt-2 pb-8">
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
                                    'Save Changes'
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
        </SkeletonTheme>
    );
}