import React from 'react';
import { Card, Switch } from 'antd';
import { motion } from 'framer-motion';

interface DeviceControlCardProps {
    name: string;
    status: number;
    onToggle: () => void;
    index: number;
    icon: React.ReactNode;
}

export const DeviceControlCard: React.FC<DeviceControlCardProps> = ({
    name, status, onToggle, index, icon
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="w-full p-1 md:p-2"
        >
            <Card
                className="shadow-md hover:shadow-lg transition-shadow duration-300"
                bordered={false}
            >
                <div className="flex flex-col items-center space-y-2 md:space-y-4">
                    <div className={`
            text-xl md:text-3xl
            ${status ? 'text-green-500' : 'text-gray-400'}
          `}>
                        {icon}
                    </div>
                    <div className="text-sm md:text-lg font-medium text-gray-700 text-center">{name}</div>
                    <Switch
                        checked={status === 1}
                        onChange={onToggle}
                        className={status ? 'bg-green-500' : 'bg-gray-300'}
                        size="small"
                    />
                </div>
            </Card>
        </motion.div>
    );
};