import React from 'react';
import { Card, Tag, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { Device } from '../../types/dashboard';
import { ApiOutlined, ArrowRightOutlined, WifiOutlined, GlobalOutlined } from '@ant-design/icons';

interface DeviceCardProps {
    device: Device;
}

export const DeviceCardDashboard: React.FC<DeviceCardProps> = ({ device }) => {
    const navigate = useNavigate();

    return (
        <Card
            hoverable
            className="bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300"
            actions={[
                <Button 
                    type="primary" 
                    icon={<ArrowRightOutlined />}
                    onClick={() => navigate(`/dashboard/${device.id}`)}
                    className="bg-[#4f6f52] hover:bg-[#2c4a2d] mr-2"
                    size="small"
                >
                    View Details
                </Button>
            ]}
        >
            <div className="flex items-start gap-3 md:gap-4">
                <div className="p-2 md:p-3 bg-[#d2e3c8] rounded-lg flex-shrink-0">
                    <ApiOutlined className="text-xl md:text-2xl text-[#4f6f52]" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-base md:text-lg font-semibold text-[#2c4a2d] mb-1 md:mb-2 truncate">{device.name}</h3>
                    <p className="text-sm text-gray-600 mb-1 md:mb-2 truncate">ID: {device.id}</p>
                    <p className="text-sm text-gray-600 mb-1 md:mb-2 truncate">Location: {device.location}</p>
                    <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2">
                        <WifiOutlined className="text-[#4f6f52] text-sm" />
                        <p className="text-sm text-gray-600 truncate">WiFi: {device.wifi}</p>
                    </div>
                    <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2">
                        <GlobalOutlined className="text-[#4f6f52] text-sm" />
                        <p className="text-sm text-gray-600 truncate">IP: {device.ip}</p>
                    </div>
                    <Tag color="green" className="mt-1 md:mt-2 text-xs">{device.type}</Tag>
                </div>
            </div>
        </Card>
    );
};