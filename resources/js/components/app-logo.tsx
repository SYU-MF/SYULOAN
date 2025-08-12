export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-white overflow-hidden">
                <img 
                    src="/img/logo.jpg" 
                    alt="SYU MICRO FINANCE Logo" 
                    className="size-full object-cover rounded-md"
                />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">SYU MICRO FINANCE</span>
                <span className="truncate text-xs text-muted-foreground">Microfinance Solutions</span>
            </div>
        </>
    );
}
