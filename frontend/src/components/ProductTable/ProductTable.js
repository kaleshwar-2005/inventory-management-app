import React, { useState } from "react";
import "./ProductTable.css";

const ProductTable = ({
  products,
  onUpdateProduct,
  onDeleteProduct,
  onRowSelect
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  const startEdit = (product) => {
    setEditingId(product.id);
    setEditData(product);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleChange = (e, field) => {
    setEditData((prev) => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleSave = () => {
    onUpdateProduct(editingId, editData);
    setEditingId(null);
  };

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Image</th>
          <th>Name</th>
          <th>Unit</th>
          <th>Category</th>
          <th>Brand</th>
          <th>Stock</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        {products.map((p) => {
          const isEditing = editingId === p.id;

          return (
            <tr
              key={p.id}
              className="table-row"
              onClick={(e) => {
                if (e.target.tagName !== "BUTTON" && e.target.type !== "text")
                  onRowSelect(p);
              }}
            >
              <td>
                {p.image ? (
                  <img src={p.image} alt="" className="product-img" />
                ) : (
                  "-"
                )}
              </td>

              {isEditing ? (
                <>
                  <td><input value={editData.name} onChange={(e) => handleChange(e, "name")} /></td>
                  <td><input value={editData.unit} onChange={(e) => handleChange(e, "unit")} /></td>
                  <td><input value={editData.category} onChange={(e) => handleChange(e, "category")} /></td>
                  <td><input value={editData.brand} onChange={(e) => handleChange(e, "brand")} /></td>
                  <td><input type="number" value={editData.stock} onChange={(e) => handleChange(e, "stock")} /></td>
                </>
              ) : (
                <>
                  <td>{p.name}</td>
                  <td>{p.unit}</td>
                  <td>{p.category}</td>
                  <td>{p.brand}</td>
                  <td>{p.stock}</td>
                </>
              )}

              <td>
                <span className={p.stock === 0 ? "status-red" : "status-green"}>
                  {p.stock === 0 ? "Out of Stock" : "In Stock"}
                </span>
              </td>

              <td>
                {isEditing ? (
                  <>
                    <button className="btn save-btn" onClick={handleSave}>Save</button>
                    <button className="btn cancel-btn" onClick={cancelEdit}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button className="btn edit-btn" onClick={() => startEdit(p)}>Edit</button>
                    <button className="btn delete-btn" onClick={() => onDeleteProduct(p.id)}>Delete</button>
                  </>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default ProductTable;
