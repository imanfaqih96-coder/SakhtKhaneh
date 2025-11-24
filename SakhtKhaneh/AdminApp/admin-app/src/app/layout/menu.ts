export interface MenuItem {
  title: string;
  icon: string;
  route?: string;          // اگر لینک مستقیم است
  open?: boolean;          // برای باز/بسته کردن accordion
  children?: MenuItem[];   // اگر ساب منو دارد
}

export const MENU_ITEMS: MenuItem[] = [
  {
    title: 'داشبورد',
    icon: 'fa fa-home',
    route: '/dashboard'
  },
  {
    title: 'مدیریت کاربران',
    icon: 'fa fa-users',
    open: false,
    children: [
      { icon: 'fa fa-list', title: 'لیست کاربران', route: '/users/list' },
      { icon: 'fa fa-user-plus', title: 'کاربر جدید', route: '/users/create' }
    ]
  },
  {
    title: 'تنظیمات سیستم',
    icon: 'fa fa-wrench',
    open: false,
    children: [
      { icon: 'fa fa-user-role', title: 'مدیریت نقش‌ها', route: '/roles/list' },
      { icon: 'fa fa-user-role-plus', title: 'نقش جدید', route: '/roles/create' }
    ]
  }
];
