import { useState, useEffect } from "react";
import {
  Button,
  Input,
  Form,
  message,
  DatePicker,
  Select,
  Upload,
  Modal,
} from "antd";
import AppLayout from "../../components/Layout";
import {
  collection,
  getDocs,
  getDoc,
  updateDoc,
  doc,
  where,
  query,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import dayjs from "dayjs";
import { Link, useParams } from "react-router-dom";
import PetLayout from "../../components/PetLayout";
import ImageKit from "imagekit";

const { Option } = Select;

export default function PetMoreInfo() {
  const [pet, setPet] = useState([]);
  const [especies, setEspecies] = useState([]);
  const [racas, setRacas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const { petId } = useParams();
  const [file, setFile] = useState(null);
  const [hasUploadedFile, setHasUploadedFile] = useState(false);
  const [savingLoading, setSavingLoading] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const petCollectionRef = collection(db, "pet");
  const especieCollectionRef = collection(db, "especie");
  const racaCollectionRef = collection(db, "raca");
  const usuarioCollectionRef = collection(db, "usuario");

  const imagekit = new ImageKit({
    urlEndpoint: "https://ik.imagekit.io/petEssence",
    publicKey: import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY,
    privateKey: import.meta.env.VITE_IMAGEKIT_PRIVATE_KEY,
  });

  useEffect(() => {
    loadEspecies();
    loadUsuarios();
    loadRacas();
    loadPet();
  }, []);

  useEffect(() => {
    loadFormData();
  }, [pet]);

  const loadPet = async () => {
    setLoading(true);
    try {
      const docRef = doc(petCollectionRef, petId);
      const data = await getDoc(docRef);
      setPet({ ...data.data(), id: data.id });
      loadFormData();
    } catch (error) {
      message.error("Erro ao carregar pet");
      console.log(error);
    }
  };

  const loadFormData = () => {
    const formData = {
      ...pet,
      photo: pet.photo,
      birthDate: pet.birthDate ? dayjs(pet.birthDate) : null,
      createdAt: pet.createdAt ? dayjs(pet.createdAt) : null,
    };
    if (formData.photo) {
      setFile(formData.photo);
      setHasUploadedFile(true);
    }
    setIsActive(formData.isActive);
    form.setFieldsValue(formData);
    setLoading(false);
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

  const loadRacas = async () => {
    try {
      const q = query(racaCollectionRef, where("isActive", "==", true));
      const racaData = await getDocs(q);
      setRacas(racaData.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    } catch (error) {
      message.error("Erro ao carregar raças");
    }
  };

  const handleEdit = async () => {
    setSavingLoading(true);
    try {
      const values = await form.validateFields();
      let photoUrl = values.photo || null;

      if (file && !hasUploadedFile) {
        try {
          const resized = await resizeImage(file, 300, 300);
          const base64 = await convertToBase64(resized);

          const upload = await imagekit.upload({
            file: base64,
            fileName: file.name,
            folder: "/pets",
          });
          photoUrl = upload.url;
        } catch (err) {
          console.error("Erro ao redimensionar/upload da imagem:", err);
          message.error("Erro ao fazer upload da imagem.");
          setSavingLoading(false);
          return;
        }
      }
      const formattedValues = {
        ...values,
        birthDate: values.birthDate
          ? values.birthDate.format("YYYY-MM-DD")
          : null,
        photo: photoUrl,
      };

      const petDoc = doc(petCollectionRef, petId);
      await updateDoc(petDoc, formattedValues);

      const oldOwners = pet.owner || [];
      const newOwners = formattedValues.owner || [];

      const addedOwners = newOwners.filter((id) => !oldOwners.includes(id));
      const removedOwners = oldOwners.filter((id) => !newOwners.includes(id));

      for (const ownerId of addedOwners) {
        const ownerRef = doc(usuarioCollectionRef, ownerId);
        const ownerSnap = await getDoc(ownerRef);

        if (ownerSnap.exists()) {
          const pets = ownerSnap.data().petsId || [];
          const updatedPets = pets.includes(petDoc.id)
            ? pets
            : [...pets, petDoc.id];

          await updateDoc(ownerRef, { petsId: updatedPets });
        }
      }

      for (const ownerId of removedOwners) {
        const ownerRef = doc(usuarioCollectionRef, ownerId);
        const ownerSnap = await getDoc(ownerRef);

        if (ownerSnap.exists()) {
          const pets = ownerSnap.data().petsId || [];
          const updatedPets = pets.filter((id) => id !== petDoc.id);

          await updateDoc(ownerRef, { petsId: updatedPets });
        }
      }
      setPet({...formattedValues, id:petDoc.id})
      message.success("Pet atualizado com sucesso!");
      setSavingLoading(false);
    } catch (error) {
      console.error("Erro na validação:", error);
      message.error("Erro ao salvar pet");
      setSavingLoading(false);
    }
  };
  const handleActiveStatus = (petId, activeStatus) => {
    Modal.confirm({
      title: `Confirmar ${activeStatus ? "inativação" : "ativação"}`,
      content: `Tem certeza que deseja ${
        activeStatus ? "desativar" : "ativar"
      } este pet?`,
      okText: "Confirmar",
      okType: "primary",
      cancelText: "Cancelar",
      okButtonProps: {
        className: "!bg-primaryGreen !hover:bg-primaryGreenHouver",
      },
      onOk: async () => {
        try {
          const petDoc = doc(petCollectionRef, petId);
          const newStatus = { isActive: !activeStatus };
          await updateDoc(petDoc, newStatus);
          setIsActive(!isActive);
          message.success("Pet atualizado com sucesso!");
        } catch (error) {
          message.error("Erro ao atualizar pet");
        }
      },
    });
  };
  const getSpecieName = (specieId) => {
    const specie = especies.find((s) => s.id === specieId);
    return specie ? specie.name : "Espécie não encontrada";
  };

  const getBreedName = (breedId) => {
    const breed = racas.find((r) => r.id === breedId);
    return breed ? breed.name : "Raça não encontrada";
  };

  const getOwnerName = (ownerId) => {
    const owner = usuarios.find((u) => u.id === ownerId);
    return owner ? owner.name : "Dono não encontrado";
  };
  const resizeImage = (file, width = 300, height = 300) => {
    return new Promise((resolve, reject) => {
      const img = document.createElement("img");
      const reader = new FileReader();

      reader.onload = (e) => {
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");

          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            resolve(blob);
          }, file.type || "image/jpeg");
        };
        img.src = e.target.result;
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const convertToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };
  return (
    <AppLayout>
      <PetLayout petId={pet.id} />
      <div className="space-y-6 flex items-center justify-center w-full">
        <Form
          form={form}
          layout="vertical"
          className="mt-4 flex flex-col w-2/5"
          onFinish={handleEdit}
        >
          <Form.Item
            label="Foto do pet"
            name="photo"
            className="flex justify-center items-center"
          >
            <div className="flex justify-center items-center flex-col gap-5">
              {file && (
                <img
                  src={hasUploadedFile ? file : URL.createObjectURL(file)}
                  alt="preview"
                  className="mt-2 object-cover rounded w-[300px] h-[300px]"
                />
              )}
              <Upload
                beforeUpload={(file) => {
                  setHasUploadedFile(false);
                  setFile(file);
                  return false;
                }}
                maxCount={1}
                showUploadList={false}
              >
                <Button>Selecionar Imagem</Button>
              </Upload>
            </div>
          </Form.Item>

          <Form.Item
            label="Nome"
            name="name"
            rules={[{ required: true, message: "Por favor, insira o nome!" }]}
          >
            <Input />
          </Form.Item>

          <div className="w-full flex gap-8 justify-between">
            <Form.Item
              label="Gênero"
              name="genre"
              className="w-3/6"
              rules={[
                { required: true, message: "Por favor, selecione o gênero!" },
              ]}
            >
              <Select
                placeholder="Selecione o gênero"
                defaultValue={pet.genre}
                options={[
                  { value: "female", label: "Fêmea" },
                  { value: "male", label: "Macho" },
                  { value: "other", label: "Outro" },
                ]}
              ></Select>
            </Form.Item>
            <Form.Item
              label="Data de Nascimento"
              name="birthDate"
              className="w-3/6"
              rules={[
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    if (value.isAfter(dayjs())) {
                      return Promise.reject("A data não pode ser no futuro!");
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <DatePicker
                format="DD/MM/YYYY"
                style={{ width: "100%" }}
                placeholder="Selecione uma data"
                disabledDate={(current) =>
                  current && current > dayjs().endOf("day")
                }
              />
            </Form.Item>
          </div>

          <div className="w-full flex gap-8 justify-between">
            <Form.Item
              label="Espécie"
              name="specie"
              className="w-3/6"
              rules={[
                {
                  required: true,
                  message: "Por favor, selecione a espécie!",
                },
              ]}
            >
              <Select
                placeholder="Selecione a espécie"
                defaultValue={getSpecieName(pet.especie)}
              >
                {especies.map((especie) => (
                  <Option key={especie.id} value={especie.id}>
                    {especie.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Raça"
              className="w-3/6"
              name="breed"
              rules={[
                { required: true, message: "Por favor, selecione a raça!" },
              ]}
            >
              <Select
                placeholder="Selecione a raça"
                defaultValue={getBreedName(pet.breed)}
              >
                {racas.map((raca) => (
                  <Option key={raca.id} value={raca.id}>
                    {raca.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>
          <Form.Item
            label="Tutor"
            name="owner"
            rules={[
              { required: true, message: "Por favor, selecione um tutor!" },
            ]}
          >
            <Select
              placeholder="Selecione um ou mais tutores"
              defaultValue={pet.owner?.map((id) => getOwnerName(id))}
              mode="multiple"
            >
              {usuarios.map((usuario) => (
                <Option key={usuario.id} value={usuario.id}>
                  {usuario.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label={null}>
            <div className="flex justify-between">
              <Button
                danger
                onClick={() => handleActiveStatus(pet.id, isActive)}
              >
                {isActive ? "Desativar" : "Ativar"}
              </Button>
              <Button type="primary" htmlType="submit" loading={savingLoading}>
                Confirmar
              </Button>
            </div>
          </Form.Item>
        </Form>
      </div>
    </AppLayout>
  );
}
