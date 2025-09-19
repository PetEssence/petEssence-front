import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";

export default function Pagina404() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Result
        status="404"
        title="Página não encontrada"
        subTitle="Ops! Parece que esta página não existe!"
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
