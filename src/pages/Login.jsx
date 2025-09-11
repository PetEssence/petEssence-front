import { useState } from "react";
import { Form, Input, Button, Card } from "antd";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { useAuth } from "../hooks/useAuth";
import logoLight from "../assets/logo-light.png";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [carregando, setCarregando] = useState(false);
  const { login, redefinirSenha } = useAuth();
  const [mostraFormLogin, setMostraFormLogin] = useState(true);
  const navigate = useNavigate();

  const onLogin = async (values) => {
    setCarregando(true);
    try {
      await login(values.email, values.senha);
      navigate("/");
    } catch (error) {
      console.error("Erro no login:", error);
    } finally {
      setCarregando(false);
    }
  };

  const auxiliaReset = (dados) => {
    if (!dados.email) {
      return message.warning("Digite seu e-mail antes de redefinir a senha.");
    }
    redefinirSenha(dados.email);
  };

  const formRedefinirSenha = () => (
    <div className="flex flex-col gap-5">
      <Form name="resetPassword" onFinish={auxiliaReset} layout="vertical">
        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Por favor, insira seu email!" },
            { type: "email", message: "Email inválido!" },
          ]}
          className="text-left"
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="exemplo@email.com"
            size="large"
          />
        </Form.Item>
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={carregando}
            size="large"
            className="w-full"
          >
            Redefinir senha
          </Button>
        </Form.Item>
      </Form>
    </div>
  );

  const FormLogin = () => (
    <Form name="login" onFinish={onLogin} layout="vertical">
      <Form.Item
        label="Email"
        name="email"
        rules={[
          { required: true, message: "Por favor, insira seu email!" },
          { type: "email", message: "Email inválido!" },
        ]}
        className="text-left"
      >
        <Input
          prefix={<MailOutlined />}
          placeholder="exemplo@email.com"
          size="large"
        />
      </Form.Item>

      <Form.Item
        label="Senha"
        name="senha"
        rules={[{ required: true, message: "Por favor, insira sua senha!" }]}
        className="text-left"
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="Sua senha"
          size="large"
        />
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={carregando}
          size="large"
          className="w-full"
        >
          Entrar
        </Button>
      </Form.Item>
    </Form>
  );

  return (
    <div className="h-screen flex items-center justify-center">
      <Card className="shadow-lg">
        <img src={logoLight} className="w-2/3 mb-4" />
        {mostraFormLogin ? FormLogin() : formRedefinirSenha()}
        <div className="flex justify-center">
          {mostraFormLogin ? (
            <div className="flex flex-col">
              <Button
                type="text"
                onClick={() => setMostraFormLogin(!mostraFormLogin)}
              >
                Primeiro acesso? Defina sua senha
              </Button>
              <Button
                type="text"
                onClick={() => setMostraFormLogin(!mostraFormLogin)}
              >
                Esqueceu sua senha?
              </Button>
            </div>
          ) : (
            <Button
              type="text"
              onClick={() => setMostraFormLogin(!mostraFormLogin)}
            >
              Lembrei minha senha
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
