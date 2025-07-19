import React, { useMemo } from "react";
import { Menu, Image, Typography } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import logo from '../assets/login/logo-ptit.png'
import {
  DashboardOutlined,
  HomeOutlined,
  ContactsOutlined,
} from "@ant-design/icons";
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

const { Title } = Typography;

interface MenuItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  path: string;
}

interface SidebarProps {
  collapsed: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleMenuClick = (path: string) => {
    NProgress.start();
    setTimeout(() => {
      navigate(path);
      NProgress.done();
    }, 300);
  };

  const menuItems = useMemo((): MenuItem[] => [
    {
      key: "/",
      icon: <HomeOutlined />,
      label: "Trang chủ",
      path: "/",
    },
    {
      key: "/dashboard",
      icon: <DashboardOutlined />,
      label: "Dashboard",
      path: "/dashboard",
    },
    {
      key: "/contact",
      icon: <ContactsOutlined />,
      label: "Liên hệ",
      path: "/contact",
    },
  ], []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center p-3 md:p-4" style={{ paddingLeft: collapsed ? '0.75rem' : '1.25rem' }}>
        <div className="flex items-center gap-2 md:gap-3">
          <Image 
            src={logo} 
            alt="PTIT Logo" 
            preview={false}
            width={collapsed ? 32 : 40}
            className="min-w-[32px] md:min-w-[40px]"
          />
          <div className="overflow-hidden" style={{ width: collapsed ? 0 : 'auto', transition: 'width 0.3s ease-in-out' }}>
            <Title level={5} className="m-0 text-[#4F6F52] whitespace-nowrap text-sm md:text-base">
              <span className="hidden sm:inline">IoT Lab PTIT</span>
              <span className="sm:hidden">IoT Lab</span>
            </Title>
          </div>
        </div>
      </div>

      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        className="flex-1 border-0 mt-2 md:mt-4"
        items={menuItems.map(item => ({
          key: item.key,
          icon: item.icon,
          label: item.label,
          onClick: () => handleMenuClick(item.path),
        }))}
      />

      <style>{`
        .ant-menu-item {
          margin: 2px 4px !important;
          border-radius: 6px !important;
          transition: all 0.3s ease !important;
          height: 40px !important;
          line-height: 40px !important;
        }
        .ant-menu-item:hover {
          background-color: rgba(79, 111, 82, 0.1) !important;
          color: #4F6F52 !important;
        }
        .ant-menu-item-selected {
          background-color: #4F6F52 !important;
          color: white !important;
        }
        .ant-menu-item-selected span {
          color: white !important;
        }
        .ant-menu-inline {
          background: transparent !important;
        }
        .ant-menu-item .anticon {
          font-size: 16px !important;
        }
        @media (max-width: 768px) {
          .ant-menu-item {
            margin: 1px 2px !important;
            height: 36px !important;
            line-height: 36px !important;
          }
          .ant-menu-item .anticon {
            font-size: 14px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Sidebar;