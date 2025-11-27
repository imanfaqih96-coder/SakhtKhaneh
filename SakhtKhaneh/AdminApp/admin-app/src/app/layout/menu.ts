export interface MenuItem {
  title: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
}

export const MENU: MenuItem[] = [
  { title: 'داشبورد', icon: 'dashboard', route: '/dashboard' },
  {
    title: 'صفحات',
    icon: 'layers',
    children: [
      { title: 'صفحه اصلی', icon: 'home', route: '/pages/home' },
      { title: 'درباره ما', icon: 'info', route: '/pages/about' },
      { title: 'خدمات', icon: 'home_repair_service', route: '/pages/services' },
      { title: 'تماس با ما', icon: 'phone_enabled', route: '/pages/contacts' }
    ]
  },
  {
    title: 'پروژه ها',
    icon: 'perm_media',
    children: [
      { title: 'فهرست پروژه ها', icon: 'grid_view', route: '/projects/list' },
      { title: 'افزودن پروژه جدید', icon: 'add', route: '/projects/new' }
    ]
  }, {
    title: 'بلاگ',
    icon: 'articles',
    children: [
      { title: 'دسته بندی ها', icon: 'dashboard_customize', route: '/blog/categories' },
      { title: 'فهرست مطلب ها', icon: 'grid_view', route: '/blog/list' },
      { title: 'افزودن مطلب جدید', icon: 'add', route: '/blog/new' }
    ]
  },
  {
    title: 'مدیریت کاربران',
    icon: 'group',
    children: [
      { title: 'حساب کاربری', icon: 'person', route: '/users/profile' },
      { title: 'فهرست کاربران', icon: 'grid_view', route: '/users/list' },
      { title: 'افزودن کاربر جدید', icon: 'person_add', route: '/users/add' }
    ]
  },
  {
    title: 'تنظیمات',
    icon: 'handyman',
    children: [
      { title: 'تنظیمات پنل', icon: 'handyman', route: '/settings' }
    ]
  }
];
