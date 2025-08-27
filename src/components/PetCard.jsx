import { useState, useEffect } from "react";
import {
  message,
} from "antd";
import {
  collection,
  getDocs,
  getDoc,
  doc,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { useParams } from "react-router-dom";

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
      const usuarioData = await getDocs(usuarioCollectionRef);
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
      <div className=" flex gap-1">
        <span className="font-bold">Nome: </span>
        <p>{pet.name}</p>
      </div>
      <div className="flex flex-col gap-1 text-center">
        <span className="font-bold">Tutores: </span>
        <div>
          {pet.owner?.map((o, index) => (
            <p key={index}>{getOwnerName(o)}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
