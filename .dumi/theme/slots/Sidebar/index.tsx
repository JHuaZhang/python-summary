/**
 * 自定义 Sidebar - 只展开当前页面所在的分组，其余收起
 * 覆盖 dumi-theme-antd 的默认 Sidebar（默认全部展开）
 */
// @ts-nocheck
import React, { useState, useCallback, useEffect, useContext, useMemo } from 'react';
import { useSidebarData, useLocation } from 'dumi';
import { Col, Menu, ConfigProvider, Drawer } from 'antd';
import { UnorderedListOutlined } from '@ant-design/icons';
import useMenu from 'dumi-theme-antd/dist/hooks/useMenu';
import SiteContext from 'dumi-theme-antd/dist/slots/SiteContext';
import useSiteToken from 'dumi-theme-antd/dist/hooks/useSiteToken';

const Sidebar: React.FC = () => {
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const sidebarData = useSidebarData();
  const location = useLocation();
  const { token } = useSiteToken();
  const { theme, isMobile } = useContext(SiteContext);
  const [menuItems, selectedKey] = useMenu();

  const isDark = theme.includes('dark');
  const { colorBgContainer } = token;

  // 计算当前页面所在的分组 title
  const activeGroupTitle = useMemo(() => {
    if (!sidebarData) return [];
    const currentPath = location.pathname;
    for (const group of sidebarData) {
      const match = group.children?.some(
        (child) => child.link && currentPath.startsWith(child.link),
      );
      if (match && group.title) return [group.title];
    }
    return [];
  }, [sidebarData, location.pathname]);

  const [openKeys, setOpenKeys] = useState<string[]>(activeGroupTitle);

  useEffect(() => {
    setOpenKeys(activeGroupTitle);
  }, [activeGroupTitle]);

  const handleOpenChange = useCallback((keys: string[]) => {
    setOpenKeys(keys);
  }, []);

  const handleShowMobileMenu = useCallback(() => setMobileMenuVisible(true), []);
  const handleCloseMobileMenu = useCallback(() => setMobileMenuVisible(false), []);

  useEffect(() => {
    if (isMobile) handleCloseMobileMenu();
  }, [isMobile, handleCloseMobileMenu]);

  const stickyTop = (token.headerHeight || 64) + (token.contentMarginTop || 40);

  const menuChild = (
    <ConfigProvider
      theme={{ components: { Menu: { itemBg: colorBgContainer, darkItemBg: colorBgContainer } } }}
    >
      <Menu
        items={menuItems}
        inlineIndent={30}
        style={{ minHeight: '100%', paddingBottom: 48 }}
        mode="inline"
        theme={isDark ? 'dark' : 'light'}
        selectedKeys={[selectedKey]}
        openKeys={openKeys}
        onOpenChange={handleOpenChange}
      />
    </ConfigProvider>
  );

  if (isMobile) {
    return (
      <>
        <Drawer
          key="mobile-menu"
          styles={{ wrapper: { width: '300px' } }}
          open={mobileMenuVisible}
          onClose={handleCloseMobileMenu}
        >
          {menuChild}
        </Drawer>
        {(menuItems ?? []).length > 1 ? (
          <div
            style={{ position: 'fixed', zIndex: 2, bottom: 100, right: 20, cursor: 'pointer' }}
            onClick={handleShowMobileMenu}
          >
            <UnorderedListOutlined />
          </div>
        ) : null}
      </>
    );
  }

  return (
    <Col xxl={4} xl={5} lg={6} md={6} sm={24} xs={24} style={{ zIndex: 1 }}>
      <section
        className="main-menu-inner"
        style={{
          position: 'sticky',
          top: stickyTop,
          width: '100%',
          height: '100%',
          maxHeight: `calc(100vh - ${stickyTop}px)`,
          overflow: 'hidden',
          scrollbarWidth: 'thin',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.overflowY = 'auto'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.overflowY = 'hidden'; }}
      >
        {menuChild}
      </section>
    </Col>
  );
};

export default Sidebar;
