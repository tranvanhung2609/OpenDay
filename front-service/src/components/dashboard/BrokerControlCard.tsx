import React, { useState, useRef } from 'react';
import { Card, Input, Button, Space, Typography, Form, Collapse, Select, List, Tag, message, Alert } from 'antd';
import { 
  CloudServerOutlined,
  SendOutlined, 
  PlusOutlined, 
  DeleteOutlined, 
  GlobalOutlined, 
  KeyOutlined, 
  UserOutlined, 
  LockOutlined,
  MessageOutlined,
  ThunderboltOutlined,
  CodeOutlined,
  ApiOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import { useControlBroker } from '../../hooks/useControlBroker';

const { TextArea } = Input;
const { Title, Text } = Typography;
const { Panel } = Collapse;
const { Option } = Select;

interface BrokerControlCardProps {
  deviceId: string;
}

interface Message {
  topic: string;
  payload: string;
  time: string;
  type: 'sent' | 'received';
}

export const BrokerControlCard: React.FC<BrokerControlCardProps> = ({ deviceId }) => {
  const [brokerConfig, setBrokerConfig] = useState({
    address: '',
    port: '9001',
    username: '',
    password: '',
    protocol: 'ws' as 'ws' | 'wss',
    path: '/mqtt',
    clientId: '',
    keepalive: 60,
    reconnectPeriod: 1000,
    connectTimeout: 4000
  });

  const [publishTopic, setPublishTopic] = useState('');
  const [publishMessage, setPublishMessage] = useState('');
  const [publishQos, setPublishQos] = useState<0 | 1 | 2>(0);

  const [subscribeTopic, setSubscribeTopic] = useState('');
  const [subscribeQos, setSubscribeQos] = useState<0 | 1 | 2>(0);

  const [messages, setMessages] = useState<Message[]>([]);

  const [collapseActiveKey, setCollapseActiveKey] = useState<string | string[]>('1');

  const {
    connectionStatus,
    isConnected,
    subscribedTopics,
    lastError,
    publishMessage: publishToBroker,
    subscribeToTopic,
    unsubscribeFromTopic,
    connectBroker,
    disconnect
  } = useControlBroker({
    deviceId,
    onMessage: (topic, payload) => {
      setMessages(prev => [{
        topic,
        payload,
        time: new Date().toLocaleTimeString(),
        type: 'received' as const
      }, ...prev].slice(0, 3));
    },
    onConnect: () => {
      message.success('Connected to MQTT broker successfully');
      setCollapseActiveKey([]);
    },
    onDisconnect: () => {
      message.info('Disconnected from MQTT broker');
    },
    onError: (error) => {
      message.error(`MQTT Error: ${error.message}`);
    }
  });

  const handleConnect = () => {
    if (!brokerConfig.address.trim() || !brokerConfig.port.trim()) {
      message.error('Please enter broker address and port');
      return;
    }

    try {
      // Clean the address and remove any protocols/slashes
      let address = brokerConfig.address.trim();
      address = address.replace(/^(mqtt|ws|wss):\/\//, '');
      address = address.replace(/\/$/, '');
      
      // Clean port
      let port = brokerConfig.port.trim();
      // Update config with broker settings
      const config = {
        ...brokerConfig,
        address,
        port,
        clientId: brokerConfig.clientId || `mqtt-client-${Math.random().toString(16).substring(2, 10)}`,
      };

      console.log('Connecting to broker:', config);
      connectBroker(config);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      message.error(`Connection failed: ${errorMessage}`);
      console.error('Connection error:', error);
    }
  };

  const handlePublish = () => {
    const topic = publishTopic.trim();
    const msg = publishMessage;
    if (!topic || !msg) {
      message.error('Please enter topic and message');
      return;
    }

    publishToBroker(topic, msg, publishQos);
    setMessages(prev => [{
      topic,
      payload: msg,
      time: new Date().toLocaleTimeString(),
      type: 'sent' as const
    }, ...prev].slice(0, 3));
  };

  const handleSubscribe = () => {
    const topic = subscribeTopic.trim();
    if (!topic) {
      message.error('Please enter topic to subscribe');
      return;
    }

    subscribeToTopic(topic, subscribeQos);
  };

  const handleUnsubscribe = (topic: string) => {
    unsubscribeFromTopic(topic);
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Error';
      default:
        return 'Disconnected';
    }
  };

  const formatJson = (jsonString: string): string => {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch (error) {
      return jsonString;
    }
  };

  const handleClearMessages = () => {
    setMessages([]);
  };

  return (
    <Card className="bg-gradient-to-br from-white to-green-50 shadow-lg border border-green-100" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Title level={4} className="mb-3 md:mb-4 flex items-center text-base md:text-lg">
        <CloudServerOutlined className="mr-2 text-green-500 text-lg md:text-2xl" />
        Broker Control
        <div className="ml-2 flex items-center">
          <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full mr-1 md:mr-2 ${getConnectionStatusColor()} animate-pulse`} />
          <span className="text-xs md:text-sm text-gray-500">
            {getConnectionStatusText()}
          </span>
        </div>
      </Title>

      {lastError && (
        <Alert
          message="Connection Error"
          description={lastError.message}
          type="error"
          showIcon
          className="mb-3 md:mb-4 text-xs md:text-sm"
        />
      )}

      <div className="flex-grow overflow-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
        <Collapse className="mb-3 md:mb-4" activeKey={collapseActiveKey} onChange={setCollapseActiveKey}>
          <Panel header={
            <div className="flex items-center">
              <ThunderboltOutlined className="mr-1 md:mr-2 text-blue-500 text-base md:text-xl" />
              <span className="text-sm md:text-base">Broker Configuration</span>
            </div>
          } key="1">
            <Form layout="vertical">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <Form.Item label={<span className="text-xs md:text-sm">Broker Address</span>}>
                  <Input
                    prefix={<GlobalOutlined className="text-blue-500 text-xs md:text-sm" />}
                    value={brokerConfig.address}
                    onChange={e => setBrokerConfig(prev => ({ ...prev, address: e.target.value.replace(/\s+/g, '') }))}
                    placeholder="e.g., broker.example.com"
                    size="small"
                  />
                </Form.Item>
                <Form.Item label={<span className="text-xs md:text-sm">Port</span>}>
                  <Input
                    prefix={<KeyOutlined className="text-blue-500 text-xs md:text-sm" />}
                    value={brokerConfig.port}
                    onChange={e => setBrokerConfig(prev => ({ ...prev, port: e.target.value.replace(/\s+/g, '') }))}
                    placeholder="e.g., 9001"
                    size="small"
                  />
                </Form.Item>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4">
                <Form.Item label={<span className="text-xs md:text-sm">Protocol</span>}>
                  <Select
                    value={brokerConfig.protocol}
                    onChange={value => setBrokerConfig(prev => ({ ...prev, protocol: value }))}
                    size="small"
                  >
                    <Option value="ws">WebSocket (ws)</Option>
                    <Option value="wss">WebSocket Secure (wss)</Option>
                  </Select>
                </Form.Item>
                <Form.Item label={<span className="text-xs md:text-sm">Path</span>}>
                  <Input
                    value={brokerConfig.path}
                    onChange={e => setBrokerConfig(prev => ({ ...prev, path: e.target.value }))}
                    placeholder="/mqtt"
                    size="small"
                  />
                </Form.Item>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4">
                <Form.Item label={<span className="text-xs md:text-sm">Username</span>}>
                  <Input
                    prefix={<UserOutlined className="text-blue-500 text-xs md:text-sm" />}
                    value={brokerConfig.username}
                    onChange={e => setBrokerConfig(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Username (optional)"
                    size="small"
                  />
                </Form.Item>
                <Form.Item label={<span className="text-xs md:text-sm">Password</span>}>
                  <Input.Password
                    prefix={<LockOutlined className="text-blue-500 text-xs md:text-sm" />}
                    value={brokerConfig.password}
                    onChange={e => setBrokerConfig(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Password (optional)"
                    size="small"
                  />
                </Form.Item>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-3 md:mb-4">
                <Form.Item label={<span className="text-xs md:text-sm">Client ID</span>}>
                  <Input
                    value={brokerConfig.clientId}
                    onChange={e => setBrokerConfig(prev => ({ ...prev, clientId: e.target.value }))}
                    placeholder="Auto-generated if empty"
                    size="small"
                  />
                </Form.Item>
                <Form.Item label={<span className="text-xs md:text-sm">Keepalive</span>}>
                  <Input
                    type="number"
                    value={brokerConfig.keepalive}
                    onChange={e => setBrokerConfig(prev => ({ ...prev, keepalive: parseInt(e.target.value) || 60 }))}
                    placeholder="60"
                    size="small"
                  />
                </Form.Item>
                <Form.Item label={<span className="text-xs md:text-sm">Connect Timeout</span>}>
                  <Input
                    type="number"
                    value={brokerConfig.connectTimeout}
                    onChange={e => setBrokerConfig(prev => ({ ...prev, connectTimeout: parseInt(e.target.value) || 4000 }))}
                    placeholder="4000"
                    size="small"
                  />
                </Form.Item>
              </div>

              <div className="flex gap-2 justify-center">
                <Button
                  type="primary"
                  icon={<ThunderboltOutlined />}
                  onClick={handleConnect}
                  disabled={isConnected}
                  className="bg-green-500 hover:bg-green-600 text-xs md:text-sm"
                  size="small"
                >
                  Connect
                </Button>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={disconnect}
                  disabled={!isConnected}
                  className="text-xs md:text-sm"
                  size="small"
                >
                  Disconnect
                </Button>
              </div>
            </Form>
          </Panel>
        </Collapse>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
          <div className="space-y-3 md:space-y-4">
            <div>
              <Title level={5} className="flex items-center mb-2 text-sm md:text-base">
                <SendOutlined className="mr-1 md:mr-2 text-blue-500 text-base md:text-xl" />
                Publish Message
              </Title>
              <Space direction="vertical" className="w-full">
                <Input
                  placeholder="Topic"
                  value={publishTopic}
                  onChange={e => setPublishTopic(e.target.value.replace(/^\s+|\s+$/g, ''))}
                  prefix={<MessageOutlined className="text-blue-500 text-xs md:text-sm" />}
                  size="small"
                />
                <TextArea
                  placeholder="Message"
                  value={publishMessage}
                  onChange={e => setPublishMessage(e.target.value)}
                  rows={3}
                  className="text-xs md:text-sm"
                />
                <Select
                  value={publishQos}
                  onChange={setPublishQos}
                  className="w-full"
                  size="small"
                >
                  <Option value={0}>QoS 0 - At most once</Option>
                  <Option value={1}>QoS 1 - At least once</Option>
                  <Option value={2}>QoS 2 - Exactly once</Option>
                </Select>
                <Button
                  type="primary"
                  onClick={handlePublish}
                  className="bg-blue-500 hover:bg-blue-600 text-white text-xs md:text-sm"
                  icon={<SendOutlined />}
                  disabled={!isConnected}
                  size="small"
                >
                  Publish
                </Button>
              </Space>
            </div>

            <div>
              <Title level={5} className="flex items-center mb-2 text-sm md:text-base">
                <PlusOutlined className="mr-1 md:mr-2 text-green-500 text-base md:text-xl" />
                Subscribe to Topic
              </Title>
              <Space direction="vertical" className="w-full">
                <Input
                  placeholder="Topic"
                  value={subscribeTopic}
                  onChange={e => setSubscribeTopic(e.target.value.replace(/^\s+|\s+$/g, ''))}
                  prefix={<MessageOutlined className="text-green-500 text-xs md:text-sm" />}
                  size="small"
                />
                <Select
                  value={subscribeQos}
                  onChange={setSubscribeQos}
                  className="w-full"
                  size="small"
                >
                  <Option value={0}>QoS 0 - At most once</Option>
                  <Option value={1}>QoS 1 - At least once</Option>
                  <Option value={2}>QoS 2 - Exactly once</Option>
                </Select>
                <Button
                  type="primary"
                  onClick={handleSubscribe}
                  className="bg-green-500 hover:bg-green-600 text-white text-xs md:text-sm"
                  icon={<PlusOutlined />}
                  disabled={!isConnected}
                  size="small"
                >
                  Subscribe
                </Button>
              </Space>
            </div>

            {subscribedTopics.length > 0 && (
              <div>
                <Title level={5} className="flex items-center mb-2 text-sm md:text-base">
                  <ApiOutlined className="mr-1 md:mr-2 text-purple-500 text-base md:text-xl" />
                  Subscribed Topics
                </Title>
                <List
                  dataSource={subscribedTopics}
                  renderItem={topic => (
                    <List.Item
                      actions={[
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleUnsubscribe(topic.topic)}
                          size="small"
                        />
                      ]}
                    >
                      <Space>
                        <Tag color="green" className="text-xs">{topic.topic}</Tag>
                        <Text type="secondary" className="text-xs">QoS {topic.qos}</Text>
                      </Space>
                    </List.Item>
                  )}
                  size="small"
                />
              </div>
            )}
          </div>

          <div>
            <Title level={5} className="flex items-center mb-2 text-sm md:text-base" style={{ position: 'relative' }}>
              <CodeOutlined className="mr-1 md:mr-2 text-purple-500 text-base md:text-xl" />
              Message History
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={handleClearMessages}
                style={{ position: 'absolute', right: 0, top: 0 }}
                title="Xóa lịch sử"
                size="small"
              />
            </Title>
            <List
              className="bg-white rounded-lg shadow-inner p-3 md:p-4"
              dataSource={messages}
              renderItem={message => (
                <List.Item>
                  <div className="w-full">
                    <div className="flex justify-between items-center mb-1 md:mb-2">
                      <Tag color={message.type === 'sent' ? 'blue' : 'green'} className="text-xs">
                        {message.type === 'sent' ? 'Sent' : 'Received'}
                      </Tag>
                      <Text type="secondary" className="text-xs">{message.time}</Text>
                    </div>
                    <div className="mb-1 md:mb-2">
                      <Text strong className="text-xs md:text-sm">Topic:</Text> <span className="text-xs md:text-sm">{message.topic}</span>
                    </div>
                    <div>
                      <Text strong className="text-xs md:text-sm">Payload:</Text>
                      <pre className="bg-gray-50 p-1 md:p-2 rounded mt-1 overflow-x-auto text-xs md:text-sm">
                        {formatJson(message.payload)}
                      </pre>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}; 