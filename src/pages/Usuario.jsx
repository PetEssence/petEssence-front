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
  DatePicker,
  Select,
  Divider,
} from "antd";
import { PlusOutlined, SearchOutlined, EditOutlined } from "@ant-design/icons";
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
import InputMask from "react-input-mask";
import dayjs from "dayjs";

export default function Usuario() {
  const [usuario, setUsuario] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingData, setEditingUsuario] = useState(null);
  const [form] = Form.useForm();
  const usuarioCollectionRef = collection(db, "usuario");

  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    setLoading(true);
    try {
      const usuarioData = await getDocs(usuarioCollectionRef);
      setUsuario(
        usuarioData.docs.map((doc) => ({ ...doc.data(), id: doc.id }))
      );
    } catch (error) {
      message.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUsuarios = () => {
    setEditingUsuario(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditUsuario = (usuario) => {
    setEditingUsuario(usuario);

    const formData = {
      ...usuario,
      birthDate: usuario.birthDate ? dayjs(usuario.birthDate) : null,
    };

    form.setFieldsValue(formData);
    setIsModalVisible(true);
  };

  const isValidCPF = (cpf) => {
    cpf = cpf.replace(/[^\d]+/g, "");
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

    let soma = 0;
    for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i)) * (10 - i);
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i)) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    return resto === parseInt(cpf.charAt(10));
  };

  const estadosOptions = [
    { value: "AC", label: "AC" },
    { value: "AL", label: "AL" },
    { value: "AP", label: "AP" },
    { value: "AM", label: "AM" },
    { value: "BA", label: "BA" },
    { value: "CE", label: "CE" },
    { value: "DF", label: "DF" },
    { value: "ES", label: "ES" },
    { value: "GO", label: "GO" },
    { value: "MA", label: "MA" },
    { value: "MT", label: "MT" },
    { value: "MS", label: "MS" },
    { value: "MG", label: "MG" },
    { value: "PA", label: "PA" },
    { value: "PB", label: "PB" },
    { value: "PR", label: "PR" },
    { value: "PE", label: "PE" },
    { value: "PI", label: "PI" },
    { value: "RJ", label: "RJ" },
    { value: "RN", label: "RN" },
    { value: "RS", label: "RS" },
    { value: "RO", label: "RO" },
    { value: "RR", label: "RR" },
    { value: "SC", label: "SC" },
    { value: "SP", label: "SP" },
    { value: "SE", label: "SE" },
    { value: "TO", label: "TO" },
  ];

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const formattedValues = {
        ...values,
        birthDate: values.birthDate
          ? values.birthDate.format("YYYY-MM-DD")
          : null,
      };

      if (editingData) {
        const usuarioDoc = doc(usuarioCollectionRef, editingData.id);
        await updateDoc(usuarioDoc, formattedValues);

        const updatedUsuarios = usuario.map((user) =>
          user.id === editingData.id ? { ...user, ...formattedValues } : user
        );
        setUsuario(updatedUsuarios);
        message.success("Usuário atualizado com sucesso!");
      } else {
        const docRef = await addDoc(usuarioCollectionRef, {
          ...formattedValues,
          complement: values.complement || "",
          createdAt: new Date().toISOString().split("T")[0],
          isActive: true,
        });

        setUsuario([
          ...usuario,
          {
            id: docRef.id,
            ...formattedValues,
            complement: values.complement || "",
            createdAt: new Date().toISOString().split("T")[0],
            isActive: true,
          },
        ]);
        message.success("Usuário adicionado com sucesso!");
      }
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error("Erro na validação:", error);
      message.error("Erro ao salvar usuário");
    }
  };

  const handleActiveStatus = (usuarioId, activeStatus) => {
    Modal.confirm({
      title: `Confirmar ${activeStatus ? "inativação" : "ativação"}`,
      content: `Tem certeza que deseja ${
        activeStatus ? "desativar" : "ativar"
      } este usuário?`,
      okText: "Confirmar",
      okType: "primary",
      cancelText: "Cancelar",
      okButtonProps: {
        className: "!bg-primaryGreen !hover:bg-primaryGreenHouver",
      },
      onOk: async () => {
        try {
          const usuarioDoc = doc(usuarioCollectionRef, usuarioId);
          const newStatus = { isActive: !activeStatus };
          await updateDoc(usuarioDoc, newStatus);

          const updatedUsuarios = usuario.map((item) =>
            item.id === usuarioId ? { ...item, isActive: !activeStatus } : item
          );
          setUsuario(updatedUsuarios);
          message.success("Usuário atualizado com sucesso!");
        } catch (error) {
          message.error("Erro ao atualizar usuário");
        }
      },
    });
  };

  const handleCepChange = async (e) => {
    const cep = e.target.value.replace(/\D/g, "");
    if (cep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          form.setFieldsValue({
            street: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf,
          });
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      }
    }
  };
  const filteredUsuarios = usuario.filter((usuario) =>
    usuario.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: "Nome Completo",
      dataIndex: "name",
      width: 800,
      key: "name",
      render: (_, record) => (
        <div className="flex items-center space-x-3">
          <div>
            <div className="text-gray-500 text-sm">{record.name}</div>
          </div>
        </div>
      ),
    },
    {
      title: "E-mail",
      dataIndex: "email",
      width: 800,
      key: "email",
      render: (_, record) => (
        <div className="flex items-center space-x-3">
          <div>
            <div className="text-gray-500 text-sm">{record.email}</div>
          </div>
        </div>
      ),
    },

    {
      title: "Cargo",
      dataIndex: "role",
      width: 800,
      key: "role",
      render: (_, record) => (
        <Space>
          {record.role === "admin" ? (
            <Tag color="blue-inverse">Administrador</Tag>
          ) : (
            <Tag color="gold-inverse">Cliente</Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Status",
      key: "activeStatus",
      align: "center",
      width: 50,
      render: (_, record) => (
        <Space>
          {record.isActive ? (
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
            onClick={() => handleEditUsuario(record)}
          />
          <Button
            type="text"
            onClick={() => handleActiveStatus(record.id, record.isActive)}
          >
            {record.isActive ? "Desativar" : "Ativar"}
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
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Usuários</h1>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddUsuarios}
          >
            Adicionar Usuário
          </Button>
        </div>
        <Card>
          <div className="mb-4">
            <Input
              placeholder="Buscar Usuário..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <Table
            columns={columns}
            dataSource={filteredUsuarios}
            rowKey="id"
            loading={loading}
          />
        </Card>
        <Modal
          title={editingData ? "Editar Usuário" : "Adicionar Usuário"}
          open={isModalVisible}
          onOk={handleModalOk}
          okText="Confirmar"
          cancelText="Cancelar"
          onCancel={() => setIsModalVisible(false)}
          width={600}
        >
          <Form form={form} layout="vertical" className="mt-4 flex flex-col">
            <Form.Item
              label="Nome Completo"
              name="name"
              rules={[{ required: true, message: "Por favor, insira o nome!" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="CPF"
              name="cpf"
              rules={[
                { required: true, message: "Por favor, insira o CPF!" },
                {
                  validator: async (_, value) => {
                    if (!value || value.trim() === "") return Promise.resolve();
                    if (!isValidCPF(value)) {
                      return Promise.reject("CPF inválido!");
                    }
                    const q = query(
                      usuarioCollectionRef,
                      where("cpf", "==", value)
                    );
                    const querySnapshot = await getDocs(q);

                    if (!querySnapshot.empty) {
                      const existingDoc = querySnapshot.docs[0];
                      if (editingData && existingDoc.id === editingData.id) {
                        return Promise.resolve();
                      }
                      return Promise.reject("Este CPF já está cadastrado!");
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputMask mask="999.999.999-99">
                {(inputProps) => <Input {...inputProps} />}
              </InputMask>
            </Form.Item>
            <Form.Item
              label="E-mail"
              name="email"
              rules={[
                { required: true, message: "Por favor, insira o e-mail!" },
                {
                  type: "email",
                  message: "E-mail inválido!",
                },
                {
                  validator: async (_, value) => {
                    if (!value || value.trim() === "") return Promise.resolve();

                    const q = query(
                      usuarioCollectionRef,
                      where("email", "==", value.toLowerCase())
                    );
                    const querySnapshot = await getDocs(q);

                    if (!querySnapshot.empty) {
                      const existingDoc = querySnapshot.docs[0];
                      if (editingData && existingDoc.id === editingData.id) {
                        return Promise.resolve();
                      }
                      return Promise.reject("Este e-mail já está cadastrado!");
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input />
            </Form.Item>
            <div className="w-full flex gap-8 justify-between">
              <Form.Item
                label="Data de Nascimento"
                name="birthDate"
                className="w-3/6"
                rules={[
                  {
                    required: true,
                    message: "Por favor, insira a data de nascimento!",
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
                label="Celular/Telefone"
                name="phone"
                className="w-3/6"
                rules={[
                  {
                    required: true,
                    message: "Por favor, insira o Celular/Telefone!",
                  },
                ]}
              >
                <InputMask mask="(99) 99999-9999">
                  {(inputProps) => <Input {...inputProps} />}
                </InputMask>
              </Form.Item>
            </div>
            <Divider>Endereço</Divider>
            <div className="w-full flex gap-8 justify-between">
              <Form.Item
                label="CEP"
                name="cep"
                className="w-1/3"
                rules={[
                  { required: true, message: "Por favor, insira o CEP!" },
                ]}
              >
                <InputMask mask="99999-999" onChange={handleCepChange}>
                  {(inputProps) => <Input {...inputProps} />}
                </InputMask>
              </Form.Item>
              <Form.Item
                label="Bairro"
                name="neighborhood"
                className="w-4/6"
                rules={[
                  { required: true, message: "Por favor, insira o bairro!" },
                ]}
              >
                <Input />
              </Form.Item>
            </div>
            <div className="w-full flex gap-8 justify-between">
              <Form.Item
                label="Rua"
                name="street"
                className="w-4/6"
                rules={[
                  { required: true, message: "Por favor, insira a rua!" },
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                label="Número"
                name="number"
                rules={[
                  { required: true, message: "Por favor, insira o número!" },
                ]}
              >
                <Input />
              </Form.Item>
            </div>
            <div className="w-full flex gap-8 justify-between">
              <Form.Item
                label="Cidade"
                name="city"
                className="w-4/6"
                rules={[
                  { required: true, message: "Por favor, insira a cidade!" },
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                label="Estado"
                name="state"
                className="w-1/3"
                rules={[
                  { required: true, message: "Por favor, insira o estado!" },
                ]}
              >
                <Select
                  placeholder="Selecione o estado"
                  defaultValue={undefined}
                  options={estadosOptions}
                />
              </Form.Item>
            </div>
            <Form.Item label="Complemento" name="complement">
              <Input />
            </Form.Item>
            <Divider plain={false}>Permissão</Divider>
            <Form.Item
              label="Cargo"
              name="role"
              rules={[
                { required: true, message: "Por favor, insira o cargo!" },
              ]}
            >
              <Select
                placeholder="Selecione o cargo"
                defaultValue={undefined}
                options={[
                  { value: "admin", label: "Administrador" },
                  { value: "client", label: "Cliente" },
                ]}
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AppLayout>
  );
}
