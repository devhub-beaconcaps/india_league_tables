'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useThemeStore } from '@/lib/store';

export default function SettingsPage() {
    const { user, isLoaded } = useUser();
    const { theme, setTheme } = useThemeStore();

    const [saving, setSaving] = useState(false);

    const [firstName, setFirstName] = useState(
        user?.firstName || ''
    );

    const [lastName, setLastName] = useState(
        user?.lastName || ''
    );

    const [notifications, setNotifications] = useState(
        Boolean(
            user?.unsafeMetadata?.emailNotifications
        )
    );

    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                Loading settings...
            </div>
        );
    }

    const saveAccount = async () => {
        try {
            setSaving(true);

            await user?.update({
                firstName,
                lastName,
            });

            alert('Profile updated');
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const saveNotifications = async () => {
        try {
            setSaving(true);

            await user?.update({
                unsafeMetadata: {
                    emailNotifications: notifications,
                },
            });

            alert('Notification preferences saved');
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Settings
                </h1>

                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Manage your account preferences.
                </p>
            </div>

            {/* Account */}
            <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold mb-5 text-gray-900 dark:text-white">
                    Account Settings
                </h2>

                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm text-gray-700 dark:text-gray-300">
                            First Name
                        </label>

                        <input
                            value={firstName}
                            onChange={(e) =>
                                setFirstName(e.target.value)
                            }
                            className="w-full mt-2 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#653FD8] dark:focus:ring-[#8b7cf7]"
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-700 dark:text-gray-300">
                            Last Name
                        </label>

                        <input
                            value={lastName}
                            onChange={(e) =>
                                setLastName(e.target.value)
                            }
                            className="w-full mt-2 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#653FD8] dark:focus:ring-[#8b7cf7]"
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-700 dark:text-gray-300">
                            Email
                        </label>

                        <input
                            disabled
                            value={
                                user?.primaryEmailAddress
                                    ?.emailAddress || ''
                            }
                            className="w-full mt-2 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-400 cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-700 dark:text-gray-300">
                            User ID
                        </label>

                        <input
                            disabled
                            value={user?.id || ''}
                            className="w-full mt-2 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-400 cursor-not-allowed"
                        />
                    </div>
                </div>

                <button
                    onClick={saveAccount}
                    disabled={saving}
                    className="mt-6 px-5 py-3 rounded-xl bg-[#653FD8] hover:bg-[#5a35c7] dark:bg-[#8b7cf7] dark:hover:bg-[#a89cff] text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Save Changes
                </button>
            </div>

            {/* Appearance */}
            <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold mb-5 text-gray-900 dark:text-white">
                    Appearance
                </h2>

                <div className="flex gap-4">
                    <button
                        onClick={() => setTheme('light')}
                        className={`px-5 py-3 rounded-xl border transition-colors ${
                            theme === 'light'
                                ? 'border-[#653FD8] bg-purple-50 dark:bg-purple-900/20 text-gray-900 dark:text-white'
                                : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                    >
                        Light
                    </button>

                    <button
                        onClick={() => setTheme('dark')}
                        className={`px-5 py-3 rounded-xl border transition-colors ${
                            theme === 'dark'
                                ? 'border-[#653FD8] bg-purple-50 dark:bg-purple-900/20 text-gray-900 dark:text-white'
                                : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                    >
                        Dark
                    </button>
                </div>
            </div>

            {/* Notifications */}
            <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold mb-5 text-gray-900 dark:text-white">
                    Notifications
                </h2>

                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={notifications}
                        onChange={(e) =>
                            setNotifications(
                                e.target.checked
                            )
                        }
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f0f1a] text-[#653FD8] dark:text-[#8b7cf7] focus:ring-2 focus:ring-[#653FD8] dark:focus:ring-[#8b7cf7]"
                    />

                    <span className="text-gray-700 dark:text-gray-300">
                        Receive email notifications
                    </span>
                </label>

                <button
                    onClick={saveNotifications}
                    className="mt-6 px-5 py-3 rounded-xl bg-[#653FD8] hover:bg-[#5a35c7] dark:bg-[#8b7cf7] dark:hover:bg-[#a89cff] text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Save Preferences
                </button>
            </div>

            {/* Security */}
            <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold mb-5 text-gray-900 dark:text-white">
                    Security
                </h2>

                <div className="space-y-4">
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                            Two Factor Authentication
                        </p>

                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {user?.twoFactorEnabled
                                ? 'Enabled'
                                : 'Disabled'}
                        </p>
                    </div>

                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                            Last Sign In
                        </p>

                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {user?.lastSignInAt
                                ? new Date(
                                      user.lastSignInAt
                                  ).toLocaleString()
                                : '-'}
                        </p>
                    </div>

                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                            Connected Accounts
                        </p>

                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {
                                user?.externalAccounts
                                    ?.length
                            }{' '}
                            account(s) connected
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}