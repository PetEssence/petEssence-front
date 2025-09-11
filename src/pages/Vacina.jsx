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
  const [carregando, setCarregando] = useState(false);
  const [textoFiltro, setTextoFiltro] = useState("");
  const [modalVisivel, setModalVisivel] = useState(false);
  const [editandoVacina, setEditandoVacina] = useState(null);
  const [form] = Form.useForm();
  const vacinaCollectionRef = collection(db, "vacina");

  const opcoesSelectPeriodoReaplicacao = [
    { value: "Anual", label: "Anual" },
    { value: "Semestral", label: "Semestral" },
    { value: "Mensal", label: "Mensal" },
    { value: "Dose Única", label: "Dose Única" },
  ];

  useEffect(() => {
    listarVacinas();
  }, []);

  const listarVacinas = async () => {
    setCarregando(true);
    try {
      const data = await getDocs(vacinaCollectionRef);
      const dataDoc = data.docs.map((doc) => ({ ...doc.data(), id: doc.id }))
      setVacina(dataDoc);
    } catch (error) {
      message.error("Erro ao carregar vacinas");
    } finally {
      setCarregando(false);
    }
  };

  const abrirModalCadastro = () => {
    setEditandoVacina(null);
    form.resetFields();
    setModalVisivel(true);
  };

  const abrirModalEditar = (vacina) => {
    setEditandoVacina(vacina);
    form.setFieldsValue(vacina);
    setModalVisivel(true);
  };

  const salvarVacina = async () => {
    try {
      const dados = await form.validateFields();
      const dadosFormatados = {
        ...dados,
      };
      if (editandoVacina) {
        const vacinaDoc = doc(vacinaCollectionRef, editandoVacina.id);
        const vacinaEditada = vacina.map((vacina) =>
          vacina.id === editandoVacina.id ? { ...vacina, ...dados } : vacina
        );
        setVacina(vacinaEditada);
        await updateDoc(vacinaDoc, dadosFormatados);
        message.success("Vacina atualizada com sucesso!");
      } else {
        const docRef = await addDoc(vacinaCollectionRef, {
          ...dadosFormatados,
          dataCriacao: new Date().toISOString().split("T")[0],
        });
        setVacina([
          ...vacina,
          {
            id: docRef.id,
            ...dadosFormatados,
            dataCriacao: new Date().toISOString().split("T")[0],
          },
        ]);
        message.success("Vacina adicionada com sucesso!");
      }
      setModalVisivel(false);
      form.resetFields();
    } catch (error) {
      console.error("Erro na validação:", error);
    }
  };

  const vacinasFiltradas = vacina.filter((vacina) =>
    vacina.nome.toLowerCase().includes(textoFiltro.toLowerCase())
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
        const option = opcoesSelectPeriodoReaplicacao.find(
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
      key: "acoes",
      width: 50,
      align: "center",
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => abrirModalEditar(record)}
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
            onClick={abrirModalCadastro}
          >
            Cadastrar vacina
          </Button>
        </div>

        <Card>
          <div className="mb-4">
            <Input
              placeholder="Buscar vacina..."
              prefix={<SearchOutlined />}
              value={textoFiltro}
              onChange={(e) => setTextoFiltro(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <Table
            columns={columns}
            dataSource={vacinasFiltradas}
            rowKey="id"
            loading={carregando}
          />
        </Card>

        <Modal
          title={editandoVacina ? "Editar vacina" : "Cadastrar vacina"}
          open={modalVisivel}
          onOk={salvarVacina}
          okText="Confirmar"
          cancelText="Cancelar"
          onCancel={() => setModalVisivel(false)}
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
              <Select options={opcoesSelectPeriodoReaplicacao}></Select>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AppLayout>
  );
}
