import React, { useEffect, useState } from 'react';
import api from './api';
import ProductTable from './components/ProductTable/ProductTable';
import InventorySidebar from './components/InventorySideBar/InventorySideBar';
import ProductFormModal from './components/ProductFormModal/ProductFormModal';
import './App.css';

function App() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [history, setHistory] = useState([]);
  const [importResult, setImportResult] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchProducts = async () => {
    try {
      const params = {};
      if (category && category !== 'All') params.category = category;
      const res = await api.get('/api/products', { params });
      setProducts(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to load products');
    }
  };

  const fetchHistory = async (productId) => {
    try {
      const res = await api.get(`/api/products/${productId}/history`);
      setHistory(res.data);
    } catch (err) {
      console.error(err);
      setHistory([]);
    }
  };

  
  useEffect(() => {
    fetchProducts();
  }, [category]);


  useEffect(() => {
    const delay = setTimeout(async () => {
      if (!search) {
        fetchProducts();
        return;
      }
      try {
        const res = await api.get('/api/products/search', {
          params: { name: search }
        });
        setProducts(res.data);
      } catch (err) {
        console.error(err);
      }
    }, 400);
    return () => clearTimeout(delay);
 
  }, [search]);

  const categories = ['All', ...new Set(products.map((p) => p.category).filter(Boolean))];

  const handleUpdateProduct = async (id, data) => {
    try {
      const payload = { ...data, changedBy: 'admin@example.com' };
      const res = await api.put(`/api/products/${id}`, payload);
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? res.data : p))
      );
      alert('Product updated');
      if (selectedProduct && selectedProduct.id === id) {
        setSelectedProduct(res.data);
        fetchHistory(id);
      }
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.error ||
        'Failed to update product (maybe duplicate name?)'
      );
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/api/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      if (selectedProduct && selectedProduct.id === id) {
        setSelectedProduct(null);
        setHistory([]);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete product');
    }
  };

  const handleRowSelect = (product) => {
    setSelectedProduct(product);
    fetchHistory(product.id);
  };

  const handleImportClick = () => {
    document.getElementById('csvInput').click();
  };

  const handleImportChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('csvFile', file);

    try {
      const res = await api.post('/api/products/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImportResult(res.data);
      alert(
        `Imported: added=${res.data.added}, skipped=${res.data.skipped}`
      );
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert('Import failed');
    } finally {
      e.target.value = '';
    }
  };

  const handleExport = () => {
    api
      .get('/api/products/export', { responseType: 'blob' })
      .then((res) => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'products.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch((err) => {
        console.error(err);
        alert('Export failed');
      });
  };

  const handleCreateProduct = async (data) => {
    try {
      const res = await api.post('/api/products', data);
      setProducts((prev) => [...prev, res.data]);
      setIsModalOpen(false);
      alert('Product created');
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.error ||
        'Failed to create product (maybe duplicate name?)'
      );
    }
  };

  return (
    <div className="app">
    
      <header className="app-header">
        <div className="header-left">
          <input
            className="search-input"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="category-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <button onClick={() => setIsModalOpen(true)}>
            Add New Product
          </button>
        </div>

        <div className="header-right">
          <input
            id="csvInput"
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleImportChange}
          />
          <button onClick={handleImportClick}>Import</button>
          <button onClick={handleExport}>Export</button>
        </div>
      </header>

      
      <div className="app-body">
        <div className="table-container">
          <ProductTable
            products={products}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onRowSelect={handleRowSelect}
          />
        </div>

        <InventorySidebar
          selectedProduct={selectedProduct}
          history={history}
          onClose={() => {
            setSelectedProduct(null);
            setHistory([]);
          }}
        />
      </div>

      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateProduct}
      />
    </div>
  );
}

export default App;
