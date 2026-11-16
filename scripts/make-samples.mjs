// 生成 sample/ 下的两个 Excel 文件：导入模板 + 含故意错误行的演示数据
// 用法：node scripts/make-samples.mjs
import * as XLSX from 'xlsx';
import { mkdirSync } from 'node:fs';

const COLUMNS = ['姓名', '公司', '手机', '邮箱', '社交账号', '地址', '收藏', '备注'];

const demo = [
  ['张明远', '福州大学 计算机学院', '138 0000 1234; 办公室:0591-2286 0001', 'zhangmy@fzu.edu.cn', '微信:zmy_fzu', '', '是', '课程助教'],
  ['李思嘉', '梅努斯国际工程学院', '139 1234 5678', 'lisj@example.com', '', '福州大学旗山校区 3 号楼 402', '是', ''],
  ['王浩然', '福建星网锐捷', '137 8888 0000', '', 'QQ:100200300; 微博:@wanghaoran', '', '否', '实习内推联系人'],
  ['陈雨桐', '自由职业 · 设计师', '150 6666 2222', 'chenyt.design@gmail.com', '微信:cyt_design', '', '否', '做海报时找她'],
  ['林建国', '', '136 5555 7777', '', '', '福州市鼓楼区工业路 12 号', '否', '修电脑的师傅'],
  ['黄晓雯', '阿里云', '135 1234 0000; 分机:8021', 'huangxw@example.com', '钉钉:huangxw', '杭州市余杭区文一西路 969 号', '是', ''],
  ['郑一鸣', '福建师范大学', '188 0000 1111', 'zhengyiming@fjnu.edu.cn', '微信:zym_1988', '', '否', ''],
  ['吴思远', '厦门大学', '159 2222 3333', 'wusy@xmu.edu.cn', '', '厦门市思明区思明南路 422 号', '否', ''],
  ['许静怡', '宁德时代', '186 7777 8888', 'xujy@catl.com', '微信:xujy_catl', '宁德市蕉城区漳湾镇', '是', ''],
  ['何俊杰', '兴业银行', '132 6666 5555', 'hejj@cib.com.cn', '', '', '否', ''],
  ['马晓东', '福州软件园', '133 1111 2222', 'maxd@example.com', 'QQ:556677889', '福州市鼓楼区铜盘路 89 号', '否', ''],
  ['刘婉清', '福建医科大学', '180 3333 4444', 'liuwq@fjmu.edu.cn', '微信:liuwq_med', '', '否', ''],
  ['罗子豪', '厦门航空', '189 5555 6666', 'luozh@xiamenair.com', '', '', '否', ''],
  ['谢文博', '紫金矿业', '134 8888 9999', 'xiewb@zjky.cn', '微信:xiewb_zj', '龙岩市上杭县', '否', ''],
  ['唐可欣', '福州一中', '137 9999 0000', 'tangkx@fzyz.edu.cn', '', '', '是', ''],
  ['邓志强', '福建省立医院', '138 1212 1212', 'dengzq@fjsl.com', '', '福州市鼓楼区东街 134 号', '否', ''],
  ['曾雅雯', '兴业证券', '139 3434 3434', 'zengyw@xyzq.com.cn', '微信:zengyw', '', '否', ''],
  ['彭立诚', '中电福富', '136 5656 5656', 'penglc@ffcs.cn', '', '', '否', ''],
  ['苏梦洁', '福州大学 图书馆', '135 7878 7878', 'sumj@fzu.edu.cn', '微信:sumj_lib', '福州市闽侯县学园路 2 号', '否', ''],
  ['范天宇', '福建联通', '158 9090 9090', 'fanty@chinaunicom.cn', '', '', '否', ''],
  ['错误行-手机号', '演示错误数据', 'abc123', '', '', '', '否', '这一行会被识别为手机号格式无效'],
  ['', '演示错误数据', '137 0000 0000', '', '', '', '否', '这一行没有姓名，会被拒绝'],
];

const template = [
  ['示例：张三', '示例公司', '13800000000; 办公室:0591-22860001', 'zhangsan@example.com', '微信:zhangsan_wx', '福建省福州市鼓楼区工业路 12 号', '是', '可删除本行后填写真实数据'],
];

function sheetWith(rows) {
  const sheet = XLSX.utils.aoa_to_sheet([COLUMNS, ...rows]);
  sheet['!cols'] = [
    { wch: 14 },
    { wch: 24 },
    { wch: 32 },
    { wch: 28 },
    { wch: 26 },
    { wch: 34 },
    { wch: 6 },
    { wch: 40 },
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, '联系人');
  return workbook;
}

mkdirSync('sample', { recursive: true });
XLSX.writeFile(sheetWith(demo), 'sample/contacts-demo.xlsx');
XLSX.writeFile(sheetWith(template), 'sample/contacts-template.xlsx');
console.log('生成完成：sample/contacts-demo.xlsx, sample/contacts-template.xlsx');
