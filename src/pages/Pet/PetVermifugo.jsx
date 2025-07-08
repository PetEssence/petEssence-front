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
  Layout,
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
const { Header, Sider, Content } = Layout;

export default function PetVermifugo() {
  const [vermifugos, setVermifugos] = useState([]);
    const [pet, setPet] = useState([]);
  
  const { petId } = useParams();

  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingVermifugo, setEditingVermifugo] = useState(null);
  const [form] = Form.useForm();
  const vermifugoCollectionRef = collection(db, "vermifugo");
  const petCollectionRef = collection(db, "pet");
  const usuarioCollectionRef = collection(db, "usuario");

  const vermifugoOptions = [
    { value: "Antiparasitário", label: "Antiparasitário" },
    { value: "Comprimido", label: "Comprimido" },
    { value: "Líquido", label: "Líquido" },
    { value: "Tópico", label: "Tópico" },
    { value: "Pasta", label: "Pasta" },
    { value: "Injetável", label: "Injetável" },
  ];

  useEffect(() => {
    loadVermifugo();
  }, []);

  const loadPet = async () => {
    setLoading(true);
    try {
      const docRef = doc(petCollectionRef, petId);
      const data = await getDoc(docRef);
      setPet({ ...data.data(), id: data.id });
    } catch (error) {
      message.error("Erro ao carregar pet");
      console.log(error);
    }
  };

    const loadUsuarios = async () => {
      try {
        const q = query(
          usuarioCollectionRef,
          where("isActive", "==", true),
          where("role", "==", "client")
        );
        const usuarioData = await getDocs(q);
        setUsuarios(
          usuarioData.docs.map((doc) => ({ ...doc.data(), id: doc.id }))
        );
      } catch (error) {
        message.error("Erro ao carregar clientes");
      }
    };
  
  const loadVermifugo = async () => {
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
    const getOwnerName = (ownerId) => {
    const owner = usuarios.find((u) => u.id === ownerId);
    return owner ? owner.name : "Dono não encontrado";
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
      applicationDate: vermifugo.applicationDate
        ? dayjs(vermifugo.applicationDate)
        : null,
    };
    form.setFieldsValue(formData);

    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingVermifugo) {
        const updatedData = vermifugos.map((vermifugo) =>
          vermifugo.id === editingVermifugo.id
            ? { ...vermifugo, ...values }
            : vermifugo
        );
        setVermifugos(updatedData);
        message.success("Vermífugação atualizada com sucesso!");
      } else {
        const docRef = await addDoc(vermifugoCollectionRef, {
          ...values,
          applicationDate: values.applicationDate
            ? values.applicationDate.format("YYYY-MM-DD")
            : null,
          createdAt: new Date().toISOString().split("T")[0],
          isActive: true,
          petId: petId,
        });
        setVermifugos([
          ...vermifugos,
          {
            ...values,
            id: docRef.id,
            applicationDate: values.applicationDate
              ? values.applicationDate.format("YYYY-MM-DD")
              : null,
            createdAt: new Date().toISOString().split("T")[0],
            isActive: true,
            petId: petId,
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

  const handleActiveStatusVermifugacao = (id, activeStatus) => {
    Modal.confirm({
      title: `Confirmar ${activeStatus ? "inativação" : "ativação"}`,
      content: `Tem certeza que deseja ${
        activeStatus ? "desativar" : "ativar"
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
          const newStatus = { isActive: !activeStatus };
          await updateDoc(vermifugoDoc, newStatus);
          const updatedData = vermifugos.map((item) =>
            item.id === id ? { ...item, isActive: !activeStatus } : item
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
      title: "Data de aplicação",
      dataIndex: "applicationDate",
      width: 800,
      key: "applicationDate",
      render: (_, record) => {
        const formatDate = (value) => {
          if (!value) return "-";
          return dayjs(value).format("DD/MM/YYYY");
        };

        return (
          <div className="flex items-center space-x-3">
            <div>
              <div className="text-gray-500 text-sm">
                {formatDate(record.applicationDate)}
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
      dataIndex: "petWeight",
      width: 800,
      key: "petWeight",
      render: (_, record) => (
        <div className="flex items-center space-x-3">
          <div>
            <div className="text-gray-500 text-sm">{record.petWeight}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Tipo do vermífugo",
      dataIndex: "vermifugeType",
      width: 800,
      key: "vermifugeType",
      render: (_, record) => (
        <div className="flex items-center space-x-3">
          <div>
            <div className="text-gray-500 text-sm">{record.vermifugeType}</div>
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
            onClick={() => handleEditVermifugo(record)}
          />
          <Button
            type="text"
            onClick={() =>
              handleActiveStatusVermifugacao(record.id, record.isActive)
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
      <PetLayout petId={petId} />
      <div className="flex gap-5 pt-6">
        <PetCard/>
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
              Adicionar Vermifugação
            </Button>
          </div>

          <Table
            columns={columns}
            dataSource={vermifugos}
            rowKey="id"
            loading={loading}
          />
          <Modal
            title={
              editingVermifugo
                ? "Editar Vermifugação"
                : "Adicionar Vermifugação"
            }
            open={isModalVisible}
            onOk={handleModalOk}
            okText="Confirmar"
            cancelText="Cancelar"
            onCancel={() => setIsModalVisible(false)}
            width={600}
          >
            <Form form={form} layout="vertical" className="mt-4">
              <Form.Item
                label="Data da aplicação"
                name="applicationDate"
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
                        return Promise.reject("A data não pode ser no futuro!");
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
                label="Peso do pet"
                name="petWeight"
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
                name="vermifugeType"
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
