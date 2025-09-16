import { Menu } from "antd";
import { useLocation, useNavigate } from "react-router-dom";

export default function PetLayout({petId}) {
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

    }
  ];

  return (
    <Menu selectedKeys={[location.pathname]} mode="horizontal" items={items} />
  );
}
