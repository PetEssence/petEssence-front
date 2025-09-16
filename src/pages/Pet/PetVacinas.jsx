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
import { useAuth } from "../../contexts/AuthContext";

const { Option } = Select;

export default function PetVacinas() {
  const [vacinasAplicadas, setVacinasAplicadas] = useState([]);
  const [vacinas, setVacinas] = useState([]);
  const [veterinarios, setVeterinarios] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [editandoVacinasAplicadas, setEditandoVacinasAplicadas] =
    useState(null);
  const [mostrarDataReaplicacao, setMostrarDataReaplicacao] = useState(false);

  const { cargoUsuario } = useAuth();

  const { petId } = useParams();

  const [form] = Form.useForm();

  const vacinaCollectionRef = collection(db, "vacina");
  const vacinasAplicadasCollectionRef = collection(db, "vacinasAplicadas");
  const usuarioCollectionRef = collection(db, "usuario");
  const marcaCollectionRef = collection(db, "marca");

  const valorVacinaForm = Form.useWatch("vacina", form);
  const valorDataAplicacaoForm = Form.useWatch("dataAplicacao", form);

  useEffect(() => {
    listarVacinasAplicadas();
    listarVacinas();
    listarUsuarios();
    listarMarcas();
  }, []);

  const listarVacinasAplicadas = async () => {
    setCarregando(true);
    try {
      const q = query(
        vacinasAplicadasCollectionRef,
        where("petId", "==", petId)
      );
      const data = await getDocs(q);
      const dataDocs = data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      setVacinasAplicadas(dataDocs);
    } catch (error) {
      message.error("Erro ao carregar as vacinas do pet");
    } finally {
      setCarregando(false);
    }
  };

  const listarUsuarios = async () => {
    try {
      const q = query(
        usuarioCollectionRef,
        where("cargo", "==", "veterinario"),
        where("ativo", "==", true)
      );
      const data = await getDocs(q);
      const dataDoc = data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      setVeterinarios(
        dataDoc.filter((doc) => doc.ativo && doc.cargo === "veterinario")
      );
    } catch (error) {
      message.error("Erro ao carregar os veterinarios");
    } finally {
      setCarregando(false);
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

  const listarVacinas = async () => {
    try {
      const data = await getDocs(vacinaCollectionRef);
      setVacinas(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    } catch (error) {
      message.error("Erro ao carregar vacinas");
    }
  };

  const abrirModalCadastro = () => {
    setEditandoVacinasAplicadas(null);
    form.resetFields();
    setModalVisivel(true);
    setMostrarDataReaplicacao(false);
  };

  const abrirModalEditar = (vacinaAplicada) => {
    setEditandoVacinasAplicadas(vacinaAplicada);
    form.setFieldsValue({
      ...vacinaAplicada,
      dataAplicacao: vacinaAplicada.dataAplicacao
        ? dayjs(vacinaAplicada.dataAplicacao)
        : null,
      dataFabricacao: vacinaAplicada.dataFabricacao
        ? dayjs(vacinaAplicada.dataFabricacao)
        : null,
      dataReaplicacao: vacinaAplicada.dataReaplicacao
        ? dayjs(vacinaAplicada.dataReaplicacao)
        : null,
    });
    setModalVisivel(true);
  };

  const salvarVacinaAplicada = async () => {
    try {
      const dados = await form.validateFields();
      const dadosFormatados = {
        ...dados,
        dataFabricacao: dados.dataFabricacao
          ? dados.dataFabricacao.format("YYYY-MM")
          : null,
        dataAplicacao: dados.dataAplicacao
          ? dados.dataAplicacao.format("YYYY-MM-DD")
          : null,
        petId: petId,
        ativo: true,
        dataReaplicacao: dados.dataReaplicacao
          ? dados.dataReaplicacao.format("YYYY-MM-DD")
          : null,
      };

      if (editandoVacinasAplicadas) {
        const vacinaAplicadaDoc = doc(
          vacinasAplicadasCollectionRef,
          editandoVacinasAplicadas.id
        );
        const dadoAtualizado = vacinasAplicadas.map((vacinaAplicada) =>
          vacinaAplicada.id === editandoVacinasAplicadas.id
            ? { ...vacinaAplicada, ...dados }
            : vacinaAplicada
        );
        setVacinasAplicadas(dadoAtualizado);
        await updateDoc(vacinaAplicadaDoc, dadosFormatados);
        message.success("Vacina do pet atualizada com sucesso!");
      } else {
        const docRef = await addDoc(vacinasAplicadasCollectionRef, {
          ...dadosFormatados,
          dataCriacao: new Date().toISOString().split("T")[0],
        });
        setVacinasAplicadas([
          ...vacinasAplicadas,
          {
            id: docRef.id,
            ...dadosFormatados,
            dataCriacao: new Date().toISOString().split("T")[0],
          },
        ]);
        message.success("Vacina do pet adicionada com sucesso!");
      }
      setModalVisivel(false);
      form.resetFields();
      setMostrarDataReaplicacao(false);
    } catch (error) {
      console.error("Erro na validação:", error);
    }
  };

  useEffect(() => {
    if (valorVacinaForm && valorDataAplicacaoForm) {
      const vacina = vacinas.find((vacina) => vacina.id === valorVacinaForm);
      const periodoReaplicacao = vacina?.periodoReaplicacao;

      let qtdDias = 0;

      if (periodoReaplicacao === "Anual") {
        qtdDias = 365;
      } else if (periodoReaplicacao === "Semestral") {
        qtdDias = 180;
      } else if (periodoReaplicacao === "Mensal") {
        qtdDias = 30;
      } else {
        qtdDias = 0;
      }

      if (periodoReaplicacao != "Dose Única") {
        const dataReaplicacao = dayjs(valorDataAplicacaoForm).add(
          qtdDias,
          "day"
        );
        setMostrarDataReaplicacao(true);
        form.setFieldsValue({ dataReaplicacao });
      } else {
        setMostrarDataReaplicacao(false);
      }
    }
  }, [valorVacinaForm, valorDataAplicacaoForm]);

  const ativarInativar = (id, ativoStatus) => {
    Modal.confirm({
      title: `Confirmar ${ativoStatus ? "inativação" : "ativação"}`,
      content: `Tem certeza que deseja ${
        ativoStatus ? "desativar" : "ativar"
      } esta vacina do pet?`,
      okText: "Confirmar",
      okType: "primary",
      cancelText: "Cancelar",
      okButtonProps: {
        className: "!bg-primaryGreen !hover:bg-primaryGreenHouver",
      },
      onOk: async () => {
        try {
          const petVacinaDoc = doc(vacinasAplicadasCollectionRef, id);
          const novoStatus = { ativo: !ativoStatus };
          await updateDoc(petVacinaDoc, novoStatus);
          const dadoEditado = vacinasAplicadas.map((item) =>
            item.id === id ? { ...item, ativo: !ativoStatus } : item
          );
          setVacinasAplicadas(dadoEditado);
          message.success("Vacina do pet atualizada com sucesso!");
        } catch (error) {
          message.error("Erro ao excluir vacina");
        }
      },
    });
  };

  const pegaNomeVacina = (idVacina) => {
    const vacina = vacinas.find((s) => s.id === idVacina);
    return vacina ? vacina.nome : "Vacina não encontrada";
  };

  const colunas = [
    {
      title: "Vacina",
      dataIndex: "nome",
      width: 800,
      key: "nome",
      render: (_, record) => (
        <div className="flex items-center space-x-3">
          <div>
            <div className="text-gray-500 text-sm">
              {pegaNomeVacina(record.vacina)}
            </div>
          </div>
        </div>
      ),
    },
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
      title: "Data de Reaplicação",
      dataIndex: "dataReaplicacao",
      width: 800,
      key: "dataReaplicacao",
      render: (_, record) => {
        const formatDate = (value) => {
          if (!value) return "-";
          return dayjs(value).format("DD/MM/YYYY");
        };

        return (
          <div className="flex items-center space-x-3">
            <div>
              <div className="text-gray-500 text-sm">
                {formatDate(record.dataReaplicacao)}
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
      key: "acoes",
      width: 50,
      align: "center",
      render: (_, record) => (
        <Space>
          {cargoUsuario !== "cliente" && (
            <>
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => abrirModalEditar(record)}
              />
              <Button
                type="text"
                onClick={() => ativarInativar(record.id, record.ativo)}
              >
                {record.ativo == true ? "Desativar" : "Ativar"}
              </Button>
            </>
          )}
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

            {cargoUsuario !== "cliente" && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={abrirModalCadastro}
              >
                Cadastrar Vacina
              </Button>
            )}
          </div>

          <Table
            columns={colunas}
            dataSource={vacinasAplicadas}
            rowKey="id"
            loading={carregando}
          />
          <Modal
            title={
              editandoVacinasAplicadas ? "Editar Vacina" : "Cadastrar Vacina"
            }
            open={modalVisivel}
            onOk={salvarVacinaAplicada}
            okText="Confirmar"
            cancelText="Cancelar"
            onCancel={() => setModalVisivel(false)}
            width={600}
          >
            <Form form={form} layout="vertical" className="mt-4">
              <div className="w-full flex gap-8 justify-between">
                <Form.Item
                  label="Vacina"
                  className="w-3/6"
                  name="vacina"
                  rules={[
                    {
                      required: true,
                      message: "Por favor, selecione a vacina!",
                    },
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
                  label="Marca"
                  className="w-3/6"
                  name="marca"
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
                  label="Data da fabricação"
                  name="dataFabricacao"
                  className="w-3/6"
                  rules={[
                    {
                      required: true,
                      message: "Por favor, insira a data de fabricação!",
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
                    format="MM/YYYY"
                    picker="month"
                    style={{ width: "100%" }}
                    placeholder="Selecione uma data"
                    disabledDate={(current) =>
                      current && current > dayjs().endOf("day")
                    }
                  />
                </Form.Item>
              </div>
              {mostrarDataReaplicacao && (
                <Form.Item
                  label="Data de reaplicação"
                  name="dataReaplicacao"
                  className="w-3/6"
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
              )}

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
                  defaultValue={undefined}
                >
                  {veterinarios.map((vet) => (
                    <Option key={vet.id} value={vet.id}>
                      {vet.nome}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Form>
          </Modal>
        </div>
      </div>
    </AppLayout>
  );
}
