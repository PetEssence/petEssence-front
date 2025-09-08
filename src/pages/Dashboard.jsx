import AppLayout from "../components/Layout";
import { db } from "../config/firebase";
import { collection, getDocs, where, query } from "firebase/firestore";
import { useState, useEffect } from "react";
import { Statistic, Col, Row } from "antd";
import { LoadingOutlined, UserOutlined } from "@ant-design/icons";
import { PawPrintIcon, SyringeIcon, PillIcon } from "@phosphor-icons/react";
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

export default function Dashboard() {
  const [pets, setPets] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [petVacinas, setPetVacinas] = useState([]);
  const [vermifugos, setVermifugos] = useState([]);
  const [loading, setLoading] = useState(false);

  const [petsBySpecie, setPetsBySpecie] = useState([]);
  const [appliedVaccines, setAppliedVaccines] = useState([]);
  const [usersByDate, setUsersByDate] = useState([]);
  const [petsByDate, setPetsByDate] = useState([]);

  const especieCollectionRef = collection(db, "especie");
  const petCollectionRef = collection(db, "pet");
  const usuarioCollectionRef = collection(db, "usuario");
  const petVacinaCollectionRef = collection(db, "petVacina");
  const vacinaCollectionRef = collection(db, "vacina");
  const vermifugosCollectionRef = collection(db, "vermifugo");

  useEffect(() => {
    loadPets();
    loadUsuarios();
    loadPetVacinas();
    loadVermifugos();
  }, []);

  const loadPets = async () => {
    setLoading(true);
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
      const specieCount = {};
      const petByDate = {};

      const getSpecieName = (specieId) => {
        const specie = especies.find((s) => s.id === specieId);
        return specie ? specie.nome : "Espécie não encontrada";
      };

      petData.forEach((pet) => {
        const registrationDate = formatDate(pet.dataCriacao);
        const specie = getSpecieName(pet.especie);
        specieCount[specie] = (specieCount[specie] || 0) + 1;
        petByDate[registrationDate] = (petByDate[registrationDate] || 0) + 1;
      });

      const specieArray = Object.entries(specieCount).map(
        ([specie, count]) => ({
          name: specie,
          "N° de pets": count,
        })
      );

      const petsDateArray = Object.entries(petByDate)
        .map(([date, count]) => ({
          date: date,
          "N° de pets registrados": count,
        }))
        .sort((a, b) => {
          const dateA = new Date(a.date.split("/").reverse().join("-"));
          const dateB = new Date(b.date.split("/").reverse().join("-"));
          return dateA - dateB;
        });

      setPetsBySpecie(specieArray);
      setPetsByDate(petsDateArray);
    } catch (error) {
      message.error("Erro ao carregar pets");
    } finally {
      setLoading(false);
    }
  };

  const loadPetVacinas = async () => {
    try {
      const vaccineData = await getDocs(vacinaCollectionRef);
      const vacinas = vaccineData.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));

      const q = query(petVacinaCollectionRef, where("ativo", "==", true));
      const data = await getDocs(q);
      const petVacinasData = data.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      const getVaccineName = (vaccineId) => {
        const vaccine = vacinas.find((s) => s.id === vaccineId);
        return vaccine ? vaccine.nome : "Vacina não encontrada";
      };

      setPetVacinas(petVacinasData);
      const vaccineCount = {};
      petVacinasData.forEach((vac) => {
        const vaccineName = getVaccineName(vac.idVacina);
        vaccineCount[vaccineName] = (vaccineCount[vaccineName] || 0) + 1;
      });

      const vaccineArray = Object.entries(vaccineCount).map(
        ([vaccine, count]) => ({
           name: vaccine,
          "N° de vacinas aplicadas": count,
        })
      );
      setAppliedVaccines(vaccineArray);
    } catch (error) {
      message.error("Erro ao carregar vacinas aplicadas");
    }
  };

  const loadVermifugos = async () => {
    try {
      const q = query(vermifugosCollectionRef, where("ativo", "==", true));
      const data = await getDocs(q);
      setVermifugos(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    } catch (error) {
      message.error("Erro ao carregar vermí fugos aplicadas");
    }
  };

  const loadUsuarios = async () => {
    try {
      const q = query(
        usuarioCollectionRef,
        where("ativo", "==", true),
        where("cargo", "==", "cliente")
      );
      const usuarioData = await getDocs(q);
      const data = usuarioData.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setUsuarios(data);
      const userByDate = {};
      data.forEach((user) => {
        const userRegistrationDate = formatDate(user.dataCriacao);
        userByDate[userRegistrationDate] =
          (userByDate[userRegistrationDate] || 0) + 1;
      });

      const userDateArray = Object.entries(userByDate)
        .map(([date, count]) => ({
          date: date,
          "N° de clientes registrados": count,
        }))
        .sort((a, b) => {
          const dateA = new Date(a.date.split("/").reverse().join("-"));
          const dateB = new Date(b.date.split("/").reverse().join("-"));
          return dateA - dateB;
        });
      setUsersByDate(userDateArray);
    } catch (error) {
      message.error("Erro ao carregar clientes");
    }
  };

  const formatDate = (timestamp) => {
    const date = dayjs(timestamp)
    return date.format('DD/MM/YYYY')
  }

  if (loading)
    return (
      <AppLayout>
        <LoadingOutlined />
      </AppLayout>
    );

  return (
    <AppLayout>
      <div className="space-y-6">
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="N° de clientes"
              value={usuarios.length}
              prefix={<UserOutlined/>}
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
              value={petVacinas.length}
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
                <BarChart width={730} height={250} data={petsBySpecie}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip cursor={false} isAnimationActive={false}/>
                  <Bar dataKey="N° de pets" fill="#29C28D" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Col>
          <Col span={12}>
            <div className="w-full border-2 rounded-lg p-4 border-primaryGreen">
              <h1 className="text-base font-bold mb-2">Vacinas aplicadas</h1>

              <ResponsiveContainer width="100%" height={250}>
                <BarChart width={730} height={250} data={appliedVaccines}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip cursor={false} isAnimationActive={false}/>
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
                <AreaChart width={730} height={250} data={usersByDate}>
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip cursor={false} isAnimationActive={false}/>
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
                <AreaChart width={730} height={250} data={petsByDate}>
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip cursor={false} isAnimationActive={false}/>
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
    </AppLayout>
  );
}
