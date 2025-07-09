import { useState, useEffect } from "react";
import {
  Table,
  Card,
  Button,
  Input,
  Space,
  Tag,
  Modal,
  Form,
  message,
  Select,
} from "antd";
import { PlusOutlined, SearchOutlined, EditOutlined } from "@ant-design/icons";
import AppLayout from "../components/Layout";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../config/firebase";

export default function Vacina() {
  const [vacina, setVacina] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingVacina, setEditingVacina] = useState(null);
  const [form] = Form.useForm();
  const vacinaCollectionRef = collection(db, "vacina");

  const optionsSelectReaplicationPeriod = [
    { value: "anual", label: "Anual" },
    { value: "biannual", label: "Semestral" },
    { value: "monthly", label: "Mensal" },
    { value: "unique", label: "Dose Única" },
  ];

  useEffect(() => {
    loadVacinas();
  }, []);

  const loadVacinas = async () => {
    setLoading(true);
    try {
      const vacinaData = await getDocs(vacinaCollectionRef);
      setVacina(vacinaData.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    } catch (error) {
      message.error("Erro ao carregar vacinas");
    } finally {
      setLoading(false);
    }
  };

  const handleAddVacina = () => {
    setEditingVacina(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditVacina = (vacina) => {
    setEditingVacina(vacina);
    form.setFieldsValue(vacina);
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const formattedValues = {
        ...values,
        isActive: true,
      };
      if (editingVacina) {
        const vacinaDoc = doc(vacinaCollectionRef, editingVacina.id);
        const updatedVacina = vacina.map((vacina) =>
          vacina.id === editingVacina.id ? { ...vacina, ...values } : vacina
        );
        setVacina(updatedVacina);
        await updateDoc(vacinaDoc, formattedValues);
        message.success("Vacina atualizada com sucesso!");
      } else {
        const docRef = await addDoc(vacinaCollectionRef, {
          ...formattedValues,
          createdAt: new Date().toISOString().split("T")[0],
        });
        setVacina([
          ...vacina,
          {
            id: docRef.id,
            ...formattedValues,
            createdAt: new Date().toISOString().split("T")[0],
          },
        ]);
        message.success("Vacina adicionada com sucesso!");
      }
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error("Erro na validação:", error);
    }
  };

  const handleActiveStatus = (vacinaId, activeStatus) => {
    Modal.confirm({
      title: `Confirmar ${activeStatus ? "inativação" : "ativação"}`,
      content: `Tem certeza que deseja ${
        activeStatus ? "desativar" : "ativar"
      } esta vacina?`,
      okText: "Confirmar",
      okType: "primary",
      cancelText: "Cancelar",
      okButtonProps: {
        className: "!bg-primaryGreen !hover:bg-primaryGreenHouver",
      },
      onOk: async () => {
        try {
          const vacinaDoc = doc(vacinaCollectionRef, vacinaId);
          const newStatus = { isActive: !activeStatus };
          await updateDoc(vacinaDoc, newStatus);
          const updatedVacina = vacina.map((item) =>
            item.id === vacinaId ? { ...item, isActive: !activeStatus } : item
          );
          setVacina(updatedVacina);
          message.success("Vacina atualizada com sucesso!");
        } catch (error) {
          message.error("Erro ao excluir Vacina");
        }
      },
    });
  };

  const filteredVacinas = vacina.filter((vacina) =>
    vacina.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: "Nome",
      dataIndex: "name",
      width: 800,
      key: "name",
      render: (_, record) => (
        <div className="flex items-center space-x-3">
          <div>
            <div className="text-gray-500 text-sm">{record.name}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Doença alvo",
      dataIndex: "targetDisease",
      width: 800,
      key: "targetDisease",
      render: (_, record) => (
        <div className="flex items-center space-x-3">
          <div>
            <div className="text-gray-500 text-sm">{record.targetDisease}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Período de reaplicação",
      dataIndex: "reaplicationPeriod",
      width: 800,
      key: "reaplicationPeriod",
      render: (_, record) => {
        const option = optionsSelectReaplicationPeriod.find(
          (opt) => opt.value === record.reaplicationPeriod
        );
        return (
          <div className="flex items-center space-x-3">
            <div>
              <div className="text-gray-500 text-sm">{option.label}</div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Status",
      key: "activeStatus",
      align: "center",
      width: 50,
      render: (_, record) => (
        <Space>
          {record.isActive == true ? (
            <Tag color="green">Ativo</Tag>
          ) : (
            <Tag color="red">Inativo</Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Ações",
      key: "actions",
      width: 50,
      align: "center",
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditVacina(record)}
          />
          <Button
            type="text"
            onClick={() => handleActiveStatus(record.id, record.isActive)}
          >
            {record.isActive == true ? "Desativar" : "Ativar"}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Vacinas</h1>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddVacina}
          >
            Adicionar vacina
          </Button>
        </div>

        <Card>
          <div className="mb-4">
            <Input
              placeholder="Buscar vacina..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <Table
            columns={columns}
            dataSource={filteredVacinas}
            rowKey="id"
            loading={loading}
          />
        </Card>

        <Modal
          title={editingVacina ? "Editar vacina" : "Adicionar vacina"}
          open={isModalVisible}
          onOk={handleModalOk}
          okText="Confirmar"
          cancelText="Cancelar"
          onCancel={() => setIsModalVisible(false)}
          width={600}
        >
          <Form form={form} layout="vertical" className="mt-4">
            <Form.Item
              label="Nome"
              name="name"
              rules={[{ required: true, message: "Por favor, insira o nome!" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Doença alvo"
              name="targetDisease"
              rules={[{ required: true, message: "Por favor, insira o nome!" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Período de reaplicação"
              name="reaplicationPeriod"
              rules={[
                {
                  required: true,
                  message: "Por favor, selecione o período de reaplicação!",
                },
              ]}
            >
              <Select options={optionsSelectReaplicationPeriod}></Select>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AppLayout>
  );
}
