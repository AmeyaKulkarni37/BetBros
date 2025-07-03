import React from "react";
import { useState, useEffect } from "react";

const PropModal = ({ isOpen, onClose, mode, onSubmit, propData }) => {
  const [propTitle, setPropTitle] = useState("");
  const [propDesc, setPropDesc] = useState("");
  const [option1, setOption1] = useState("");
  const [option2, setOption2] = useState("");
  const [odds1, setOdds1] = useState("");
  const [odds2, setOdds2] = useState("");

  useEffect(() => {
    // Reset form fields when modal opens or changes mode
    if (isOpen) {
      if (mode === "edit" && propData) {
        setPropTitle(propData.title || "");
        setPropDesc(propData.description || "");
        setOption1(propData.option1 || "");
        setOption2(propData.option2 || "");
        setOdds1(propData.odds1 || "");
        setOdds2(propData.odds2 || "");
      } else {
        // For add mode, reset all fields
        setPropTitle("");
        setPropDesc("");
        setOption1("");
        setOption2("");
        setOdds1("");
        setOdds2("");
      }
    }
  }, [isOpen, mode, propData]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const newPropData = {
      title: propTitle,
      description: propDesc,
      option1: option1,
      odds1: odds1,
      option2: option2,
      odds2: odds2,
    };

    onSubmit(newPropData);
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div>
      <dialog id="prop_modal" className="modal" open={isOpen}>
        <div className="modal-box">
          <form method="dialog">
            <button
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
              onClick={handleClose}
            >
              ✕
            </button>
          </form>
          <h3 className="font-bold text-xl mb-5">
            {mode === "edit" ? "Edit Prop" : "Create A Prop"}
          </h3>
          <form
            method="dialog"
            className="flex flex-col justify-center items-left w-full"
            onSubmit={handleSubmit}
          >
            <label className="label">
              <span className="label-text text-white">Prop Title</span>
            </label>
            <input
              type="text"
              placeholder="Enter Prop Title"
              value={propTitle}
              onChange={(e) => setPropTitle(e.target.value)}
              className="input input-bordered w-100% max-w-xs mb-3"
            />

            <label className="label">
              <span className="label-text text-white">Prop Description</span>
            </label>
            <textarea
              className="input input-bordered w-full max-w-xs mb-3 h-32 p-3 resize-none whitespace-pre-wrap"
              id="prop_desc"
              placeholder="Enter a prop description..."
              value={propDesc}
              onChange={(e) => setPropDesc(e.target.value)}
              maxLength={200}
              rows="4"
              cols="50"
              wrap="soft"
            ></textarea>

            <div className="grid grid-cols-2">
              <div>
                <label className="label text-white">Option 1:</label>
                <input
                  type="text"
                  placeholder="Ex: Over, Under, Win, etc."
                  value={option1}
                  onChange={(e) => setOption1(e.target.value)}
                  className="input input-bordered w-55 max-w-xs mb-3"
                />
              </div>
              <div>
                <label className="label text-white">Option 2:</label>
                <input
                  type="text"
                  placeholder="Ex: Over, Under, Win, etc."
                  value={option2}
                  onChange={(e) => setOption2(e.target.value)}
                  className="input input-bordered w-55 max-w-xs mb-3"
                />
              </div>
              <div>
                <label className="label text-white">Option 1 Odds:</label>
                <input
                  type="text"
                  placeholder="Ex: -110, +150, etc."
                  value={odds1}
                  onChange={(e) => setOdds1(e.target.value)}
                  className="input input-bordered w-55 max-w-xs mb-3"
                />
              </div>
              <div>
                <label className="label text-white">Option 2 Odds:</label>
                <input
                  type="text"
                  placeholder="Ex: -110, +150, etc."
                  value={odds2}
                  onChange={(e) => setOdds2(e.target.value)}
                  className="input input-bordered w-55 max-w-xs mb-3"
                />
              </div>
            </div>

            <div className="modal-action">
              <button
                className="btn bg-green-600 hover:bg-green-700"
                type="submit"
              >
                {mode === "edit" ? "Save Changes" : "Create"}
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  );
};

export default PropModal;
