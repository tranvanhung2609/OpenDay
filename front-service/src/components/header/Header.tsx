import React, { useState, useEffect } from "react";
import { Avatar, Space, Typography, Badge, Dropdown, Tooltip } from "antd";
import { 
  UserOutlined, 
  SettingOutlined, 
  LogoutOutlined, 
  LoginOutlined, 
  BellOutlined, 
  MessageOutlined,
  HomeOutlined 
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationLoading, setIsNotificationLoading] = useState(false);

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
    <motion.div
      className="px-8 py-4 flex items-center justify-between bg-gradient-to-r from-[#f8faf6] via-white to-[#f8faf6]"
      variants={headerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Left section - Title and Subtitle */}
      <motion.div variants={itemVariants}>
        <Title
          level={1}
          className="!m-0 !text-[#1a1a1a]"
          style={{
            fontSize: '28px',
            fontWeight: 700,
            letterSpacing: '-0.5px',
            textShadow: '0 2px 4px rgba(0,0,0,0.05)',
            marginBottom: '4px'
          }}
        >
          NỀN TẢNG THỰC HÀNH SỐ IoT
        </Title>
        <Text className="text-[#4a4a4a] font-medium">
          Học tập - Thực hành - Đổi mới
        </Text>
      </motion.div>

      {/* Right section - Search & Controls */}
      <Space align="center" size={32} className="mr-8">
        <motion.div variants={itemVariants} className="w-64">
          <SearchComponent 
            onSearch={(value) => console.log('Search query:', value)} 
          />
        </motion.div>

        <motion.div variants={itemVariants} className="ml-4">
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
                  <MessageOutlined className="text-xl p-2 rounded-full bg-[#d2e3c8] text-[#4F6F52] hover:bg-[#86A789] hover:text-white transition-all duration-300" />
                </MessageDropdown>
              </div>
            </Badge>
          </Tooltip>
        </motion.div>

        <motion.div variants={itemVariants} className="ml-4">
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
                <BellOutlined className="text-xl p-2 rounded-full bg-[#d2e3c8] text-[#4F6F52] hover:bg-[#86A789] hover:text-white transition-all duration-300" />
              </NotificationDropdown>
            </Badge>
          </Tooltip>
        </motion.div>

        <motion.div variants={itemVariants} className="ml-4">
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
                size={40}
                icon={<UserOutlined style={{ fontSize: '20px' }} />}
                className="border-2 border-[#4F6F52] transition-all duration-300 hover:border-opacity-80 shadow-md"
              />
            </div>
          </Dropdown>
        </motion.div>
      </Space>
    </motion.div>
  );
};

export default CustomHeader;