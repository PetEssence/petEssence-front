import AppLayout from "../components/Layout";
import { db } from "../config/firebase";
import {
  collection,
  getDocs,
  where,
  query,
} from "firebase/firestore";
import { useState, useEffect } from "react";
import { Statistic, Col, Row } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { PawPrintIcon, SyringeIcon, PillIcon } from "@phosphor-icons/react";
import {
  Bar,
  BarChart,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
  const [pets, setPets] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [petVacinas, setPetVacinas] = useState([]);
  const [vermifugos, setVermifugos] = useState([]);
  const [petsBySpecie, setPetsBySpecie] = useState([]);
  const [especies, setEspecies] = useState([]);
  const especieCollectionRef = collection(db, "especie");

  const petCollectionRef = collection(db, "pet");
  const usuarioCollectionRef = collection(db, "usuario");
  const petVacinaCollectionRef = collection(db, "petVacina");
  const vermifugosCollectionRef = collection(db, "vermifugo");

  useEffect(() => {
    loadEspecies();
    loadPets();
    loadUsuarios();
    loadPetVacinas();
    loadVermifugos();
  }, []);

  const loadPets = async () => {
    try {
      const q = query(petCollectionRef, where("isActive", "==", true));
      const data = await getDocs(q);
      setPets(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
      const specieCount = {};
      pets.forEach((pet) => {
        const specie = getSpecieName(pet.specie);
        specieCount[specie] = (specieCount[specie] || 0) + 1;
      });

      const specieArray = Object.entries(specieCount).map(
        ([specie, count]) => ({
          name: specie,
          'N° de pets': count,
        })
      );
      setPetsBySpecie(specieArray);
      console.log(specieArray);
    } catch (error) {
      message.error("Erro ao carregar pets");
    }
  };
  const loadEspecies = async () => {
    try {
      const q = query(especieCollectionRef, where("isActive", "==", true));
      const especieData = await getDocs(q);
      setEspecies(
        especieData.docs.map((doc) => ({ ...doc.data(), id: doc.id }))
      );
    } catch (error) {
      message.error("Erro ao carregar espécies");
    }
  };

  const loadPetVacinas = async () => {
    try {
      const q = query(petVacinaCollectionRef, where("isActive", "==", true));
      const data = await getDocs(q);
      setPetVacinas(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    } catch (error) {
      message.error("Erro ao carregar vacinas aplicadas");
    }
  };

  const loadVermifugos = async () => {
    try {
      const q = query(vermifugosCollectionRef, where("isActive", "==", true));
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
        where("isActive", "==", true),
        where("role", "==", "client")
      );
      const usuarioData = await getDocs(q);
      setUsuarios(
        usuarioData.docs.map((doc) => ({ ...doc.data(), id: doc.id }))
      );
    } catch (error) {
      message.error("Erro ao carregar clientes");
    }
  };
  const getSpecieName = (specieId) => {
    const specie = especies.find((s) => s.id === specieId);
    return specie ? specie.name : "Espécie não encontrada";
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="N° de clientes"
              value={usuarios.length}
              prefix={<UserOutlined />}
              className="border-2 rounded-lg p-4"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="N° de Pets"
              value={pets.length}
              prefix={<PawPrintIcon />}
              className="border-2 rounded-lg p-4"

            />
          </Col>
          <Col span={6}>
            <Statistic
              title="N° de Vacinas aplicadas"
              value={petVacinas.length}
              prefix={<SyringeIcon />}
              className="border-2 rounded-lg p-4"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="N° de vermifugações realizadas"
              value={vermifugos.length}
              prefix={<PillIcon />}
              className="border-2 rounded-lg p-4"
            />
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
          <div className="w-full border-2 rounded-lg p-4">
            <h1 className="text-base font-bold mb-2">Quantidade de pets por espécie</h1>

            <ResponsiveContainer width="100%" height={250}>
              <BarChart width={730} height={250} data={petsBySpecie}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="N° de pets" fill="#29C28D" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          </Col>
        </Row>
      </div>
    </AppLayout>
  );
}
