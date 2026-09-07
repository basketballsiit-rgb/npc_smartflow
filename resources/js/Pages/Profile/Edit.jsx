import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ 
    mustVerifyEmail, 
    status,
    divisions = [],
    subDepartments = [],
    availableMajors = [],
    availableDuties = [],
    initialPositions = [],
}) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-bold leading-tight text-purple-950">
                    👤 ข้อมูลส่วนตัวและภาระงานหน้าที่ (Profile & Duties)
                </h2>
            }
        >
            <Head title="ข้อมูลส่วนตัวและภาระงาน - NPC SmartFlow" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    <div className="bg-white p-6 shadow-sm border border-purple-100 sm:rounded-2xl dark:bg-gray-800">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            divisions={divisions}
                            subDepartments={subDepartments}
                            availableMajors={availableMajors}
                            availableDuties={availableDuties}
                            initialPositions={initialPositions}
                        />
                    </div>

                    <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8 dark:bg-gray-800">
                        <UpdatePasswordForm className="max-w-xl" />
                    </div>

                    <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8 dark:bg-gray-800">
                        <DeleteUserForm className="max-w-xl" />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
