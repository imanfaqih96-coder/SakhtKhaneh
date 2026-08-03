export interface MenuItem {
  title: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
}

export const MENU: MenuItem[] = [
  { title: 'داشبورد', icon: 'dashboard', route: '/dashboard' },
  { title: 'گزارشات', icon: 'monitoring', route: '/reports' },
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
      { title: 'فهرست پروژه ها', icon: 'grid_view', route: '/projects/all' },
      { title: 'دسته‌بندی پروژه‌ها', icon: 'account_tree', route: '/project-categories/all' },
      { title: 'افزودن پروژه جدید', icon: 'add', route: '/projects/new' }
    ]
  },
  {
    title: 'ژورنال‌ها',
    icon: 'auto_stories',
    children: [
      { title: 'فهرست ژورنال‌ها', icon: 'view_module', route: '/journals/all' },
      { title: 'افزودن ژورنال', icon: 'add_photo_alternate', route: '/journals/new' }
    ]
  }, {
    title: 'بلاگ',
    icon: 'article',
    children: [
      { title: 'مدیریت دسته بندی ها', icon: 'dashboard_customize', route: '/blog-categories/all' },
      { title: 'فهرست مطلب ها', icon: 'grid_view', route: '/blog-posts/all' },
      { title: 'افزودن مطلب جدید', icon: 'add', route: '/blog-posts/new' }
    ]
  },
  {
    title: 'مدیریت کاربران',
    icon: 'group',
    children: [
      { title: 'حساب کاربری', icon: 'person', route: '/profile' },
      { title: 'فهرست کاربران', icon: 'grid_view', route: '/users/all' },
      { title: 'افزودن کاربر جدید', icon: 'person_add', route: '/users/new' },
    ]
  }
];
