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
          dataCriacao: new Date().toISOString().split("T")[0],
        });
        setVacina([
          ...vacina,
          {
            id: docRef.id,
            ...formattedValues,
            dataCriacao: new Date().toISOString().split("T")[0],
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

  const filteredVacinas = vacina.filter((vacina) =>
    vacina.nome.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: "Nome",
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
      title: "Doença alvo",
      dataIndex: "doencaAlvo",
      width: 800,
      key: "doencaAlvo",
      render: (_, record) => (
        <div className="flex items-center space-x-3">
          <div>
            <div className="text-gray-500 text-sm">{record.doencaAlvo}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Período de reaplicação",
      dataIndex: "periodoReaplicacao",
      width: 800,
      key: "periodoReaplicacao",
      render: (_, record) => {
        const option = optionsSelectReaplicationPeriod.find(
          (opt) => opt.value === record.periodoReaplicacao
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
            Cadastrar vacina
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
            locale={{ emptyText: "Não há registros."}}
          />
        </Card>

        <Modal
          title={editingVacina ? "Editar vacina" : "Cadastrar vacina"}
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

            <Form.Item
              label="Doença alvo"
              name="doencaAlvo"
              rules={[{ required: true, message: "Por favor, insira a doença alvo!" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Período de reaplicação"
              name="periodoReaplicacao"
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
