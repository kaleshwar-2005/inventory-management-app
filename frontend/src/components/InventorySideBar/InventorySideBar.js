import React from "react";
import "./InventorySidebar.css";

const InventorySidebar = ({ selectedProduct, history, onClose }) => {
  if (!selectedProduct) return null;

  // Optional: Render backend URL if you want to show product image in sidebar
  const BACKEND_URL = "https://inventory-management-app-backend-gn9n.onrender.com";

  const getImageUrl = (img) => {
    if (!img) return "";
    if (img.startsWith("http")) return img;
    return `${BACKEND_URL}${img}`;
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="product-info">
          <h2>{selectedProduct.name}</h2>

          {/* SHOW PRODUCT IMAGE IN SIDEBAR */}
          {selectedProduct.image && (
            <img
              src={getImageUrl(selectedProduct.image)}
              className="sidebar-product-img"
              alt={selectedProduct.name}
            />
          )}
        </div>

        <button className="close-btn" onClick={onClose}>✖</button>
      </div>

      <div className="sidebar-body">
        <h3>Inventory History</h3>

        {history.length === 0 ? (
          <p className="empty-msg">No history found.</p>
        ) : (
          history.map((log) => (
            <div className="history-item" key={log.id}>
              <p>
                <b>Date:</b> {new Date(log.timestamp || log.change_date).toLocaleString()}
              </p>
              <p>
                <b>Old Stock:</b> {log.oldStock ?? log.old_quantity}
              </p>
              <p>
                <b>New Stock:</b> {log.newStock ?? log.new_quantity}
              </p>
              <p>
                <b>Changed By:</b> {log.changedBy ?? log.user_info}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default InventorySidebar;
