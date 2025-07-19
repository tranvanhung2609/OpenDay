import React, { useState, useEffect } from "react";
import { Avatar, Space, Typography, Badge, Dropdown, Tooltip, Button, Drawer, Menu } from "antd";
import { 
  UserOutlined, 
  SettingOutlined, 
  LogoutOutlined, 
  LoginOutlined, 
  BellOutlined, 
  MessageOutlined,
  HomeOutlined,
  SearchOutlined,
  MenuOutlined,
  DashboardOutlined,
  ContactsOutlined
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageDropdown, MessageTooltipContent } from "./MessageDropdown";
import { NotificationDropdown, NotificationTooltipContent } from "./NotificationDropdown";
import { SearchComponent } from "./SearchBar";
import type { MenuProps } from "antd";
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { Notification } from "../../types/notification";
import { tokenStorage } from "../../services/tokenStorage";

const { Title, Text } = Typography;

interface HeaderProps {
  layoutType?: 'admin' | 'user';
}

const CustomHeader: React.FC<HeaderProps> = ({ layoutType = 'user' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationLoading, setIsNotificationLoading] = useState(false);
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);

  useEffect(() => {
    const token = tokenStorage.getAccessToken();
    setIsAuthenticated(!!token);
    
    // Giả lập dữ liệu notifications
    setIsNotificationLoading(true);
    setTimeout(() => {
      setNotifications([
        {
          id: 1,
          userId: 1,
          borrowRecordId: 1,
          title: "Thông báo hệ thống",
          message: "Hệ thống đã được cập nhật",
          read: false,
          type: "system",
          createdAt: new Date().toISOString()
        }
      ]);
      setIsNotificationLoading(false);
    }, 1000);
  }, []);

  const handleLogout = async () => {
    NProgress.start();
    try {
      navigate('/login'); 
      NProgress.done();
    } catch (error) {
      NProgress.done();
      console.error('Logout failed:', error);
    }
  };

  const handleMenuClick = (path: string) => {
    NProgress.start();
    setTimeout(() => {
      navigate(path);
      setMobileMenuVisible(false);
      NProgress.done();
    }, 300);
  };
  
  const menuItems: MenuProps["items"] = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Hồ sơ người dùng",
      onClick: () => setIsModalOpen(true),
    },
    ...(layoutType === 'user' 
      ? [{
          key: "admin",
          icon: <SettingOutlined />,
          label: "Quản trị hệ thống",
          onClick: () => navigate("/admin"),
        }]
      : [{
          key: "user",
          icon: <HomeOutlined />,
          label: "Trang người dùng",
          onClick: () => navigate("/"),
        }]
    ),
    ...(isAuthenticated 
      ? [{
          key: "logout",
          icon: <LogoutOutlined />,
          label: "Đăng xuất",
          onClick: handleLogout,
          danger: true,
        }]
      : [{
          key: "/login",
          icon: <LoginOutlined />,
          label: "Đăng nhập",
          onClick: () => navigate("/login"),
        }]
    ),
  ];

  const mobileMenuItems = [
    {
      key: "/",
      icon: <HomeOutlined />,
      label: "Trang chủ",
      onClick: () => handleMenuClick("/"),
    },
    {
      key: "/dashboard",
      icon: <DashboardOutlined />,
      label: "Dashboard",
      onClick: () => handleMenuClick("/dashboard"),
    },
    {
      key: "/contact",
      icon: <ContactsOutlined />,
      label: "Liên hệ",
      onClick: () => handleMenuClick("/contact"),
    },
  ];

  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <>
      <motion.div
        className="px-4 md:px-8 py-3 md:py-4 flex items-center justify-between bg-gradient-to-r from-[#f8faf6] via-white to-[#f8faf6]"
        variants={headerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Left section - Title and Subtitle */}
        <motion.div variants={itemVariants} className="flex-1 min-w-0">
          <Title
            level={1}
            className="!m-0 !text-[#1a1a1a] text-lg md:text-2xl lg:text-3xl"
            style={{
              fontWeight: 700,
              letterSpacing: '-0.5px',
              textShadow: '0 2px 4px rgba(0,0,0,0.05)',
              marginBottom: '2px',
              lineHeight: '1.2'
            }}
          >
            <span className="hidden sm:inline">NỀN TẢNG THỰC HÀNH SỐ IoT</span>
            <span className="sm:hidden">IoT LAB</span>
          </Title>
          <Text className="text-[#4a4a4a] font-medium text-xs md:text-sm">
            <span className="hidden sm:inline">Học tập - Thực hành - Đổi mới</span>
            <span className="sm:hidden">PTIT</span>
          </Text>
        </motion.div>

        {/* Right section - Search & Controls */}
        <Space align="center" size={16} className="ml-2 md:ml-8">
          {/* Search - Hidden on mobile */}
          <motion.div variants={itemVariants} className="hidden md:block w-64">
            <SearchComponent 
              onSearch={(value) => console.log('Search query:', value)} 
            />
          </motion.div>

          {/* Search button for mobile */}
          <motion.div variants={itemVariants} className="md:hidden">
            <Tooltip title="Tìm kiếm">
              <Button
                type="text"
                icon={<SearchOutlined />}
                className="text-[#4F6F52] hover:bg-[#d2e3c8]"
                size="small"
              />
            </Tooltip>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Tooltip 
              title={<MessageTooltipContent />}
              placement="bottom"
              overlayClassName="!p-0"
              overlayInnerStyle={{
                background: 'linear-gradient(to right, #4f6f52, #3d5740)',
                borderRadius: '12px',
              }}
            >
              <Badge 
                count={0}
                size="small"
                className="cursor-pointer"
              >
                <div className="inline-block">
                  <MessageDropdown>
                    <MessageOutlined className="text-lg md:text-xl p-1.5 md:p-2 rounded-full bg-[#d2e3c8] text-[#4F6F52] hover:bg-[#86A789] hover:text-white transition-all duration-300" />
                  </MessageDropdown>
                </div>
              </Badge>
            </Tooltip>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Tooltip 
              title={<NotificationTooltipContent />}
              placement="bottom"
              overlayClassName="!p-0"
              overlayInnerStyle={{
                background: 'linear-gradient(to right, #4f6f52, #3d5740)',
                borderRadius: '12px',
              }}
            >
              <Badge 
                count={notifications.filter(n => !n.read).length}
                size="small"
                className="cursor-pointer"
              >
                <NotificationDropdown
                  notifications={notifications}
                  isLoading={isNotificationLoading}
                >
                  <BellOutlined className="text-lg md:text-xl p-1.5 md:p-2 rounded-full bg-[#d2e3c8] text-[#4F6F52] hover:bg-[#86A789] hover:text-white transition-all duration-300" />
                </NotificationDropdown>
              </Badge>
            </Tooltip>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Dropdown
              menu={{ items: menuItems }}
              placement="bottomRight"
              trigger={['hover']}
              overlayStyle={{ 
                width: '200px',
                padding: '8px',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              }}
            >
              <div className="cursor-pointer">
                <Avatar
                  size={32}
                  icon={<UserOutlined style={{ fontSize: '16px' }} />}
                  className="border-2 border-[#4F6F52] transition-all duration-300 hover:border-opacity-80 shadow-md md:w-10 md:h-10"
                />
              </div>
            </Dropdown>
          </motion.div>

          {/* Mobile Menu Button */}
          <motion.div variants={itemVariants} className="md:hidden">
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setMobileMenuVisible(true)}
              className="text-[#4F6F52] hover:bg-[#d2e3c8]"
              size="small"
            />
          </motion.div>
        </Space>
      </motion.div>

      {/* Mobile Menu Drawer */}
      <Drawer
        title="Menu"
        placement="right"
        onClose={() => setMobileMenuVisible(false)}
        open={mobileMenuVisible}
        width={250}
        className="md:hidden"
      >
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={mobileMenuItems}
          className="border-0"
        />
        <style>{`
          .ant-menu-item {
            margin: 4px 8px !important;
            border-radius: 8px !important;
            transition: all 0.3s ease !important;
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
        `}</style>
      </Drawer>
    </>
  );
};

export default CustomHeader;