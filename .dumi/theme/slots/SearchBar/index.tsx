// @ts-nocheck
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useFullSidebarData, useNavData, history } from 'dumi';

/**
 * 轻量级搜索组件 - 支持标题搜索 + 分组搜索
 * 替代 dumi 默认的全文搜索（上千个文件全文索引导致卡顿）
 * 只使用已在客户端的路由元信息，不触发 getFullRoutesMeta 加载全文
 */

interface SearchItem {
  type: 'page' | 'group';
  title: string;
  path: string;
  group?: string;
  childCount?: number;
}

/** 跳转后滚动侧边栏到对应分组位置 */
function scrollSidebarToGroup(groupTitle: string) {
  requestAnimationFrame(() => {
    setTimeout(() => {
      const sidebarEl = document.querySelector('.dumi-default-sidebar') ||
        document.querySelector('[class*="sidebar"]') ||
        document.querySelector('aside');
      if (!sidebarEl) return;

      const allTitles = sidebarEl.querySelectorAll(
        'h2, h3, [class*="group-title"], [class*="GroupTitle"], dt'
      );
      for (const el of allTitles) {
        if (el.textContent?.trim() === groupTitle) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // 高亮闪烁效果
          const originalBg = (el as HTMLElement).style.background;
          (el as HTMLElement).style.background = '#e6f4ff';
          setTimeout(() => {
            (el as HTMLElement).style.background = originalBg;
          }, 1500);
          break;
        }
      }
    }, 300);
  });
}

export default function SearchBar() {
  const [keywords, setKeywords] = useState('');
  const [visible, setVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const sidebar = useFullSidebarData();
  const navData = useNavData();

  // 从 sidebar 数据中提取所有页面标题和分组信息
  const { allItems, allGroups } = useMemo(() => {
    const items: SearchItem[] = [];
    const groupMap = new Map<string, { path: string; childCount: number }>();

    Object.entries(sidebar).forEach(([, groups]) => {
      groups.forEach((group) => {
        const firstChildPath = group.children?.[0]?.link;
        if (group.title && firstChildPath) {
          // 收集分组信息（去重）
          if (!groupMap.has(group.title)) {
            groupMap.set(group.title, {
              path: firstChildPath,
              childCount: group.children?.length || 0,
            });
          } else {
            // 同名分组合并子项数
            const existing = groupMap.get(group.title)!;
            existing.childCount += group.children?.length || 0;
          }
        }
        group.children?.forEach((child) => {
          if (child.title && child.link) {
            items.push({
              type: 'page',
              title: child.title,
              path: child.link,
              group: group.title || '',
            });
          }
        });
      });
    });

    const groups: SearchItem[] = Array.from(groupMap.entries()).map(
      ([title, { path, childCount }]) => ({
        type: 'group' as const,
        title,
        path,
        childCount,
      }),
    );

    return { allItems: items, allGroups: groups };
  }, [sidebar]);

  // 搜索结果：同时匹配分组和标题
  const results = useMemo(() => {
    if (!keywords.trim()) return [];
    const kw = keywords.toLowerCase().trim();

    // 匹配分组（优先展示）
    const groupResults = allGroups
      .filter((g) => g.title.toLowerCase().includes(kw))
      .slice(0, 5);

    // 匹配标题
    const pageResults = allItems
      .filter((item) => item.title.toLowerCase().includes(kw))
      .slice(0, 15);

    return [...groupResults, ...pageResults];
  }, [keywords, allItems, allGroups]);

  // 防抖输入
  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setKeywords(value);
      setActiveIndex(0);
    }, 200);
  }, []);

  // 键盘导航（忽略 IME 组合输入的回车，如中文输入法确认候选词）
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.nativeEvent.isComposing) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && results[activeIndex]) {
        e.preventDefault();
        handleNavigate(results[activeIndex]);
      } else if (e.key === 'Escape') {
        setVisible(false);
        inputRef.current?.blur();
      }
    },
    [results, activeIndex],
  );

  const handleNavigate = useCallback((item: SearchItem) => {
    setVisible(false);
    setKeywords('');
    if (inputRef.current) inputRef.current.value = '';
    history.push(item.path);

    // 如果是分组，跳转后滚动侧边栏到该分组
    if (item.type === 'group') {
      scrollSidebarToGroup(item.title);
    }
  }, []);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 快捷键 Ctrl+K / Command+K 聚焦搜索框
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setVisible(true);
      }
    };
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  return (
    <div ref={wrapperRef} className="dumi-default-search-bar" style={{ position: 'relative' }}>
      <svg style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="6.5" cy="6.5" r="5.5" stroke="#b8b8b8" strokeWidth="1.5" fill="none" />
        <line x1="10.5" y1="10.5" x2="14.5" y2="14.5" stroke="#b8b8b8" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <input
        ref={inputRef}
        className="dumi-default-search-bar-input"
        placeholder="输入关键字搜索..."
        onFocus={() => setVisible(true)}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        style={{
          width: '100%',
          height: 40,
          padding: '8px 12px 8px 40px',
          border: 'none',
          borderLeft: '2px solid #e8e8e8',
          borderRadius: 0,
          outline: 'none',
          fontSize: 14,
          color: '#454d64',
          background: 'transparent',
          boxSizing: 'border-box',
        }}
      />
      {visible && results.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            minWidth: 360,
            maxHeight: 420,
            overflowY: 'auto',
            background: '#fff',
            borderRadius: 8,
            boxShadow: '0 6px 16px 0 rgba(0,0,0,0.08), 0 3px 6px -4px rgba(0,0,0,0.12)',
            border: '1px solid #f0f0f0',
            zIndex: 1000,
          }}
        >
          {results.map((item, index) => (
            <div
              key={`${item.type}-${item.path}`}
              onClick={() => handleNavigate(item)}
              style={{
                padding: '10px 16px',
                cursor: 'pointer',
                background: index === activeIndex ? '#f5f5f5' : 'transparent',
                borderBottom: '1px solid #f5f5f5',
                transition: 'background 0.15s',
              }}
              onMouseEnter={() => setActiveIndex(index)}
            >
              {item.type === 'group' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    background: '#e6f4ff',
                    fontSize: 11,
                    color: '#1677ff',
                  }}>
                    📁
                  </span>
                  <div>
                    <div style={{ fontSize: 14, color: '#262626', fontWeight: 600 }}>
                      {highlightMatch(item.title, keywords)}
                    </div>
                    <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>
                      分组 · {item.childCount} 篇文章
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 14, color: '#262626', fontWeight: 500 }}>
                    {highlightMatch(item.title, keywords)}
                  </div>
                  {item.group && (
                    <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>
                      {item.group}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {visible && keywords.trim() && results.length === 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            minWidth: 360,
            padding: '16px',
            background: '#fff',
            borderRadius: 8,
            boxShadow: '0 6px 16px 0 rgba(0,0,0,0.08)',
            border: '1px solid #f0f0f0',
            zIndex: 1000,
            textAlign: 'center',
            color: '#8c8c8c',
            fontSize: 14,
          }}
        >
          未找到相关内容
        </div>
      )}
    </div>
  );
}

function highlightMatch(text: string, keyword: string) {
  if (!keyword.trim()) return text;
  const index = text.toLowerCase().indexOf(keyword.toLowerCase());
  if (index === -1) return text;
  const before = text.slice(0, index);
  const match = text.slice(index, index + keyword.length);
  const after = text.slice(index + keyword.length);
  return (
    <>
      {before}
      <span style={{ color: '#1677ff', fontWeight: 600 }}>{match}</span>
      {after}
    </>
  );
}
