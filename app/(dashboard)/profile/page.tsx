'use client';

import { useUser } from '@clerk/nextjs';
import Image from 'next/image';

export default function ProfilePage() {
    const { user, isLoaded } = useUser();

    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                Loading...
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl shadow-sm p-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <Image
                        src={user?.imageUrl || ''}
                        alt="Profile"
                        width={100}
                        height={100}
                        className="rounded-full border"
                    />

                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {user?.fullName}
                        </h1>

                        <p className="text-gray-500 dark:text-gray-400">
                            {user?.primaryEmailAddress?.emailAddress}
                        </p>

                        <p className="text-sm text-gray-400 mt-2">
                            User ID: {user?.id}
                        </p>
                    </div>
                </div>
            </div>

            {/* Profile Details */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl p-6">
                    <h2 className="font-semibold mb-4 text-gray-900 dark:text-white text-lg">
                        Personal Information
                    </h2>

                    <div className="space-y-4">
                        <Info
                            label="First Name"
                            value={user?.firstName || '-'}
                        />

                        <Info
                            label="Last Name"
                            value={user?.lastName || '-'}
                        />

                        <Info
                            label="Username"
                            value={user?.username || '-'}
                        />

                        <Info
                            label="Email"
                            value={
                                user?.primaryEmailAddress?.emailAddress || '-'
                            }
                        />
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl p-6">
                    <h2 className="font-semibold mb-4 text-gray-900 dark:text-white text-lg">
                        Account Information
                    </h2>

                    <div className="space-y-4">
                        <Info
                            label="Created"
                            value={
                                user?.createdAt
                                    ? new Date(
                                          user.createdAt
                                      ).toLocaleDateString()
                                    : '-'
                            }
                        />

                        <Info
                            label="Last Sign In"
                            value={
                                user?.lastSignInAt
                                    ? new Date(
                                          user.lastSignInAt
                                      ).toLocaleString()
                                    : '-'
                            }
                        />

                        <Info
                            label="Two Factor Auth"
                            value={
                                user?.twoFactorEnabled
                                    ? 'Enabled'
                                    : 'Disabled'
                            }
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function Info({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="font-medium text-gray-900 dark:text-white">{value}</p>
        </div>
    );
}