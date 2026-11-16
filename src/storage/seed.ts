import { newId, type Contact } from '../types';

function method(kind: Contact['methods'][number]['kind'], label: string, value: string, primary = false) {
  return { id: newId(), kind, label, value, primary };
}

function now(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString();
}

/** 首次启动写入的演示数据，保证评审第一眼不是空白页。 */
export function seedContacts(): Contact[] {
  return [
    {
      id: newId(),
      name: '张明远',
      company: '福州大学 计算机学院',
      note: '课程助教，问题优先微信联系',
      favorite: true,
      methods: [
        method('phone', '手机', '138 0000 1234', true),
        method('phone', '办公室', '0591-2286 0001'),
        method('email', '邮箱', 'zhangmy@fzu.edu.cn'),
        method('social', '微信', 'zmy_fzu'),
      ],
      createdAt: now(12),
      updatedAt: now(1),
    },
    {
      id: newId(),
      name: '李思嘉',
      company: '梅努斯国际工程学院',
      note: '',
      favorite: true,
      methods: [
        method('phone', '手机', '139 1234 5678', true),
        method('email', '邮箱', 'lisj@example.com'),
        method('address', '宿舍', '福州大学旗山校区 3 号楼 402'),
      ],
      createdAt: now(9),
      updatedAt: now(2),
    },
    {
      id: newId(),
      name: '王浩然',
      company: '福建星网锐捷',
      note: '实习内推联系人',
      favorite: false,
      methods: [
        method('phone', '手机', '137 8888 0000', true),
        method('social', 'QQ', '100200300'),
        method('social', '微博', '@wanghaoran'),
      ],
      createdAt: now(6),
      updatedAt: now(3),
    },
    {
      id: newId(),
      name: '陈雨桐',
      company: '自由职业 · 设计师',
      note: '做海报时找她',
      favorite: false,
      methods: [
        method('phone', '手机', '150 6666 2222', true),
        method('email', '邮箱', 'chenyt.design@gmail.com'),
        method('social', '微信', 'cyt_design'),
      ],
      createdAt: now(3),
      updatedAt: now(1),
    },
    {
      id: newId(),
      name: '林建国',
      company: '',
      note: '修电脑的师傅',
      favorite: false,
      methods: [
        method('phone', '手机', '136 5555 7777', true),
        method('address', '地址', '福州市鼓楼区工业路 12 号'),
      ],
      createdAt: now(1),
      updatedAt: now(0),
    },
  ];
}
