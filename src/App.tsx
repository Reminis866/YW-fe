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
  Trash2,
} from 'lucide-react';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const DATA_SOURCES = [
  { id: 'queryWarehouseStorage', title: '商品库存列表', desc: '同步指定海外仓的库存数据' },
];

const WAREHOUSE = [
  { id: '1030075', title: 'CATO Warehouse', desc: ''},
  { id: '1000001', title: 'AU Warehouse', desc: ''},
  { id: '1054191', title: 'USWC2 Warehouse', desc: ''},
];

const FIELDS = [
  { id: 'merchandiseSerno', name: '商品条码', type: 'A', locked: false },
  { id: 'productName', name: '商品名称', type: 'A', locked: false },
  { id: 'productCode', name: '商品条码', type: 'A', locked: false },
  { id: 'specification', name: '商品规格', type: 'A', locked: false },
  { id: 'isActive', name: '是否有效', type: 'A', locked: false },
  { id: 'isReturnInventory', name: '是否退货库存', type: 'A', locked: false },
  { id: 'warehouseID', name: '万邑通仓库ID', type: 'A', locked: false },
  { id: 'warehouseCode', name: '万邑通仓库Code', type: 'A', locked: false },
  { id: 'warehouseName', name: '万邑通仓库名称', type: 'A', locked: false },
  { id: 'inStockQty', name: '在库总库存', type: 'A', locked: false },
  { id: 'qtyAvailable', name: '可用库存数量', type: 'A', locked: false },
  { id: 'qtyWaitOut', name: '待发数量', type: 'A', locked: false },
  { id: 'qtyLostConfirming', name: '丢失确认中数量', type: 'A', locked: false },
  { id: 'addValueFrozenQty', name: '增值处理中数量', type: 'A', locked: false },
  { id: 'qtyFrozen', name: '在库异常数量', type: 'A', locked: false },
  { id: 'qtyDestruction', name: '待销毁数量', type: 'A', locked: false },
  { id: 'prohibitFrozenQty', name: '失效VAT冻结数量', type: 'A', locked: false },
  { id: 'prohibitUsableQty', name: '禁止出库数量', type: 'A', locked: false },
  { id: 'pipelineInventory', name: '在途待入库数量', type: 'A', locked: false },
  { id: 'preSaleWaitOutQty', name: '预售待发数量', type: 'A', locked: false },
];

export default function App() {
  const [activeNav, setActiveNav] = useState('datasource');
  const [action, setAction] = useState('queryWarehouseStorage');
  const [warehouseID, setWarehouseID] = useState('1030075');
  const [account, setAccount] = useState<Record<string, string> | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [modalForm] = Form.useForm();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  const [userId, setUserId] = useState('');
  const [tenantKey, setTenantKey] = useState('');

  // 校验错误状态
  const [accountError, setAccountError] = useState('');
  const [fieldsError, setFieldsError] = useState('');

  // 计算所有可编辑字段（非锁定字段）
  const editableFields = FIELDS.filter(field => !field.locked);
  const editableFieldIds = editableFields.map(field => field.id);
  // 字段选中状态管理（仅管理可编辑字段，锁定字段始终选中且不可更改）
  const [selectedFieldIds, setSelectedFieldIds] = useState<Set<string>>(
    () => new Set(editableFieldIds) // 初始默认全部选中
  );
  // 判断是否全选（可编辑字段全部选中）
  const isAllSelected = editableFieldIds.length > 0 && 
    editableFieldIds.every(id => selectedFieldIds.has(id));

  // 判断是否半选状态（部分选中）
  const isIndeterminate = !isAllSelected && editableFieldIds.some(id => selectedFieldIds.has(id));
  // 未来新增字段
  const [newlyAddedFields, setNewlyAddedFields] = useState(true)

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

  // 校验 state 管理的字段（非 Ant Design Form 托管）
  const validateStateFields = (): boolean => {
    let valid = true;

    if (!account) {
      setAccountError('请设置一个关联账号');
      valid = false;
    } else {
      setAccountError('');
    }

    const lockedCount = FIELDS.filter(f => f.locked).length;
    if (lockedCount + selectedFieldIds.size === 0) {
      setFieldsError('请至少选择一个字段');
      valid = false;
    } else {
      setFieldsError('');
    }

    // 校验不通过时滚动到第一个出错的区域
    if (!valid) {
      const firstErrorSection = !account ? 'account' : 'fields';
      scrollToSection(firstErrorSection);
    }

    return valid;
  };

  const handleSaveConfig = (values: any) => {
    if (!validateStateFields()) return;

    const payload = {
      ...values,
      action: action,
      warehouseID: warehouseID,
      selectedFieldIds: Array.from(selectedFieldIds),
      newlyAddedFields,
      account,
    };
    console.log(payload);

    bitable.saveConfigAndGoNext(payload);
  };

  const openAccountModal = () => {
    if (account) {
      modalForm.setFieldsValue(account);
    } else {
      modalForm.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleAccountSave = (values: Record<string, string>) => {
    setAccount(values);
    setAccountError(''); // 保存账号后清除错误
    setIsModalOpen(false);
  };

  const navItems = [
    { key: 'datasource', label: '数据源选择', icon: <Database size={16} /> },
    { key: 'account', label: '账号设置', icon: <UserCog size={16} /> },
    // { key: 'params', label: '参数设置', icon: <Settings size={16} /> },
    { key: 'fields', label: '字段设置', icon: <LayoutGrid size={16} /> },
    // { key: 'sync', label: '同步设置', icon: <RefreshCw size={16} /> },
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
    scrollContainer: {
      width: '50vw',
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
      justifyContent: 'flex-start',
      gap: 8,
      backgroundColor: '#f5f6f7',
    },
    errorText: { fontSize: 12, color: '#f54a45', marginTop: 4 },
    paramLabel: { display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 },
    paramLabelText: { fontSize: 14, color: '#646a73' },
    requiredStar: { color: '#f54a45' },
    fieldTable: (hasError: boolean) => ({
      border: `1px solid ${hasError ? '#f54a45' : '#dee0e3'}`,
      borderRadius: 8,
      overflow: 'hidden' as const,
    }),
    fieldHeader: {
      backgroundColor: '#f5f6f7',
      padding: '8px 16px',
      borderBottom: '1px solid #dee0e3',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
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
          {/* <div style={styles.sidebarFooter}>
            <HelpCircle size={16} />
            <span>使用说明</span>
          </div> */}
        </div>

        {/* 主内容区域 */}
        <div style={styles.mainArea}>
          <div ref={scrollContainerRef} style={styles.scrollArea}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSaveConfig}
              style={styles.scrollContainer}
            >
              {/* 数据源选择 */}
              <section id="datasource" style={styles.section}>
                <div style={styles.sectionTitle}>数据源选择</div>
                <Space direction="vertical" style={{ width: '100%' }} size={12}>
                  {DATA_SOURCES.map((source) => (
                    <div
                      key={source.id}
                      onClick={() => setAction(source.id)}
                      style={styles.dataSourceCard(action === source.id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={styles.dataSourceIcon}>
                          <Database size={18} />
                        </div>
                        <div>
                          <div style={styles.dataSourceTitle}>{source.title}</div>
                          <div style={styles.dataSourceDesc}>{source.desc}</div>
                        </div>
                      </div>
                      {action === source.id && (
                        <div style={styles.checkIcon}>
                          <Check size={18} />
                        </div>
                      )}
                    </div>
                  ))}
                </Space>
              </section>

              {/* 指定仓库 */}
              <section id="warehouse" style={styles.section}>
                <div style={styles.sectionTitle}>选择仓库</div>
                <Space direction='vertical' style={{ width: '100%' }} size={12}>
                  {WAREHOUSE.map((warehouse) => (
                    <div
                      key={warehouse.id}
                      onClick={() => setWarehouseID(warehouse.id)}
                      style={styles.dataSourceCard(warehouseID == warehouse.id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={styles.dataSourceIcon}>
                          <Database size={18} />
                        </div>
                        <div>
                          <div style={styles.dataSourceTitle}>{warehouse.title} ( {warehouse.id} )</div>
                          <div style={styles.dataSourceDesc}>{warehouse.desc}</div>
                        </div>
                      </div>
                      {warehouseID === warehouse.id && (
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
                {account ? (
                  <div
                    style={{
                      ...styles.dashedButton,
                      borderStyle: 'solid',
                      borderRadius: 8,
                      borderColor: '#2b66ff',
                      color: '#2b66ff',
                      cursor: 'pointer',
                      position: 'relative',
                      backgroundColor: '#fff',
                      padding: '0 15px',
                      boxSizing: 'border-box',
                    }}
                    onClick={openAccountModal}
                  >
                    <UserCog size={18} />
                    {account.accountName}
                    <div
                      style={{
                        position: 'absolute',
                        right: 16,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'red',
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        Modal.confirm({
                          title: '确认删除',
                          content: `确定要删除账号「${account.accountName}」吗？`,
                          okText: '删除',
                          cancelText: '取消',
                          okButtonProps: { danger: true },
                          centered: true,
                          onOk: () => {
                            setAccount(null);
                            modalForm.resetFields();
                          },
                        });
                      }}
                    >
                      <Trash2 size={16} />
                    </div>
                  </div>
                ) : (
                  <>
                    <Button
                      type="dashed"
                      icon={<Plus size={18} />}
                      onClick={openAccountModal}
                      style={{
                        ...styles.dashedButton,
                        borderColor: accountError ? '#f54a45' : undefined,
                      }}
                    >
                      关联账号
                    </Button>
                    {accountError && <div style={styles.errorText}>{accountError}</div>}
                  </>
                )}
              </section>

              {/* 参数设置 */}
              {/* <section id="params" style={styles.section}>
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
              </section> */}

              {/* 字段设置 */}
              <section id="fields" style={styles.section}>
                <div style={styles.sectionTitle}>字段设置</div>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 14, color: '#646a73', marginBottom: 8 }}>字段范围</div>
                  <div style={styles.fieldTable(!!fieldsError)}>
                    <div style={styles.fieldHeader}>
                      <Checkbox 
                        checked={isAllSelected}
                        indeterminate={isIndeterminate}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setSelectedFieldIds(prev => {
                            const newSet = new Set(prev);
                            if (checked) {
                              editableFieldIds.forEach(id => newSet.add(id));
                            } else {
                              editableFieldIds.forEach(id => newSet.delete(id));
                            }
                            return newSet;
                          });
                          if (e.target.checked) setFieldsError('');
                        }}  
                      >全选</Checkbox>
                      <span style={{ fontSize: 12, color: '#8f959e' }}>
                        已选择 {FIELDS.filter(f => f.locked).length + selectedFieldIds.size} 项
                      </span>
                    </div>
                    <div style={{
                        padding: 8,
                        height: '55vh',
                        overflowY: 'auto',
                      }} 
                    >
                      {FIELDS.map((field) => {
                        const isLocked = field.locked;
                        const isChecked = isLocked ? true : selectedFieldIds.has(field.id);

                        return (
                          <div key={field.id} style={styles.fieldItem}>
                            <Checkbox
                              checked={isChecked}
                              disabled={isLocked}
                              onChange={(e) => {
                                if (isLocked) return;
                                const checked = e.target.checked;
                                setSelectedFieldIds(prev => {
                                  const newSet = new Set(prev);
                                  checked ? newSet.add(field.id) : newSet.delete(field.id);
                                  return newSet;
                                });
                                if (e.target.checked) setFieldsError('');
                              }}
                            >
                              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={styles.fieldTypeBadge}>{field.type}</span>
                                <span style={{ color: isLocked ? '#bbbfc4' : 'inherit' }}>{field.name}</span>
                                {isLocked && <Lock size={12} style={{ color: '#bbbfc4' }} />}
                              </span>
                            </Checkbox>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {fieldsError && <div style={styles.errorText}>{fieldsError}</div>}
                </div>
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 14, color: '#646a73', marginBottom: 12 }}>未来新增字段</div>
                  <Radio.Group defaultValue={newlyAddedFields} onChange={(e) => setNewlyAddedFields(e.target.value)}>
                    <Space direction="vertical">
                      <Radio value={true}>包含</Radio>
                      <Radio value={false}>不包含</Radio>
                    </Space>
                  </Radio.Group>
                </div>
              </section>

              {/* 同步设置 */}
              {/* <section id="sync" style={{ ...styles.section, marginBottom: 40 }}>
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
              </section> */}
            </Form>
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
        width='50vw'
        centered
        closeIcon={<X size={20} />}
        title={null}
        styles={{ body: { padding: '24px 32px' } }}
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
            {account ? '修改' : '关联'} 万邑通 账号
          </Title>
        </div>

        <Form form={modalForm} layout="vertical" requiredMark={false} onFinish={handleAccountSave}>
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
            rules={[{ required: true, message: '请输入账号名称' }]}
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
            rules={[{ required: true, message: '请输入卖家账号' }]}
          >
            <Input placeholder="请输入" />
          </Form.Item>
          <Form.Item
            label={
              <span>
                TOKEN <span style={{ color: '#f54a45' }}>*</span>
                <Tooltip title="卖家账号的TOKEN">
                  <Info size={14} style={{ marginLeft: 4, color: '#bbbfc4' }} />
                </Tooltip>
              </span>
            }
            name="token"
            rules={[{ required: true, message: '请输入TOKEN' }]}
          >
            <Input placeholder="请输入" />
          </Form.Item>
          <div style={{ display: 'flex', gap: 12, marginTop: 40 }}>
            <Button style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>
              取消
            </Button>
            <Button type="primary" style={{ flex: 1 }} onClick={() => modalForm.submit()}>
              确定
            </Button>
          </div>
        </Form>
      </Modal>
    </ConfigProvider>
  );
}