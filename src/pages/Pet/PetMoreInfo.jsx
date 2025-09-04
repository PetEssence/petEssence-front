import { useState, useEffect, useRef } from "react";
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
import { useParams } from "react-router-dom";
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
  const [isActive, setIsActive] = useState(true);
  const [usingCamera, setUsingCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

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
    } finally {
      setLoading(false);
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
      const especieData = await getDocs(especieCollectionRef);
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
      const racaData = await getDocs(racaCollectionRef);
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
        isActive: isActive,
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
      setPet({ ...formattedValues, id: petDoc.id });
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
    return specie ? specie.nome : "Espécie não encontrada";
  };

  const getBreedName = (breedId) => {
    const breed = racas.find((r) => r.id === breedId);
    return breed ? breed.nome : "Raça não encontrada";
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

  useEffect(() => {
    if (usingCamera && videoRef.current) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          videoRef.current.srcObject = stream;
        })
        .catch((err) => {
          console.error("Erro ao acessar câmera:", err);
          setUsingCamera(false);
        });
    }
  }, [usingCamera]);

  const capturePhoto = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      const newFile = new File([blob], "photo.jpg", { type: "image/jpeg" });
      setFile(newFile);
      setHasUploadedFile(false);
      stopCamera();
    }, "image/jpeg");
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setUsingCamera(false);
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
              {file && !usingCamera && (
                <div className="mt-2 w-[300px] h-[300px] rounded overflow-hidden">
                  <img
                    src={hasUploadedFile ? file : URL.createObjectURL(file)}
                    alt="preview"
                    className="w-[300px] h-[300px] object-cover rounded"
                  />
                </div>
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
              <p>ou</p>
              {!usingCamera && (
                <Button onClick={() => setUsingCamera(true)}>
                  Usar câmera
                </Button>
              )}
              {usingCamera && (
                <div className="flex flex-col items-center gap-3">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="rounded w-[300px] h-[300px] bg-black object-cover overflow-hidden"
                  ></video>
                  <div className="flex gap-3">
                    <Button type="primary" onClick={capturePhoto}>
                      Capturar Foto
                    </Button>
                    <Button danger onClick={stopCamera}>
                      Cancelar
                    </Button>
                  </div>
                  <canvas ref={canvasRef} className="hidden"></canvas>
                </div>
              )}
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
              label="Sexo"
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
              label="Data de nascimento ou estimativa"
              tooltip="Indique a data de nascimento ou uma possível data que o pet tenha nascido"
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
                    {especie.nome}
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
                    {raca.nome}
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
