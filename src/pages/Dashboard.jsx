import AppLayout from "../components/Layout";
import { db } from "../config/firebase";
import { collection, getDocs, where, query } from "firebase/firestore";
import { useState, useEffect } from "react";
import { Statistic, Col, Row, Avatar, message, Button, Spin } from "antd";
import { LoadingOutlined, UserOutlined } from "@ant-design/icons";
import {
  PawPrintIcon,
  SyringeIcon,
  PillIcon,
  WhatsappLogoIcon,
} from "@phosphor-icons/react";
import {
  Bar,
  BarChart,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import dayjs from "dayjs";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Dashboard() {
  const [pets, setPets] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [vacinasAplicadas, setVacinasAplicadas] = useState([]);
  const [vermifugos, setVermifugos] = useState([]);
  const [atendimentos, setAtendimentos] = useState([]);
  const [carregandoPagina, setCarregandoPagina] = useState(false);

  const [petsPorEspecie, setPetsPorEspecie] = useState([]);
  const [vacinasAplicadasPets, setVacinasAplicadasPets] = useState([]);
  const [usuariosPorData, setUsuariosPorData] = useState([]);
  const [petsPorData, setPetsPorData] = useState([]);
  const [atendimentosHoje, setAtendimentosHoje] = useState([]);
  const [aniversariantes, setAniversariantes] = useState([]);

  const especieCollectionRef = collection(db, "especie");
  const petCollectionRef = collection(db, "pet");
  const usuarioCollectionRef = collection(db, "usuario");
  const vacinasAplicadasCollectionRef = collection(db, "vacinasAplicadas");
  const vacinaCollectionRef = collection(db, "vacina");
  const vermifugosCollectionRef = collection(db, "vermifugo");
  const atendimentoCollectionRef = collection(db, "atendimento");
  const { cargoUsuario, carregando } = useAuth();

  const navigate = useNavigate();

  useEffect(() => {
    if (cargoUsuario && cargoUsuario !== "cliente") {
      listarPets();
      listarUsuarios();
      listarVacinasAplicadas();
      listarVermifugos();
      listarAtendimentos();
    }
  }, [cargoUsuario]);

  if (carregando || cargoUsuario === undefined || cargoUsuario === null) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (cargoUsuario === "cliente") {
    return <Navigate to="/acessoNegado" replace />;
  }

  const listarPets = async () => {
    setCarregandoPagina(true);
    try {
      const especieData = await getDocs(especieCollectionRef);
      const especies = especieData.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));

      const q = query(petCollectionRef, where("ativo", "==", true));
      const data = await getDocs(q);
      const petData = data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      setPets(petData);
      const contadorEspecie = {};
      const petPorData = {};

      const pegaNomeEspecie = (especieId) => {
        const especie = especies.find((s) => s.id === especieId);
        return especie ? especie.nome : "Espécie não encontrada";
      };

      petData.forEach((pet) => {
        const dataCriacao = formataData(pet.dataCriacao);
        const especieNome = pegaNomeEspecie(pet.especie);
        contadorEspecie[especieNome] = (contadorEspecie[especieNome] || 0) + 1;
        petPorData[dataCriacao] = (petPorData[dataCriacao] || 0) + 1;
      });

      const especieArray = Object.entries(contadorEspecie).map(
        ([especie, count]) => ({
          nome: especie,
          "N° de pets": count,
        })
      );

      const petsPorDataArray = Object.entries(petPorData)
        .map(([data, count]) => ({
          data: data,
          "N° de pets registrados": count,
        }))
        .sort((a, b) => {
          const dataA = new Date(a.data.split("/").reverse().join("-"));
          const dataB = new Date(b.data.split("/").reverse().join("-"));
          return dataA - dataB;
        });

      setPetsPorEspecie(especieArray);
      setPetsPorData(petsPorDataArray);

      const dataHoje = dayjs().format("DD/MM");
      setAniversariantes(
        petData.filter(
          (pet) => dayjs(pet.dataNasc).format("DD/MM") === dataHoje
        )
      );
    } catch (error) {
      message.error(error);
    } finally {
      setCarregandoPagina(false);
      console.log(carregandoPagina)
    }
  };

  const listarVacinasAplicadas = async () => {
    try {
      const vacinaData = await getDocs(vacinaCollectionRef);
      const vacinas = vacinaData.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));

      const q = query(
        vacinasAplicadasCollectionRef,
        where("ativo", "==", true)
      );
      const data = await getDocs(q);
      const petVacinasData = data.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));

      const pegaNomeVacina = (vacinaId) => {
        const vacina = vacinas.find((s) => s.id === vacinaId);
        return vacina ? vacina.nome : "Vacina não encontrada";
      };

      setVacinasAplicadas(petVacinasData);
      const contadorVacina = {};
      petVacinasData.forEach((vac) => {
        const nomeVacina = pegaNomeVacina(vac.vacina);
        contadorVacina[nomeVacina] = (contadorVacina[nomeVacina] || 0) + 1;
      });

      const vacinaArray = Object.entries(contadorVacina).map(
        ([vacina, count]) => ({
          nome: vacina,
          "N° de vacinas aplicadas": count,
        })
      );
      setVacinasAplicadasPets(vacinaArray);
    } catch (error) {
      message.error("Erro ao carregar vacinas aplicadas");
    }
  };

  const listarVermifugos = async () => {
    try {
      const q = query(vermifugosCollectionRef, where("ativo", "==", true));
      const data = await getDocs(q);
      setVermifugos(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    } catch (error) {
      message.error("Erro ao carregar vermífugos aplicadas");
    }
  };

  const listarAtendimentos = async () => {
    try {
      const q = query(atendimentoCollectionRef, where("ativo", "==", true));
      const data = await getDocs(q);
      const dataDoc = data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      setAtendimentos(dataDoc);

      setAtendimentosHoje(
        dataDoc.filter(
          (atendimento) =>
            formataData(atendimento.data) === dayjs().format("DD/MM/YYYY")
        )
      );
    } catch (error) {
      message.error("Erro ao carregar atendimentos");
    }
  };

  const listarUsuarios = async () => {
    try {
      const q = query(usuarioCollectionRef, where("ativo", "==", true));
      const usuarioData = await getDocs(q);
      const data = usuarioData.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setUsuarios(data);

      const clientes = data.filter((d) => d.cargo === "cliente");
      const usuariosPorData = {};
      clientes.forEach((user) => {
        const usuarioDataCriacao = formataData(user.dataCriacao);
        usuariosPorData[usuarioDataCriacao] =
          (usuariosPorData[usuarioDataCriacao] || 0) + 1;
      });

      const usuarioDataArray = Object.entries(usuariosPorData)
        .map(([data, count]) => ({
          data: data,
          "N° de clientes registrados": count,
        }))
        .sort((a, b) => {
          const dataA = new Date(a.data.split("/").reverse().join("-"));
          const dataB = new Date(b.data.split("/").reverse().join("-"));
          return dataA - dataB;
        });
      setUsuariosPorData(usuarioDataArray);
    } catch (error) {
      message.error("Erro ao carregar clientes");
    }
  };

  const formataData = (timestamp) => {
    const data = dayjs(timestamp);
    return data.format("DD/MM/YYYY");
  };

  const consultaPet = (petId) => {
    const pet = pets.find((p) => p.id === petId);
    return pet;
  };

  const pegaNomeUsuario = (usuarioId) => {
    const usuario = usuarios.find((u) => u.id === usuarioId);
    return usuario ? usuario.nome : "Dono não encontrado";
  };

  if (carregandoPagina)
    return (
      <AppLayout>
        <LoadingOutlined />
      </AppLayout>
    );

  return (
    <AppLayout>
      {!carregandoPagina && cargoUsuario && (
        <div className="space-y-6">
          <Row gutter={16}>
            {atendimentosHoje.length > 0 && (
              <Col span={12}>
                <div className="border-2 rounded-lg p-4 border-primaryGreen">
                  <h1 className="text-base font-bold mb-2">
                    Atendimentos do dia
                  </h1>
                  {atendimentosHoje.map((atendimento) => (
                    <div className="flex gap-2 mt-2">
                      <Avatar
                        src={consultaPet(atendimento.pet).foto}
                        size={{
                          xs: 24,
                          sm: 32,
                          md: 40,
                          lg: 64,
                          xl: 80,
                          xxl: 100,
                        }}
                        shape="square"
                        className="object-contain"
                      />
                      <div className="flex flex-col">
                        <b>{consultaPet(atendimento.pet).nome}</b>
                        <p>
                          <b>Horário: </b>
                          {atendimento.horarioInicio} -{" "}
                          {atendimento.horarioFinal}
                        </p>
                        <p>
                          <b>Veterinário:</b>{" "}
                          {pegaNomeUsuario(atendimento.veterinario)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Col>
            )}
            {aniversariantes.length > 0 && (
              <Col span={12}>
                <div className="border-2 rounded-lg p-4 border-primaryGreen">
                  <h1 className="text-base font-bold mb-2">
                    Aniversariantes do dia
                  </h1>
                  {aniversariantes.map((aniversariante) => (
                    <div className="flex gap-2 mt-2">
                      <Avatar
                        src={aniversariante.foto}
                        size={{
                          xs: 24,
                          sm: 32,
                          md: 40,
                          lg: 64,
                          xl: 80,
                          xxl: 100,
                        }}
                        shape="square"
                        className="object-contain"
                      />
                      <div className="flex flex-col">
                        <b>{aniversariante.nome}</b>
                        <p>
                          {" "}
                          {aniversariante.tutorAnimal.map(
                            (tutor) => pegaNomeUsuario(tutor) + " - "
                          )}
                        </p>
                        <Button
                          icon={<WhatsappLogoIcon />}
                          onClick={() => navigate(`/${aniversariante.id}`)}
                          className="!bg-green-500 !hover:bg-green-600"
                          type="primary"
                        >
                          Enviar mensagem
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Col>
            )}
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="N° de clientes"
                value={usuarios.length}
                prefix={<UserOutlined />}
                className="border-2 rounded-lg p-4 border-primaryGreen"
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="N° de Pets"
                value={pets.length}
                prefix={<PawPrintIcon />}
                className="border-2 rounded-lg p-4 border-primaryGreen"
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="N° de Vacinas aplicadas"
                value={vacinasAplicadas.length}
                prefix={<SyringeIcon />}
                className="border-2 rounded-lg p-4 border-primaryGreen"
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="N° de vermifugações realizadas"
                value={vermifugos.length}
                prefix={<PillIcon />}
                className="border-2 rounded-lg p-4 border-primaryGreen"
              />
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <div className="w-full border-2 rounded-lg p-4 border-primaryGreen">
                <h1 className="text-base font-bold mb-2">
                  Quantidade de pets por espécie
                </h1>

                <ResponsiveContainer width="100%" height={250}>
                  <BarChart width={730} height={250} data={petsPorEspecie}>
                    <XAxis dataKey="nome" />
                    <YAxis allowDecimals={false} />
                    <Tooltip cursor={false} isAnimationActive={false} />
                    <Bar dataKey="N° de pets" fill="#29C28D" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Col>
            <Col span={12}>
              <div className="w-full border-2 rounded-lg p-4 border-primaryGreen">
                <h1 className="text-base font-bold mb-2">Vacinas aplicadas</h1>

                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    width={730}
                    height={250}
                    data={vacinasAplicadasPets}
                  >
                    <XAxis dataKey="nome" />
                    <YAxis allowDecimals={false} />
                    <Tooltip cursor={false} isAnimationActive={false} />
                    <Bar dataKey="N° de vacinas aplicadas" fill="#2FA63E" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <div className="w-full border-2 rounded-lg p-4 border-primaryGreen">
                <h1 className="text-base font-bold mb-2">
                  Clientes registrados por dia
                </h1>

                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart width={730} height={250} data={usuariosPorData}>
                    <XAxis dataKey="data" />
                    <YAxis allowDecimals={false} />
                    <Tooltip cursor={false} isAnimationActive={false} />
                    <Area
                      dataKey="N° de clientes registrados"
                      fill="#2FA63E"
                      stroke="#2FA63E"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Col>
            <Col span={12}>
              <div className="w-full border-2 rounded-lg p-4 border-primaryGreen">
                <h1 className="text-base font-bold mb-2">
                  Pets registrados por dia
                </h1>

                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart width={730} height={250} data={petsPorData}>
                    <XAxis dataKey="data" />
                    <YAxis allowDecimals={false} />
                    <Tooltip cursor={false} isAnimationActive={false} />
                    <Area
                      dataKey="N° de pets registrados"
                      fill="#29C28D"
                      stroke="#29C28D"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Col>
          </Row>
        </div>
      )}
    </AppLayout>
  );
}
