import React from "react";
import "./InventorySidebar.css";

const InventorySidebar = ({ selectedProduct, history, onClose }) => {
  if (!selectedProduct) return null;

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>{selectedProduct.name}</h2>
        <button className="close-btn" onClick={onClose}>✖</button>
      </div>

      <div className="sidebar-body">
        {history.length === 0 ? (
          <p>No history found.</p>
        ) : (
          history.map((log) => (
            <div className="history-item" key={log.id}>
              <p><b>Date:</b> {new Date(log.timestamp).toLocaleString()}</p>
              <p><b>Old Stock:</b> {log.oldStock}</p>
              <p><b>New Stock:</b> {log.newStock}</p>
              <p><b>Changed By:</b> {log.changedBy}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default InventorySidebar;
