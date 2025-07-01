import { useState, useEffect } from "react"
import { Table, Card, Button, Input, Space, Tag, Avatar, Modal, Form, message } from "antd"
import { UserOutlined, PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons"
import AppLayout from "../components/Layout"

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState("")
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [form] = Form.useForm()

  // Dados mockados - substitua por dados reais do Firebase
  const mockUsers = [
    {
      id: "1",
      name: "João Silva",
      email: "joao@email.com",
      role: "Admin",
      status: "active",
      createdAt: "2024-01-15",
    },
    {
      id: "2",
      name: "Maria Santos",
      email: "maria@email.com",
      role: "User",
      status: "active",
      createdAt: "2024-01-20",
    },
    {
      id: "3",
      name: "Pedro Costa",
      email: "pedro@email.com",
      role: "User",
      status: "inactive",
      createdAt: "2024-01-25",
    },
  ]

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      // Aqui você faria a busca no Firebase
      // const usersData = await getUsersFromFirebase()
      setUsers(mockUsers)
    } catch (error) {
      message.error("Erro ao carregar usuários")
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = () => {
    setEditingUser(null)
    form.resetFields()
    setIsModalVisible(true)
  }

  const handleEditUser = (user) => {
    setEditingUser(user)
    form.setFieldsValue(user)
    setIsModalVisible(true)
  }

  const handleDeleteUser = (userId) => {
    Modal.confirm({
      title: "Confirmar exclusão",
      content: "Tem certeza que deseja excluir este usuário?",
      onOk: async () => {
        try {
          // Aqui você faria a exclusão no Firebase
          setUsers(users.filter((user) => user.id !== userId))
          message.success("Usuário excluído com sucesso!")
        } catch (error) {
          message.error("Erro ao excluir usuário")
        }
      },
    })
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()

      if (editingUser) {
        // Atualizar usuário existente
        const updatedUsers = users.map((user) => (user.id === editingUser.id ? { ...user, ...values } : user))
        setUsers(updatedUsers)
        message.success("Usuário atualizado com sucesso!")
      } else {
        // Adicionar novo usuário
        const newUser = {
          id: Date.now().toString(),
          ...values,
          createdAt: new Date().toISOString().split("T")[0],
        }
        setUsers([...users, newUser])
        message.success("Usuário adicionado com sucesso!")
      }

      setIsModalVisible(false)
      form.resetFields()
    } catch (error) {
      console.error("Erro na validação:", error)
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchText.toLowerCase()) ||
      user.email.toLowerCase().includes(searchText.toLowerCase()),
  )

  const columns = [
    {
      title: "Usuário",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div className="flex items-center space-x-3">
          <Avatar icon={<UserOutlined />} />
          <div>
            <div className="font-medium">{text}</div>
            <div className="text-gray-500 text-sm">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Função",
      dataIndex: "role",
      key: "role",
      render: (role) => <Tag color={role === "Admin" ? "red" : "blue"}>{role}</Tag>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "active" ? "green" : "default"}>{status === "active" ? "Ativo" : "Inativo"}</Tag>
      ),
    },
    {
      title: "Data de Criação",
      dataIndex: "createdAt",
      key: "createdAt",
    },
    {
      title: "Ações",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEditUser(record)} />
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteUser(record.id)} />
        </Space>
      ),
    },
  ]

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Usuários</h1>
            <p className="text-gray-600">Gerencie os usuários do sistema</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddUser}>
            Adicionar Usuário
          </Button>
        </div>

        <Card>
          <div className="mb-4">
            <Input
              placeholder="Buscar usuários..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <Table
            columns={columns}
            dataSource={filteredUsers}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
            }}
          />
        </Card>

        <Modal
          title={editingUser ? "Editar Usuário" : "Adicionar Usuário"}
          open={isModalVisible}
          onOk={handleModalOk}
          onCancel={() => setIsModalVisible(false)}
          width={600}
        >
          <Form form={form} layout="vertical" className="mt-4">
            <Form.Item label="Nome" name="name" rules={[{ required: true, message: "Por favor, insira o nome!" }]}>
              <Input />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Por favor, insira o email!" },
                { type: "email", message: "Email inválido!" },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Função"
              name="role"
              rules={[{ required: true, message: "Por favor, selecione a função!" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Status"
              name="status"
              rules={[{ required: true, message: "Por favor, selecione o status!" }]}
            >
              <Input />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AppLayout>
  )
}
