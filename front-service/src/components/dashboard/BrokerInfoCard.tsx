import React from 'react';
import { Card, Typography, Tag } from 'antd';
import { 
  CloudServerOutlined, 
  MessageOutlined, 
  CodeOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface BrokerInfoCardProps {
  broker: string;
  topic: string;
  payload: string;
}

export const BrokerInfoCard: React.FC<BrokerInfoCardProps> = ({ broker, topic, payload }) => {
  const formatJson = (jsonString: string): string => {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch (error) {
      return jsonString;
    }
  };

  return (
    <Card className="bg-gradient-to-br from-white to-green-50 shadow-lg border border-green-100" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Title level={4} className="mb-3 md:mb-4 flex items-center text-base md:text-lg">
        <CloudServerOutlined className="mr-2 text-green-500 text-lg md:text-2xl" />
        Broker Information
      </Title>

      <div className="flex-grow overflow-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
        <div className="space-y-3 md:space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="bg-white/80 p-3 md:p-4 rounded-lg shadow-sm">
              <Title level={5} className="flex items-center mb-2 text-sm md:text-base">
                <ThunderboltOutlined className="mr-2 text-blue-500 text-base md:text-xl" />
                Broker Address
              </Title>
              <Text className="text-gray-700 block text-sm break-all">{broker}</Text>
            </div>

            <div className="bg-white/80 p-3 md:p-4 rounded-lg shadow-sm">
              <Title level={5} className="flex items-center mb-2 text-sm md:text-base">
                <MessageOutlined className="mr-2 text-green-500 text-base md:text-xl" />
                Current Topic
              </Title>
              <Tag color="green" className="text-xs md:text-sm px-2 py-1 break-all">{topic}</Tag>
            </div>
          </div>

          <div>
            <Title level={5} className="flex items-center mb-2 text-sm md:text-base">
              <CodeOutlined className="mr-2 text-purple-500 text-base md:text-xl" />
              Latest Payload
            </Title>
            <div className="bg-white rounded-lg shadow-inner p-3 md:p-4">
              <pre className="bg-gray-50 p-2 md:p-3 rounded-lg font-mono text-xs md:text-sm overflow-x-auto border border-gray-100">
                {formatJson(payload)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}; 