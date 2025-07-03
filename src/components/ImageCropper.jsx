import React, { useState, useRef, useCallback } from "react";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

const ImageCropper = ({ isOpen, onClose, onImageCropped, aspectRatio = 1 }) => {
  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const [loading, setLoading] = useState(false);
  const imgRef = useRef(null);
  const canvasRef = useRef(null);

  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined); // Makes crop preview update between images.
      const reader = new FileReader();
      reader.addEventListener("load", () =>
        setImgSrc(reader.result?.toString() || "")
      );
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onImageLoad = useCallback(
    (e) => {
      const { width, height } = e.currentTarget;
      setCrop(
        centerCrop(
          makeAspectCrop(
            {
              unit: "%",
              width: 90,
            },
            aspectRatio,
            width,
            height
          ),
          width,
          height
        )
      );
    },
    [aspectRatio]
  );

  const getCroppedImg = useCallback(async () => {
    if (!completedCrop || !imgRef.current || !canvasRef.current) {
      return;
    }

    const image = imgRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("No 2d context");
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const pixelRatio = window.devicePixelRatio;

    canvas.width = completedCrop.width * pixelRatio * scaleX;
    canvas.height = completedCrop.height * pixelRatio * scaleY;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = "high";

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.error("Canvas is empty");
            return;
          }
          resolve(blob);
        },
        "image/jpeg",
        0.9
      );
    });
  }, [completedCrop]);

  const handleCropComplete = async () => {
    if (!completedCrop) {
      return;
    }

    setLoading(true);
    try {
      const croppedImageBlob = await getCroppedImg();
      if (croppedImageBlob) {
        onImageCropped(croppedImageBlob);
        onClose();
      }
    } catch (error) {
      console.error("Error cropping image:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setImgSrc("");
    setCrop(undefined);
    setCompletedCrop(undefined);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-base-100 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Crop Image</h3>
          <button
            className="btn btn-sm btn-circle btn-ghost"
            onClick={handleClose}
          >
            ✕
          </button>
        </div>

        {!imgSrc && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Select Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={onSelectFile}
              className="file-input file-input-bordered w-full"
            />
          </div>
        )}

        {imgSrc && (
          <div className="mb-4">
            <div className="mb-4">
              <p className="text-sm text-base-content/70 mb-2">
                Drag the corners to adjust the crop area. The selected area will
                be used for your{" "}
                {aspectRatio === 1 ? "profile picture" : "image"}.
              </p>
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspectRatio}
                className="max-w-full"
              >
                <img
                  ref={imgRef}
                  alt="Crop me"
                  src={imgSrc}
                  onLoad={onImageLoad}
                  style={{ maxWidth: "100%", maxHeight: "400px" }}
                />
              </ReactCrop>
            </div>

            {/* Preview */}
            {completedCrop && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">Preview:</p>
                <div className="flex justify-center">
                  <div
                    className={`${
                      aspectRatio === 1
                        ? "w-24 h-24 rounded-full"
                        : "w-32 h-20 rounded-lg"
                    } overflow-hidden border-2 border-base-300`}
                  >
                    <canvas
                      ref={canvasRef}
                      style={{
                        width: aspectRatio === 1 ? "96px" : "128px",
                        height: aspectRatio === 1 ? "96px" : "80px",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                className="btn btn-ghost flex-1"
                onClick={() => setImgSrc("")}
              >
                Choose Different Image
              </button>
              <button
                className="btn btn-primary flex-1"
                onClick={handleCropComplete}
                disabled={!completedCrop || loading}
              >
                {loading ? "Processing..." : "Use This Image"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageCropper;
