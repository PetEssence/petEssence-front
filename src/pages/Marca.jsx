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
  Tag,
  Radio,
  Grid,
  Spin,
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
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Marca() {
  const { useBreakpoint } = Grid;
  const screens = useBreakpoint();
  const [marca, setMarca] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingMarca, setEditingMarca] = useState(null);
  const [form] = Form.useForm();
  const marcaCollectionRef = collection(db, "marca");
  const { cargoUsuario } = useAuth();

  if (cargoUsuario == "cliente") {
    return <Navigate to="/acessoNegado" replace />;
  }
  useEffect(() => {
    listarMarcas();
  }, []);

  const listarMarcas = async () => {
    setLoading(true);
    try {
      const data = await getDocs(marcaCollectionRef);
      setMarca(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    } catch (error) {
      message.error("Erro ao carregar marcas");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMarcas = () => {
    setEditingMarca(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditMarcas = (marca) => {
    setEditingMarca(marca);
    form.setFieldsValue(marca);
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const formattedValues = {
        ...values,
        ativo: true,
      };
      if (editingMarca) {
        const marcaDoc = doc(marcaCollectionRef, editingMarca.id);
        const updatedMarcas = marca.map((marca) =>
          marca.id === editingMarca.id ? { ...marca, ...values } : marca
        );
        setMarca(updatedMarcas);
        await updateDoc(marcaDoc, formattedValues);
        message.success("Marca atualizada com sucesso!");
      } else {
        const docRef = await addDoc(marcaCollectionRef, {
          ...formattedValues,
          dataCriacao: new Date().toISOString().split("T")[0],
        });
        setMarca([
          ...marca,
          {
            id: docRef.id,
            ...formattedValues,
            dataCriacao: new Date().toISOString().split("T")[0],
          },
        ]);
        message.success("Marca adicionada com sucesso!");
      }
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error("Erro na validação:", error);
    }
  };
  const handleActiveStatus = (id, activeStatus) => {
    Modal.confirm({
      title: `Confirmar ${activeStatus ? "inativação" : "ativação"}`,
      content: `Tem certeza que deseja ${
        activeStatus ? "desativar" : "ativar"
      } esta marca?`,
      okText: "Confirmar",
      okType: "primary",
      cancelText: "Cancelar",
      okButtonProps: {
        className: "!bg-primaryGreen !hover:bg-primaryGreenHouver",
      },
      onOk: async () => {
        try {
          const marcaDoc = doc(marcaCollectionRef, id);
          const newStatus = { ativo: !activeStatus };
          await updateDoc(marcaDoc, newStatus);
          const updatedData = marca.map((item) =>
            item.id === id ? { ...item, ativo: !activeStatus } : item
          );
          setMarca(updatedData);
          message.success("Marca atualizada com sucesso!");
        } catch (error) {
          message.error("Erro ao atualizar vacina");
        }
      },
    });
  };
  const filteredMarcas = marca.filter((marca) =>
    marca.nome.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: "Marca",
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
      title: "Origem",
      dataIndex: "origem",
      width: 800,
      key: "origem",
      render: (_, record) => (
        <div className="flex items-center space-x-3">
          <div>
            <div className="text-gray-500 text-sm">{record.origem}</div>
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
          {record.ativo == true ? (
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
            onClick={() => handleEditMarcas(record)}
          />
          <Button
            type="text"
            onClick={() => handleActiveStatus(record.id, record.ativo)}
          >
            {record.ativo == true ? "Desativar" : "Ativar"}
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
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Marcas</h1>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddMarcas}
          >
            Cadastrar Marca
          </Button>
        </div>

        <Card>
          <div className="mb-4">
            <Input
              placeholder="Buscar marca..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center">
              <Spin />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table
                columns={columns}
                dataSource={filteredMarcas}
                rowKey="id"
                scroll={{ x: true }}
              />
            </div>
          )}
        </Card>
        <Modal
          title={editingMarca ? "Editar Marca" : "Cadastrar Marca"}
          open={isModalVisible}
          onOk={handleModalOk}
          okText="Confirmar"
          cancelText="Cancelar"
          onCancel={() => setIsModalVisible(false)}
          width={screens.xs ? "95vw" : 600}
          style={{ top: screens.xs ? 8 : 24 }}
        >
          <Form form={form} layout="vertical" className="mt-4">
            <Form.Item
              label="Nome"
              name="nome"
              rules={[{ required: true, message: "Por favor, insira o nome!" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Origem"
              name="origem"
              rules={[
                { required: true, message: "Por favor, selecione a origem!" },
              ]}
            >
              <Radio.Group
                options={[
                  { value: "Internacional", label: "Internacional" },
                  { value: "Nacional", label: "Nacional" },
                ]}
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AppLayout>
  );
}
