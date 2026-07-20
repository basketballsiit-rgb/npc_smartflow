import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';

const JobLevelBadge = ({ level }) => {
    const colors = {
        1: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
        2: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
        3: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    };
    if (!level) return null;
    return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors[level] ?? 'bg-gray-100 text-gray-600'}`}>
            ระดับ {level}
        </span>
    );
};

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const user = usePage().props.auth.user;
    const allPositions = user.all_positions ?? [];

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
        });

    const submit = (e) => {
        e.preventDefault();
        patch(route('profile.update'));
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    ข้อมูลส่วนตัว
                </h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    ข้อมูลตำแหน่งซิงค์อัตโนมัติจากระบบ npcjob ทุกครั้งที่ Login ด้วย SSO
                </p>
            </header>

            {/* ── ตำแหน่งและฝ่ายทั้งหมด (จาก npcjob) ── */}
            {allPositions.length > 0 ? (
                <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                            ตำแหน่งและฝ่ายในระบบ ({allPositions.length} ตำแหน่ง)
                        </span>
                    </div>

                    <div className="space-y-2">
                        {allPositions.map((pos, i) => (
                            <div
                                key={i}
                                className={`flex items-start justify-between gap-3 rounded-lg px-4 py-3 border
                                    ${pos.is_primary
                                        ? 'bg-white dark:bg-gray-800 border-blue-300 dark:border-blue-700 shadow-sm'
                                        : 'bg-white/60 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700'
                                    }`}
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                                            {pos.position}
                                        </p>
                                        {pos.is_primary && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500 text-white">
                                                หลัก
                                            </span>
                                        )}
                                        <JobLevelBadge level={pos.job_level} />
                                    </div>
                                    {pos.department_name && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                            📂 {pos.department_name}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : user.position || user.department_name ? (
                /* Fallback: แสดง position/department เดี่ยว */
                <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                            ข้อมูลบุคลากร
                        </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {user.department_name && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg px-4 py-3 border border-blue-100 dark:border-blue-900">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">ฝ่าย / งาน</p>
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{user.department_name}</p>
                            </div>
                        )}
                        {user.position && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg px-4 py-3 border border-blue-100 dark:border-blue-900">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">ตำแหน่ง</p>
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{user.position}</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : null}

            {/* ── Form แก้ไขข้อมูลทั่วไป ── */}
            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <InputLabel htmlFor="name" value="ชื่อ-นามสกุล" />
                    <TextInput
                        id="name"
                        className="mt-1 block w-full"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        isFocused
                        autoComplete="name"
                    />
                    <InputError className="mt-2" message={errors.name} />
                </div>

                <div>
                    <InputLabel htmlFor="email" value="อีเมล" />
                    <TextInput
                        id="email"
                        type="email"
                        className="mt-1 block w-full"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                    />
                    <InputError className="mt-2" message={errors.email} />
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <p className="mt-2 text-sm text-gray-800 dark:text-gray-200">
                            อีเมลยังไม่ได้รับการยืนยัน
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="ml-2 rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:text-gray-400 dark:hover:text-gray-100 dark:focus:ring-offset-gray-800"
                            >
                                คลิกเพื่อส่งลิงก์ยืนยันอีกครั้ง
                            </Link>
                        </p>
                        {status === 'verification-link-sent' && (
                            <div className="mt-2 text-sm font-medium text-green-600 dark:text-green-400">
                                ส่งลิงก์ยืนยันใหม่แล้ว
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>บันทึก</PrimaryButton>
                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600 dark:text-gray-400">บันทึกแล้ว</p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
