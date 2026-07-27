import { usePage } from '@inertiajs/react';

export default function ApplicationLogo(props) {
    const { asset_url } = usePage().props;
    return (
        <img
            {...props}
            src={`${asset_url || '/'}LogoNPC_PNG.png?v=100`}
            alt="ตราสัญลักษณ์ วิทยาลัยสารพัดช่างน่าน"
            className={`object-contain rounded-full ${props.className || 'h-12 w-auto'}`}
        />
    );
}
