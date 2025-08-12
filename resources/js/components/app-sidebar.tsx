import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { 
    LayoutGrid, 
    Users, 
    CreditCard, 
    BanknoteIcon, 
    FileText, 
    BarChart3, 
    Settings, 
    Calculator,
    UserCheck,
    AlertTriangle
} from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Borrowers',
        href: '/borrowers',
        icon: Users,
    },
    {
        title: 'Loans',
        href: '/loans',
        icon: CreditCard,
    },
    {
        title: 'Payments',
        href: '/payments',
        icon: BanknoteIcon,
    },
    {
        title: 'Applications',
        href: '/applications',
        icon: FileText,
    },
    {
        title: 'Reports',
        href: '/reports',
        icon: BarChart3,
    },
    {
        title: 'Collections',
        href: '/collections',
        icon: AlertTriangle,
    },
    {
        title: 'Calculator',
        href: '/calculator',
        icon: Calculator,
    },
    {
        title: 'KYC Verification',
        href: '/kyc',
        icon: UserCheck,
    },
];

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
