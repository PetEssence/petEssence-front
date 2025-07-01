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

export default function Especie() {
  const [especie, setEspecie] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingEspecie, setEditingEspecie] = useState(null);
  const [form] = Form.useForm();
  const especieCollectionRef = collection(db, "especie");

  useEffect(() => {
    loadEspecies();
  }, []);

  const loadEspecies = async () => {
    setLoading(true);
    try {
      const especieData = await getDocs(especieCollectionRef);
      setEspecie(
        especieData.docs.map((doc) => ({ ...doc.data(), id: doc.id }))
      );
    } catch (error) {
      message.error("Erro ao carregar espécies");
    } finally {
      setLoading(false);
    }
  };

  const handleAddEspecie = () => {
    setEditingEspecie(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditEspecie = (especie) => {
    setEditingEspecie(especie);
    form.setFieldsValue(especie);
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingEspecie) {
        const updatedEspecies = especie.map((especie) =>
          especie.id === editingEspecie.id ? { ...especie, ...values } : especie
        );
        setEspecie(updatedEspecies);
        message.success("Espécie atualizada com sucesso!");
      } else {
        const docRef = await addDoc(especieCollectionRef, {
          name: values.name,
          createdAt: new Date().toISOString().split("T")[0],
          isActive: true,
        });
        setEspecie([
          ...especie,
          {
            id: docRef.id,
            name: values.name,
            createdAt: new Date().toISOString().split("T")[0],
            isActive: true,
          },
        ]);
        message.success("Espécie adicionada com sucesso!");
      }
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error("Erro na validação:", error);
    }
  };

  const handleActiveStatusEspecie = (especieId, activeStatus) => {
    Modal.confirm({
      title: `Confirmar ${activeStatus ? "inativação" : "ativação"}`,
      content: `Tem certeza que deseja ${
        activeStatus ? "desativar" : "ativar"
      } esta espécie?`,
      okText: "Confirmar",
      okType: "primary",
      cancelText: "Cancelar",
      okButtonProps: { className: "bg-primaryGreen" },
      onOk: async () => {
        try {
          const especieDoc = doc(db, "especie", especieId);
          const newStatus = { isActive: !activeStatus };
          await updateDoc(especieDoc, newStatus);
          const updatedEspecies = especie.map((item) =>
            item.id === especieId ? { ...item, isActive: !activeStatus } : item
          );
          setEspecie(updatedEspecies);
          message.success("Espécie atualizada com sucesso!");
        } catch (error) {
          message.error("Erro ao excluir usuário");
        }
      },
    });
  };

  const filteredEspecies = especie.filter((especie) =>
    especie.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: "Espécie",
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
            onClick={() => handleEditEspecie(record)}
          />
          <Button
            type="text"
            onClick={() =>
              handleActiveStatusEspecie(record.id, record.isActive)
            }
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
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Espécies</h1>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddEspecie}
          >
            Adicionar Espécie
          </Button>
        </div>

        <Card>
          <div className="mb-4">
            <Input
              placeholder="Buscar espécie..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <Table
            columns={columns}
            dataSource={filteredEspecies}
            rowKey="id"
            loading={loading}
          />
        </Card>

        <Modal
          title={editingEspecie ? "Editar Espécie" : "Adicionar Espécie"}
          open={isModalVisible}
          onOk={handleModalOk}
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
