import { useState, useEffect } from "react";
import {
  Table,
  Card,
  Button,
  Input,
  Space,
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
      const formattedValues = {
        ...values,
      };
      if (editingEspecie) {
        const especieDoc = doc(especieCollectionRef, editingEspecie.id);
        const updatedEspecies = especie.map((especie) =>
          especie.id === editingEspecie.id ? { ...especie, ...values } : especie
        );
        setEspecie(updatedEspecies);
        await updateDoc(especieDoc, formattedValues);
        message.success("Espécie atualizada com sucesso!");
      } else {
        const docRef = await addDoc(especieCollectionRef, {
          ...formattedValues,
          createdAt: new Date().toISOString().split("T")[0],
        });
        setEspecie([
          ...especie,
          {
            id: docRef.id,
            ...formattedValues,
            createdAt: new Date().toISOString().split("T")[0],
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

  const filteredEspecies = especie.filter((especie) =>
    especie.nome.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: "Espécie",
      dataIndex: "nome",
      width: 800,
      key: "nome",
      render: (_, record) => (
        <div className="flex items-center space-x-3">
          <div>
            <div className="text-gray-500 text-sm">{record.nome}</div>
          </div>
        </div>
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
            Cadastrar Espécie
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
            locale={{ emptyText: "Não há registros."}}
          />
        </Card>
        <Modal
          title={editingEspecie ? "Editar Espécie" : "Cadastrar Espécie"}
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
              name="nome"
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
