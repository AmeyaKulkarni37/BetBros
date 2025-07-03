import React, { useEffect } from "react";

const Notification = ({ message, type = "success", isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000); // Auto close after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const bgColor = type === "success" ? "bg-success" : "bg-error";
  const textColor =
    type === "success" ? "text-success-content" : "text-error-content";

  return (
    <div className={`toast toast-top toast-end z-50`}>
      <div className={`alert ${bgColor} ${textColor}`}>
        <span>{message}</span>
        <button className="btn btn-sm btn-ghost" onClick={onClose}>
          ✕
        </button>
      </div>
    </div>
  );
};

export default Notification;
