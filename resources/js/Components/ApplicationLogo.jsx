export default function ApplicationLogo(props) {
    return (
        <img
            {...props}
            src="/LogoNPC_PNG.png?v=100"
            alt="ตราสัญลักษณ์ วิทยาลัยสารพัดช่างน่าน"
            className={`object-contain rounded-full ${props.className || 'h-12 w-auto'}`}
        />
    );
}
