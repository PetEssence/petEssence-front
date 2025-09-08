import { useState, useEffect } from "react";
import {
  Button,
  Form,
  message,
  DatePicker,
  Select,
  Modal,
  Table,
  Space,
  Tag,
  InputNumber,
} from "antd";
import AppLayout from "../../components/Layout";
import { PlusOutlined, EditOutlined } from "@ant-design/icons";
import {
  collection,
  getDocs,
  updateDoc,
  query,
  where,
  addDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import dayjs from "dayjs";
import { useParams } from "react-router-dom";
import PetLayout from "../../components/PetLayout";
import PetCard from "../../components/PetCard";

export default function PetVermifugo() {
  const [vermifugos, setVermifugos] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const { petId } = useParams();

  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingVermifugo, setEditingVermifugo] = useState(null);
  const [form] = Form.useForm();
  const vermifugoCollectionRef = collection(db, "vermifugo");
  const marcaCollectionRef = collection(db, "marca");

  const vermifugoOptions = [
    { value: "Antiparasitário", label: "Antiparasitário" },
    { value: "Comprimido", label: "Comprimido" },
    { value: "Líquido", label: "Líquido" },
    { value: "Tópico", label: "Tópico" },
    { value: "Pasta", label: "Pasta" },
    { value: "Injetável", label: "Injetável" },
  ];

  useEffect(() => {
    listarVermifugo();
    listarMarcas();
  }, []);

  const listarVermifugo = async () => {
    setLoading(true);
    try {
      const q = query(vermifugoCollectionRef, where("petId", "==", petId));
      const data = await getDocs(q);
      setVermifugos(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    } catch (error) {
      message.error("Erro ao carregar os vermífugos pet");
    } finally {
      setLoading(false);
    }
  };

  const listarMarcas = async () => {
    try {
      const q = query(marcaCollectionRef, where("ativo", "==", true));
      const data = await getDocs(q);
      setMarcas(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    } catch (error) {
      message.error("Erro ao carregar as marcas");
    }
  };

  const handleAddVermifugo = () => {
    setEditingVermifugo(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditVermifugo = (vermifugo) => {
    setEditingVermifugo(vermifugo);
    const formData = {
      ...vermifugo,
      dataAplicacao: vermifugo.dataAplicacao
        ? dayjs(vermifugo.dataAplicacao)
        : null,
    };
    form.setFieldsValue(formData);

    setIsModalVisible(true);
  };

  const editar = async () => {
    try {
      const values = await form.validateFields();
      const formattedValues = {
        ...values,
        ativo: true,
        dataAplicacao: values.dataAplicacao
          ? values.dataAplicacao.format("YYYY-MM-DD")
          : null,
        petId: petId,
      };
      if (editingVermifugo) {
        const vermifugoDoc = doc(vermifugoCollectionRef, editingVermifugo.id);
        const updatedData = vermifugos.map((vermifugo) =>
          vermifugo.id === editingVermifugo.id
            ? { ...vermifugo, ...values }
            : vermifugo
        );
        setVermifugos(updatedData);
        await updateDoc(vermifugoDoc, formattedValues);
        message.success("Vermífugação atualizada com sucesso!");
      } else {
        const docRef = await addDoc(vermifugoCollectionRef, {
          ...formattedValues,
          dataCriacao: new Date().toISOString().split("T")[0],
        });
        setVermifugos([
          ...vermifugos,
          {
            ...formattedValues,
            id: docRef.id,
            dataCriacao: new Date().toISOString().split("T")[0],
          },
        ]);
        message.success("Vermifugação adicionada com sucesso!");
      }
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error("Erro na validação:", error);
    }
  };

  const ativarInativar = (id, ativo) => {
    Modal.confirm({
      title: `Confirmar ${ativo ? "inativação" : "ativação"}`,
      content: `Tem certeza que deseja ${
        ativo ? "desativar" : "ativar"
      } esta vermifugação do pet?`,
      okText: "Confirmar",
      okType: "primary",
      cancelText: "Cancelar",
      okButtonProps: {
        className: "!bg-primaryGreen !hover:bg-primaryGreenHouver",
      },
      onOk: async () => {
        try {
          const vermifugoDoc = doc(vermifugoCollectionRef, id);
          const newStatus = { ativo: !ativo };
          await updateDoc(vermifugoDoc, newStatus);
          const updatedData = vermifugos.map((item) =>
            item.id === id ? { ...item, ativo: !ativo } : item
          );
          setVermifugos(updatedData);
          message.success("Vermifugação atualizada com sucesso!");
        } catch (error) {
          message.error("Erro ao excluir Vermifugação ");
        }
      },
    });
  };

  const columns = [
    {
      title: "Data da Aplicação",
      dataIndex: "dataAplicacao",
      width: 800,
      key: "dataAplicacao",
      render: (_, record) => {
        const formatDate = (value) => {
          if (!value) return "-";
          return dayjs(value).format("DD/MM/YYYY");
        };

        return (
          <div className="flex items-center space-x-3">
            <div>
              <div className="text-gray-500 text-sm">
                {formatDate(record.dataAplicacao)}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Dose (mg)",
      dataIndex: "dose",
      width: 800,
      key: "dose",
      render: (_, record) => (
        <div className="flex items-center space-x-3">
          <div>
            <div className="text-gray-500 text-sm">{record.dose}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Peso do Pet (kg)",
      dataIndex: "peso",
      width: 800,
      key: "peso",
      render: (_, record) => (
        <div className="flex items-center space-x-3">
          <div>
            <div className="text-gray-500 text-sm">{record.peso}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Tipo do Vermífugo",
      dataIndex: "tipo",
      width: 800,
      key: "tipo",
      render: (_, record) => (
        <div className="flex items-center space-x-3">
          <div>
            <div className="text-gray-500 text-sm">{record.tipo}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Status",
      key: "ativo",
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
            onClick={() => handleEditVermifugo(record)}
          />
          <Button
            type="text"
            onClick={() =>
              ativarInativar(record.id, record.ativo)
            }
          >
            {record.ativo == true ? "Desativar" : "Ativar"}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <AppLayout>
      <PetLayout petId={petId} />
      <div className="flex gap-5 pt-6">
        <PetCard />
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2 mt-4 ml-2">
                Vermifugações do Pet
              </h1>
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddVermifugo}
            >
              Cadastrar Vermifugação
            </Button>
          </div>

          <Table
            columns={columns}
            dataSource={vermifugos}
            rowKey="id"
            loading={loading}
            locale={{ emptyText: "Não há registros." }}
          />
          <Modal
            title={
              editingVermifugo
                ? "Editar Vermifugação"
                : "Cadastrar Vermifugação"
            }
            open={isModalVisible}
            onOk={editar}
            okText="Confirmar"
            cancelText="Cancelar"
            onCancel={() => setIsModalVisible(false)}
            width={600}
          >
            <Form form={form} layout="vertical" className="mt-4">
              <div className="w-full flex gap-8 justify-between">
                <Form.Item
                  label="Data da aplicação"
                  name="dataAplicacao"
                  className="w-3/6"
                  rules={[
                    {
                      required: true,
                      message: "Por favor, insira a data de aplicação!",
                    },
                    {
                      validator: (_, value) => {
                        if (!value) return Promise.resolve();
                        if (value.isAfter(dayjs())) {
                          return Promise.reject(
                            "A data não pode ser no futuro!"
                          );
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <DatePicker
                    format="DD/MM/YYYY"
                    style={{ width: "100%" }}
                    placeholder="Selecione uma data"
                    disabledDate={(current) =>
                      current && current > dayjs().endOf("day")
                    }
                  />
                </Form.Item>

                <Form.Item
                  label="Marca"
                  className="w-3/6"
                  name="idMarca"
                  rules={[
                    {
                      required: true,
                      message: "Por favor, selecione a marca!",
                    },
                  ]}
                >
                  <Select
                    placeholder="Selecione a marca"
                    defaultValue={undefined}
                  >
                    {marcas.map((marca) => (
                      <Option key={marca.id} value={marca.id}>
                        {marca.nome}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>
              <Form.Item
                label="Peso do pet"
                name="peso"
                rules={[
                  {
                    required: true,
                    message: "Por favor, insira o peso do pet!",
                  },
                ]}
              >
                <InputNumber
                  addonAfter="kg"
                  decimalSeparator=","
                  keyboard={false}
                  precision={2}
                  min={0}
                  placeholder="Insira o peso do pet"
                />
              </Form.Item>
              <Form.Item
                label="Dose"
                name="dose"
                rules={[
                  {
                    required: true,
                    message: "Por favor, insira a dose",
                  },
                ]}
              >
                <InputNumber
                  addonAfter="mg"
                  decimalSeparator=","
                  keyboard={false}
                  precision={3}
                  min={0}
                  placeholder="Insira o a dose do vermífugo"
                />
              </Form.Item>

              <Form.Item
                label="Tipo do vermífugo"
                name="tipo"
                rules={[
                  {
                    required: true,
                    message: "Por favor, insira a dose",
                  },
                ]}
              >
                <Select
                  placeholder="Selecione o tipo do vermífugo"
                  defaultValue={undefined}
                  options={vermifugoOptions}
                />
              </Form.Item>
            </Form>
          </Modal>
        </div>
      </div>
    </AppLayout>
  );
}
