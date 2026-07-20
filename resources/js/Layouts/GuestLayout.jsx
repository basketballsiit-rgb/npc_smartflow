import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen flex-col items-center bg-gradient-to-b from-purple-50 via-violet-50/50 to-slate-50 pt-6 sm:justify-center sm:pt-0">
            <div>
                <Link href="/">
                    <ApplicationLogo className="h-20 w-20 fill-current text-purple-600 drop-shadow-md" />
                </Link>
            </div>

            <div className="mt-6 w-full overflow-hidden bg-white/90 px-8 py-8 shadow-xl shadow-purple-500/10 backdrop-blur-md border border-purple-100 sm:max-w-md sm:rounded-2xl">
                {children}
            </div>
        </div>
    );
}
