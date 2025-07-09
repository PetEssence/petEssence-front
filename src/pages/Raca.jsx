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

export default function Raca() {
  const [raca, setRaca] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRaca, setEditingRaca] = useState(null);
  const [form] = Form.useForm();
  const racaCollectionRef = collection(db, "raca");

  useEffect(() => {
    loadRacas();
  }, []);

  const loadRacas = async () => {
    setLoading(true);
    try {
      const racaData = await getDocs(racaCollectionRef);
      setRaca(racaData.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    } catch (error) {
      message.error("Erro ao carregar raças");
    } finally {
      setLoading(false);
    }
  };

  const handleAddRaca = () => {
    setEditingRaca(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditRaca = (raca) => {
    setEditingRaca(raca);
    form.setFieldsValue(raca);
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const formattedValues = {
        ...values,
        isActive: true,
      };
      if (editingRaca) {
        const racaDoc = doc(racaCollectionRef, editingRaca.id);
        const updatedRaca = raca.map((raca) =>
          raca.id === editingRaca.id ? { ...raca, ...values } : raca
        );
        setRaca(updatedRaca);
        await updateDoc(racaDoc, formattedValues);
        message.success("Raça atualizada com sucesso!");
      } else {
        const docRef = await addDoc(racaCollectionRef, {
          ...formattedValues,
          createdAt: new Date().toISOString().split("T")[0],
        });
        setRaca([
          ...raca,
          {
            id: docRef.id,
            ...formattedValues,
            createdAt: new Date().toISOString().split("T")[0],
          },
        ]);
        message.success("Raça adicionada com sucesso!");
      }
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error("Erro na validação:", error);
    }
  };

  const handleActiveStatus = (racaId, activeStatus) => {
    Modal.confirm({
      title: `Confirmar ${activeStatus ? "inativação" : "ativação"}`,
      content: `Tem certeza que deseja ${
        activeStatus ? "desativar" : "ativar"
      } esta raça?`,
      okText: "Confirmar",
      okType: "primary",
      cancelText: "Cancelar",
      okButtonProps: {
        className: "!bg-primaryGreen !hover:bg-primaryGreenHouver",
      },
      onOk: async () => {
        try {
          const racaDoc = doc(racaCollectionRef, racaId);
          const newStatus = { isActive: !activeStatus };
          await updateDoc(racaDoc, newStatus);
          const updatedRaca = raca.map((item) =>
            item.id === racaId ? { ...item, isActive: !activeStatus } : item
          );
          setRaca(updatedRaca);
          message.success("Raça atualizada com sucesso!");
        } catch (error) {
          message.error("Erro ao excluir raça");
        }
      },
    });
  };

  const filteredRaças = raca.filter((raca) =>
    raca.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: "Raça",
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
            onClick={() => handleEditRaca(record)}
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
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Raças</h1>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddRaca}
          >
            Adicionar Raça
          </Button>
        </div>

        <Card>
          <div className="mb-4">
            <Input
              placeholder="Buscar raça..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <Table
            columns={columns}
            dataSource={filteredRaças}
            rowKey="id"
            loading={loading}
          />
        </Card>

        <Modal
          title={editingRaca ? "Editar Raça" : "Adicionar Raça"}
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
          </Form>
        </Modal>
      </div>
    </AppLayout>
  );
}
