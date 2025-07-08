import { useState, useEffect } from "react";
import {
  message,
} from "antd";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  where,
  query,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { Link, useParams } from "react-router-dom";

export default function PetCard() {
  const [pet, setPet] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const { petId } = useParams();


  const petCollectionRef = collection(db, "pet");
  const usuarioCollectionRef = collection(db, "usuario");

  useEffect(() => {
    loadUsuarios();
    loadPet();
  }, []);

  const loadPet = async () => {
    setLoading(true);
    try {
      const docRef = doc(petCollectionRef, petId);
      const data = await getDoc(docRef);
      setPet({ ...data.data(), id: data.id });
    } catch (error) {
      message.error("Erro ao carregar pet");
      console.log(error);
    } finally {
      setLoading(false);
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

  const getOwnerName = (ownerId) => {
    const owner = usuarios.find((u) => u.id === ownerId);
    return owner ? owner.name : "Dono não encontrado";
  };

  if (loading) return <div>Carregando</div>;

  return (
    <div className="min-w-64 border rounded shadow-md flex flex-col items-center p-4 gap-2">
      <img
        src={pet.photo}
        alt="preview"
        className="mt-2 object-cover rounded w-[200px] h-[200px]"
      />
      <p className="">Nome: {pet.name}</p>
      <p>Tutores: {pet.owner?.map((o) => getOwnerName(o))}</p>
    </div>
  );
}
