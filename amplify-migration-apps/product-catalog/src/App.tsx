import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { uploadData, getUrl } from 'aws-amplify/storage';
import { getCurrentUser } from 'aws-amplify/auth';
import { listProducts, listUsers, getUser, checkLowStock, commentsByProductId } from './graphql/queries.ts';
import { createProduct, deleteProduct, updateProduct, createUser, updateUser, createComment } from './graphql/mutations.ts';
import type { Product, User, Comment, UserRole } from './API';
import './App.css';
import {
  withAuthenticator,
  Button,
  Card,
  Flex,
  Text,
  Badge,
  View,
  TextField,
  TextAreaField,
  SelectField,
  Loader,
} from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { type AuthUser } from 'aws-amplify/auth';
import { type UseAuthenticator } from '@aws-amplify/ui-react-core';

// Enterprise constants
const CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Toys', 'Other'];

// Enterprise ProductImage component
function ProductImage({ imageKey }: { imageKey: string | null | undefined }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (imageKey) {
      getUrl({ key: imageKey })
        .then((result) => {
          setImageUrl(result.url.toString());
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [imageKey]);

  if (loading) {
    return (
      <View
        height="280px"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        }}
      >
        <View textAlign="center">
          <Loader size="large" />
          <Text fontSize="sm" color="#64748b" marginTop="1rem">
            Loading image...
          </Text>
        </View>
      </View>
    );
  }

  if (!imageKey || !imageUrl) {
    return (
      <View
        height="280px"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        }}
      >
        <View textAlign="center">
          <View
            backgroundColor="#e2e8f0"
            borderRadius="50%"
            width="60px"
            height="60px"
            margin="0 auto 1rem"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text fontSize="2xl">📦</Text>
          </View>
          <Text fontSize="sm" fontWeight="600" color="#64748b">
            No image available
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      position="relative"
      overflow="hidden"
      style={{
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      }}
    >
      <img
        src={imageUrl}
        alt="Product"
        style={{
          width: '100%',
          height: '280px',
          objectFit: 'cover',
          transition: 'transform 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      />
    </View>
  );
}

type AppProps = {
  signOut?: UseAuthenticator['signOut'];
  user?: AuthUser;
};

function App({ signOut, user }: AppProps) {
  const client = generateClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [stockCheckLoading, setStockCheckLoading] = useState(false);
  const [lowStockAlert, setLowStockAlert] = useState<{ count: number; products: string[]; message: string } | null>(null);

  // User role management
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [showUserManagement, setShowUserManagement] = useState(false);

  // Comments
  const [productComments, setProductComments] = useState<{ [key: string]: Comment[] }>({});
  const [showComments, setShowComments] = useState<{ [key: string]: boolean }>({});
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});

  const [formData, setFormData] = useState({
    serialno: '',
    engword: '',
    price: '',
    category: '',
    description: '',
    stock: '',
    brand: '',
    imageKey: '',
    images: [],
  });

  // Permission checks
  const canCreate = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER';
  const canEdit = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER';
  const canDelete = currentUser?.role === 'ADMIN';
  const canManageUsers = currentUser?.role === 'ADMIN';

  const resetForm = () => {
    setFormData({ serialno: '', engword: '', price: '', category: '', description: '', stock: '', brand: '', imageKey: '', images: [] });
    setSelectedFile(null);
    setEditingProduct(null);
    setShowForm(false);
  };

  // Initialize current user
  const initializeUser = async () => {
    try {
      const authUser = await getCurrentUser();
      const result = await client.graphql({
        query: getUser,
        variables: { id: authUser.userId },
      });

      if (result.data?.getUser) {
        setCurrentUser(result.data.getUser as User);
      } else {
        // Check if this is the first user (bootstrap admin)
        const allUsersResult = await client.graphql({ query: listUsers });
        const existingUsers = allUsersResult.data?.listUsers?.items?.filter((user) => user !== null) || [];
        const isFirstUser = existingUsers.length === 0;

        // Create new user - first user gets ADMIN role, others get VIEWER
        const newUser = await client.graphql({
          query: createUser,
          variables: {
            input: {
              id: authUser.userId,
              email: authUser.signInDetails?.loginId || '',
              name: authUser.signInDetails?.loginId || 'User',
              role: isFirstUser ? ('ADMIN' as UserRole) : ('VIEWER' as UserRole),
            },
          },
        });
        setCurrentUser(newUser.data?.createUser as User);

        if (isFirstUser) {
          alert('🎉 Welcome! You are the first user and have been granted Admin privileges.');
        }
      }
    } catch (error) {
      console.error('Error initializing user:', error);
    }
  };

  // Fetch all users (admin only)
  const fetchAllUsers = async () => {
    try {
      const result = await client.graphql({ query: listUsers });
      setAllUsers((result.data?.listUsers?.items?.filter((user) => user !== null) as User[]) || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Update user role (admin only)
  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      await client.graphql({
        query: updateUser,
        variables: { input: { id: userId, role: newRole } },
      });
      fetchAllUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  // Fetch comments for a product
  const fetchComments = async (productId: string) => {
    try {
      const result = await client.graphql({
        query: commentsByProductId,
        variables: { productId },
      });
      const comments = (result.data?.commentsByProductId?.items?.filter((comment) => comment !== null) as Comment[]) || [];
      setProductComments((prev) => ({ ...prev, [productId]: comments }));
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  // Add comment to product
  const addComment = async (productId: string) => {
    const content = newComment[productId]?.trim();
    if (!content || !currentUser) return;

    try {
      await client.graphql({
        query: createComment,
        variables: {
          input: {
            productId,
            authorId: currentUser.id,
            authorName: currentUser.name,
            content,
          },
        },
      });
      setNewComment((prev) => ({ ...prev, [productId]: '' }));
      fetchComments(productId);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  // Toggle comments visibility
  const toggleComments = (productId: string) => {
    setShowComments((prev) => ({ ...prev, [productId]: !prev[productId] }));
    if (!showComments[productId] && !productComments[productId]) {
      fetchComments(productId);
    }
  };

  const startEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      serialno: product.serialno.toString(),
      engword: product.engword,
      price: product.price?.toString() || '',
      category: product.category || '',
      description: product.description || '',
      stock: product.stock?.toString() || '',
      brand: product.brand || '',
      imageKey: (product as any).imageKey || '',
      images: [],
    });
    setShowForm(true);
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const result = await client.graphql({ query: listProducts });
      console.log('Fetch products result:', result);
      const items = result.data?.listProducts?.items || [];
      console.log('Products found:', items.length);
      setProducts(items.filter((item) => item !== null) as Product[]);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      if (error.errors) {
        console.error('GraphQL errors:', error.errors);
        error.errors.forEach((err: any, index: number) => {
          console.error(`Error ${index + 1}:`, err.message, err);
        });
      }
      setProducts([]);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      // Check if user is initialized
      if (!currentUser) {
        alert('User not initialized. Please refresh the page.');
        setUploading(false);
        return;
      }

      const productData = {
        serialno: parseInt(formData.serialno),
        engword: formData.engword,
        price: formData.price ? parseFloat(formData.price) : null,
        category: formData.category || null,
        description: formData.description || null,
        stock: formData.stock ? parseInt(formData.stock) : null,
        brand: formData.brand || null,
        createdBy: currentUser.id,
        updatedBy: currentUser.id,
      };

      let productId;

      if (editingProduct) {
        console.log(`Updating product (${editingProduct.id}) with data:`, productData);
        const result = await client.graphql({
          query: updateProduct,
          variables: { input: { id: editingProduct.id, ...productData } },
        });
        console.log('Update result:', result);
        productId = editingProduct.id;
      } else {
        console.log('Creating product with data:', productData);
        const result = await client.graphql({
          query: createProduct,
          variables: { input: productData },
        });
        console.log('Create result:', result);
        productId = result.data.createProduct.id;
      }

      if (selectedFile) {
        const fileKey = `products/${productId}_${Date.now()}-${selectedFile.name}`;
        console.log(`Uploading image ${fileKey}`);
        await uploadData({
          key: fileKey,
          data: selectedFile,
          options: { contentType: selectedFile.type },
        });

        console.log(`Updating imageKey field`);
        await client.graphql({
          query: updateProduct,
          variables: { input: { id: productId, imageKey: fileKey } },
        });
      }

      resetForm();
      fetchProducts();
      alert('Product saved successfully!');
    } catch (error: any) {
      console.error('Error saving product:', error);
      alert(`Error saving product: ${error.message || error}`);
    }
    setUploading(false);
  };

  const removeProduct = async (id: string) => {
    try {
      await client.graphql({
        query: deleteProduct,
        variables: { input: { id } },
      });
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const checkLowStockProducts = async () => {
    try {
      const result = (await client.graphql({ query: checkLowStock })) as any;
      const data = result.data?.checkLowStock;
      console.log('Lambda result:', data);

      if (data?.lowStockProducts && data.lowStockProducts.length > 0) {
        setLowStockAlert({
          count: data.lowStockProducts.length,
          products: data.lowStockProducts.map((p: any) => `${p.name} (${p.stock} left)`),
          message: data.message,
        });
      } else {
        setLowStockAlert(null);
      }

      return data?.lowStockProducts || [];
    } catch (error) {
      console.error('Error checking low stock:', error);
      return [];
    }
  };

  const downloadStockReport = async () => {
    setStockCheckLoading(true);
    try {
      const lowStock = await checkLowStockProducts();

      // Create CSV content
      const csvHeader = 'Product Name,Current Stock\n';
      const csvRows = lowStock.length > 0 ? lowStock.map((p: any) => `"${p.name}",${p.stock}`).join('\n') : 'No low stock items found,';

      const csvContent = csvHeader + csvRows;

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `low-stock-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      if (lowStock.length > 0) {
        alert(`Downloaded stock report! Found ${lowStock.length} products with low stock.`);
      } else {
        alert('Downloaded report: All products are well stocked!');
      }
    } catch (error) {
      console.error('Error downloading stock report:', error);
      alert('Failed to download stock report. Please try again.');
    }
    setStockCheckLoading(false);
  };

  // Filter and sort products
  const filteredProducts = products
    .filter(
      (product) =>
        product.engword.toLowerCase().includes(searchTerm.toLowerCase()) && (filterCategory === '' || product.category === filterCategory),
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return (a.price || 0) - (b.price || 0);
        case 'stock':
          return (a.stock || 0) - (b.stock || 0);
        default:
          return a.engword.localeCompare(b.engword);
      }
    });

  useEffect(() => {
    fetchProducts();
    initializeUser();
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      checkLowStockProducts();
    }
  }, [products]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
      {/* Modern Header */}
      <View
        backgroundColor="white"
        padding="1.5rem 2rem"
        style={{
          borderBottom: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          flexShrink: 0,
        }}
      >
        <Flex justifyContent="space-between" alignItems="center">
          <View>
            <Flex alignItems="center" gap="0.75rem">
              <View
                backgroundColor="#3b82f6"
                borderRadius="12px"
                padding="0.75rem"
                style={{ boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}
              >
                <Text fontSize="xl" style={{ margin: 0 }}>
                  🏪
                </Text>
              </View>
              <View>
                <Text fontSize="2xl" fontWeight="700" color="#1e293b">
                  Product Catalog
                </Text>
                <Text fontSize="sm" color="#64748b">
                  Welcome back, {user?.signInDetails?.loginId || user?.username}
                </Text>
              </View>
            </Flex>
          </View>
          <Button
            onClick={signOut}
            size="small"
            style={{
              borderColor: '#e2e8f0',
              color: '#64748b',
              fontWeight: '500',
              backgroundColor: 'transparent',
              border: '1px solid #e2e8f0',
            }}
          >
            Sign out
          </Button>
        </Flex>
      </View>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '2rem' }}>
        {/* Enhanced Controls Bar */}
        <Card
          padding="0"
          marginBottom="2rem"
          style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            overflow: 'hidden',
          }}
        >
          {/* Controls Header */}
          <View
            padding="0.5rem 1rem 0.25rem"
            style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            }}
          >
            <Flex alignItems="center" gap="0.5rem">
              <View backgroundColor="#3b82f6" borderRadius="6px" padding="0.2rem" style={{ boxShadow: '0 2px 8px rgba(59,130,246,0.3)' }}>
                <Text fontSize="xs" style={{ margin: 0, filter: 'brightness(0) invert(1)' }}>
                  🔍
                </Text>
              </View>
              <Text fontSize="sm" fontWeight="700" color="#1e293b">
                Search & Filter
              </Text>
            </Flex>
          </View>

          {/* Controls Content */}
          <View padding="0.75rem 1rem 1rem">
            <Flex direction={{ base: 'column', large: 'row' }} gap="0.75rem" alignItems={{ large: 'center' }}>
              <View
                padding="0.4rem"
                backgroundColor="#f8fafc"
                borderRadius="8px"
                border="1px solid #e2e8f0"
                width={{ base: '100%', large: '260px' }}
              >
                <Text fontSize="xs" fontWeight="600" color="#64748b" marginBottom="0.2rem">
                  Search
                </Text>
                <input
                  type="text"
                  placeholder="🔍 Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                />
              </View>

              <View
                padding="0.4rem"
                backgroundColor="#fefce8"
                borderRadius="8px"
                border="1px solid #fde047"
                width={{ base: '100%', large: '160px' }}
              >
                <SelectField label="Category" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} size="small">
                  <option value="">All Categories</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </SelectField>
              </View>

              <View
                padding="0.4rem"
                backgroundColor="#f0f9ff"
                borderRadius="8px"
                border="1px solid #7dd3fc"
                width={{ base: '100%', large: '120px' }}
              >
                <SelectField label="Sort by" value={sortBy} onChange={(e) => setSortBy(e.target.value)} size="small">
                  <option value="name">Name</option>
                  <option value="price">Price</option>
                  <option value="stock">Stock</option>
                </SelectField>
              </View>

              <Button
                onClick={downloadStockReport}
                size="large"
                isLoading={stockCheckLoading}
                loadingText="Downloading..."
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: 'white',
                  fontWeight: '700',
                  borderRadius: '8px',
                  padding: '0.6rem 1.2rem',
                  boxShadow: '0 4px 16px rgba(5,150,105,0.4)',
                  marginRight: '0.75rem',
                }}
              >
                📄 Download Report
              </Button>

              {canCreate && (
                <Button
                  onClick={() => (showForm ? resetForm() : setShowForm(true))}
                  size="large"
                  style={{
                    background: showForm ? 'transparent' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderColor: showForm ? '#667eea' : 'transparent',
                    color: showForm ? '#667eea' : 'white',
                    fontWeight: '700',
                    borderRadius: '8px',
                    padding: '0.6rem 1.2rem',
                    boxShadow: showForm ? 'none' : '0 4px 16px rgba(102,126,234,0.4)',
                    transition: 'all 0.2s ease',
                    border: showForm ? '1px solid #667eea' : 'none',
                  }}
                >
                  {showForm ? '✕ Cancel' : '✨ Add Product'}
                </Button>
              )}

              {canManageUsers && (
                <Button
                  onClick={() => {
                    setShowUserManagement(!showUserManagement);
                    if (!showUserManagement) {
                      fetchAllUsers();
                    }
                  }}
                  size="large"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: 'white',
                    fontWeight: '700',
                    borderRadius: '8px',
                    padding: '0.6rem 1.2rem',
                    boxShadow: '0 4px 16px rgba(245,158,11,0.4)',
                  }}
                >
                  👥 Manage Users
                </Button>
              )}
            </Flex>
          </View>
        </Card>

        {/* User Role Display */}
        {currentUser && (
          <Card marginBottom="1rem" style={{ backgroundColor: '#f0f9ff', border: '1px solid #7dd3fc', borderRadius: '12px' }}>
            <Flex alignItems="center" gap="1rem" padding="1rem">
              <Badge style={{ backgroundColor: '#3b82f6', color: 'white', fontWeight: '600' }}>{currentUser.role}</Badge>
              <Text fontSize="sm" color="#1e40af">
                Logged in as {currentUser.name} ({currentUser.email})
              </Text>
              {currentUser.role === 'VIEWER' && (
                <Button
                  onClick={() => updateUserRole(currentUser.id, 'ADMIN' as UserRole)}
                  size="small"
                  style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    fontWeight: '600',
                    borderRadius: '6px',
                    marginLeft: 'auto',
                  }}
                >
                  🚀 Make Me Admin
                </Button>
              )}
            </Flex>
          </Card>
        )}

        {/* User Management Panel */}
        {showUserManagement && canManageUsers && (
          <Card marginBottom="2rem" style={{ backgroundColor: '#fefce8', border: '1px solid #fde047', borderRadius: '12px' }}>
            <View padding="1.5rem">
              <Text fontSize="lg" fontWeight="700" marginBottom="1rem">
                👥 User Management
              </Text>
              {allUsers.map((user) => (
                <Flex
                  key={user.id}
                  alignItems="center"
                  gap="1rem"
                  marginBottom="1rem"
                  padding="1rem"
                  style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                >
                  <View flex="1">
                    <Text fontWeight="600">{user.name}</Text>
                    <Text fontSize="sm" color="#6b7280">
                      {user.email}
                    </Text>
                  </View>
                  <SelectField
                    label="Role"
                    value={user.role}
                    onChange={(e) => updateUserRole(user.id, e.target.value as UserRole)}
                    size="small"
                    style={{ minWidth: '120px' }}
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="MANAGER">Manager</option>
                    <option value="VIEWER">Viewer</option>
                  </SelectField>
                </Flex>
              ))}
            </View>
          </Card>
        )}

        {/* Low Stock Alert Banner */}
        {lowStockAlert && (
          <Card
            marginBottom="2rem"
            style={{
              backgroundColor: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: '12px',
            }}
          >
            <Flex alignItems="center" gap="1rem" padding="1rem">
              <View
                backgroundColor="#f59e0b"
                borderRadius="50%"
                padding="0.5rem"
                style={{ minWidth: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Text fontSize="lg" style={{ margin: 0 }}>
                  ⚠️
                </Text>
              </View>
              <View>
                <Text fontSize="md" fontWeight="700" color="#92400e">
                  Low Stock Alert: {lowStockAlert.count} products need attention ({lowStockAlert.message})
                </Text>
                <Text fontSize="sm" color="#b45309">
                  {lowStockAlert.products.slice(0, 3).join(', ')}
                  {lowStockAlert.products.length > 3 ? '...' : ''}
                </Text>
              </View>
              <Button
                onClick={() => setLowStockAlert(null)}
                size="small"
                style={{
                  marginLeft: 'auto',
                  backgroundColor: 'transparent',
                  color: '#92400e',
                  border: 'none',
                }}
              >
                ✕
              </Button>
            </Flex>
          </Card>
        )}

        {/* Modal Popup Form */}
        {showForm && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '2rem',
            }}
          >
            <Card
              padding="0"
              className="form-section"
              style={{
                backgroundColor: 'white',
                borderRadius: '20px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                overflow: 'hidden',
                width: '50%',
                minWidth: '600px',
                maxWidth: '800px',
                maxHeight: '90vh',
                overflowY: 'auto',
              }}
            >
              {/* Gradient Header */}
              <View
                padding="2rem 2.5rem"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  position: 'relative',
                }}
              >
                <Flex alignItems="center" gap="1rem">
                  <View
                    backgroundColor="rgba(255,255,255,0.25)"
                    borderRadius="12px"
                    padding="0.75rem"
                    style={{ backdropFilter: 'blur(10px)' }}
                  >
                    <Text fontSize="xl" style={{ margin: 0 }}>
                      {editingProduct ? '✏️' : '✨'}
                    </Text>
                  </View>
                  <View>
                    <Text fontSize="2xl" fontWeight="800" color="white">
                      {editingProduct ? 'Edit Product' : 'Create New Product'}
                    </Text>
                    <Text fontSize="sm" color="rgba(255,255,255,0.9)">
                      {editingProduct ? 'Update product information' : 'Fill in the details to add a new product'}
                    </Text>
                  </View>
                </Flex>
              </View>

              {/* Form Content */}
              <View padding="2.5rem">
                <form onSubmit={handleSubmit}>
                  <Flex direction="column" gap="2rem">
                    {/* Basic Info Section */}
                    <View
                      padding="1.5rem"
                      backgroundColor="#f8fafc"
                      borderRadius="12px"
                      border="1px solid #e2e8f0"
                      className="form-section"
                    >
                      <Text fontSize="md" fontWeight="700" color="#1e293b" marginBottom="1rem">
                        📋 Basic Information
                      </Text>
                      <Flex direction={{ base: 'column', large: 'row' }} gap="1rem">
                        <TextField
                          label="Serial Number *"
                          placeholder="e.g., 001"
                          value={formData.serialno}
                          onChange={(e) => setFormData({ ...formData, serialno: e.target.value })}
                          required
                          width="100%"
                        />
                        <TextField
                          label="Product Name *"
                          placeholder="e.g., iPhone 15 Pro"
                          value={formData.engword}
                          onChange={(e) => setFormData({ ...formData, engword: e.target.value })}
                          required
                          width="100%"
                        />
                      </Flex>
                    </View>

                    {/* Pricing Section */}
                    <View
                      padding="1.5rem"
                      backgroundColor="#fefce8"
                      borderRadius="12px"
                      border="1px solid #fde047"
                      className="form-section"
                    >
                      <Text fontSize="md" fontWeight="700" color="#1e293b" marginBottom="1rem">
                        💰 Pricing & Category
                      </Text>
                      <Flex direction={{ base: 'column', large: 'row' }} gap="1rem">
                        <TextField
                          label="Price ($)"
                          placeholder="99.99"
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          width="100%"
                        />
                        <SelectField
                          label="Category"
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          width="100%"
                        >
                          <option value="">Select category</option>
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </SelectField>
                      </Flex>
                    </View>

                    {/* Brand & Stock Section */}
                    <View
                      padding="1.5rem"
                      backgroundColor="#f0f9ff"
                      borderRadius="12px"
                      border="1px solid #7dd3fc"
                      className="form-section"
                    >
                      <Text fontSize="md" fontWeight="700" color="#1e293b" marginBottom="1rem">
                        🏷️ Brand & Inventory
                      </Text>
                      <Flex direction={{ base: 'column', large: 'row' }} gap="1rem">
                        <TextField
                          label="Brand"
                          placeholder="e.g., Apple, Samsung"
                          value={formData.brand}
                          onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                          width="100%"
                        />
                        <TextField
                          label="Stock"
                          placeholder="100"
                          type="number"
                          value={formData.stock}
                          onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                          width="100%"
                        />
                      </Flex>
                    </View>

                    {/* Description Section */}
                    <View
                      padding="1.5rem"
                      backgroundColor="#f0fdf4"
                      borderRadius="12px"
                      border="1px solid #86efac"
                      className="form-section"
                    >
                      <Text fontSize="md" fontWeight="700" color="#1e293b" marginBottom="1rem">
                        📝 Description
                      </Text>
                      <TextAreaField
                        label="Product Description"
                        placeholder="Describe your product features and benefits..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                      />
                    </View>

                    {/* Image Upload Section */}
                    <View
                      padding="1.5rem"
                      backgroundColor="#fdf4ff"
                      borderRadius="12px"
                      border="1px solid #d8b4fe"
                      className="form-section upload-area"
                    >
                      <Text fontSize="md" fontWeight="700" color="#1e293b" marginBottom="1rem">
                        📸 Product Image
                      </Text>
                      <View
                        padding="2rem"
                        borderRadius="12px"
                        border="2px dashed #d8b4fe"
                        backgroundColor="white"
                        textAlign="center"
                        style={{ position: 'relative', cursor: 'pointer' }}
                      >
                        <Text fontSize="3xl" marginBottom="0.5rem">
                          {selectedFile ? '✅' : '📷'}
                        </Text>
                        <Text fontSize="md" fontWeight="600" color="#374151" marginBottom="0.25rem">
                          {selectedFile ? selectedFile.name : 'Choose product image'}
                        </Text>
                        <Text fontSize="sm" color="#6b7280">
                          {selectedFile ? 'Click to change' : 'PNG, JPG, GIF up to 10MB'}
                        </Text>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            opacity: 0,
                            cursor: 'pointer',
                          }}
                        />
                      </View>
                    </View>

                    {/* Action Buttons */}
                    <Flex gap="1rem" justifyContent="flex-end">
                      <Button
                        onClick={resetForm}
                        size="large"
                        style={{
                          borderColor: '#e2e8f0',
                          color: '#64748b',
                          fontWeight: '600',
                          borderRadius: '12px',
                          padding: '1rem 2rem',
                          backgroundColor: 'transparent',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        size="large"
                        isDisabled={uploading || !formData.engword || !formData.serialno}
                        isLoading={uploading}
                        loadingText={editingProduct ? 'Updating...' : 'Creating...'}
                        style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          borderColor: 'transparent',
                          fontWeight: '700',
                          borderRadius: '12px',
                          padding: '1rem 2.5rem',
                          boxShadow: '0 4px 16px rgba(102,126,234,0.4)',
                          color: 'white',
                        }}
                      >
                        {editingProduct ? '✏️ Update Product' : '✨ Create Product'}
                      </Button>
                    </Flex>
                  </Flex>
                </form>
              </View>
            </Card>
          </div>
        )}

        {/* Products Grid */}
        {loading ? (
          <View
            textAlign="center"
            padding="4rem"
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
            }}
          >
            <View
              backgroundColor="#f1f5f9"
              borderRadius="50%"
              width="80px"
              height="80px"
              margin="0 auto 1.5rem"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Loader size="large" />
            </View>
            <Text fontSize="lg" fontWeight="600" color="#1e293b" marginBottom="0.5rem">
              Loading products...
            </Text>
            <Text color="#64748b">Please wait while we fetch your inventory</Text>
          </View>
        ) : (
          <>
            <Flex justifyContent="space-between" alignItems="center" marginBottom="2rem">
              <View>
                <Text fontSize="xl" fontWeight="700" color="#1e293b">
                  {filteredProducts.length} Product{filteredProducts.length !== 1 ? 's' : ''}
                </Text>
                <Text fontSize="sm" color="#64748b">
                  {searchTerm || filterCategory ? 'Filtered results' : 'Total inventory'}
                </Text>
              </View>
            </Flex>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: '2rem',
              }}
            >
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  padding="0"
                  style={{
                    overflow: 'hidden',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                  }}
                >
                  <ProductImage imageKey={(product as any).imageKey} />
                  <View padding="2rem">
                    <Text fontSize="xl" fontWeight="700" marginBottom="0.75rem" lineHeight="1.3" color="#1e293b">
                      {product.engword}
                    </Text>
                    <View backgroundColor="#f1f5f9" padding="0.5rem 0.75rem" borderRadius="6px">
                      <Text fontSize="xs" fontWeight="600" color="#64748b">
                        Image Uploaded At: {product.imageUploadedAt}
                      </Text>
                    </View>
                    <br></br>
                    <Flex justifyContent="space-between" alignItems="center" marginBottom="1.25rem">
                      <View backgroundColor="#f1f5f9" padding="0.5rem 0.75rem" borderRadius="6px">
                        <Text fontSize="xs" fontWeight="600" color="#64748b">
                          Serial: {product.serialno}
                        </Text>
                      </View>
                      {product.price && (
                        <Text fontSize="2xl" fontWeight="800" color="#10b981">
                          ${product.price}
                        </Text>
                      )}
                    </Flex>

                    <Flex gap="0.75rem" marginBottom="1.25rem" wrap="wrap">
                      {product.category && (
                        <Badge
                          style={{
                            backgroundColor: '#dbeafe',
                            color: '#1e40af',
                            fontWeight: '600',
                            borderRadius: '6px',
                            padding: '0.25rem 0.75rem',
                          }}
                        >
                          {product.category}
                        </Badge>
                      )}
                      {product.brand && (
                        <Badge
                          style={{
                            backgroundColor: '#f3e8ff',
                            color: '#7c3aed',
                            fontWeight: '600',
                            borderRadius: '6px',
                            padding: '0.25rem 0.75rem',
                          }}
                        >
                          {product.brand}
                        </Badge>
                      )}
                      {product.stock !== undefined && product.stock !== null && (
                        <Badge
                          style={{
                            backgroundColor: (product.stock || 0) > 0 ? '#dcfce7' : '#fef3c7',
                            color: (product.stock || 0) > 0 ? '#166534' : '#92400e',
                            fontWeight: '600',
                            borderRadius: '6px',
                            padding: '0.25rem 0.75rem',
                          }}
                        >
                          {(product.stock || 0) > 0 ? `${product.stock} in stock` : 'Out of stock'}
                        </Badge>
                      )}
                    </Flex>

                    {product.description && (
                      <Text fontSize="sm" color="#64748b" marginBottom="1.5rem" lineHeight="1.5">
                        {product.description.length > 120 ? `${product.description.substring(0, 120)}...` : product.description}
                      </Text>
                    )}

                    <Flex gap="0.75rem" marginBottom="1rem">
                      <Button
                        onClick={() => toggleComments(product.id)}
                        size="small"
                        style={{
                          flex: 1,
                          borderColor: '#10b981',
                          color: '#10b981',
                          fontWeight: '600',
                          borderRadius: '8px',
                          padding: '0.75rem',
                          backgroundColor: 'transparent',
                          border: '1px solid #10b981',
                        }}
                      >
                        💬 Comments ({productComments[product.id]?.length || 0})
                      </Button>
                      {canEdit && (
                        <Button
                          onClick={() => startEdit(product)}
                          size="small"
                          style={{
                            flex: 1,
                            borderColor: '#3b82f6',
                            color: '#3b82f6',
                            fontWeight: '600',
                            borderRadius: '8px',
                            padding: '0.75rem',
                            backgroundColor: 'transparent',
                            border: '1px solid #3b82f6',
                          }}
                        >
                          ✏️ Edit
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          onClick={() => removeProduct(product.id)}
                          size="small"
                          style={{
                            flex: 1,
                            borderColor: '#ef4444',
                            color: '#ef4444',
                            fontWeight: '600',
                            borderRadius: '8px',
                            padding: '0.75rem',
                            backgroundColor: 'transparent',
                            border: '1px solid #ef4444',
                          }}
                        >
                          🗑️ Delete
                        </Button>
                      )}
                    </Flex>

                    {/* Comments Section */}
                    {showComments[product.id] && (
                      <View padding="1rem" backgroundColor="#f8fafc" borderRadius="8px" border="1px solid #e2e8f0">
                        <Text fontSize="sm" fontWeight="600" marginBottom="0.75rem">
                          Comments
                        </Text>

                        {/* Add Comment */}
                        <Flex gap="0.5rem" marginBottom="1rem">
                          <TextField
                            label=""
                            placeholder="Add a comment..."
                            value={newComment[product.id] || ''}
                            onChange={(e) => setNewComment((prev) => ({ ...prev, [product.id]: e.target.value }))}
                            size="small"
                            style={{ flex: 1 }}
                          />
                          <Button
                            onClick={() => addComment(product.id)}
                            size="small"
                            isDisabled={!newComment[product.id]?.trim()}
                            style={{
                              backgroundColor: '#10b981',
                              color: 'white',
                              borderRadius: '6px',
                            }}
                          >
                            Post
                          </Button>
                        </Flex>

                        {/* Comments List */}
                        {productComments[product.id]?.map((comment) => (
                          <View
                            key={comment.id}
                            padding="0.75rem"
                            backgroundColor="white"
                            borderRadius="6px"
                            marginBottom="0.5rem"
                            border="1px solid #e5e7eb"
                          >
                            <Flex justifyContent="space-between" alignItems="center" marginBottom="0.25rem">
                              <Text fontSize="xs" fontWeight="600" color="#374151">
                                {comment.authorName}
                              </Text>
                              <Text fontSize="xs" color="#6b7280">
                                {new Date(comment.createdAt).toLocaleDateString()}
                              </Text>
                            </Flex>
                            <Text fontSize="sm" color="#1f2937">
                              {comment.content}
                            </Text>
                          </View>
                        ))}

                        {(!productComments[product.id] || productComments[product.id].length === 0) && (
                          <Text fontSize="sm" color="#6b7280" textAlign="center">
                            No comments yet. Be the first to comment!
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                </Card>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <View
                textAlign="center"
                padding="4rem"
                style={{
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  border: '2px dashed #e2e8f0',
                }}
              >
                <View
                  backgroundColor="#f1f5f9"
                  borderRadius="50%"
                  width="80px"
                  height="80px"
                  margin="0 auto 1.5rem"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text fontSize="2xl">📦</Text>
                </View>
                <Text fontSize="xl" fontWeight="700" marginBottom="0.75rem" color="#1e293b">
                  No products found
                </Text>
                <Text color="#64748b" fontSize="lg">
                  {searchTerm || filterCategory ? 'Try adjusting your search or filters' : 'Add your first product to get started!'}
                </Text>
              </View>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default withAuthenticator(App);
