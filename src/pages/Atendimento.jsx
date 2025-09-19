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
  Grid,
  List,
  Empty,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import AppLayout from "../components/Layout";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../config/firebase";
import dayjs from "dayjs";
import { useAuth } from "../contexts/AuthContext";

export default function Atendimento() {
  const { useBreakpoint } = Grid;
  const screens = useBreakpoint();
  const [atendimentos, setAtendimentos] = useState([]);
  const [veterinarios, setVeterinarios] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [pets, setPets] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [detalhesAtendimento, setDetalhesAtendimento] = useState(null);
  const [editando, setEditando] = useState(null);
  const [form] = Form.useForm();
  const { cargoUsuario } = useAuth();
  const atendimentoCollectionRef = collection(db, "atendimento");
  const usuarioCollectionRef = collection(db, "usuario");
  const petCollectionRef = collection(db, "pet");

  const mostrarBotoesAcoes = () => {
    if (cargoUsuario == "cliente" || cargoUsuario == "funcionario") return;
    return [
      <Button
        key="status"
        onClick={() =>
          ativarInativar(detalhesAtendimento.id, detalhesAtendimento.ativo)
        }
      >
        {detalhesAtendimento?.ativo ? "Desativar" : "Ativar"}
      </Button>,
      <Button
        key="edit"
        type="primary"
        onClick={() => abrirModalEditar(detalhesAtendimento)}
      >
        Editar
      </Button>,
    ];
  };

  useEffect(() => {
    listarAtendimentos();
    listarUsuarios();
    listarPets();
  }, []);

  const listarAtendimentos = async () => {
    setCarregando(true);
    try {
      const data = await getDocs(atendimentoCollectionRef);
      const dataDoc = data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      setAtendimentos(dataDoc);
    } catch (error) {
      message.error("Erro ao carregar atendimentos");
    } finally {
      setCarregando(false);
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
      const data = await getDocs(petCollectionRef);
      const dataDoc = data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      setPets(dataDoc);
    } catch (error) {
      message.error("Erro ao carregar pets");
    }
  };

  const celulaDataRender = (value) => {
    const atendimentosDoDia = atendimentos.filter(
      (item) => item.data === value.format("YYYY-MM-DD")
    );
    return (
      <ul className="p-0 m-0 list-none">
        {atendimentosDoDia.map((item) => (
          <li
            key={item.id}
            className="rounded-lg px-2 py-1 my-1 cursor-pointer hover:bg-gray-50 transition border-l-4 border-primaryGreen"
            onClick={() => setDetalhesAtendimento(item)}
          >
            <Badge
              status={item.ativo ? "success" : "error"}
              text={
                <span className="text-sm">
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

  const abrirModalCadastro = () => {
    setEditando(null);
    form.resetFields();
    setModalVisivel(true);
  };

  const ativarInativar = (id, ativoStatus) => {
    Modal.confirm({
      title: `Confirmar ${ativoStatus ? "inativação" : "ativação"}`,
      content: `Tem certeza que deseja ${
        ativoStatus ? "desativar" : "ativar"
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
          const novoStatus = { ativo: !ativoStatus };
          await updateDoc(atendimentoDoc, novoStatus);
          const dadoEditado = atendimentos.map((item) =>
            item.id === id ? { ...item, ativo: !ativoStatus } : item
          );
          setDetalhesAtendimento(dadoEditado);
          setAtendimentos(dadoEditado);
          setDetalhesAtendimento(null);
          message.success("Atendimento atualizado com sucesso!");
        } catch (error) {
          message.error("Erro ao atualizar atendimento");
        }
      },
    });
  };

  const abrirModalEditar = (atendimento) => {
    setDetalhesAtendimento(null);
    setEditando(atendimento);
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
    setModalVisivel(true);
  };

  const tempoStringParaMinutos = (timeStr) => {
    if (!timeStr) return null;
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  };

  const dayjsParaMinutos = (d) => {
    if (!d) return null;
    return d.hour() * 60 + d.minute();
  };

  const verificarDisponibilidade = (
    vetId,
    dataStr,
    minutoInicial,
    minutoFinal,
    idIgnorado = null
  ) => {
    if (!vetId || !dataStr || minutoInicial == null || minutoFinal == null)
      return true;

    const conflito = atendimentos.some((item) => {
      if (idIgnorado && item.id === idIgnorado) return false;
      if (item.veterinario !== vetId) return false;
      if (item.data !== dataStr) return false;
      if (!item.horarioInicio || !item.horarioFinal) return false;
      if (item.ativo === false) return false;

      const itemStart = tempoStringParaMinutos(item.horarioInicio);
      const itemEnd = tempoStringParaMinutos(item.horarioFinal);
      if (itemStart == null || itemEnd == null) return false;

      return minutoInicial < itemEnd && itemStart < minutoFinal;
    });

    return !conflito;
  };

  const salvarAtendimento = async () => {
    try {
      const dados = await form.validateFields();
      const dadosFormatados = {
        ...dados,
        horarioInicio: dados.horario ? dados.horario[0].format("HH:mm") : null,
        horarioFinal: dados.horario ? dados.horario[1].format("HH:mm") : null,
        data: dados.data ? dados.data.format("YYYY-MM-DD") : null,
        ativo: true,
        descricao: dados.descricao ? dados.descricao : null,
      };
      delete dadosFormatados.horario;

      const minutoInicio = dados.horario
        ? dayjsParaMinutos(dados.horario[0])
        : null;
      const minutoFinal = dados.horario
        ? dayjsParaMinutos(dados.horario[1])
        : null;
      const dataStr = dados.data ? dados.data.format("YYYY-MM-DD") : null;
      const vetId = dados.veterinario;
      const idIgnorado = editando ? editando.id : null;

      const disponivel = verificarDisponibilidade(
        vetId,
        dataStr,
        minutoInicio,
        minutoFinal,
        idIgnorado
      );

      if (!disponivel) {
        message.error(
          "Veterinário indisponível nesse horário. Escolha outro horário ou veterinário."
        );
        return;
      }

      if (editando) {
        const atendimentoDoc = doc(atendimentoCollectionRef, editando.id);
        const atendimentosEditados = atendimentos.map((atendimento) =>
          atendimento.id === editando.id
            ? { ...atendimento, ...dadosFormatados }
            : atendimento
        );
        setAtendimentos(atendimentosEditados);
        await updateDoc(atendimentoDoc, dadosFormatados);
        message.success("Atendimento atualizado com sucesso!");
      } else {
        const docRef = await addDoc(atendimentoCollectionRef, {
          ...dadosFormatados,
          dataCriacao: new Date().toISOString().split("T")[0],
        });
        setAtendimentos([
          ...atendimentos,
          {
            id: docRef.id,
            ...dadosFormatados,
            dataCriacao: new Date().toISOString().split("T")[0],
          },
        ]);
        message.success("Atendimento adicionado com sucesso!");
      }
      setModalVisivel(false);
      form.resetFields();
    } catch (error) {
      console.error("Erro na validação:", error);
    }
  };

  const pegaNomeUsuario = (ownerId) => {
    const tutor = usuarios.find((u) => u.id === ownerId);
    return tutor ? tutor.nome : "Dono não encontrado";
  };
  const pegaNomePet = (petId) => {
    const pet = pets.find((p) => p.id === petId);
    return pet ? pet.nome : "Pet não encontrado";
  };

  const pegaTutoresAnimal = (petId) => {
    const pet = pets.find((p) => p.id === petId);
    return pet.tutorAnimal?.map((t) => pegaNomeUsuario(t));
  };

  const listaMobile = () => {
    if (atendimentos.length === 0)
      return <Empty description="Nenhum atendimento agendado" />;
    return (
      <List
        dataSource={atendimentos.sort((a, b) => a.data.localeCompare(b.data))}
        renderItem={(item) => (
          <List.Item
            className="px-3 py-2 border-b cursor-pointer hover:bg-gray-50"
            onClick={() => setDetalhesAtendimento(item)}
          >
            <List.Item.Meta
              title={
                <span className="font-medium">
                  {dayjs(item.data).format("DD/MM")} -{" "}
                  {item.descricao || "Atendimento"}
                </span>
              }
              description={`${item.horarioInicio} - ${item.horarioFinal}`}
            />
            <Tag color={item.ativo ? "green" : "red"}>
              {item.ativo ? "Ativo" : "Inativo"}
            </Tag>
          </List.Item>
        )}
      />
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6 relative">
        <div className="flex justify-between items-center flex-col md:flex-row ">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">
            Atendimentos
          </h1>

          {cargoUsuario === "veterinario" && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={abrirModalCadastro}
            >
              Cadastrar Atendimento
            </Button>
          )}
        </div>
        <Card loading={carregando}>
          {screens.xs ? (
            listaMobile()
          ) : (
            <Calendar cellRender={celulaDataRender} fullscreen />
          )}
        </Card>
        {/* Modal Detalhes */}
        <Modal
          title="Detalhes do Atendimento"
          open={!!detalhesAtendimento}
          onCancel={() => setDetalhesAtendimento(null)}
          footer={mostrarBotoesAcoes}
          width={screens.xs ? "95vw" : 600}
          style={{ top: screens.xs ? 8 : 24 }}
        >
          {detalhesAtendimento && (
            <div className="space-y-3 text-sm">
              <div className="flex flex-col sm:flex-row gap-4">
                <p>
                  <b>Pet:</b> {pegaNomePet(detalhesAtendimento.pet)}
                </p>
                <p>
                  <b>Tutor(es):</b> {pegaTutoresAnimal(detalhesAtendimento.pet) + ", "}
                </p>
              </div>
              <p>
                <b>Descrição:</b> {detalhesAtendimento.descricao}
              </p>
              <p>
                <b>Veterinário:</b>{" "}
                {pegaNomeUsuario(detalhesAtendimento.veterinario)}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
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

        {/* Modal Form */}
        <Modal
          title={editando ? "Editar Atendimento" : "Cadastrar Atendimento"}
          open={modalVisivel}
          onOk={salvarAtendimento}
          okText="Confirmar"
          cancelText="Cancelar"
          onCancel={() => setModalVisivel(false)}
          width={screens.xs ? "95vw" : 700}
          style={{ top: screens.xs ? 8 : 24 }}
        >
          <Form form={form} layout="vertical" className="mt-4 flex flex-col">
            <Form.Item
              label="Pet"
              name="pet"
              rules={[
                { required: true, message: "Por favor, selecione o pet!" },
              ]}
            >
              <Select
                placeholder="Selecione o pet"
                showSearch
              >
                {pets.map((pet) => (
                  <Select.Option key={pet.id} value={pet.id}>
                    {pet.nome} (
                    {pet.tutorAnimal.map((id) => pegaNomeUsuario(id) + ", ")})
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
              <Select
                placeholder="Selecione o veterinário"
                showSearch
                optionFilterProp="children"
              >
                {veterinarios.map((vet) => (
                  <Select.Option key={vet.id} value={vet.id}>
                    {vet.nome}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <div className="w-full flex flex-col md:flex-row gap-4">
              <Form.Item
                label="Data do atendimento"
                name="data"
                rules={[
                  { required: true, message: "Por favor, selecione a data!" },
                ]}
                className="flex-1"
              >
                <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
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
                className="flex-1"
              >
                <TimePicker.RangePicker
                  format="HH:mm"
                  minuteStep={15}
                  needConfirm={false}
                  style={{ width: "100%" }}
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
