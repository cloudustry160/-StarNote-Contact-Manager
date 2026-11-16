// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { ContactsProvider } from './hooks/useContacts';
import { ToastProvider } from './components/toast';
import { STORAGE_KEY } from './storage/store';

function renderApp(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <ToastProvider>
        <ContactsProvider>
          <App />
        </ContactsProvider>
      </ToastProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe('页面冒烟测试', () => {
  it('首屏渲染示例联系人', () => {
    renderApp();
    expect(screen.getByText('张明远')).toBeTruthy();
    expect(screen.getByRole('tab', { name: /全部/ })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /收藏/ })).toBeTruthy();
  });

  it('点星标切换收藏并落到本地存储', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole('button', { name: '收藏 王浩然' }));
    expect(screen.getByRole('button', { name: '取消收藏 王浩然' })).toBeTruthy();

    await waitFor(
      () => {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{"contacts":[]}');
        const wang = stored.contacts.find((c: { name: string }) => c.name === '王浩然');
        expect(wang?.favorite).toBe(true);
      },
      { timeout: 3000 },
    );
  });

  it('搜索实时过滤', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.type(screen.getByLabelText('搜索联系人'), '张');
    expect(screen.getByText('张明远')).toBeTruthy();
    expect(screen.queryByText('李思嘉')).toBeNull();
  });

  it('新增页校验姓名必填', async () => {
    const user = userEvent.setup();
    renderApp('/contacts/new');
    expect(screen.getByRole('heading', { name: '新增联系人' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(screen.getByText('请填写姓名')).toBeTruthy();
  });
});
