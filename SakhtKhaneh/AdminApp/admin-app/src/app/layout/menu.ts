export interface MenuItem {
  title: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
}

export const MENU: MenuItem[] = [
  { title: 'داشبورد', icon: 'dashboard', route: '/dashboard' },
  {
    title: 'مدیریت کاربران',
    icon: 'group',
    children: [
      { title: 'لیست کاربران', icon: 'list', route: '/users/list' },
      { title: 'افزودن کاربر', icon: 'person_add', route: '/users/add' }
    ]
  },
  {
    title: 'محصولات',
    icon: 'shopping_cart',
    children: [
      { title: 'لیست محصولات', icon: 'list', route: '/products/list' },
      { title: 'افزودن محصول', icon: 'add_shopping_cart', route: '/products/add' }
    ]
  }
];
