import { useState } from "react";
import { Form, Input, Button, Card } from "antd";
import { UserOutlined, LockOutlined, MailOutlined } from "@ant-design/icons";
import { useAuth } from "../hooks/useAuth";
import logoLight from "../assets/logo-light.png";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const [showLoginForm, setShowLoginForm] = useState(true);
  const navigate = useNavigate();

  const onLogin = async (values) => {
    setLoading(true);
    try {
      await login(values.email, values.password);
      navigate('/home')

    } catch (error) {
      console.error("Erro no login:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (values) => {
    setLoading(true);
    try {
      await register(values.email, values.password, values.displayName);
    } catch (error) {
      console.error("Erro no registro:", error);
    } finally {
      setLoading(false);
    }
  };

  const LoginForm = () => (
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
          placeholder="seu@email.com"
          size="large"
        />
      </Form.Item>

      <Form.Item
        label="Senha"
        name="password"
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
          loading={loading}
          size="large"
          className="w-full"
        >
          Entrar
        </Button>
      </Form.Item>
    </Form>
  );

  const RegisterForm = () => (
    <Form
      name="register"
      onFinish={onRegister}
      autoComplete="off"
      layout="vertical"
    >
      <Form.Item
        label="Nome"
        name="displayName"
        rules={[{ required: true, message: "Por favor, insira seu nome!" }]}
        className="text-left"
      >
        <Input
          prefix={<UserOutlined />}
          placeholder="Seu nome completo"
          size="large"
        />
      </Form.Item>

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
          placeholder="seu@email.com"
          size="large"
        />
      </Form.Item>

      <Form.Item
        label="Senha"
        name="password"
        rules={[
          { required: true, message: "Por favor, insira sua senha!" },
          { min: 6, message: "A senha deve ter pelo menos 6 caracteres!" },
        ]}
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
          loading={loading}
          size="large"
          className="w-full"
        >
          Criar Conta
        </Button>
      </Form.Item>
    </Form>
  );

  return (
    <div className="h-screen flex items-center justify-center">
      <Card className="shadow-lg">
        <img src={logoLight} className="w-2/3"/>
        {showLoginForm ? LoginForm() : RegisterForm()}
        <Button type="text" onClick={() => setShowLoginForm(!showLoginForm)}>
          {showLoginForm
            ? "Não tem uma conta? Cadastre-se"
            : "Tem uma conta? Conecte-se"}
        </Button>
      </Card>
    </div>
  );
}
