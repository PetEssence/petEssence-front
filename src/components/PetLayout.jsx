import { Menu, Button } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { LeftOutlined } from "@ant-design/icons";

export default function PetLayout({ petId }) {
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    {
      label: "Dados gerais",
      key: "geral",
      onClick: () => navigate(`/pet/${petId}`),
    },
    {
      label: "Vacinas",
      key: "vaccine",
      onClick: () => navigate(`/pet/${petId}/vacinas`),
    },
    {
      label: "Vermífugo",
      key: "vermifuge",
      onClick: () => navigate(`/pet/${petId}/vermifugos`),
    },
  ];

  return (
    <div className="w-full overflow-x-auto overflow-y-hidden sm:overflow-x-hidden">
      <Button
        icon={<LeftOutlined />}
        color="primary"
        variant="link"
        className="text-primaryGreen"
        onClick={() => navigate(-1)}
      >
        Voltar
      </Button>
      <div className="min-w-[480px]">
        {petId && 
          <Menu
            selectedKeys={[location.pathname]}
            mode="horizontal"
            items={items}
          />
        }
      </div>
    </div>
  );
}
