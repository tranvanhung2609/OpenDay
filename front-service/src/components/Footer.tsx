import React from 'react';
import { Layout, Typography, Space } from 'antd';
import { FacebookOutlined, GithubOutlined, LinkedinOutlined } from '@ant-design/icons';

const { Footer } = Layout;
const { Text, Link } = Typography;

const CustomFooter: React.FC = () => {
  return (
    <Footer className="bg-white shadow-inner py-3 md:py-4">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-2 md:gap-0">
        <Text className="text-[#4F6F52] text-xs md:text-sm text-center md:text-left">
          IoT Lab PTIT ©{new Date().getFullYear()} Created by Trần Văn Hưng
        </Text>
        
        <Space size={12} className="md:size-16">
          <Link href="https://github.com/tranhung26092002" target="_blank" className="text-[#4F6F52] hover:text-[#86A789] transition-colors">
            <GithubOutlined className="text-lg md:text-xl" />
          </Link>
          <Link href="https://www.linkedin.com/in/tranhung2609/" target="_blank" className="text-[#4F6F52] hover:text-[#86A789] transition-colors">
            <LinkedinOutlined className="text-lg md:text-xl" />
          </Link>
          <Link href="https://www.facebook.com/tranhung2609" target="_blank" className="text-[#4F6F52] hover:text-[#86A789] transition-colors">
            <FacebookOutlined className="text-lg md:text-xl" />
          </Link>
        </Space>
      </div>
    </Footer>
  );
};

export default CustomFooter;
