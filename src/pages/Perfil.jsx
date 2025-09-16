import { useAuth } from "../contexts/AuthContext";
import AppLayout from "../components/Layout";
import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";
import dayjs from "dayjs";
import {
  Input,
  Form,
  message,
  DatePicker,
  Select,
  Divider,
  Button,
  Spin,
} from "antd";
import InputMask from "react-input-mask";

export default function Perfil() {
  const { usuario } = useAuth();
  const [usuarioDados, setUsuarioDados] = useState([]);
  const [carregando, setCarregando] = useState([]);
  const [carregandoSalvar,setCarregandoSalvar] = useState(false)
  const usuarioCollectionRef = collection(db, "usuario");
  const [form] = Form.useForm();
  const usuarioCargo = Form.useWatch("cargo", form);

  useEffect(() => {
    consultaUsuarios();
  }, []);

  const consultaUsuarios = async () => {
    setCarregando(true);
    try {
      const docRef = doc(usuarioCollectionRef, usuario.uid);
      const usuarioData = await getDoc(docRef);
      const dataDoc = { ...usuarioData.data(), id: usuarioData.id };
      setUsuarioDados(dataDoc);

      const formData = {
        ...dataDoc,
        dataNasc: dataDoc.dataNasc ? dayjs(dataDoc.dataNasc) : null,
        complemento: dataDoc.complemento || null,
      };
      form.setFieldsValue(formData);
      setCarregando(false);
    } catch (error) {
      message.error("Erro ao carregar usuários");
    }
  };

  const salvarUsuario = async () => {
    setCarregandoSalvar(true);
    try {
      const dados = await form.validateFields();
      const dadosFormatados = {
        ...dados,
        dataNasc: dados.dataNasc ? dados.dataNasc.format("YYYY-MM-DD") : null,
        complemento: dados.complemento ?? null,
      };

      const usuarioDoc = doc(usuarioCollectionRef, usuario.uid);
      await updateDoc(usuarioDoc, dadosFormatados);

      setUsuarioDados({ ...dadosFormatados, id: usuarioDoc.id });
      message.success("Usuário atualizado com sucesso!");
      setCarregandoSalvar(false);
    } catch (error) {
      message.error("Erro ao salvar atualização" + error);
      setCarregandoSalvar(false);
    }
  };

  const pegaCep = async (e) => {
    const cep = e.target.value.replace(/\D/g, "");
    if (cep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          form.setFieldsValue({
            logradouro: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            estado: data.uf,
          });
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      }
    }
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

  const validaCpf = (cpf) => {
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

  if (carregando) {
    return (
      <AppLayout>
        <Spin spinning={true} />
      </AppLayout>
    );
  }
  return (
    <AppLayout>
      <div className="flex flex-col justify-center items-center">
        <Form
          form={form}
          layout="vertical"
          className="mt-4 flex flex-col w-2/5 "
          onFinish={salvarUsuario}
        >
          <Form.Item
            label="Nome Completo"
            name="nome"
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
                  if (!validaCpf(value)) {
                    return Promise.reject("CPF inválido!");
                  }
                  const q = query(
                    usuarioCollectionRef,
                    where("cpf", "==", value)
                  );
                  const querySnapshot = await getDocs(q);

                  if (!querySnapshot.empty) {
                    const existingDoc = querySnapshot.docs[0];
                    if (existingDoc.id === usuarioDados.id) {
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
                    if (existingDoc.id === usuarioDados.id) {
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
              name="dataNasc"
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
              name="celular"
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
              rules={[{ required: true, message: "Por favor, insira o CEP!" }]}
            >
              <InputMask mask="99999-999" onChange={pegaCep}>
                {(inputProps) => <Input {...inputProps} />}
              </InputMask>
            </Form.Item>
            <Form.Item
              label="Bairro"
              name="bairro"
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
              label="Logradouro"
              name="logradouro"
              className="w-4/6"
              rules={[{ required: true, message: "Por favor, insira a rua!" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Número"
              name="numero"
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
              name="cidade"
              className="w-4/6"
              rules={[
                { required: true, message: "Por favor, insira a cidade!" },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Estado"
              name="estado"
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
          <Form.Item label="Complemento" name="complemento">
            <Input />
          </Form.Item>
          <Divider plain={false}>Permissão</Divider>
          <Form.Item
            label="Cargo"
            name="cargo"
            rules={[{ required: true, message: "Por favor, insira o cargo!" }]}
          >
            <Select
              placeholder="Selecione o cargo"
              defaultValue={undefined}
              options={[
                { value: "funcionario", label: "Funcionário" },
                { value: "cliente", label: "Cliente" },
                { value: "veterinario", label: "Veterinário" },
              ]}
            />
          </Form.Item>

          {usuarioCargo === "veterinario" && (
            <Form.Item
              label="CRMV"
              name="crmv"
              rules={[
                { required: true, message: "Por favor, insira o CRMV!" },
                {
                  validator: async (_, value) => {
                    if (!value || value.trim() === "") return Promise.resolve();
                    const q = query(
                      usuarioCollectionRef,
                      where("crmv", "==", value)
                    );
                    const querySnapshot = await getDocs(q);

                    if (!querySnapshot.empty) {
                      const existingDoc = querySnapshot.docs[0];
                      if (existingDoc.id === usuarioDados.id) {
                        return Promise.resolve();
                      }
                      return Promise.reject("Este CRMV já está cadastrado!");
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input />
            </Form.Item>
          )}
          <Form.Item label={null} className="">
            <Button type="primary" htmlType="submit" loading={carregandoSalvar}>
              Confirmar
            </Button>
          </Form.Item>
        </Form>
      </div>
    </AppLayout>
  );
}
