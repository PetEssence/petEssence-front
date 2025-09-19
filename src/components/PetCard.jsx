import { useState, useEffect } from "react";
import { message } from "antd";
import { collection, getDocs, getDoc, doc } from "firebase/firestore";
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
    return owner ? owner.nome : "Dono não encontrado";
  };

  if (loading) return <div>Carregando</div>;

  return (
    <div className="w-full max-w-sm border rounded shadow-md flex flex-col items-center p-4 gap-2">
      <div className="w-full flex items-center justify-center">
        <img
          src={pet.foto}
          alt="preview"
          className="mt-2 object-cover rounded w-40 h-40 sm:w-48 sm:h-48 md:w-52 md:h-52"
        />
      </div>
      <div className="flex gap-1 flex-wrap justify-center text-center">
        <span className="font-bold">Nome: </span>
        <p className="break-words">{pet.nome}</p>
      </div>
      <div className="flex flex-col gap-1 text-center w-full">
        <span className="font-bold">Tutores: </span>
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-1 items-center justify-center whitespace-pre-wrap">
          {pet.tutorAnimal?.map((o, index) => (
            <>
              <p
                key={index}
                className="truncate max-w-full sm:max-w-[200px] whitespace-pre-wrap"
              >
                {getOwnerName(o) + ", "} 
              </p>
              <br/>
            </>
          ))}
        </div>
      </div>
    </div>
  );
}
