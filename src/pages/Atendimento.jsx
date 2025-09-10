import { useState, useEffect } from "react";
import {
  Card,
  Button,
  Input,
  Modal,
  Form,
  message,
  Select,
  TimePicker,
  DatePicker,
  InputNumber,
  Calendar,
  Tag,
  Badge,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import AppLayout from "../components/Layout";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  where,
  query,
} from "firebase/firestore";
import { db } from "../config/firebase";
import dayjs from "dayjs";
import { getNodeText } from "@testing-library/dom";

export default function Atendimento() {
  const [atendimentos, setAtendimentos] = useState([]);
  const [veterinarios, setVeterinarios] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [detalhesAtendimento, setDetalhesAtendimento] = useState(null);
  const [ediiting, setEditing] = useState(null);
  const [form] = Form.useForm();
  const atendimentoCollectionRef = collection(db, "atendimento");
  const usuarioCollectionRef = collection(db, "usuario");
  const petCollectionRef = collection(db, "pet");

  useEffect(() => {
    listarAtendimentos();
    listarUsuarios();
    listarPets();
  }, []);

  const listarAtendimentos = async () => {
    setLoading(true);
    try {
      const data = await getDocs(atendimentoCollectionRef);
      setAtendimentos(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    } catch (error) {
      message.error("Erro ao carregar atendimentos");
    } finally {
      setLoading(false);
    }
  };

  const listarUsuarios = async () => {
    try {
      const data = await getDocs(usuarioCollectionRef);
      const dataDoc = data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      setUsuarios(dataDoc);

      setVeterinarios(dataDoc.filter((doc) => doc.cargo === "veterinario"));
    } catch (error) {
      message.error("Erro ao carregar os usuários");
    }
  };

  const listarPets = async () => {
    try {
      const q = query(petCollectionRef, where("ativo", "==", true));
      const data = await getDocs(petCollectionRef);
      setPets(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    } catch (error) {
      message.error("Erro ao carregar pets");
    }
  };

  const dateCellRender = (value) => {
    const atendimentosDoDia = atendimentos.filter(
      (item) => item.data === value.format("YYYY-MM-DD")
    );
    return (
      <ul className="p-0 m-0 list-none">
        {atendimentosDoDia.map((item) => (
          <li
            key={item.id}
            className="border-2 rounded p-1 my-2 cursor-pointer"
            onClick={() => setDetalhesAtendimento(item)}
          >
            <Badge
              status={item.ativo ? "success" : "error"}
              text={
                <span>
                  {item.descricao || "Atendimento"} ({item.horarioInicio} -{" "}
                  {item.horarioFinal})
                </span>
              }
            />
          </li>
        ))}
      </ul>
    );
  };

  const handleAddAtendimento = () => {
    setEditing(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const ativarInativar = (id, activeStatus) => {
    Modal.confirm({
      title: `Confirmar ${activeStatus ? "inativação" : "ativação"}`,
      content: `Tem certeza que deseja ${
        activeStatus ? "desativar" : "ativar"
      } este atendimento?`,
      okText: "Confirmar",
      okType: "primary",
      cancelText: "Cancelar",
      okButtonProps: {
        className: "!bg-primaryGreen !hover:bg-primaryGreenHouver",
      },
      onOk: async () => {
        try {
          const atendimentoDoc = doc(atendimentoCollectionRef, id);
          const newStatus = { ativo: !activeStatus };
          await updateDoc(atendimentoDoc, newStatus);
          const updatedData = atendimentos.map((item) =>
            item.id === id ? { ...item, ativo: !activeStatus } : item
          );
          setDetalhesAtendimento(updatedData);
          setAtendimentos(updatedData);
          setDetalhesAtendimento(null);
          message.success("Atendimento atualizado com sucesso!");
        } catch (error) {
          message.error("Erro ao atualizar atendimento");
        }
      },
    });
  };
  const handleEditAtendimento = (atendimento) => {
    setDetalhesAtendimento(null);
    setEditing(atendimento);
    form.setFieldsValue({
      ...atendimento,
      data: atendimento.data ? dayjs(atendimento.data) : null,
      horario:
        atendimento.horarioInicio && atendimento.horarioFinal
          ? [
              dayjs(atendimento.horarioInicio, "HH:mm"),
              dayjs(atendimento.horarioFinal, "HH:mm"),
            ]
          : [],
    });
    setIsModalVisible(true);
  };
  const editarAtendimento = async () => {
    try {
      const values = await form.validateFields();
      const formattedValues = {
        ...values,
        horarioInicio: values.horario
          ? values.horario[0].format("HH:mm")
          : null,
        horarioFinal: values.horario ? values.horario[1].format("HH:mm") : null,
        data: values.data ? values.data.format("YYYY-MM-DD") : null,
        ativo: true,
        descricao: values.descricao ? values.descricao : null,
      };
      delete formattedValues.horario;

      if (ediiting) {
        const atendimentoDoc = doc(atendimentoCollectionRef, ediiting.id);
        const updatedAtendimentos = atendimentos.map((atendimento) =>
          atendimento.id === ediiting.id
            ? { ...atendimento, ...formattedValues }
            : atendimento
        );
        setAtendimentos(updatedAtendimentos);
        await updateDoc(atendimentoDoc, formattedValues);
        message.success("Atendimento atualizado com sucesso!");
      } else {
        const docRef = await addDoc(atendimentoCollectionRef, {
          ...formattedValues,
          dataCriacao: new Date().toISOString().split("T")[0],
        });
        setAtendimentos([
          ...atendimentos,
          {
            id: docRef.id,
            ...formattedValues,
            dataCriacao: new Date().toISOString().split("T")[0],
          },
        ]);
        message.success("Atendimento adicionado com sucesso!");
      }
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error("Erro na validação:", error);
    }
  };

  const getUserName = (ownerId) => {
    const owner = usuarios.find((u) => u.id === ownerId);
    return owner ? owner.nome : "Dono não encontrado";
  };
  const getPetName = (petId) => {
    const pet = pets.find((p) => p.id === petId);
    return pet ? pet.nome : "Pet não encontrado";
  };

  const getOwners = (petId) => {
    const pet = pets.find((p) => p.id === petId);
    return pet.tutorAnimal?.map((t) => getUserName(t));
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Atendimentos
          </h1>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddAtendimento}
          >
            Cadastrar Atendimento
          </Button>
        </div>

        <Card loading={loading}>
          <Calendar cellRender={dateCellRender} />
        </Card>
        <Modal
          title="Detalhes do Atendimento"
          open={!!detalhesAtendimento}
          onCancel={() => setDetalhesAtendimento(null)}
          footer={[
            <Button
              key="status"
              onClick={() =>
                ativarInativar(
                  detalhesAtendimento.id,
                  detalhesAtendimento.ativo
                )
              }
            >
              {detalhesAtendimento?.ativo ? "Desativar" : "Ativar"}
            </Button>,
            <Button
              key="edit"
              type="primary"
              onClick={() => handleEditAtendimento(detalhesAtendimento)}
            >
              Editar
            </Button>,
          ]}
        >
          {detalhesAtendimento && (
            <div>
              <div className="flex gap-4">
                <p>
                  <b>Pet:</b> {getPetName(detalhesAtendimento.pet)}
                </p>
                <p>
                  <b>Tutor(es):</b> {getOwners(detalhesAtendimento.pet)}
                </p>
              </div>
              <p>
                <b>Descrição:</b> {detalhesAtendimento.descricao}
              </p>
              <p>
                <b>Veterinário:</b>{" "}
                {getUserName(detalhesAtendimento.veterinario)}
              </p>
              <div className="flex gap-4">
                <p>
                  <b>Horário:</b> {detalhesAtendimento.horarioInicio} -{" "}
                  {detalhesAtendimento.horarioFinal}
                </p>
                <p>
                  <b>Data:</b>{" "}
                  {dayjs(detalhesAtendimento.data).format("DD/MM/YYYY")}
                </p>
              </div>
              <p>
                <b>Valor:</b> R$ {detalhesAtendimento.valor}
              </p>
              <p>
                {detalhesAtendimento.ativo ? (
                  <Tag color="green">Ativo</Tag>
                ) : (
                  <Tag color="red">Inativo</Tag>
                )}
              </p>
            </div>
          )}
        </Modal>
        <Modal
          title={ediiting ? "Editar Atendimento" : "Cadastrar Atendimento"}
          open={isModalVisible}
          onOk={editarAtendimento}
          okText="Confirmar"
          cancelText="Cancelar"
          onCancel={() => setIsModalVisible(false)}
          width={600}
        >
          <Form form={form} layout="vertical" className="mt-4 flex flex-col">
            <Form.Item
              label="Pet"
              name="pet"
              rules={[
                {
                  required: true,
                  message: "Por favor, selecione o pet!",
                },
              ]}
            >
              <Select placeholder="Selecione o pet">
                {pets.map((pet) => (
                  <Select.Option key={pet.id} value={pet.id}>
                    {pet.nome} ({pet.tutorAnimal.map((id) => getUserName(id))})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="Descrição" name="descricao">
              <Input />
            </Form.Item>
            <Form.Item
              label="Veterinário"
              name="veterinario"
              rules={[
                {
                  required: true,
                  message: "Por favor, selecione o veterinário!",
                },
              ]}
            >
              <Select placeholder="Selecione o veterinário">
                {veterinarios.map((vet) => (
                  <Select.Option key={vet.id} value={vet.id}>
                    {vet.nome}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <div className="w-full flex gap-8 justify-between flex-row">
              <Form.Item
                label="Data do atendimento"
                name="data"
                rules={[
                  { required: true, message: "Por favor, selecione a data!" },
                ]}
              >
                <DatePicker format="DD/MM/YYYY" />
              </Form.Item>

              <Form.Item
                label="Horário"
                name="horario"
                rules={[
                  {
                    required: true,
                    message: "Por favor, selecione o horário!",
                  },
                ]}
                className="w-3/6"
              >
                <TimePicker.RangePicker
                  format="HH:mm"
                  minuteStep={15}
                  needConfirm={false}
                />
              </Form.Item>
            </div>
            <Form.Item
              label="Valor"
              name="valor"
              rules={[
                { required: true, message: "Por favor, insira o valor!" },
              ]}
            >
              <InputNumber
                addonBefore="R$"
                precision={2}
                min={0}
                style={{ width: "100%" }}
                decimalSeparator=","
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AppLayout>
  );
}
