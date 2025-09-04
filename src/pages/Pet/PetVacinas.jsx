import { useState, useEffect } from "react";
import {
  Button,
  Input,
  Form,
  message,
  DatePicker,
  Select,
  Modal,
  Table,
  Space,
  Tag,
} from "antd";
import AppLayout from "../../components/Layout";
import { PlusOutlined, EditOutlined } from "@ant-design/icons";
import {
  collection,
  getDocs,
  updateDoc,
  addDoc,
  doc,
  where,
  query,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import dayjs from "dayjs";
import { useParams } from "react-router-dom";
import PetLayout from "../../components/PetLayout";
import PetCard from "../../components/PetCard";

const { Option } = Select;

export default function PetVacinas() {
  const [petVacinas, setPetVacinas] = useState([]);
  const [vacinas, setVacinas] = useState([]);
  const { petId } = useParams();

  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPetVacina, setEditingPetVacina] = useState(null);
  const [form] = Form.useForm();
  const vacinaCollectionRef = collection(db, "vacina");
  const petVacinasCollectionRef = collection(db, "petVacina");

  useEffect(() => {
    loadPetVacinas();
    loadVacinas();
  }, []);

  const loadPetVacinas = async () => {
    setLoading(true);
    try {
      const q = query(petVacinasCollectionRef, where("petId", "==", petId));
      const data = await getDocs(q);
      setPetVacinas(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    } catch (error) {
      message.error("Erro ao carregar as vacinas do pet");
    } finally {
      setLoading(false);
    }
  };

  const loadVacinas = async () => {
    try {
      const data = await getDocs(vacinaCollectionRef);
      setVacinas(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    } catch (error) {
      message.error("Erro ao carregar vacinas");
    }
  };

  const handleAddPetVacina = () => {
    setEditingPetVacina(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditPetVacina = (petVacina) => {
    setEditingPetVacina(petVacina);
    const formData = {
      ...petVacina,
      dataAplicacao: petVacina.dataAplicacao
        ? dayjs(petVacina.dataAplicacao)
        : null,
    };
    form.setFieldsValue(formData);
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const formattedValues = {
        ...values,
        dataAplicacao: values.dataAplicacao
          ? values.dataAplicacao.format("YYYY-MM-DD")
          : null,
        petId: petId,
        isActive: true,
      };

      if (editingPetVacina) {
        const petVacinaDoc = doc(petVacinasCollectionRef, editingPetVacina.id);
        const updatedData = petVacinas.map((petVacina) =>
          petVacina.id === editingPetVacina.id
            ? { ...petVacina, ...values }
            : petVacina
        );
        setPetVacinas(updatedData);
        await updateDoc(petVacinaDoc, formattedValues);
        message.success("Vacina do pet atualizada com sucesso!");
      } else {
        const docRef = await addDoc(petVacinasCollectionRef, {
          ...formattedValues,
          createdAt: new Date().toISOString().split("T")[0],
        });
        setPetVacinas([
          ...petVacinas,
          {
            id: docRef.id,
            ...formattedValues,
            createdAt: new Date().toISOString().split("T")[0],
          },
        ]);
        message.success("Vacina do pet adicionada com sucesso!");
      }
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error("Erro na validação:", error);
    }
  };

  const handleActiveStatusPetVacina = (id, activeStatus) => {
    Modal.confirm({
      title: `Confirmar ${activeStatus ? "inativação" : "ativação"}`,
      content: `Tem certeza que deseja ${
        activeStatus ? "desativar" : "ativar"
      } esta vacina do pet?`,
      okText: "Confirmar",
      okType: "primary",
      cancelText: "Cancelar",
      okButtonProps: {
        className: "!bg-primaryGreen !hover:bg-primaryGreenHouver",
      },
      onOk: async () => {
        try {
          const petVacinaDoc = doc(petVacinasCollectionRef, id);
          const newStatus = { isActive: !activeStatus };
          await updateDoc(petVacinaDoc, newStatus);
          const updatedData = petVacinas.map((item) =>
            item.id === id ? { ...item, isActive: !activeStatus } : item
          );
          setPetVacinas(updatedData);
          message.success("Vacina do pet atualizada com sucesso!");
        } catch (error) {
          message.error("Erro ao excluir vacina");
        }
      },
    });
  };
  const getVaccineName = (idVacina) => {
    const vaccine = vacinas.find((s) => s.id === idVacina);
    return vaccine ? vaccine.nome : "Vacina não encontrada";
  };

  const columns = [
    {
      title: "Vacina",
      dataIndex: "nome",
      width: 800,
      key: "nome",
      render: (_, record) => (
        <div className="flex items-center space-x-3">
          <div>
            <div className="text-gray-500 text-sm">
              {getVaccineName(record.idVacina)}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Data da Aplicação",
      dataIndex: "vaccinationDate",
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
      title: "Código do lote/dose",
      dataIndex: "codigoDoseLote",
      width: 800,
      key: "codigoDoseLote",
      render: (_, record) => (
        <div className="flex items-center space-x-3">
          <div>
            <div className="text-gray-500 text-sm">{record.codigoDoseLote}</div>
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
            onClick={() => handleEditPetVacina(record)}
          />
          <Button
            type="text"
            onClick={() =>
              handleActiveStatusPetVacina(record.id, record.isActive)
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
        <PetCard />

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2 mt-4 ml-2">
                Vacinas do Pet
              </h1>
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddPetVacina}
            >
              Cadastrar Vacina
            </Button>
          </div>

          <Table
            columns={columns}
            dataSource={petVacinas}
            rowKey="id"
            loading={loading}
            locale={{ emptyText: "Não há registros."}}
          />
          <Modal
            title={editingPetVacina ? "Editar Vacina" : "Cadastrar Vacina"}
            open={isModalVisible}
            onOk={handleModalOk}
            okText="Confirmar"
            cancelText="Cancelar"
            onCancel={() => setIsModalVisible(false)}
            width={600}
          >
            <Form form={form} layout="vertical" className="mt-4">
              <Form.Item
                label="Vacina"
                className="w-3/6"
                name="idVacina"
                rules={[
                  { required: true, message: "Por favor, selecione a vacina!" },
                ]}
              >
                <Select
                  placeholder="Selecione a Vacina"
                  defaultValue={undefined}
                >
                  {vacinas.map((vacina) => (
                    <Option key={vacina.id} value={vacina.id}>
                      {vacina.nome}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
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
                label="Código da dose/lote"
                name="codigoDoseLote"
                rules={[
                  {
                    required: true,
                    message: "Por favor, insira o código da dose/lote!",
                  },
                ]}
              >
                <Input />
              </Form.Item>
            </Form>
          </Modal>
        </div>
      </div>
    </AppLayout>
  );
}
