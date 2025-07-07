import {useState} from "react";
import { Menu } from "antd";

export default function PetLayout() {
  const items = [
    {
      label: "Dados gerais",
      key: "geral",
    },
    {
      label: "Vacinas",
      key: "vaccine",
    },
    {
      label: "Vermífugo",
      key: "vermifuge",
    },
    {
      key: "Atendimentos",
      label: "care"
    },
  ];
  const [current, setCurrent] = useState("geral");
  const onClick = (e) => {
    console.log("click ", e);
    setCurrent(e.key);
  };
  return (
    <Menu
      onClick={onClick}
      selectedKeys={[current]}
      mode="horizontal"
      items={items}
    />
  );
}
