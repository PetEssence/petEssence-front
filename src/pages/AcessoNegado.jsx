import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";

export default function AcessoNegado() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Result
        status="403"
        title="Acesso Negado"
        subTitle="Você não tem permissão para acessar esta página."
        extra={
          <Button
            type="primary"
            className="!bg-primaryGreen !hover:bg-primaryGreenHouver"
            onClick={() => navigate("/")}
          >
            Voltar para o início
          </Button>
        }
      />
    </div>
  );
}
