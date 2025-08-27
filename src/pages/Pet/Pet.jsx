import { useState, useEffect } from "react";
import {
  Card,
  Button,
  Input,
  Tag,
  Modal,
  Form,
  message,
  DatePicker,
  Select,
  Avatar,
  Upload,
} from "antd";
import {
  ClearOutlined,
  FilterOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import AppLayout from "../../components/Layout";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  addDoc,
  where,
  query,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import ImageKit from "imagekit";

const { Meta } = Card;
const { Option } = Select;

export default function Pet() {
  const [pets, setPets] = useState([]);
  const [especies, setEspecies] = useState([]);
  const [racas, setRacas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchRaca, setSearchRaca] = useState(null);
  const [searchEspecie, setSearchEspecie] = useState(null);
  const [searchUsuario, setSearchUsuario] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [file, setFile] = useState(null);
  const [savingLoading, setSavingLoading] = useState(false);

  const petCollectionRef = collection(db, "pet");
  const especieCollectionRef = collection(db, "especie");
  const racaCollectionRef = collection(db, "raca");
  const usuarioCollectionRef = collection(db, "usuario");
  const isFilterActive = searchText || searchRaca || searchEspecie || searchUsuario;

  const imagekit = new ImageKit({
    urlEndpoint: "https://ik.imagekit.io/petEssence",
    publicKey: import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY,
    privateKey: import.meta.env.VITE_IMAGEKIT_PRIVATE_KEY,
  });

  useEffect(() => {
    loadEspecies();
    loadRacas();
    loadUsuarios();
    loadPets();
  }, []);

  const loadPets = async () => {
    setLoading(true);
    try {
      const data = await getDocs(petCollectionRef);
      setPets(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    } catch (error) {
      message.error("Erro ao carregar pets");
    } finally {
      setLoading(false);
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

  const handleAddPet = () => {
    form.resetFields();
    setFile(null);
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      setSavingLoading(true);
      const values = await form.validateFields();
      let photoUrl = values.photo || null;
      if (file) {
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
          return;
        }
      }
      const formattedValues = {
        ...values,
        photo: photoUrl,
        birthDate: values.birthDate
          ? values.birthDate.format("YYYY-MM-DD")
          : null,
      };

      const docRef = await addDoc(petCollectionRef, {
        ...formattedValues,
        createdAt: new Date().toISOString().split("T")[0],
        isActive: true,
      });

      for (const ownerId of formattedValues.owner) {
        const ownerDocRef = doc(usuarioCollectionRef, ownerId);
        const ownerSnap = await getDoc(ownerDocRef);

        if (ownerSnap.exists()) {
          const existingPets = ownerSnap.data().petsId || [];

          const updatedPets = existingPets.includes(docRef.id)
            ? existingPets
            : [...existingPets, docRef.id];

          await updateDoc(ownerDocRef, { petsId: updatedPets });
        }
      }
      setPets([
        ...pets,
        {
          id: docRef.id,
          ...formattedValues,
          createdAt: new Date().toISOString().split("T")[0],
          isActive: true,
        },
      ]);
      message.success("Pet adicionado com sucesso!");
      setIsModalVisible(false);
      form.resetFields();
      setFile(null);
      setSavingLoading(false);
    } catch (error) {
      console.error("Erro na validação:", error);
      message.error("Erro ao salvar pet.");
      setSavingLoading(false);
    }
  };

  const resizeImage = (file, width = 300, height = 300) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
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

  const filteredPet = pets.filter((pet) => {
    const matchName = pet.name.toLowerCase().includes(searchText.toLowerCase());
    const matchRaca = !searchRaca || pet.breed === searchRaca;
    const matchEspecie = !searchEspecie || pet.specie === searchEspecie;
    const matchTutor = !searchUsuario || pet.owner.includes(searchUsuario);

    return matchName && matchRaca && matchEspecie && matchTutor;
  });

  const handleClearFilters = () => {
    setSearchText("");
    setSearchRaca(null);
    setSearchEspecie(null);
    setSearchUsuario(null)
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

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Pets</h1>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddPet}>
            Adicionar Pet
          </Button>
        </div>

        <Card>
          <div className="mb-4 flex gap-5">
            <Input
              placeholder="Buscar Pet..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="max-w-sm"
            />
            <Select
              placeholder="Filtre por raça"
              className="w-52"
              allowClear={true}
              value={searchRaca}
              prefix={<FilterOutlined />}
              onChange={(e) => setSearchRaca(e)}
            >
              {racas.map((raca) => (
                <Option key={raca.id} value={raca.id}>
                  {raca.name}
                </Option>
              ))}
            </Select>
            <Select
              placeholder="Filtre por espécie"
              className="w-52"
              allowClear={true}
              value={searchEspecie}
              prefix={<FilterOutlined />}
              onChange={(e) => setSearchEspecie(e)}
            >
              {especies.map((e) => (
                <Option key={e.id} value={e.id}>
                  {e.name}
                </Option>
              ))}
            </Select>
            <Select
              placeholder="Filtre por tutor"
              className="w-52"
              allowClear={true}
              value={searchUsuario}
              prefix={<FilterOutlined />}
              onChange={(e) => setSearchUsuario(e)}
            >
              {usuarios.map((u) => (
                <Option key={u.id} value={u.id}>
                  {u.name}
                </Option>
              ))}
            </Select>
          {   isFilterActive &&
            <Button
              icon={<ClearOutlined />}
              onClick={() => handleClearFilters()}
              type="primary"
            >
              Limpar Filtros
            </Button>
            }
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPet.length > 0 ? (
              filteredPet.map((pet) => (
              <Link to={`/${pet.id}`} key={pet.id}>
                <Card
                  key={pet.id}
                  hoverable
                  className="w-full"
                  cover={
                    <Avatar
                      shape="square"
                      size="large"
                      src={pet.photo}
                      className="object-contain"
                      style={{ minHeight: 200, maxHeight: 200 }}
                    />
                  }
                >
                  <Meta
                    title={
                      <div className="flex items-center justify-between">
                        <span className="truncate">{pet.name}</span>
                        {pet.isActive ? (
                          <Tag color="green" size="small">
                            Ativo
                          </Tag>
                        ) : (
                          <Tag color="red" size="small">
                            Inativo
                          </Tag>
                        )}
                      </div>
                    }
                    description={
                      <div className="space-y-1">
                        <div className="text-xs text-gray-500 truncate">
                          Tutores:{" "}
                          {pet.owner.map((id) => getOwnerName(id) + " - ")}
                        </div>
                        <div className="text-xs text-gray-400">
                          Raça: {getBreedName(pet.breed)}
                        </div>
                        <div className="text-xs text-gray-400">
                          Espécie: {getSpecieName(pet.specie)}
                        </div>
                      </div>
                    }
                  />
                </Card>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-300 py-8">
              Não há registros.
            </div>
          )}
          </div>
        </Card>

        <Modal
          title={"Adicionar Pet"}
          open={isModalVisible}
          onOk={handleModalOk}
          okText="Confirmar"
          cancelText="Cancelar"
          confirmLoading={savingLoading}
          onCancel={() => setIsModalVisible(false)}
          width={600}
        >
          <Form form={form} layout="vertical" className="mt-4 flex flex-col">
            <Form.Item
              label="Foto do pet"
              name="photo"
              className="flex justify-center items-center"
            >
              <div className="flex justify-center items-center flex-col gap-5">
                {file && (
                  <img
                    src={URL.createObjectURL(file)}
                    alt="preview"
                    className="mt-2 object-cover rounded w-[300px] h-[300px]"
                  />
                )}
                <Upload
                  beforeUpload={(file) => {
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
                label="Sexo"
                name="genre"
                className="w-3/6"
                rules={[
                  { required: true, message: "Por favor, selecione o sexo!" },
                ]}
              >
                <Select
                  placeholder="Selecione o sexo"
                  defaultValue={undefined}
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
                <Select placeholder="Selecione a raça" defaultValue={undefined}>
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
                defaultValue={undefined}
                mode="multiple"
              >
                {usuarios.map((usuario) => (
                  <Option key={usuario.id} value={usuario.id}>
                    {usuario.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AppLayout>
  );
}
