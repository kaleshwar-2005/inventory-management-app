import React, { useState } from "react";
import "./ProductFormModal.css";
import api from "../../api";

const ProductFormModal = ({ isOpen, onClose, onCreate }) => {
  const [form, setForm] = useState({
    name: "",
    unit: "",
    category: "",
    brand: "",
    stock: 0,
    status: "In Stock",
    image: ""
  });

  const [uploading, setUploading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e, field) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await API.post("/api/products/upload-image", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setForm((prev) => ({ ...prev, image: res.data.imageUrl }));
    } catch (err) {
      console.error("Image upload failed:", err);
      alert("Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Add New Product</h3>

        <input placeholder="Name" onChange={(e) => handleChange(e, "name")} />
        <input placeholder="Unit" onChange={(e) => handleChange(e, "unit")} />
        <input placeholder="Category" onChange={(e) => handleChange(e, "category")} />
        <input placeholder="Brand" onChange={(e) => handleChange(e, "brand")} />
        <input type="number" placeholder="Stock" onChange={(e) => handleChange(e, "stock")} />

        <select onChange={(e) => handleChange(e, "status")}>
          <option>In Stock</option>
          <option>Out of Stock</option>
        </select>

        
        <label className="upload-label">
          Upload Image:
          <input type="file" accept="image/*" onChange={handleImageUpload} />
        </label>

        
        <input
          placeholder="Image URL (optional)"
          onChange={(e) => handleChange(e, "image")}
          value={form.image}
        />

        {uploading && <p style={{ color: "blue" }}>Uploading image...</p>}

        <div className="modal-buttons">
          <button onClick={() => onCreate(form)}>Add</button>
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default ProductFormModal;
