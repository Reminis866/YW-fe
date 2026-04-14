/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import './App.css';
import { useState, useEffect, useRef } from 'react';
import { bitable } from '@lark-base-open/connector-api';
import {
  Button,
  Form,
  Input,
  Checkbox,
  Select,
  Switch,
  Radio,
  Modal,
  Tooltip,
  ConfigProvider,
  Layout,
  Menu,
  Space,
  Typography,
  Card,
  Divider,
  Flex,
} from 'antd';
import {
  Database,
  UserCog,
  Settings,
  LayoutGrid,
  RefreshCw,
  HelpCircle,
  Plus,
  Check,
  Lock,
  Info,
  Eye,
  EyeOff,
  X,
} from 'lucide-react';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const DATA_SOURCES = [
  { id: 'store', title: '店铺列表', desc: '同步指定平台的所有店铺与档案数据', api: '' },
  { id: 'product', title: '商品列表', desc: '同步一段时间内的所有货品与相关信息', api: '' },
  { id: 'order', title: '订单列表', desc: '同步一段时间内的所有订单数据（暂不支持淘系、拼多多订单）', api: '' },
  { id: 'sales_out', title: '销售出库单列表', desc: '同步指定查询条件的销售出库单', api: '' },
  { id: 'purchase_in', title: '采购入库单列表', desc: '同步指定查询条件的采购入库单', api: '' },
  { id: 'return_order', title: '退换货订单列表', desc: '同步指定查询条件的全部退换货单', api: '' },
  { id: 'inventory', title: '商品库存列表', desc: '同步一段时间内的所有商品库存', api: '' },
];

const FIELDS = [
  { id: 'code', name: '货品编号', type: 'A', locked: true },
  { id: 'name', name: '货品名称', type: 'A' },
  { id: 'barcode', name: '条码', type: 'A' },
  { id: 'weight', name: '重量', type: '#' },
  { id: 'image', name: '图片URL', type: '🔗' },
  { id: 'merchant_code', name: '商家编码', type: 'A' },
  { id: 'sku_id', name: '单品 ID', type: 'A' },
  { id: 'brand_code', name: '品牌编号', type: 'A' },
  { id: 'brand_name', name: '品牌名称', type: 'v' },
  { id: 'unique_key', name: '明细唯一键', type: 'A' },
  { id: 'defective', name: '残次品', type: 'v' },
];

export default function App() {
  const [activeNav, setActiveNav] = useState('datasource');
  const [selectedSource, setSelectedSource] = useState('store');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [modalForm] = Form.useForm();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  const [userId, setUserId] = useState('');
  const [tenantKey, setTenantKey] = useState('');

  useEffect(() => {
    bitable.getConfig().then(config => {
      if (config?.value) {
        // Handle existing config if needed
      }
    });
    bitable.getUserId().then(id => setUserId(id));
    bitable.getTenantKey().then(key => setTenantKey(key));

    const container = scrollContainerRef.current;
    if (!container) return;

    const options = {
      root: container,
      rootMargin: '-10% 0px -80% 0px',
      threshold: 0,
    };

    const observer = new IntersectionObserver((entries) => {
      if (isScrollingRef.current) return;
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveNav(entry.target.id);
        }
      });
    }, options);

    const sections = container.querySelectorAll('section[id]');
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element && scrollContainerRef.current) {
      isScrollingRef.current = true;
      setActiveNav(id);
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 800);
    }
  };

  const handleSaveConfig = (values: any) => {
    console.log('Final Config:', values);
    bitable.saveConfigAndGoNext({
      ...values,
      selectedSource,
    });
  };

  const navItems = [
    { key: 'datasource', label: '数据源选择', icon: <Database size={16} /> },
    { key: 'account', label: '账号设置', icon: <UserCog size={16} /> },
    { key: 'params', label: '参数设置', icon: <Settings size={16} /> },
    { key: 'fields', label: '字段设置', icon: <LayoutGrid size={16} /> },
    { key: 'sync', label: '同步设置', icon: <RefreshCw size={16} /> },
  ];

  // 内联样式常量
  const styles = {
    container: { display: 'flex', height: '100vh', backgroundColor: '#fff' },
    sidebar: {
      width: 256,
      borderRight: '1px solid #dee0e3',
      display: 'flex',
      flexDirection: 'column' as const,
    },
    sidebarContent: { flex: 1, padding: '16px' },
    sidebarFooter: {
      padding: '16px',
      borderTop: '1px solid #dee0e3',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      color: '#646a73',
    },
    mainArea: { flex: 1, display: 'flex', flexDirection: 'column' as const, overflow: 'hidden' },
    scrollArea: {
      flex: 1,
      overflowY: 'auto' as const,
      padding: '32px',
      scrollBehavior: 'smooth' as const,
    },
    section: { marginBottom: 40 },
    sectionTitle: { fontSize: 16, fontWeight: 500, marginBottom: 16 },
    dataSourceCard: (isSelected: boolean) => ({
      position: 'relative' as const,
      padding: 16,
      border: `1px solid ${isSelected ? '#2b66ff' : '#dee0e3'}`,
      borderRadius: 8,
      cursor: 'pointer',
      backgroundColor: '#fff',
      transition: 'all 0.2s',
      boxShadow: isSelected ? '0 0 0 1px #2b66ff' : 'none',
    }),
    dataSourceIcon: { marginRight: 16, marginTop: 2, color: '#646a73' },
    dataSourceTitle: { fontSize: 14, fontWeight: 500, marginBottom: 4 },
    dataSourceDesc: { fontSize: 12, color: '#8f959e' },
    checkIcon: { position: 'absolute' as const, right: 16, top: '50%', transform: 'translateY(-50%)', color: '#2b66ff' },
    dashedButton: {
      width: '100%',
      height: 64,
      borderStyle: 'dashed',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: '#f5f6f7',
    },
    errorText: { fontSize: 12, color: '#f54a45', marginTop: 4 },
    paramLabel: { display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 },
    paramLabelText: { fontSize: 14, color: '#646a73' },
    requiredStar: { color: '#f54a45' },
    fieldTable: { border: '1px solid #dee0e3', borderRadius: 8, overflow: 'hidden' },
    fieldHeader: {
      backgroundColor: '#f5f6f7',
      padding: '8px 16px',
      borderBottom: '1px solid #dee0e3',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    fieldList: { padding: 8 },
    fieldItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 8px',
      borderRadius: 6,
    },
    fieldTypeBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 20,
      height: 20,
      backgroundColor: '#f0f1f2',
      color: '#646a73',
      fontSize: 10,
      fontWeight: 'bold',
      borderRadius: 4,
      marginRight: 8,
    },
    footer: {
      padding: 16,
      borderTop: '1px solid #dee0e3',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 12,
      backgroundColor: '#fff',
    },
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#2b66ff',
          borderRadius: 6,
        },
      }}
    >
      <div style={styles.container}>
        {/* 侧边栏 - 使用 Ant Design Menu */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarContent}>
            <Menu
              mode="inline"
              selectedKeys={[activeNav]}
              onClick={({ key }) => scrollToSection(key)}
              items={navItems.map(item => ({
                key: item.key,
                icon: item.icon,
                label: item.label,
              }))}
              style={{ borderRight: 0 }}
            />
          </div>
          <div style={styles.sidebarFooter}>
            <HelpCircle size={16} />
            <span>使用说明</span>
          </div>
        </div>

        {/* 主内容区域 */}
        <div style={styles.mainArea}>
          <div ref={scrollContainerRef} style={styles.scrollArea}>
            {/* 数据源选择 */}
            <section id="datasource" style={styles.section}>
              <div style={styles.sectionTitle}>数据源选择</div>
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                {DATA_SOURCES.map((source) => (
                  <div
                    key={source.id}
                    onClick={() => setSelectedSource(source.id)}
                    style={styles.dataSourceCard(selectedSource === source.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                      <div style={styles.dataSourceIcon}>
                        <Database size={18} />
                      </div>
                      <div>
                        <div style={styles.dataSourceTitle}>{source.title}</div>
                        <div style={styles.dataSourceDesc}>{source.desc}</div>
                      </div>
                    </div>
                    {selectedSource === source.id && (
                      <div style={styles.checkIcon}>
                        <Check size={18} />
                      </div>
                    )}
                  </div>
                ))}
              </Space>
            </section>

            {/* 账号设置 */}
            <section id="account" style={styles.section}>
              <div style={styles.sectionTitle}>账号设置</div>
              <Button
                type="dashed"
                icon={<Plus size={18} />}
                onClick={() => setIsModalOpen(true)}
                style={styles.dashedButton}
              >
                关联账号
              </Button>
              <div style={styles.errorText}>请设置一个关联账号</div>
            </section>

            {/* 参数设置 */}
            <section id="params" style={styles.section}>
              <div style={styles.sectionTitle}>参数设置</div>
              <div>
                <div style={styles.paramLabel}>
                  <span style={styles.paramLabelText}>时间范围</span>
                  <span style={styles.requiredStar}>*</span>
                  <Tooltip title="选择同步的时间范围">
                    <Info size={14} style={{ color: '#bbbfc4', cursor: 'help' }} />
                  </Tooltip>
                </div>
                <Space size={12}>
                  <Select defaultValue="recent" style={{ width: 160 }} options={[{ value: 'recent', label: '最近时间' }]} />
                  <Select defaultValue="30d" style={{ width: 160 }} options={[{ value: '30d', label: '近 30 天' }]} />
                </Space>
              </div>
            </section>

            {/* 字段设置 */}
            <section id="fields" style={styles.section}>
              <div style={styles.sectionTitle}>字段设置</div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 14, color: '#646a73', marginBottom: 8 }}>字段范围</div>
                <div style={styles.fieldTable}>
                  <div style={styles.fieldHeader}>
                    <Checkbox defaultChecked>全选</Checkbox>
                    <span style={{ fontSize: 12, color: '#8f959e' }}>已选择 57 项</span>
                  </div>
                  <div style={styles.fieldList}>
                    {FIELDS.map((field) => (
                      <div key={field.id} style={styles.fieldItem}>
                        <Checkbox defaultChecked disabled={field.locked}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={styles.fieldTypeBadge}>{field.type}</span>
                            <span style={{ color: field.locked ? '#bbbfc4' : 'inherit' }}>{field.name}</span>
                            {field.locked && <Lock size={12} style={{ color: '#bbbfc4' }} />}
                          </span>
                        </Checkbox>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 14, color: '#646a73', marginBottom: 12 }}>未来新增字段</div>
                <Radio.Group defaultValue="include">
                  <Space direction="vertical">
                    <Radio value="include">包含</Radio>
                    <Radio value="exclude">不包含</Radio>
                  </Space>
                </Radio.Group>
              </div>
            </section>

            {/* 同步设置 */}
            <section id="sync" style={{ ...styles.section, marginBottom: 40 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={styles.sectionTitle}>同步设置</div>
                <Switch defaultChecked size="small" />
              </div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 16 }}>
                根据你的设置，连接器会自动同步最新数据到当前数据表
              </Text>
              <Radio.Group defaultValue="hourly">
                <Space direction="vertical" size={16}>
                  <div>
                    <Radio value="hourly">按小时同步</Radio>
                    <div style={{ marginLeft: 24, marginTop: 8 }}>
                      <Select defaultValue="1h" style={{ width: 160 }} options={[{ value: '1h', label: '每隔 1 小时' }]} />
                    </div>
                  </div>
                  <Radio value="scheduled">定时同步</Radio>
                </Space>
              </Radio.Group>
            </section>
          </div>

          {/* 底部按钮 */}
          <div style={styles.footer}>
            <Button>取消</Button>
            <Button type="primary" onClick={() => form.submit()}>
              创建
            </Button>
          </div>
        </div>
      </div>

      {/* 关联账号弹窗 */}
      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={520}
        centered
        closeIcon={<X size={20} />}
        title={null}
        bodyStyle={{ padding: '24px 32px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          {/* <div
            style={{
              width: 64,
              height: 64,
              backgroundColor: '#2b66ff',
              borderRadius: 16,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            <span style={{ color: '#fff', fontSize: 28, fontWeight: 'bold', fontStyle: 'italic' }}>W</span>
          </div> */}
          
          <Title level={4} style={{ margin: 0 }}>
            关联 旺店通旗舰版 账号
          </Title>
        </div>

        <Form form={modalForm} layout="vertical" requiredMark={false}>
          <Form.Item
            label={
              <span>
                账号名称 <span style={{ color: '#f54a45' }}>*</span>
                <Tooltip title="为该账号设置一个易于识别的名称">
                  <Info size={14} style={{ marginLeft: 4, color: '#bbbfc4' }} />
                </Tooltip>
              </span>
            }
            name="accountName"
            initialValue="我的“万邑通”连接器"
          >
            <Input suffix={<span style={{ fontSize: 12, color: '#bbbfc4' }}>13/100</span>} />
          </Form.Item>
          <Form.Item
            label={
              <span>
                卖家账号 <span style={{ color: '#f54a45' }}>*</span>
              </span>
            }
            name="sellerAccount"
          >
            <Input placeholder="请输入" />
          </Form.Item>
          <Form.Item
            label={
              <span>
                TOKEN <span style={{ color: '#f54a45' }}>*</span>
                <Tooltip title="旺店通提供的接口账号">
                  <Info size={14} style={{ marginLeft: 4, color: '#bbbfc4' }} />
                </Tooltip>
              </span>
            }
            name="token"
          >
            <Input placeholder="请输入" />
          </Form.Item>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <Button style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>
              取消
            </Button>
            <Button type="primary" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>
              确定
            </Button>
          </div>
        </Form>
      </Modal>
    </ConfigProvider>
  );
}