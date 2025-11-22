import React, { useState } from "react";
import "./ProductFormModal.css";

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

  if (!isOpen) return null;

  const handleChange = (e, field) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
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

        <input placeholder="Image URL" onChange={(e) => handleChange(e, "image")} />

        <div className="modal-buttons">
          <button onClick={() => onCreate(form)}>Add</button>
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default ProductFormModal;
